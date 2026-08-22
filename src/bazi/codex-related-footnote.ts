/**
 * 图鉴列表「关联知识点」脚注：从词条关系 / dossier.combos 抽可跳转链接。
 */
import { buildCodexDossier } from './codex-dossier.ts';
import {
  getBaziEncyclopedia,
  listBaziEncyclopedia,
} from './codex-encyclopedia.ts';
import { STEM_WUXING } from './elements.ts';

export type RelatedFootnote = {
  peerId: string;
  peerLabel: string;
  /** 短注：常与【X】同现，…… */
  gloss: string;
};

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

const STEM_PEER: Record<string, string> = {
  甲: '乙',
  乙: '甲',
  丙: '丁',
  丁: '丙',
  戊: '己',
  己: '戊',
  庚: '辛',
  辛: '庚',
  壬: '癸',
  癸: '壬',
};

/** 天干条目常与「同气十神」同现：阳干→比肩语境，阴干→劫财语境（相对自身当令时） */
const STEM_TEN_GOD_FOOT: Record<string, { id: string; label: string; gloss: string }> = {
  甲: {
    id: 'tg:比肩',
    label: '比肩',
    gloss: '同气并肩，成林或争辉都在这一层谈',
  },
  乙: {
    id: 'tg:劫财',
    label: '劫财',
    gloss: '同气异性，攀缘与分享常一起出现',
  },
  丙: {
    id: 'tg:比肩',
    label: '比肩',
    gloss: '同气外放，热度与竞争常同框',
  },
  丁: {
    id: 'tg:劫财',
    label: '劫财',
    gloss: '同气内火，细照与分光常同现',
  },
  戊: {
    id: 'tg:比肩',
    label: '比肩',
    gloss: '同气承载，立业与分担常一起谈',
  },
  己: {
    id: 'tg:劫财',
    label: '劫财',
    gloss: '同气田园，滋养与争夺资源同框',
  },
  庚: {
    id: 'tg:比肩',
    label: '比肩',
    gloss: '同气锋刃，规则与较劲常同现',
  },
  辛: {
    id: 'tg:劫财',
    label: '劫财',
    gloss: '同气珠玉，精致与分割常一起看',
  },
  壬: {
    id: 'tg:比肩',
    label: '比肩',
    gloss: '同气奔流，扩展与并进常同框',
  },
  癸: {
    id: 'tg:劫财',
    label: '劫财',
    gloss: '同气雨露，润物与争润常同现',
  },
};

export function resolveCodexPeerId(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (getBaziEncyclopedia(text)) return text;

  const stripped = text.replace(/[金木水火土阴阳]/g, '').trim();
  if (stripped && getBaziEncyclopedia(stripped)) return stripped;

  for (const s of STEMS) {
    if (text.includes(s) && getBaziEncyclopedia(s)) return s;
  }
  for (const b of BRANCHES) {
    if (text.includes(b) && getBaziEncyclopedia(b)) return b;
  }

  const tg = `tg:${stripped || text}`;
  if (getBaziEncyclopedia(tg)) return tg;
  const ss = `ss:${stripped || text}`;
  if (getBaziEncyclopedia(ss)) return ss;

  const hit = listBaziEncyclopedia().find(
    (e) => e.title === text || e.title.includes(text) || text.includes(e.title),
  );
  return hit?.id ?? null;
}

function pushUnique(
  out: RelatedFootnote[],
  item: RelatedFootnote,
  selfId: string,
): void {
  if (!item.peerId || item.peerId === selfId) return;
  if (out.some((x) => x.peerId === item.peerId)) return;
  out.push(item);
}

/**
 * 列表脚注：默认 1 条，极小字「常与【X】同现」。
 */
export function relatedFootnotesFor(
  id: string,
  limit = 1,
): RelatedFootnote[] {
  const entry = getBaziEncyclopedia(id);
  if (!entry || limit <= 0) return [];
  const out: RelatedFootnote[] = [];

  if (entry.kind === 'stem') {
    const tg = STEM_TEN_GOD_FOOT[entry.id];
    if (tg && getBaziEncyclopedia(tg.id)) {
      pushUnique(
        out,
        { peerId: tg.id, peerLabel: tg.label, gloss: tg.gloss },
        id,
      );
    }
    const peer = STEM_PEER[entry.id];
    if (peer && getBaziEncyclopedia(peer)) {
      const peerEntry = getBaziEncyclopedia(peer)!;
      const wx = STEM_WUXING[peer] || peerEntry.tags.wuxing || '';
      pushUnique(
        out,
        {
          peerId: peer,
          peerLabel: peerEntry.title,
          gloss: wx
            ? `同属${wx}，一刚一柔常对照着读`
            : '同气异性，常对照着读',
        },
        id,
      );
    }
  }

  const relPools = [
    ...entry.relations.helpedBy,
    ...entry.relations.generates,
    ...entry.relations.controls,
    ...entry.relations.drainedBy,
  ];
  for (const r of relPools) {
    if (out.length >= limit + 2) break;
    const peerId = resolveCodexPeerId(r.id) || r.id;
    if (!getBaziEncyclopedia(peerId)) continue;
    const peer = getBaziEncyclopedia(peerId)!;
    pushUnique(
      out,
      {
        peerId,
        peerLabel: peer.title,
        gloss: r.label.includes(peer.title)
          ? peer.oneLiner.slice(0, 22)
          : `${r.label} · ${peer.oneLiner.slice(0, 16)}`,
      },
      id,
    );
  }

  const dossier = buildCodexDossier(id);
  if (dossier) {
    for (const c of dossier.combos) {
      if (out.length >= limit + 2) break;
      const peerId = resolveCodexPeerId(c.peer);
      if (!peerId || !getBaziEncyclopedia(peerId)) continue;
      const peer = getBaziEncyclopedia(peerId)!;
      const gloss = c.note.replace(/^[^：:]+[：:]/, '').trim().slice(0, 28);
      pushUnique(
        out,
        {
          peerId,
          peerLabel: peer.title,
          gloss: gloss || peer.oneLiner.slice(0, 22),
        },
        id,
      );
    }
  }

  return out.slice(0, limit);
}
