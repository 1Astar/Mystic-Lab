import type { SceneAction } from './types.ts';

/** 把「【标题】正文」块拆成动作列表 */
export function parseWeekActions(nextSteps: string): SceneAction[] {
  return nextSteps
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      const m = block.match(/^【([^】]+)】\s*([\s\S]*)$/);
      if (m) {
        return {
          id: `week-${i}`,
          title: m[1]!.trim(),
          body: m[2]!.trim(),
        };
      }
      return {
        id: `week-${i}`,
        title: `动作 ${i + 1}`,
        body: block,
      };
    });
}
