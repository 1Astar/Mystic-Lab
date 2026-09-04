/**
 * 问法形状（AskShape）：把任意原问拆成「必须答的槽位」，
 * 整盘合成按槽填牌——不是为某个案例写死文案。
 *
 * 槽位 = 用户真正在问什么（为什么 / 会做什么 / 后果 / 是否 / 选择 / 时机 / 怎么办）
 */
export type AskSlotKind =
  | 'why'
  | 'will_do'
  | 'consequence'
  | 'yes_no'
  | 'choice'
  | 'timing'
  | 'how'
  | 'state';

export type AskSlot = {
  kind: AskSlotKind;
  /** 短标签，写入综合结论 */
  label: string;
  /** 原问切片 */
  source: string;
};

export type AskShape = {
  slots: AskSlot[];
  primary: AskSlotKind;
  /** 需要过去→现在→未来串因果 */
  needsTimeline: boolean;
  /** 多牌必须整盘，不能只绑第一张 */
  needsWholeSpread: boolean;
};

const SPLIT_RE = /[？?！!；;。\n]+/;

function classifyFragment(text: string): AskSlotKind {
  const t = text.trim().replace(/[？?！!。．\s]+$/g, '');
  if (!t) return 'state';
  if (/为什么|为何|什么原因|动机|真正想|到底想/.test(t)) return 'why';
  if (/什么时候|何时|几月|哪天|多久|应期/.test(t)) return 'timing';
  if (/要不要|该不该|选哪个|还是|去留|走还是留/.test(t)) return 'choice';
  if (/怎么办|怎么做|如何应对|怎样才能|策略|建议/.test(t)) return 'how';
  if (/做什么|会做|会有什么动作|接下来会/.test(t)) return 'will_do';
  if (/后果|会怎样|会怎么样|如何发展|走向|将来会|以后会/.test(t)) return 'consequence';
  if (
    /吗$|么$|能不能|可不可以|会不会|是不是|有没有|能否|是否|安全|摆脱|行不行|靠谱|值得|喜欢我|爱不爱/.test(
      t,
    )
  ) {
    return 'yes_no';
  }
  return 'state';
}

function labelFor(kind: AskSlotKind, source: string): string {
  const short = source.replace(/[？?！!]+$/g, '').trim().slice(0, 18);
  switch (kind) {
    case 'why':
      return short ? `为什么：${short}` : '动机/原因';
    case 'will_do':
      return short ? `会做什么：${short}` : '更可能做什么';
    case 'consequence':
      return short ? `后果：${short}` : '可能后果';
    case 'yes_no':
      return short ? short : '是或否的判断';
    case 'choice':
      return short ? `选择：${short}` : '怎么选';
    case 'timing':
      return short ? `时机：${short}` : '时机窗口';
    case 'how':
      return short ? `怎么办：${short}` : '可执行一步';
    default:
      return short || '当前局面';
  }
}

/** 从一句里再挖隐藏槽（单句含两问） */
function expandHiddenSlots(text: string, kind: AskSlotKind): AskSlot[] {
  const t = text.trim();
  const slots: AskSlot[] = [{ kind, label: labelFor(kind, t), source: t }];

  // 「A吗？B吗？」已在外层拆开；这里处理挤在一句里的
  if (kind === 'will_do' && /后果|会怎样|怎么样/.test(t)) {
    slots.push({
      kind: 'consequence',
      label: labelFor('consequence', t),
      source: t,
    });
  }
  if (kind === 'yes_no' && /摆脱|纠缠|后果|会怎样/.test(t) && !/摆脱|纠缠/.test(slots[0]!.label)) {
    // 安全吗 + 摆脱 → 已是 yes_no；若同句还有摆脱语义，加第二槽
    if (/安全/.test(t) && /摆脱|纠缠/.test(t)) {
      slots[0] = {
        kind: 'yes_no',
        label: labelFor('yes_no', t.match(/[^？?]*安全[^？?]*/)?.[0] || '安不安全'),
        source: t,
      };
      slots.push({
        kind: 'yes_no',
        label: labelFor('yes_no', t.match(/[^？?]*摆脱[^？?]*|[^？?]*纠缠[^？?]*/)?.[0] || '能不能摆脱'),
        source: t,
      });
    }
  }
  if (kind === 'why' && /做什么|后果|会怎样/.test(t)) {
    if (/做什么|会做/.test(t)) {
      slots.push({ kind: 'will_do', label: '更可能做什么', source: t });
    }
    if (/后果|会怎样/.test(t)) {
      slots.push({ kind: 'consequence', label: '可能后果', source: t });
    }
  }
  return slots;
}

function dedupeSlots(slots: AskSlot[]): AskSlot[] {
  const seen = new Set<string>();
  const out: AskSlot[] = [];
  for (const s of slots) {
    const key = `${s.kind}::${s.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.slice(0, 4);
}

/**
 * 任意原问 → 问法槽位。
 * 多问号拆句；单句按语义分类；必要时展开隐藏槽。
 */
export function resolveAskShape(question: string): AskShape {
  const q = question.trim();
  if (!q) {
    return {
      slots: [{ kind: 'state', label: '当前局面', source: '' }],
      primary: 'state',
      needsTimeline: false,
      needsWholeSpread: false,
    };
  }

  const parts = q
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  let slots: AskSlot[] = [];
  if (parts.length >= 2) {
    for (const part of parts) {
      slots.push(...expandHiddenSlots(part, classifyFragment(part)));
    }
  } else {
    const kind = classifyFragment(q);
    slots = expandHiddenSlots(q, kind);
  }

  slots = dedupeSlots(slots);
  const primary = slots[0]?.kind ?? 'state';
  const kinds = new Set(slots.map((s) => s.kind));
  const needsTimeline =
    kinds.has('will_do') ||
    kinds.has('consequence') ||
    kinds.has('yes_no') ||
    kinds.has('choice') ||
    kinds.has('why');
  const needsWholeSpread =
    needsTimeline || kinds.has('how') || kinds.has('timing') || slots.length >= 2;

  return { slots, primary, needsTimeline, needsWholeSpread };
}

/** 槽位默认绑到哪一张时间线位置 */
export function slotPreferredFrame(kind: AskSlotKind): '过去' | '现在' | '未来' | '整盘' {
  switch (kind) {
    case 'why':
      return '过去';
    case 'will_do':
    case 'state':
    case 'how':
      return '现在';
    case 'consequence':
    case 'yes_no':
    case 'timing':
    case 'choice':
      return '未来';
    default:
      return '整盘';
  }
}

/** 牌位上的解读提示（通用，不绑具体案例文案） */
export function framePromptForAsk(
  frame: string,
  shape: AskShape,
): string {
  const kinds = new Set(shape.slots.map((s) => s.kind));
  if (frame === '过去') {
    if (kinds.has('why')) return '动机/底色';
    if (kinds.has('will_do') || kinds.has('consequence')) return '行为底色';
    if (kinds.has('yes_no')) return '局面怎么铺到今天';
    return '起点';
  }
  if (frame === '现在') {
    if (kinds.has('will_do')) return '更可能怎么动';
    if (kinds.has('yes_no') || kinds.has('choice')) return '眼下卡在哪里';
    if (kinds.has('why')) return '当下仍在起作用的';
    return '当下';
  }
  if (frame === '未来') {
    if (kinds.has('consequence')) return '可能拖出的代价';
    if (kinds.has('yes_no')) return '就「能否/是否」';
    if (kinds.has('choice')) return '若维持路径，更偏哪边';
    if (kinds.has('timing')) return '窗口感';
    return '延伸方向';
  }
  return frame;
}
