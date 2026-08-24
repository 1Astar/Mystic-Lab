/**
 * 随心而行 · Bug 反馈入口（独立右下角，不进悬浮簇）
 * 配置：VITE_STAR_PM_FEEDBACK_TOKEN + 可选 VITE_STAR_PM_FEEDBACK_ENDPOINT
 */
import { APP_VERSION } from '../core/version.ts';

const DEFAULT_ENDPOINT = 'https://pm.starry-studio.cn/api/public/bug-feedback';
const DEFAULT_WIDGET =
  'https://pm.starry-studio.cn/bug-feedback-widget.js';

type StarPmBugFeedbackApi = {
  mount: (opts: Record<string, string>) => () => void;
};

declare global {
  interface Window {
    StarPmBugFeedback?: StarPmBugFeedbackApi;
  }
}

function env(name: string): string {
  try {
    return String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.[name] ?? '').trim();
  } catch {
    return '';
  }
}

export function mountBugFeedback(): () => void {
  const token = env('VITE_STAR_PM_FEEDBACK_TOKEN');
  if (!token) return () => {};

  const endpoint = env('VITE_STAR_PM_FEEDBACK_ENDPOINT') || DEFAULT_ENDPOINT;
  const widgetUrl = env('VITE_STAR_PM_FEEDBACK_WIDGET') || DEFAULT_WIDGET;

  let disposed = false;
  let disposeMount: (() => void) | undefined;

  const run = () => {
    if (disposed) return;
    disposeMount?.();
    disposeMount = window.StarPmBugFeedback?.mount({
      token,
      endpoint,
      version: APP_VERSION,
      label: '反馈',
      // 避开右侧悬浮簇
      offsetRight: '72',
      offsetBottom: '20',
    });
  };

  if (window.StarPmBugFeedback?.mount) {
    run();
  } else {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-star-bug-feedback-loader="mystic"]',
    );
    if (existing) {
      existing.addEventListener('load', run);
    } else {
      const script = document.createElement('script');
      script.src = widgetUrl;
      script.async = true;
      script.dataset.starBugFeedbackLoader = 'mystic';
      script.addEventListener('load', run);
      script.addEventListener('error', () => {
        console.warn('[bug-feedback] widget 加载失败', widgetUrl);
      });
      document.body.appendChild(script);
    }
  }

  return () => {
    disposed = true;
    disposeMount?.();
  };
}
