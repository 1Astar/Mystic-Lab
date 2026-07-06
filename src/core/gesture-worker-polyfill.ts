/**
 * MediaPipe tasks-vision 在 Vite ESM Worker 中需要这些垫片。
 * 根因：Worker 里 importScripts 不可用 → 回退到 self.import（默认不存在）
 * → WASM 脚本未执行 → ModuleFactory not set
 *
 * @see https://github.com/google-ai-edge/mediapipe/issues/6259
 */
export function installGestureWorkerPolyfills(): void {
  installDocumentPolyfill();
  installSelfImportPolyfill();
}

function installDocumentPolyfill(): void {
  if (typeof document !== 'undefined') return;

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'createElement') {
        return (tag: string) => {
          if (tag === 'canvas') return new OffscreenCanvas(1, 1);
          return {};
        };
      }
      return undefined;
    },
    has() {
      return false;
    },
  };

  (self as unknown as { document: Document }).document = new Proxy({}, handler) as Document;
}

function installSelfImportPolyfill(): void {
  const root = self as unknown as {
    import?: (url: string) => Promise<unknown>;
    ModuleFactory?: unknown;
  };

  if (typeof root.import === 'function') return;

  root.import = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WASM 脚本 HTTP ${response.status}：${url}`);
    }

    let text = await response.text();

    // Emscripten 在 strict ESM 下 function-in-block 会报错
    text = text.replace(
      /if\s*\(\s*typeof\s*\(?\s*custom_dbg\s*\)?\s*===?\s*["']undefined["']\s*\)\s*\{\s*function\s+custom_dbg\s*\(\s*text\s*\)\s*\{/,
      "var custom_dbg; if (typeof custom_dbg === 'undefined') { custom_dbg = function(text) {",
    );

    if (!text.includes('globalThis.ModuleFactory')) {
      text += '\nglobalThis.ModuleFactory = typeof ModuleFactory !== "undefined" ? ModuleFactory : globalThis.ModuleFactory;\n';
    }

    const blob = new Blob([text], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    try {
      const mod = (await import(/* @vite-ignore */ blobUrl)) as { default?: unknown };
      const g = globalThis as typeof globalThis & { ModuleFactory?: unknown };
      if (mod.default) {
        root.ModuleFactory = mod.default;
        g.ModuleFactory = mod.default;
      } else if (root.ModuleFactory) {
        g.ModuleFactory = root.ModuleFactory;
      }
      return mod;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };
}
