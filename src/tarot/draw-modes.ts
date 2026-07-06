import type { EnvCapability } from '../core/browser-env.ts';

export type DrawMode = 'gesture' | 'touch' | 'free';

export type InputCapabilities = {
  hasTouch: boolean;
  hasMotion: boolean;
  canGesture: boolean;
};

export type DrawModeOption = {
  mode: DrawMode;
  title: string;
  desc: string;
  icon: string;
  available: boolean;
  unavailableReason?: string;
};

export function detectInputCapabilities(env: EnvCapability): InputCapabilities {
  const hasTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const hasMotion = typeof DeviceMotionEvent !== 'undefined';
  const canGesture = env.canUseCamera && env.canUseGesture;

  return { hasTouch, hasMotion, canGesture };
}

export function getDrawModeOptions(caps: InputCapabilities): DrawModeOption[] {
  return [
    {
      mode: 'gesture',
      title: '手势抽牌',
      desc: '摄像头识别手势，沉浸仪式感',
      icon: '🤚',
      available: caps.canGesture,
      unavailableReason: '当前环境无法使用摄像头手势',
    },
    {
      mode: 'touch',
      title: '触屏抽牌',
      desc: '滑动洗牌 · 长按抽牌 · 上滑翻牌',
      icon: '👆',
      available: true,
    },
    {
      mode: 'free',
      title: '随心抽牌',
      desc: caps.hasMotion
        ? '摇一摇 · 画符 · 按住松手'
        : '画下念头 · 按住松手',
      icon: '✨',
      available: caps.hasTouch,
      unavailableReason: '需要触屏设备',
    },
  ];
}

export function defaultDrawMode(caps: InputCapabilities): DrawMode {
  if (caps.hasTouch) return 'touch';
  if (caps.canGesture) return 'gesture';
  return 'touch';
}
