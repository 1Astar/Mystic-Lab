/**
 * 解读/图鉴页浮钮快捷挂载（方案1统一壳）
 */
import {
  BAZI_SHARE_POSTER_PATH,
  LIUYAO_SHARE_POSTER_PATH,
  TAROT_SHARE_POSTER_PATH,
  ZIWEI_SHARE_POSTER_PATH,
} from '../share/cover.ts';
import { draftGeneric } from '../share/drafts.ts';
import type { ShareDraft } from '../share/sheet.ts';
import { openLabDeepSheet, type LabDeepSystem } from './lab-deep-sheet.ts';
import { mountLabFloatActions } from './lab-float-actions.ts';
import {
  openLabNotesSheet,
  type LabNotesSurface,
  type LabNotesSystem,
} from './lab-notes-sheet.ts';

const SYSTEM_SHARE: Record<LabNotesSystem, ShareDraft['system']> = {
  bazi: 'bazi',
  ziwei: 'lab',
  liuyao: 'liuyao',
  tarot: 'tarot',
  xiaoliuren: 'xiaoliuren',
};

const SYSTEM_TITLE: Record<LabNotesSystem, string> = {
  bazi: '八字',
  ziwei: '紫微',
  liuyao: '六爻',
  tarot: '塔罗',
  xiaoliuren: '小六壬',
};

const SYSTEM_POSTER: Partial<Record<LabNotesSystem, string>> = {
  bazi: BAZI_SHARE_POSTER_PATH,
  ziwei: ZIWEI_SHARE_POSTER_PATH,
  liuyao: LIUYAO_SHARE_POSTER_PATH,
  tarot: TAROT_SHARE_POSTER_PATH,
};

export type MountLabFloatShellOpts = {
  system: LabNotesSystem;
  surface: LabNotesSurface;
  atlasMode?: boolean;
  tujianPath?: string;
  /** 分享草稿；缺省用体系通用卡 */
  draftShare?: () => ShareDraft | null | undefined;
  /** AI 追问；缺省开空追问面板 */
  onDeep?: () => void;
  answerConcept?: (q: string) => { answer: string; hit: boolean };
  notesContext?: string | (() => string | undefined);
  seedQuery?: () => string | undefined;
};

function resolveDeepSystem(system: LabNotesSystem): LabDeepSystem {
  return system;
}

/** 挂统一四钮；返回 dispose */
export function mountLabFloatShell(
  page: HTMLElement,
  opts: MountLabFloatShellOpts,
): () => void {
  const title = SYSTEM_TITLE[opts.system];
  const atlas = Boolean(opts.atlasMode);

  const contextFn =
    typeof opts.notesContext === 'function' ? opts.notesContext : null;
  const contextStr =
    typeof opts.notesContext === 'string' ? opts.notesContext : undefined;

  const answerConcept =
    opts.answerConcept ??
    ((q: string) => ({
      answer: `关于「${q}」：本体系本地词库还在补，可先记到笔记，或换个说法再问。`,
      hit: false,
    }));

  return mountLabFloatActions(page, {
    system: opts.system,
    surface: opts.surface,
    atlasMode: atlas,
    tujianPath: opts.tujianPath,
    notesContext: contextStr,
    answerConcept,
    onNotes: contextFn
      ? () => {
          openLabNotesSheet({
            system: opts.system,
            surface: opts.surface,
            context: contextFn() || (atlas ? `${title}图鉴` : `${title}解读`),
          });
        }
      : undefined,
    draftShare:
      opts.draftShare ??
      (() =>
        draftGeneric({
          system: SYSTEM_SHARE[opts.system],
          headline: atlas ? `${title}图鉴` : `${title}解读`,
          question: atlas ? `${title}图鉴` : `${title}解读`,
          summary: atlas
            ? `正在浏览${title}图鉴。`
            : `正在看${title}解读。`,
          label: title,
          invitePosterPath: SYSTEM_POSTER[opts.system],
        })),
    onDeep:
      opts.onDeep ??
      (() => {
        openLabDeepSheet({
          system: resolveDeepSystem(opts.system),
          title: atlas ? `${title}图鉴追问` : `${title}追问`,
          initialTab: 'ask',
          seedQuery: opts.seedQuery?.(),
          answerConcept,
          deepHint: '概念优先本地词库；完整 AI 深度可后续接入。',
        });
      }),
  });
}
