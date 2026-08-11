import fs from 'node:fs';
import path from 'node:path';
export const BASELINE='d150a741231abe608a0d994e9e5787e6c71cfc3d';
export const root=process.cwd();
export const readText=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
export const readJson=f=>JSON.parse(readText(f));
export const exists=f=>fs.existsSync(path.join(root,f));
export const routeFile=route=>({
  '/':'index.html','/library':'library.html','/articles':'articles.html','/figures':'figures.html','/figure':'figure.html','/books':'books/index.html',
  '/books/reality-formation':'books/reality-formation/index.html','/books/reality-runtime':'books/reality-runtime/index.html',
  '/books/reality-civilization':'books/reality-civilization/index.html','/books/reality-navigation':'books/reality-navigation/index.html',
  '/academy':'academy.html','/reality-journey':'reality-journey.html','/reality-dashboard':'reality-dashboard.html','/personal-runtime':'personal-runtime.html',
  '/services':'services.html','/professional/financial':'professional/financial/index.html','/professional-workspace':'professional-workspace.html','/professional-reports':'professional-reports.html'
}[route]??null);
