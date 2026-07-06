export type EnvCapability = {
  isWeChat: boolean;
  isIOS: boolean;
  iosVersion: number | null;
  isSecureContext: boolean;
  isHttps: boolean;
  isLocalhost: boolean;
  hasGetUserMedia: boolean;
  hasWorker: boolean;
  hasWasm: boolean;
  canUseCamera: boolean;
  canUseGesture: boolean;
  shouldShowWeChatWarning: boolean;
  shouldBlockCamera: boolean;
  warnings: string[];
};

export function parseIOSVersion(ua: string): number | null {
  const match = ua.match(/OS (\d+)[_.](\d+)/);
  if (!match) return null;
  return Number(match[1]) + Number(match[2]) / 10;
}

export function detectBrowserEnv(
  ua: string = navigator.userAgent,
  secureContext: boolean = window.isSecureContext,
  protocol: string = location.protocol,
  hostname: string = location.hostname,
  capabilities: {
    hasGetUserMedia?: boolean;
    hasWorker?: boolean;
    hasWasm?: boolean;
  } = {},
): EnvCapability {
  const isWeChat = /MicroMessenger/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const iosVersion = isIOS ? parseIOSVersion(ua) : null;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isHttps = protocol === 'https:';
  const isSecureContext = secureContext;
  const hasGetUserMedia =
    capabilities.hasGetUserMedia ?? !!navigator.mediaDevices?.getUserMedia;
  const hasWorker = capabilities.hasWorker ?? typeof Worker !== 'undefined';
  const hasWasm = capabilities.hasWasm ?? typeof WebAssembly !== 'undefined';

  const warnings: string[] = [];

  if (!isSecureContext && !isLocalhost && !isHttps) {
    warnings.push('当前页面非安全上下文，摄像头不可用。请使用 HTTPS 访问。');
  }

  if (!isHttps && !isLocalhost) {
    warnings.push('摄像头 API 需要 HTTPS 环境。');
  }

  if (isHttps && !isLocalhost && !isSecureContext) {
    warnings.push('当前为自签名 HTTPS，若摄像头无响应，请在地址栏信任证书后刷新。');
  }

  if (isWeChat) {
    warnings.push('微信内置浏览器对摄像头/手势能力支持有限，建议用 Safari 或 Chrome 打开。');
  }

  if (isIOS && iosVersion !== null && iosVersion < 14.3) {
    warnings.push('当前 iOS 版本较低，请升级至 iOS 14.3 以上以使用摄像头。');
  }

  // HTTPS 或 localhost 均尝试请求摄像头；不因手势/WASM 能力而提前拦截
  const shouldBlockCamera =
    (!isHttps && !isLocalhost) ||
    !hasGetUserMedia ||
    (isIOS && iosVersion !== null && iosVersion < 14.3);

  const canUseCamera = !shouldBlockCamera;
  // HTTPS 下即使证书不受信任也尝试手势（与摄像头策略一致）
  const canUseGesture = canUseCamera && hasWorker && hasWasm && !isWeChat;

  if (canUseCamera && !canUseGesture && isWeChat) {
    warnings.push('当前环境建议使用触控模式完成仪式。');
  }

  return {
    isWeChat,
    isIOS,
    iosVersion,
    isSecureContext,
    isHttps,
    isLocalhost,
    hasGetUserMedia,
    hasWorker,
    hasWasm,
    canUseCamera,
    canUseGesture,
    shouldShowWeChatWarning: isWeChat,
    shouldBlockCamera,
    warnings,
  };
}
