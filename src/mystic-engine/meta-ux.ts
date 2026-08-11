/**
 * 识别「问产品体验 / 流程空不空」类元问题，避免答成卦象人事模板。
 */
export function isMetaUxQuestion(question: string): boolean {
  const t = question.trim();
  if (!t) return false;
  const aboutFlow = /流程|步骤|走完|起卦|仪式|太长|太繁|复杂/.test(t);
  const aboutEmpty = /解读|太空|空不空|太虚|看不懂|模板感|空洞|空话/.test(t);
  const metaFrame = /刚来玩|新手|用户|体验|会不会觉得|玩的|作为一个/.test(t);
  return (aboutFlow && aboutEmpty) || (metaFrame && (aboutFlow || aboutEmpty));
}
