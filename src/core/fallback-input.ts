import type { RitualStep } from '../ui/gesture-hint-bar.ts';

export type FallbackAction =
  | 'ritual'
  | 'shuffle'
  | 'cut'
  | 'draw'
  | 'flip'
  | 'zoom_in'
  | 'zoom_out'
  | 'confirm'
  | 'end';

const STEP_BUTTONS: Record<RitualStep, { action: FallbackAction; label: string }[]> = {
  ritual: [
    { action: 'ritual', label: '🙏 进入仪式' },
  ],
  shuffle: [{ action: 'shuffle', label: '✊ 手掌收起洗牌' }],
  cut: [{ action: 'cut', label: '👋 切牌' }],
  draw: [{ action: 'draw', label: '🤏 捏合抽牌' }],
  flip: [{ action: 'flip', label: '🖐️ 手掌上翻' }],
  review: [],
  reading: [
    { action: 'zoom_in', label: '⬆️ 放大细读' },
    { action: 'zoom_out', label: '⬇️ 回到牌阵' },
  ],
  confirm: [{ action: 'confirm', label: '⏸️ 确认解读' }],
  end: [{ action: 'end', label: '🌬️ 结束仪式' }],
};

export function createFallbackInput(
  onAction: (action: FallbackAction) => void,
): {
  el: HTMLElement;
  setVisible: (visible: boolean) => void;
  setStep: (step: RitualStep | null) => void;
  setHint: (text: string) => void;
} {
  const wrap = document.createElement('div');
  wrap.className = 'fallback-input';
  wrap.hidden = true;

  const hint = document.createElement('p');
  hint.className = 'fallback-hint';
  hint.textContent = '也可使用下方辅助按钮完成当前步骤';

  const btnWrap = document.createElement('div');
  btnWrap.className = 'fallback-btns';

  wrap.append(hint, btnWrap);

  function setStep(step: RitualStep | null): void {
    btnWrap.innerHTML = '';
    if (!step) return;
    for (const btn of STEP_BUTTONS[step]) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'btn btn-secondary fallback-btn';
      el.textContent = btn.label;
      el.addEventListener('click', () => onAction(btn.action));
      btnWrap.appendChild(el);
    }
  }

  return {
    el: wrap,
    setVisible(visible: boolean) {
      wrap.hidden = !visible;
    },
    setStep,
    setHint(text: string) {
      hint.textContent = text;
    },
  };
}
