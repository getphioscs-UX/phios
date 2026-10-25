// R1.2 explicit language request. Presentation never creates payment or source identity.
export const OUTPUT_LANGUAGES=Object.freeze(['zh','en','bilingual']);
export function outputLanguage(value){const mapped=value==='zh-Hans'?'zh':value;if(!OUTPUT_LANGUAGES.includes(mapped))throw Object.assign(Error('OUTPUT_LANGUAGE_REQUIRED'),{code:'OUTPUT_LANGUAGE_REQUIRED',status:422});return mapped;}
export const reportLocale=value=>outputLanguage(value)==='zh'?'zh-Hans':outputLanguage(value);
export function requireSourceLanguage(records,language){const selected=outputLanguage(language);if(selected==='bilingual')return;const expected=selected==='zh'?'zh-Hans':'en';if(records.some(r=>r.language!==expected))throw Object.assign(Error('SOURCE_TRANSLATION_UNAVAILABLE'),{code:'SOURCE_TRANSLATION_UNAVAILABLE',status:409});}
