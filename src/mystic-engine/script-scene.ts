/** 剧本场景：v1 三场景 + 通用兜底 */
export type ScriptScene = 'interview' | 'reunion' | 'quit_stay' | 'fallback';

export function detectScriptScene(question: string): ScriptScene {
  const q = question.trim();
  if (!q) return 'fallback';

  if (
    /面试|求职|找工作|投简历|录用|offer|海投|HR|补材料|作品集|入职|过不过|能不能进|通过吗/.test(
      q,
    )
  ) {
    return 'interview';
  }
  if (/复合|挽回|和好|回头|还能不能在一起|分手后/.test(q)) {
    return 'reunion';
  }
  if (
    /离职|辞职|要不要留|该不该留|留下|走人|跳槽|去留|继续干|裸辞/.test(q) ||
    (/分手|要不要分|继续在一起/.test(q) && /感情|对象|恋爱|他|她|男朋友|女朋友/.test(q))
  ) {
    return 'quit_stay';
  }
  return 'fallback';
}
