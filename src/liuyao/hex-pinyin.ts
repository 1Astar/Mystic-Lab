/**
 * 六十四卦注音：只给易读错/生僻的字注，常见卦名不注。
 */
const HEX_PINYIN: Record<string, string> = {
  屯: 'zhūn', // 易读成 tún
  否: 'pǐ', // 易读成 fǒu
  噬嗑: 'shì hé',
  贲: 'bì',
  颐: 'yí',
  遁: 'dùn',
  睽: 'kuí',
  蹇: 'jiǎn',
  夬: 'jué',
  姤: 'gòu',
  萃: 'cuì',
  艮: 'gèn',
  涣: 'huàn',
  蛊: 'gǔ',
};

/** 仅生僻/易错字有返回；常见卦返回 undefined */
export function hexPinyin(name: string): string | undefined {
  return HEX_PINYIN[name];
}

/** 有注音才带（jué）；否则原样全名 */
export function formatHexWithPinyin(name: string, fullName: string): string {
  const py = hexPinyin(name);
  const label = fullName || name;
  if (!py) return label;
  if (label.includes(name)) return `${label}（${py}）`;
  return `${label}（${py}）`;
}

/** 仅短名：夬（jué）；常见字不加括号 */
export function formatHexShortWithPinyin(name: string): string {
  const py = hexPinyin(name);
  return py ? `${name}（${py}）` : name;
}
