/**
 * 点词「看完整百科」：只叠开该词条讲解，不整页跳走
 * 关掉后仍回到宿主（红娘档案 / 命盘页）
 */
import type { BaziChart } from '../bazi/cast.ts';
import { buildCodexDossier } from '../bazi/codex-dossier.ts';
import { getBaziEncyclopedia } from '../bazi/codex-encyclopedia.ts';
import { chartPresenceBrief } from '../bazi/codex-presence-brief.ts';
import { getStarCard } from '../bazi/codex-tags.ts';
import type { LuckCycles } from '../bazi/luck-cycles.ts';
import { navigate } from '../router.ts';
import { openLabConceptPeek, type LabConceptTab } from './lab-concept-peek.ts';

function joinBlocks(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/** 打开单条词条百科层（叠在当前弹窗之上） */
export function openBaziCodexEntryPeek(opts: {
  id: string;
  chart?: BaziChart | null;
  luck?: LuckCycles | null;
}): boolean {
  const entry = getBaziEncyclopedia(opts.id);
  if (!entry) return false;
  const d = buildCodexDossier(opts.id);
  const card = getStarCard(opts.id);
  const presence =
    chartPresenceBrief(opts.id, opts.chart ?? null, opts.luck ?? null).trim() ||
    '当前盘面未直接点亮此条；下面仍是这条词的通识讲解。';

  const tabs: LabConceptTab[] = [
    {
      id: 'what',
      label: '是什么',
      body: joinBlocks([d?.whatIs, entry.oneLiner, card?.where]),
    },
    {
      id: 'you',
      label: '在你身上',
      body: presence,
    },
    {
      id: 'live',
      label: '怎么显',
      body: joinBlocks([
        card?.impression,
        d?.personality,
        d?.career ? `做事：${d.career}` : '',
        d?.love ? `关系：${d.love}` : '',
      ]),
    },
    {
      id: 'care',
      label: '注意',
      body: joinBlocks([card?.trap, d?.imbalance, d?.memory]),
    },
  ].filter((t) => t.body.trim());

  openLabConceptPeek({
    term: entry.title,
    sourceHint: '本条百科 · 关掉回到刚才',
    tabs,
    initialTab: presence.includes('原局') ? 'you' : 'what',
    atlasLabel: '去图鉴逛全部',
    onOpenAtlas: () => {
      // 真要逛整本图鉴才跳页；先收起红娘档案，避免盖住
      document.querySelectorAll('dialog.mm-person-dialog[open]').forEach((el) => {
        if (el instanceof HTMLDialogElement) el.close();
      });
      try {
        sessionStorage.setItem('mystic-lab-open-codex-id', opts.id);
      } catch {
        /* ignore */
      }
      navigate('/bazi/tujian');
    },
  });
  return true;
}
