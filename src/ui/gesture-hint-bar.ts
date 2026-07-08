import type { DrawMode } from '../tarot/draw-modes.ts';

export type RitualStep =
  | 'ritual'
  | 'shuffle'
  | 'cut'
  | 'draw'
  | 'flip'
  | 'reading'
  | 'confirm'
  | 'end';

type Hint = { icon: string; label: string; desc: string };

const GESTURE_HINTS: Record<RitualStep, Hint> = {
  ritual: { icon: '🙏', label: '进入仪式', desc: '星尘聚拢后轻触继续，或张掌保持 1 秒' },
  shuffle: { icon: '✊', label: '手掌收起', desc: '轻晃洗牌' },
  cut: { icon: '👋', label: '左右挥手', desc: '切牌' },
  draw: { icon: '🤏', label: '拇指食指捏合', desc: '抽牌（保持 0.3 秒）' },
  flip: { icon: '🖐️', label: '手掌上翻', desc: '翻开牌面' },
  reading: { icon: '⬆️', label: '向上滑动', desc: '放大细读 · 向下滑回' },
  confirm: { icon: '⏸️', label: '停留 1 秒', desc: '确认解读' },
  end: { icon: '🌬️', label: '手掌散开', desc: '结束仪式' },
};

const TOUCH_HINTS: Record<RitualStep, Hint> = {
  ritual: { icon: '✨', label: '进入仪式', desc: '星尘聚拢，轻触继续' },
  shuffle: { icon: '👆', label: '滑动洗牌', desc: '在牌堆上左右滑或画圈' },
  cut: { icon: '↔️', label: '横划切牌', desc: '横向划过牌堆' },
  draw: { icon: '👆', label: '滑动选牌', desc: '左右滑动选牌 · 上滑或长按抽出' },
  flip: { icon: '⬆️', label: '上滑翻牌', desc: '向上滑动或双击牌面' },
  reading: { icon: '⬆️', label: '向上滑动', desc: '放大细读 · 向下滑回' },
  confirm: { icon: '👆', label: '按住确认', desc: '按住屏幕约 1 秒' },
  end: { icon: '🌬️', label: '结束仪式', desc: '查看结果' },
};

const FREE_HINTS: Record<RitualStep, Hint> = {
  ritual: { icon: '✨', label: '进入仪式', desc: '星尘聚拢，轻触继续' },
  shuffle: { icon: '📱', label: '随心洗牌', desc: '摇一摇，或在屏幕上画圈' },
  cut: { icon: '〰️', label: '随心切牌', desc: '再摇一次，或横划一条线' },
  draw: { icon: '✍️', label: '随心抽牌', desc: '画下念头，或按住松手' },
  flip: { icon: '⬆️', label: '上滑翻牌', desc: '向上滑动牌面' },
  reading: { icon: '⬆️', label: '向上滑动', desc: '放大细读' },
  confirm: { icon: '👆', label: '按住确认', desc: '按住屏幕约 1 秒' },
  end: { icon: '🌬️', label: '结束仪式', desc: '查看结果' },
};

const BY_MODE: Record<DrawMode, Record<RitualStep, Hint>> = {
  gesture: GESTURE_HINTS,
  touch: TOUCH_HINTS,
  free: FREE_HINTS,
};

export function createGestureHintBar(): {
  el: HTMLElement;
  setStep: (step: RitualStep | null, mode?: DrawMode) => void;
  setProgress: (text: string) => void;
} {
  const bar = document.createElement('div');
  bar.className = 'gesture-hint-bar';
  bar.hidden = true;

  const icon = document.createElement('span');
  icon.className = 'hint-icon';

  const textWrap = document.createElement('div');
  textWrap.className = 'hint-text';

  const label = document.createElement('strong');
  const desc = document.createElement('span');
  desc.className = 'hint-desc';

  const progress = document.createElement('span');
  progress.className = 'hint-progress';

  textWrap.append(label, desc, progress);
  bar.append(icon, textWrap);

  let currentMode: DrawMode = 'touch';

  return {
    el: bar,
    setStep(step: RitualStep | null, mode: DrawMode = currentMode) {
      currentMode = mode;
      if (!step) {
        bar.hidden = true;
        return;
      }
      bar.hidden = false;
      const hint = BY_MODE[mode][step];
      icon.textContent = hint.icon;
      label.textContent = hint.label;
      desc.textContent = hint.desc;
      progress.textContent = '';
    },
    setProgress(text: string) {
      progress.textContent = text;
    },
  };
}
