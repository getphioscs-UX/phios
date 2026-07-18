import {
  ENTRY_PROVIDER_ENRICHMENT_SCHEMA,
  ENTRY_PROVIDER_SYSTEM_PROMPT,
  buildEntryProviderInput
} from '../provider-contract.js';

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stripCodeFence(value) {
  const text = cleanText(value);
  const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : text;
}

function parseJSON(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  const text = stripCodeFence(value);
  if (!text) {
    throw new Error('Workers AI returned no Runtime Entry enrichment.');
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('The parsed enrichment is not an object.');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Workers AI returned invalid Runtime Entry JSON: ${error.message}`);
  }
}

function parseProviderResponse(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.response !== undefined) return parseJSON(value.response);
    if (value.result?.response !== undefined) return parseJSON(value.result.response);
  }

  return parseJSON(value);
}

function assertContractShape(enrichment) {
  const required = ENTRY_PROVIDER_ENRICHMENT_SCHEMA.required || [];
  const missing = required.filter(key => !(key in enrichment));

  if (missing.length) {
    throw new Error(`Workers AI enrichment is missing required fields: ${missing.join(', ')}.`);
  }

  return enrichment;
}

function usageFrom(response) {
  const usage = response?.usage || response?.result?.usage;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) return null;

  return {
    promptTokens: Number(usage.prompt_tokens || usage.input_tokens) || null,
    completionTokens: Number(usage.completion_tokens || usage.output_tokens) || null,
    totalTokens: Number(usage.total_tokens) || null
  };
}

export async function runWorkersAIEntry(env, entryInput, ruleEntry) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    throw new Error('Workers AI binding AI is not configured.');
  }

  if (ruleEntry?.routingHints?.modelInferenceUseful !== true) {
    throw new Error('Workers AI Entry was not authorized by the Rule Engine routing hints.');
  }

  const model = cleanText(env.WORKERS_AI_ENTRY_MODEL) || DEFAULT_MODEL;
  const response = await env.AI.run(model, {
    messages: [
      { role: 'system', content: ENTRY_PROVIDER_SYSTEM_PROMPT },
      { role: 'user', content: buildEntryProviderInput(entryInput, ruleEntry) }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: ENTRY_PROVIDER_ENRICHMENT_SCHEMA
    },
    max_tokens: 1200,
    temperature: 0.1
  });

  const enrichment = assertContractShape(parseProviderResponse(response));

  return {
    provider: 'workers_ai',
    model,
    workersAIUsed: true,
    openAIUsed: false,
    billing: {
      metered: true,
      freeAllocationMayApply: true
    },
    enrichment,
    usage: usageFrom(response)
  };
}

export default runWorkersAIEntry;
