/**
 * 猜题时「看两人的盘」：第一层只指位置，第二层才解释十神 + 图鉴 + 经历
 */
import { getBaziEncyclopedia } from '../bazi/codex-encyclopedia.ts';
import type { MatchmakerCast } from './cast.ts';
import type { MatchmakerCharacter } from './characters.ts';

export type ChartHint = {
  focusPersonId: string;
  focusName: string;
  /** 第一层：只指位置 */
  layer1: string;
  /** 高亮哪根柱的天干 */
  highlightKeys: Array<'year' | 'month' | 'day' | 'hour'>;
  /** 第二层标题 / 正文 */
  layer2Title: string;
  layer2Body: string;
  /** 可点开图鉴的词 */
  term: string;
  /** 故事侧习惯线索 */
  habitLine: string;
};

function peerOnMonth(cast: MatchmakerCast): { stem: string; dayStem: string; god: string } | null {
  const day = cast.bazi.pillars.find((p) => p.key === 'day');
  const month = cast.bazi.pillars.find((p) => p.key === 'month');
  if (!day || !month || day.empty || month.empty) return null;
  if (month.stemGod === '比肩' || month.stemGod === '劫财') {
    return { stem: month.stem, dayStem: day.stem, god: month.stemGod };
  }
  return null;
}

function pickFocus(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  ca: MatchmakerCast,
  cb: MatchmakerCast,
  /** 场景已点名的人（如拿到邀约的那位）优先 */
  preferId?: string,
): { ch: MatchmakerCharacter; cast: MatchmakerCast } {
  if (preferId === a.id) return { ch: a, cast: ca };
  if (preferId === b.id) return { ch: b, cast: cb };
  const score = (ch: MatchmakerCharacter, cast: MatchmakerCast): number => {
    let s = 0;
    if (/外地|事业|闯/.test(ch.wish)) s += 3;
    if (peerOnMonth(cast)) s += 4;
    if (/截止|机会|自己/.test(ch.situation)) s += 2;
    return s;
  };
  return score(a, ca) >= score(b, cb) ? { ch: a, cast: ca } : { ch: b, cast: cb };
}

/** 为猜题构建两层看盘提示 */
export function buildGuessChartHint(
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  ca: MatchmakerCast,
  cb: MatchmakerCast,
  preferPersonId?: string,
): ChartHint {
  const focus = pickFocus(a, b, ca, cb, preferPersonId);
  const peer = peerOnMonth(focus.cast);
  const bj = getBaziEncyclopedia('tg:比肩');
  const oneLiner = bj?.oneLiner ?? '像并肩的朋友：自我主张、分担，也容易较劲。';
  const habitLine = /机会|截止|换了工作|攒钱/.test(focus.ch.situation)
    ? `${focus.ch.nickname}以前遇到限时机会，习惯先自己拿主意，再回头说明。`
    : `${focus.ch.nickname}的处境是「${focus.ch.situation}」——有主见时，未必会先把话说开。`;

  if (peer) {
    return {
      focusPersonId: focus.ch.id,
      focusName: focus.ch.nickname,
      layer1: `先看：高亮${focus.ch.nickname}的日干与月干（先不要急着下结论）。`,
      highlightKeys: ['day', 'month'],
      layer2Title: `${peer.dayStem}日干 · ${peer.stem}月干 → ${peer.god}`,
      layer2Body:
        peer.god === '比肩'
          ? `两个都是「${peer.dayStem}」气场同辈，月干标作比肩。图鉴说：${oneLiner} 读法可以是「并肩」，也可以是「我先定」。`
          : `月干相对日干为${peer.god}。图鉴里的比劫都偏自我主张；劫财更急、更抢窗口。`,
      term: peer.god === '劫财' ? '劫财' : '比肩',
      habitLine,
    };
  }

  const day = focus.cast.bazi.pillars.find((p) => p.key === 'day');
  return {
    focusPersonId: focus.ch.id,
    focusName: focus.ch.nickname,
    layer1: `先看：高亮${focus.ch.nickname}的日柱（日干 ${focus.cast.dayStem}），再对照对方日干。`,
    highlightKeys: ['day'],
    layer2Title: `日主 ${focus.cast.dayStem}${focus.cast.dayBranch}`,
    layer2Body: `这局没有明显的「月干比肩」标记，就先用日主气质 + 经历读：${oneLiner}`,
    term: '比肩',
    habitLine,
    ...(day ? {} : {}),
  };
}

export function miniPillarsHtml(
  cast: MatchmakerCast,
  highlightKeys: Array<'year' | 'month' | 'day' | 'hour'>,
): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return cast.bazi.pillars
    .filter((p) => p.key !== 'liunian')
    .map((p) => {
      const on = highlightKeys.includes(p.key as 'year' | 'month' | 'day' | 'hour');
      return `<span class="mm-pillar${on ? ' is-day mm-hint-hi' : ''}" title="${escape(p.title)}${p.stemGod ? ` · ${escape(p.stemGod)}` : ''}">
        <em class="mm-stem${on ? ' mm-mark-stem' : ''}">${escape(p.stem)}</em><em class="mm-branch${on ? ' mm-mark-branch' : ''}">${escape(p.branch)}</em>
      </span>`;
    })
    .join('');
}
