/**
 * 红娘角色类型与查找
 */
import type { PersonProfile } from '../life/types.ts';

export type MatchmakerCharacter = PersonProfile & {
  quote: string;
  job: string;
  /** 愿望 / 在意什么 */
  wish: string;
  /** 当前处境 */
  situation: string;
};

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('|');
}

export function findInPool(
  pool: MatchmakerCharacter[],
  id: string,
): MatchmakerCharacter | undefined {
  return pool.find((c) => c.id === id);
}
