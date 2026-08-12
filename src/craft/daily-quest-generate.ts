/**
 * Daily_Quest 生成：日常/周常、宫位 CD、模板与可选 AI、换任务
 */
import type { PersonProfile } from '../life/types.ts';
import {
  canUseMysticDeep,
  canUseMysticFollow,
  loadAiServiceMode,
  recordFollowUse,
} from '../ai/ai-mode.ts';
import { resolveAiRunReady, runChatCompletion } from '../ai/chat-runner.ts';
import type { ZiweiChartView } from '../ziwei/types.ts';
import {
  axisForTopic,
  DAILY_ATTR,
  DAILY_XP,
  MAX_SWAPS_PER_CADENCE,
  shortTopic,
  SWAP_XP_COST,
  WEEKLY_ATTR,
  WEEKLY_XP,
  type DailyQuest,
  type QuestCadence,
} from './daily-quest-types.ts';
import {
  lastWeekTopics,
  listActiveQuests,
  loadAllQuests,
  loadWeekSummary,
  pruneWeekData,
  recentTopics,
  saveWeekSummary,
  toYmd,
  upsertQuest,
  weekStartMonday,
} from './daily-quest-store.ts';
import { dismissQuest, spendXpForSwap } from './daily-quest-settle.ts';

const FALLBACK_TOPICS = ['兄弟', '田宅', '疾厄', '福德', '子女'];

const TEMPLATES: Record<string, { title: string; body: string }> = {
  官禄: {
    title: '最小职业实验',
    body: '今天做一件最小职业实验：约 15 分钟信息访谈，或改简历里最能代表你的三行，并记下一条真实反馈。',
  },
  仆役: {
    title: '认识新朋友',
    body: '今天主动认识一位新朋友或重启一段淡了的联络：一次真诚问候 + 一个轻松邀约，不谈事务。',
  },
  交友: {
    title: '认识新朋友',
    body: '今天主动认识一位新朋友或重启一段淡了的联络：一次真诚问候 + 一个轻松邀约，不谈事务。',
  },
  夫妻: {
    title: '说清需要',
    body: '今天留一段不被打扰的相处或独处：写下亲密里真正需要的三件事，只选一件今天能说出口或做出来的。',
  },
  福德: {
    title: '静心写生',
    body: '今天给自己留 30 分钟独处：关掉通知，写下对现在生活最满意的一件事，以及一件想慢慢调整的事。',
  },
  命宫: {
    title: '认出自己',
    body: '今天用三句话说清「我是谁、我最近真正想要什么、我愿意先改的一件小事」，贴在你每天能看见的地方。',
  },
  迁移: {
    title: '环境采样',
    body: '今天去一个你不常去的地方待 40 分钟，回来写三句：哪里充电、哪里耗电、下周可重复什么。',
  },
  财帛: {
    title: '现金流体检',
    body: '今天做一次现金流体检：列出本月固定开销与可砍的一项，并把一笔小钱转入蓄水池（哪怕 50 元）。',
  },
  田宅: {
    title: '空间清零',
    body: '今天整理一个你每天经过的角落：扔掉或归档 5 件不用的东西，并拍一张清爽后的照片。',
  },
  疾厄: {
    title: '节律修复',
    body: '今天晚上提前 30 分钟睡：睡前不刷工作消息，只做一件让身体放松的小事。',
  },
  兄弟: {
    title: '主动问候',
    body: '今天给一位同辈伙伴发一条不含事务的问候，并约一个轻量碰头（咖啡/散步/语音 10 分钟）。',
  },
  子女: {
    title: '小作品',
    body: '今天完成一个 15 分钟小作品：一段文字、一张图或一段录音，只为自己，不求完美。',
  },
  父母: {
    title: '边界一句',
    body: '今天在出处/权威议题上写清一句边界或感谢，写下来再决定是否发出。',
  },
};

