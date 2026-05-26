import path from 'node:path';
import crypto from 'node:crypto';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';

const isDev = process.env.NODE_ENV !== 'production';

const configReactRefreshPreamble = `
import RefreshRuntime from "/@react-refresh";

RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
`;

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/\.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;

const configNavigationHandler = `
if (window.self !== window.top) {
	const notifyNavigationError = (url, source) => {
		window.parent.postMessage({
			type: 'horizons-navigation-error',
			url,
			source,
		}, '*');
	};

	const isCrossOriginHttpNavigation = (url) => {
		try {
			const destinationUrl = new URL(url, window.location.href);

			if (!['http:', 'https:'].includes(destinationUrl.protocol)) {
				return false;
			}

			return destinationUrl.origin !== window.location.origin;
		} catch {
			return false;
		}
	};

	document.addEventListener('click', (event) => {
		const link = event.target?.closest?.('a[href]');
		if (!link) return;

		const href = link.getAttribute('href');
		if (!href || href.startsWith('#')) return;

		if (link.hasAttribute('download')) return;
		if (link.target && link.target.toLowerCase() === '_blank') return;

		if (!isCrossOriginHttpNavigation(href)) return;

		event.preventDefault();
		notifyNavigationError(href, 'anchor-click');

		try {
			window.open(href, '_blank', 'noopener,noreferrer');
		} catch {}
	}, true);

	document.addEventListener('submit', (event) => {
		const form = event.target;
		if (!(form instanceof HTMLFormElement)) return;

		const action = form.getAttribute('action') || window.location.href;
		if (!isCrossOriginHttpNavigation(action)) return;

		event.preventDefault();
		notifyNavigationError(action, 'form-submit');
	}, true);

	if (window.navigation) {
		window.navigation.addEventListener('navigate', (event) => {
			const url = event.destination.url;

			if (!isCrossOriginHttpNavigation(url)) {
				return;
			}

			if (event.cancelable) {
				event.preventDefault();
			}

			notifyNavigationError(url, 'navigation-api');
		});
	}
}
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		const tags = [
			...(isDev ? [{
				tag: 'script',
				attrs: { type: 'module' },
				children: configReactRefreshPreamble,
				injectTo: 'head-prepend',
			}] : []),
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsRuntimeErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsViteErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: {type: 'module'},
				children: configHorizonsConsoleErrroHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configWindowFetchMonkeyPatch,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configNavigationHandler,
				injectTo: 'head',
			},
		];

		if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
			tags.push(
				{
					tag: 'script',
					attrs: {
						src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
						'template-redirect-url': process.env.TEMPLATE_REDIRECT_URL,
					},
					injectTo: 'head',
				}
			);
		}

		return {
			html,
			tags,
		};
	},
};

// ── API local para desarrollo (replica /api/bold-checkout en Vite) ──
const localApiPlugin = {
	name: 'local-api',
	configureServer(server) {
		server.middlewares.use('/api/bold-checkout', (req, res) => {
			if (req.method !== 'POST') {
				res.statusCode = 405;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({ error: 'Método no permitido' }));
				return;
			}
			let raw = '';
			req.on('data', d => (raw += d));
			req.on('end', () => {
				try {
					const { cartItems } = JSON.parse(raw);
					const apiKey    = process.env.BOLD_API_KEY    || '';
					const secretKey = process.env.BOLD_SECRET_KEY || '';
					if (!apiKey || !secretKey) {
						res.statusCode = 500;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ error: 'Pasarela Bold no configurada. Agrega BOLD_API_KEY y BOLD_SECRET_KEY en .env.local' }));
						return;
					}
					if (!cartItems?.length) {
						res.statusCode = 400;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ error: 'El carrito está vacío' }));
						return;
					}
					const amount = cartItems.reduce((t, item) => {
						const priceCents = item.variant.sale_price_in_cents ?? item.variant.price_in_cents ?? 0;
						return t + Math.round(priceCents / 100) * item.quantity;
					}, 0);
					if (amount < 1000) {
						res.statusCode = 400;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify({ error: 'El monto mínimo de pago es $1.000 COP' }));
						return;
					}
					const orderId = `CSA-${Date.now()}`;
					const hash    = crypto.createHash('sha256')
						.update(`${orderId}${amount}COP${secretKey}`, 'utf8')
						.digest('hex');
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({ orderId, amount, hash, apiKey }));
				} catch (e) {
					res.statusCode = 500;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({ error: e.message }));
				}
			});
		});
	},
};

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

export default defineConfig({
	customLogger: logger,
	plugins: [
		...(isDev ? [inlineEditPlugin(), editModeDevPlugin(), iframeRouteRestorationPlugin(), selectionModePlugin(), localApiPlugin] : []),
		react(),
		addTransformIndexHtml
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types'
			]
		}
	}
});
