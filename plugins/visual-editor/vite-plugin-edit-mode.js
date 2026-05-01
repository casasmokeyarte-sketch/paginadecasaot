import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { EDIT_MODE_STYLES, POPUP_STYLES } from './visual-editor-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default function inlineEditDevPlugin() {
	return {
		name: 'vite:inline-edit-dev',
		apply: 'serve',
		transformIndexHtml() {
			const scriptPath = resolve(__dirname, 'edit-mode-script.js');
			const scriptContent = readFileSync(scriptPath, 'utf-8');
			const scriptWithoutImport = scriptContent.replace(
				/^\s*import\s+\{\s*POPUP_STYLES\s*\}\s+from\s+["']\.\/visual-editor-config\.js["'];?\s*$/m,
				''
			);
			const hydratedScriptContent = `const POPUP_STYLES = ${JSON.stringify(POPUP_STYLES)};\n${scriptWithoutImport}`;

			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: hydratedScriptContent,
					injectTo: 'body'
				},
				{
					tag: 'style',
					children: EDIT_MODE_STYLES,
					injectTo: 'head'
				}
			];
		}
	};
}
