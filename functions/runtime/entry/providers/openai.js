import {
  ENTRY_PROVIDER_ENRICHMENT_SCHEMA,
  ENTRY_PROVIDER_SYSTEM_PROMPT,
  buildEntryProviderInput
} from '../provider-contract.js';

const OPENAI_RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-4.1-mini';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function outputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  for (const item of Array.isArray(data?.output) ? data.output : []) {
    if (item?.type !== 'message') continue;

    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (content?.type === 'refusal') {
        throw new Error(content.refusal || 'OpenAI refused the Runtime Entry enrichment request.');
      }

      if (content?.type === 'output_text' && typeof content.text === 'string') {
        return content.text.trim();
      }
    }
  }

  throw new Error('OpenAI returned no structured Runtime Entry enrichment.');
}

function parseEnrichment(data) {
  const text = outputText(data);

  try {
    const enrichment = JSON.parse(text);
    if (!enrichment || typeof enrichment !== 'object' || Array.isArray(enrichment)) {
      throw new Error('The parsed enrichment is not an object.');
    }

    const required = ENTRY_PROVIDER_ENRICHMENT_SCHEMA.required || [];
    const missing = required.filter(key => !(key in enrichment));
    if (missing.length) {
      throw new Error(`OpenAI enrichment is missing required fields: ${missing.join(', ')}.`);
    }

    return enrichment;
  } catch (error) {
    throw new Error(`OpenAI returned invalid Runtime Entry JSON: ${error.message}`);
  }
}

function usageFrom(data) {
  const usage = data?.usage;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) return null;

  return {
    inputTokens: Number(usage.input_tokens) || null,
    outputTokens: Number(usage.output_tokens) || null,
    totalTokens: Number(usage.total_tokens) || null
  };
}

function assertRoutingAuthorization(ruleEntry, routingContext) {
  if (ruleEntry?.routingHints?.modelInferenceUseful !== true) {
    throw new Error('OpenAI Entry was not authorized by the Rule Engine routing hints.');
  }

  const workersAIFailed = routingContext?.workersAIAttempted === true &&
    routingContext?.workersAISucceeded !== true;
  const workersAIUnavailable = routingContext?.workersAIUnavailable === true;

  if (!workersAIFailed && !workersAIUnavailable) {
    throw new Error('OpenAI Entry requires Workers AI to fail or be unavailable first.');
  }
}

export async function runOpenAIEntry(
  env,
  entryInput,
  ruleEntry,
  routingContext = {}
) {
  if (!cleanText(env?.OPENAI_API_KEY)) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  assertRoutingAuthorization(ruleEntry, routingContext);

  const model = cleanText(env.OPENAI_ENTRY_MODEL) ||
    cleanText(env.OPENAI_MODEL) ||
    DEFAULT_MODEL;

  const response = await fetch(OPENAI_RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: 'system',
          content: ENTRY_PROVIDER_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: buildEntryProviderInput(entryInput, ruleEntry)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'phi_os_entry_enrichment',
          strict: true,
          schema: ENTRY_PROVIDER_ENRICHMENT_SCHEMA
        }
      },
      max_output_tokens: 1400
    })
  });

  const raw = await response.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('OpenAI returned an unreadable Runtime Entry response.');
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI Entry request failed (${response.status}).`);
  }

  return {
    provider: 'openai',
    model,
    workersAIUsed: routingContext?.workersAIAttempted === true,
    openAIUsed: true,
    billing: {
      metered: true,
      freeAllocationMayApply: false
    },
    enrichment: parseEnrichment(data),
    usage: usageFrom(data)
  };
}

export default runOpenAIEntry;