const WEEKLY_TEMPLATES: Record<string, { title: string; body: string }> = {
  官禄: {
    title: '本周事业破局',
    body: '本周完成一次稍难的职业行动：正式约 1 次深度访谈，或投出一版认真改过的材料，并复盘「我真正想要的反馈」。',
  },
  仆役: {
    title: '本周扩展圈子',
    body: '本周参加或组织一次轻社交：认识至少两位新朋友，并记下谁让你感到被滋养。',
  },
  交友: {
    title: '本周扩展圈子',
    body: '本周参加或组织一次轻社交：认识至少两位新朋友，并记下谁让你感到被滋养。',
  },
  福德: {
    title: '本周内心安定',
    body: '本周安排一次 2 小时深度独处或疗愈仪式，写下「我愿意慢慢成为的人」三段话。',
  },
};

function newId(): string {
  return `dq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function candidateTopics(view: ZiweiChartView): string[] {
  const list: string[] = [];
  const push = (name?: string) => {
    if (!name) return;
    const t = shortTopic(name);
    if (!list.includes(t)) list.push(t);
  };
  for (const p of view.theater.annual.focusPalaces ?? []) push(p);
  push(view.theater.decade.palaceName);
  push(view.soulPalace.name);
  for (const p of view.palaces) {
    const peach = [...p.majors, ...p.minors, ...p.adjectives].some((s) =>
      /红鸾|天喜|咸池|沐浴/.test(s.name),
    );
    if (peach) push(p.name);
  }
  for (const t of FALLBACK_TOPICS) push(t);
  return list;
}

function pickTopic(
  view: ZiweiChartView,
  userId: string,
  avoidExtra: string[] = [],
): string {
  const banned = new Set([
    ...lastWeekTopics(userId).map(shortTopic),
    ...recentTopics(userId, 3).map(shortTopic),
    ...avoidExtra.map(shortTopic),
  ]);
  // 若连续三周同宫已在 recentTopics 里，banned 会挡住
  const cands = candidateTopics(view).filter((t) => !banned.has(t));
  const pool = cands.length ? cands : FALLBACK_TOPICS.filter((t) => !banned.has(t));
  return pool[0] ?? '福德';
}

function originFor(view: ZiweiChartView, topic: string): string {
  const palace = view.palaces.find(
    (p) => shortTopic(p.name) === shortTopic(topic),
  );
  const stars = palace
    ? [...palace.majors, ...palace.minors]
        .map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : ''))
        .slice(0, 3)
        .join('、')
    : '';
  const mutagen = view.theater.annual.mutagenLine?.split(/[·、]/)[0]?.trim() || '';
  if (stars && mutagen) return `${shortTopic(topic)}宫见${stars} · ${mutagen}`;
  if (stars) return `${shortTopic(topic)}宫见${stars}`;
  if (mutagen) return `流年${mutagen} · 关注${shortTopic(topic)}宫`;
  return `本流年课题落在${shortTopic(topic)}宫`;
}

function templateFor(topic: string, cadence: QuestCadence): { title: string; body: string } {
  const t = shortTopic(topic);
  if (cadence === 'weekly') {
    return WEEKLY_TEMPLATES[t] ?? {
      title: `本周·${t}`,
      body: `本周围绕${t}宫做一件稍有挑战、但本周内能完成的事，并写下三句复盘。`,
    };
  }
  return (
    TEMPLATES[t] ?? {
      title: `${t}小练习`,
      body: `今天做一件与${t}宫相关的小事（30–60 分钟），做完在心里打勾即可。`,
    }
  );
}

function buildQuestRow(input: {
  userId: string;
  view: ZiweiChartView;
  cadence: QuestCadence;
  topic: string;
  questDate: string;
  swappedFrom?: string;
}): DailyQuest {
  const tpl = templateFor(input.topic, input.cadence);
  const isWeekly = input.cadence === 'weekly';
  return {
    id: newId(),
    userId: input.userId,
    questDate: input.questDate,
    cadence: input.cadence,
    topic: shortTopic(input.topic),
    origin: originFor(input.view, input.topic),
    taskTitle: tpl.title,
    taskDescription: tpl.body,
    rewardType: axisForTopic(input.topic),
    rewardValue: isWeekly ? WEEKLY_ATTR : DAILY_ATTR,
    xpValue: isWeekly ? WEEKLY_XP : DAILY_XP,
    status: 'todo',
    isSettled: false,
    source: 'template',
    createdAt: new Date().toISOString(),
    swappedFrom: input.swappedFrom,
  };
}

async function polishQuest(
  quest: DailyQuest,
  _view: ZiweiChartView,
  person: PersonProfile,
): Promise<DailyQuest> {
  const ready = resolveAiRunReady({
    kind: 'follow',
    mysticFollowOk: canUseMysticFollow(),
    mysticDeepOk: canUseMysticDeep(),
  });
  if (!ready.ok) return quest;

  const system = [
    '你是紫微造命教练。根据宫位与 Origin 写一条可执行小任务。',
    '正向、有画面；禁止恐吓与绝对吉凶。',
    '只输出 JSON：{"taskTitle":"短标题","taskDescription":"80-140字"}',
  ].join('\n');
  const user = [
    `称呼：${person.nickname || '你'}`,
    `类型：${quest.cadence === 'weekly' ? '周常' : '日常'}`,
    `宫位：${quest.topic}`,
    `因由：${quest.origin}`,
    `底稿：${quest.taskDescription}`,
  ].join('\n');

  try {
    const text = await runChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0.55 },
    );
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return quest;
    const parsed = JSON.parse(m[0]) as {
      taskTitle?: string;
      taskDescription?: string;
    };
    const title = String(parsed.taskTitle ?? '').trim().slice(0, 16);
    const body = String(parsed.taskDescription ?? '').trim().slice(0, 280);
    if (!body || body.length < 20) return quest;
    if (loadAiServiceMode() === 'mystic') recordFollowUse();
    return {
      ...quest,
      taskTitle: title || quest.taskTitle,
      taskDescription: body,
      source: 'ai',
    };
  } catch {
    return quest;
  }
}

function migrateOldWeekQuest(
  userId: string,
  weekStart: string,
  view: ZiweiChartView,
): DailyQuest | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(`mystic-lab.ziwei-week-quest.${userId}.`)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const pack = JSON.parse(raw) as {
        taskTitle?: string;
        taskBody?: string;
        palace?: string;
      };
      if (!pack.taskBody) continue;
      const topic = shortTopic(pack.palace || '福德');
      const q = buildQuestRow({
        userId,
        view,
        cadence: 'weekly',
        topic,
        questDate: weekStart,
      });
      q.taskTitle = pack.taskTitle || q.taskTitle;
      q.taskDescription = pack.taskBody;
      return q;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 确保今日日常 + 本周周常存在；生成前先 prune */
export function ensureDailyQuests(
  view: ZiweiChartView,
  person: PersonProfile,
  now = new Date(),
): { daily: DailyQuest | null; weekly: DailyQuest | null; week: ReturnType<typeof loadWeekSummary> } {
  const userId = person.id;
  const week = pruneWeekData(userId, now);
  const today = toYmd(now);
  const weekStart = week.weekStart;

  let daily =
    listActiveQuests(userId, { cadence: 'daily', questDate: today }).find(
      (q) => q.status !== 'dismissed',
    ) ?? null;
  let weekly =
    listActiveQuests(userId, { cadence: 'weekly', questDate: weekStart }).find(
      (q) => q.status !== 'dismissed',
    ) ?? null;

  const hadDismissDaily = loadAllQuests().some(
    (q) =>
      q.userId === userId &&
      q.cadence === 'daily' &&
      q.questDate === today &&
      q.status === 'dismissed',
  );
  const hadDismissWeekly = loadAllQuests().some(
    (q) =>
      q.userId === userId &&
      q.cadence === 'weekly' &&
      q.questDate === weekStart &&
      q.status === 'dismissed',
  );

  if (!weekly && !hadDismissWeekly) {
    const migrated = migrateOldWeekQuest(userId, weekStart, view);
    if (migrated) {
      upsertQuest(migrated);
      weekly = migrated;
    } else {
      weekly = buildQuestRow({
        userId,
        view,
        cadence: 'weekly',
        topic: pickTopic(view, userId),
        questDate: weekStart,
      });
      upsertQuest(weekly);
    }
  }

  if (!daily && !hadDismissDaily) {
    const avoid = weekly ? [weekly.topic] : [];
    daily = buildQuestRow({
      userId,
      view,
      cadence: 'daily',
      topic: pickTopic(view, userId, avoid),
      questDate: today,
    });
    upsertQuest(daily);
  }

  return { daily, weekly, week };
}

/** 后台 AI 润色（失败保留模板） */
export async function enrichQuestsWithAi(
  view: ZiweiChartView,
  person: PersonProfile,
  quests: DailyQuest[],
): Promise<DailyQuest[]> {
  const out: DailyQuest[] = [];
  for (const q of quests) {
    if (q.source === 'ai' || q.isSettled || q.status === 'done') {
      out.push(q);
      continue;
    }
    const next = await polishQuest(q, view, person);
    if (next.source === 'ai') upsertQuest(next);
    out.push(next);
  }
  return out;
}

export function swapQuest(
  view: ZiweiChartView,
  person: PersonProfile,
  questId: string,
): { ok: true; quest: DailyQuest } | { ok: false; reason: string } {
  const week = pruneWeekData(person.id);
  const all = listActiveQuests(person.id, {});
  const cur = all.find((q) => q.id === questId);
  if (!cur || cur.isSettled || cur.status === 'done') {
    return { ok: false, reason: '无法更换已完成的任务' };
  }
  const swapField = cur.cadence === 'weekly' ? 'swapCountWeekly' : 'swapCountDaily';
  if (week[swapField] >= MAX_SWAPS_PER_CADENCE) {
    return { ok: false, reason: '本周更换次数已用完' };
  }
  if (!spendXpForSwap(person.id, SWAP_XP_COST)) {
    return { ok: false, reason: `需要 ${SWAP_XP_COST} XP 才能换任务` };
  }
  dismissQuest(cur.id);
  week[swapField] += 1;
  saveWeekSummary(week);

  const next = buildQuestRow({
    userId: person.id,
    view,
    cadence: cur.cadence,
    topic: pickTopic(view, person.id, [cur.topic]),
    questDate: cur.questDate,
    swappedFrom: cur.id,
  });
  upsertQuest(next);
  return { ok: true, quest: next };
}

/**
 * 关闭后重新接取：强制为今日日常 / 本周周常再生成一条。
 * 若该时段已有未关闭任务或已打卡完成，则拒绝。
 */
export function reacceptQuest(
  view: ZiweiChartView,
  person: PersonProfile,
  cadence: QuestCadence,
  now = new Date(),
): { ok: true; quest: DailyQuest } | { ok: false; reason: string } {
  pruneWeekData(person.id, now);
  const today = toYmd(now);
  const weekStart = weekStartMonday(now);
  const questDate = cadence === 'weekly' ? weekStart : today;

  const slot = loadAllQuests().filter(
    (q) =>
      q.userId === person.id &&
      q.cadence === cadence &&
      q.questDate === questDate,
  );
  if (slot.some((q) => q.status === 'done' || q.isSettled)) {
    return {
      ok: false,
      reason: cadence === 'weekly' ? '本周周常已完成' : '今日日常已完成',
    };
  }
  const active = slot.find((q) => q.status !== 'dismissed');
  if (active) {
    return { ok: true, quest: active };
  }

  const avoid = slot.map((q) => q.topic);
  const other =
    cadence === 'daily'
      ? listActiveQuests(person.id, {
          cadence: 'weekly',
          questDate: weekStart,
        })[0]
      : listActiveQuests(person.id, { cadence: 'daily', questDate: today })[0];
  if (other) avoid.push(other.topic);

  const quest = buildQuestRow({
    userId: person.id,
    view,
    cadence,
    topic: pickTopic(view, person.id, avoid),
    questDate,
  });
  upsertQuest(quest);
  return { ok: true, quest };
}
