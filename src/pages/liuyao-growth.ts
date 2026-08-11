import { navigate } from '../router.ts';

/**
 * 旧「成长档案」入口：成长并进单卦「我的相遇」（对标塔罗）。
 * 保留路由以免旧链接失效。
 */
export function renderLiuyaoGrowth(_root: HTMLElement): () => void {
  history.replaceState({}, '', '/liuyao/vault');
  navigate('/liuyao/vault');
  return () => {};
}
