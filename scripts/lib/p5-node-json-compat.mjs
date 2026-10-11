import fs from 'node:fs';
import {registerHooks} from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.json')) {
      const raw = fs
        .readFileSync(new URL(url), 'utf8')
        .replace(/^\uFEFF/, '');

      /*
        JSON.parse here proves the fixture source is valid JSON
        before converting it into an ESM default export.
      */
      const value = JSON.parse(raw);

      return {
        format: 'module',
        source:
          'export default Object.freeze(' +
          JSON.stringify(value) +
          ');',
        shortCircuit: true
      };
    }

    return nextLoad(url, context);
  }
});
