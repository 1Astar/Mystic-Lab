import { navigate } from '../router.ts';

/** @deprecated 完整命盘已并入 /ziwei/reading?mode=chart */
export function renderZiweiChart(_root: HTMLElement): () => void {
  navigate('/ziwei/reading?mode=chart');
  return () => undefined;
}
