/** 结果页同人笔记填空 */
export const JOURNAL_PROMPT_FIELDS = [
  { key: 'dong', label: '动爻让我想到', placeholder: '某个具体场景 / 人 / 选择…' },
  { key: 'shi', label: '用神或世应让我感觉', placeholder: '稳 / 慌 / 被推着走…' },
  { key: 'verify', label: '事后想验证的一点', placeholder: '考完再回来对一下…' },
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
