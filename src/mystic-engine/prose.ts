/** 解读正文：拆短段，避免大块墙字 */

/** 把长段按句号拆成短段；有句号则一句一段，宁短勿长 */
export function splitProse(text: string, softMax = 40): string[] {
  const raw = text.replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  const blocks = raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const block of blocks) {
    const sentences = block
      .split(/([。！？；])/)
      .reduce<string[]>((acc, part, i, arr) => {
        if (!part) return acc;
        if (/^[。！？；]$/.test(part)) {
          if (acc.length) acc[acc.length - 1] = `${acc[acc.length - 1]}${part}`;
          return acc;
        }
        // 下一项若是标点，先挂上
        const next = arr[i + 1];
        if (next && /^[。！？；]$/.test(next)) {
          acc.push(part);
          return acc;
        }
        acc.push(part);
        return acc;
      }, [])
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      if (block.length <= softMax) out.push(block);
      else out.push(...chunkByComma(block, softMax));
      continue;
    }

    for (const s of sentences) {
      if (s.length <= softMax) out.push(s);
      else out.push(...chunkByComma(s, softMax));
    }
  }
  return out;
}

function chunkByComma(text: string, softMax: number): string[] {
  const parts = text.split(/(?<=[，、：:])/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) return [text];
  const out: string[] = [];
  let buf = '';
  for (const p of parts) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (buf.length + p.length <= softMax + 8) buf += p;
    else {
      out.push(buf);
      buf = p;
    }
  }
  if (buf) out.push(buf);
  return out;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 输出多个短 <p>，便于扫读 */
export function formatProseHtml(text: string, className = 'ly-pack-p'): string {
  return splitProse(text)
    .map((line) => `<p class="${className}">${escapeHtml(line)}</p>`)
    .join('');
}
