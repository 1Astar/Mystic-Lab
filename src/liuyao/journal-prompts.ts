/** 结果页同人笔记填空 */
export const JOURNAL_PROMPT_FIELDS = [
  { key: 'feel', label: '我的直觉感受', placeholder: '第一眼的感觉…' },
  { key: 'touch', label: '卦象中最触动我的一句话', placeholder: '哪一句戳到你…' },
  { key: 'reflect', label: '几天后/几周后回看，我的反思是', placeholder: '预留回看空位…' },
] as const;

export type JournalPromptKey = (typeof JOURNAL_PROMPT_FIELDS)[number]['key'];

export function renderJournalPromptsHtml(): string {
  return `
    <div class="ly-note-prompts">
      ${JOURNAL_PROMPT_FIELDS.map(
        (f) => `
        <label class="ly-note-prompt">
          <span>${f.label}</span>
          <input type="text" class="question-input" data-note-prompt="${f.key}" placeholder="${f.placeholder}" />
        </label>`,
      ).join('')}
    </div>
  `;
}

export function collectJournalPrompts(root: HTMLElement): string {
  const parts: string[] = [];
  for (const f of JOURNAL_PROMPT_FIELDS) {
    const input = root.querySelector<HTMLInputElement>(`[data-note-prompt="${f.key}"]`);
    const v = input?.value.trim() ?? '';
    if (v) parts.push(`${f.label}：${v}`);
  }
  return parts.join('\n');
}

export function mergeReflection(draft: string, prompts: string): string {
  const a = draft.trim();
  const b = prompts.trim();
  if (a && b) return `${b}\n\n${a}`;
  return a || b;
}
