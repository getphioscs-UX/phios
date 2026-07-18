import {
  READING_ENRICHMENT_SCHEMA,
  READING_PROVIDER_SYSTEM_PROMPT,
  buildReadingProviderInput
} from '../provider-contract.js';

function outputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  for (const item of Array.isArray(data?.output) ? data.output : []) {
    if (item?.type !== 'message') continue;
    for (const content of Array.isArray(item.content) ? item.content : []) {
      if (content?.type === 'refusal') {
        throw new Error(content.refusal || 'OpenAI refused the Reading enrichment request.');
      }
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        return content.text.trim();
      }
    }
  }

  throw new Error('OpenAI returned no structured Reading enrichment.');
}

export async function runOpenAIReading(env, readingInput, ruleReading) {
  if (!env?.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const model =
    env.OPENAI_READING_MODEL ||
    env.OPENAI_MODEL ||
    'gpt-4.1-mini';

  const response = await fetch('https://api.openai.com/v1/responses', {
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
          content: READING_PROVIDER_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: buildReadingProviderInput(readingInput, ruleReading)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'phi_os_reading_enrichment',
          strict: true,
          schema: READING_ENRICHMENT_SCHEMA
        }
      },
      max_output_tokens: 1400
    })
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('OpenAI returned an unreadable response.');
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed (${response.status}).`);
  }

  return {
    provider: 'openai',
    model,
    enrichment: JSON.parse(outputText(data))
  };
}

export default runOpenAIReading;
