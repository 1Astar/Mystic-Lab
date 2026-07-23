import type { CastResult } from './engine.ts';
import { dressHexagram, type LiuQin, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildShengKeMap, YUAN_OF, JI_OF } from './shengke-map.ts';
import { LIUQIN_ENERGY } from './energy-lens.ts';
import { resolveYongShen, yongLiuQinList } from './yong-shen.ts';
import { detectSceneDomain, type SceneDomain } from './scene-map.ts';
import {
  buildYaoSpecialFlags,
  formatYaoSpecialTags,
  isAnDong,
  isEffectivelyMoving,
  isHuiTouKe,
} from './yao-special.ts';

export type SpiritNarrativePara = {
  kind: 'yong' | 'yuan' | 'ji' | 'chou' | 'verdict';
  text: string;
};

/** 用 / 元 / 忌 / 仇 在本卦上的落点 */
export type SpiritRosterItem = {
  role: '用神' | '元神' | '忌神' | '仇神';
  qin: LiuQin;
  /** 如「本卦三爻 · 父母辰土 · 动」；未落则为空 */
  where: string;
};

/** 古籍断语口诀 + 白话（教学整理，非全书影印） */
export type SpiritClassicNote = {
  classic: string;
  baihua: string;
  /** 出处提示 */
  source: string;
};

export type SpiritNarrative = {
  /** 落点所在：本卦名 */
  hexName: string;
  roster: SpiritRosterItem[];
  paragraphs: SpiritNarrativePara[];
  classicNotes: SpiritClassicNote[];
  /** 一句收束 */
  verdict: string;
};

/** 地支六合 */
const LIU_HE: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
};

export function isBranchLiuHe(a: string, b: string): boolean {
  return Boolean(a && b && LIU_HE[a] === b);
}

function branchOfGanzhi(gz: string): string {
  return gz.slice(1) || '';
}

function chouOf(yongQin: LiuQin): LiuQin {
  return YUAN_OF[JI_OF[yongQin]];
}

function pickRow(rows: YaoDress[], qin: LiuQin): YaoDress | undefined {
  const matches = rows.filter((r) => r.liuqin === qin);
  if (!matches.length) return undefined;
  return matches.find((r) => r.changing) ?? matches.find((r) => r.isShi) ?? matches[0];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function moveBit(row: YaoDress, dayBranch: string): string {
  if (row.changing) return '·动';
  if (isAnDong(row, dayBranch)) return '·暗动';
  return '';
}

function rowTag(row: YaoDress, dayBranch: string): string {
  return `${row.label}${row.liuqin}${row.branch}${row.wuxing}${moveBit(row, dayBranch)}`;
}

function whereOf(
  row: YaoDress | undefined,
  dayBranch: string,
  monthBranch: string,
  dayXunKong: string,
): string {
  if (!row) return '本卦未直接落到爻';
  const flags = buildYaoSpecialFlags(row, { dayBranch, monthBranch, dayXunKong });
  const tags = formatYaoSpecialTags(flags);
  const extra = tags.length ? ` · ${tags.join('·')}` : '';
  return `本卦${row.label} · ${row.liuqin}${row.branch}${row.wuxing}${extra}`;
}

function matterOf(domain: SceneDomain, question: string): string {
  const q = question.trim();
  if (/考试|考研|考证|题目|成绩|分数/.test(q)) return '这场考试 / 文书';
  if (/薪|工资|资产|投资|收入|钱|财|回本/.test(q)) return '钱与回报';
  if (domain === 'career') return '工作 / 面试这件事';
  if (domain === 'love') return '这段感情';
  if (domain === 'life') return '资源与生活盘';
  return '你问的这件事';
}

/** 六亲在本题里「实际在指什么」——避免只甩「物质根基」抽象词 */
function qinMeans(qin: LiuQin, domain: SceneDomain, matter: string): string {
  if (qin === '官鬼') {
    if (domain === 'career') return '岗位、考核、老板规则、能不能过关';
    if (domain === 'love') return '关系里的约束、承诺压力、外部眼光';
    return `${matter}里的外部规则与压力`;
  }
  if (qin === '妻财') {
    if (domain === 'career') return '这次机会能换来的实际回报（薪资、作品、背书）';
    if (domain === 'love') return '对方给不给、值不值、关系里的实感回报';
    return '钱、资源、以及你觉得「值」的那部分';
  }
  if (qin === '子孙') {
    if (domain === 'career') return '破局点子、身体状态、敢试的一小步';
    if (domain === 'love') return '放松、真心表达、能把僵局打开的动作';
    return '创造力、放松与破局的那股力';
  }
  if (qin === '父母') {
    if (domain === 'career') return '资料、文书、内推信息、合同与基础盘';
    if (domain === 'love') return '过往经验、家庭意见、聊天记录与安全感来源';
    return '信息、文书、经验与安全垫';
  }
  if (domain === 'career') return '同侪比较、群聊进度、合作里的分杯与抢节奏';
  if (domain === 'love') return '朋友圈拉扯、第三者感、和别人比进度';
  return '同辈往来、竞争与分走注意力的场';
}

function qinDo(qin: LiuQin, domain: SceneDomain, role: 'yong' | 'yuan' | 'ji' | 'chou'): string {
  if (role === 'yong') {
    if (qin === '官鬼') return '先写清「过关标准」是什么（一道题、一次面试、一项交付），别只盯情绪。';
    if (qin === '妻财') return '先写清「这周能验证的一笔回报 / 一项能力变现」是什么。';
    if (qin === '子孙') return '先做一件低成本试验，别空等灵感自己来。';
    if (qin === '父母') return '先补齐缺的那份信息 / 文书，再谈冲刺。';
    return '先分清谁在激活你、谁在带走节奏，少跟风。';
  }
  if (role === 'yuan') {
    if (qin === '子孙') return '顺着这一层：做可验证的一小步（发一封、试一次、练一题）。';
    if (qin === '父母') return '借现成资料 / 内推 / 经验，别从零硬扛。';
    if (qin === '妻财') return '先兑现手里已有的资源或回报，再扩盘子。';
    if (qin === '官鬼') return '借规则与考核节点推进，别绕开明面标准。';
    return '把同侪里真正能帮你的人叫出来办事，少空聊。';
  }
  if (role === 'ji') {
    if (qin === '兄弟') {
      return domain === 'love'
        ? '先减朋友圈比较与第三人叙事，再谈推进关系。'
        : '先少刷别人进度、少卷入分杯争论，再谈大推进。';
    }
    if (qin === '妻财') return '先止住乱花钱 / 乱承诺资源，再谈扩张。';
    if (qin === '官鬼') return '先别硬顶外部压力，改成可完成的小交付。';
    if (qin === '父母') return '先少囤无效信息、少空开会，再谈冲刺。';
    return '先减这一层消耗，再谈借力。';
  }
  if (qin === '父母') return '信息与文书若在给干扰续力：先停囤资料，再找真正能帮你的力。';
  if (qin === '兄弟') return '同侪场若在给干扰续力：先退出空转群聊，再谈借力。';
  if (qin === '子孙') return '「想破局」若在给干扰续力：先别用冲动抵消干扰，顺序是先清再冲。';
  if (qin === '妻财') return '利益诱惑若在给干扰续力：先别用短期回报麻痹自己。';
  return '先切断给干扰续力的那一层，再谈补给。';
}

/** 忌神 / 元神同动等：古籍口诀 + 白话（含暗动、回头克） */
export function buildSpiritClassicNotes(
  yuan: YaoDress | undefined,
  ji: YaoDress | undefined,
  dayBranch: string,
): SpiritClassicNote[] {
  const notes: SpiritClassicNote[] = [];
  const yuanOn = yuan ? isEffectivelyMoving(yuan, dayBranch) : false;
  const jiOn = ji ? isEffectivelyMoving(ji, dayBranch) : false;

  if (ji && isAnDong(ji, dayBranch)) {
    notes.push({
      classic: `忌神${ji.label}日冲暗动（日支${dayBranch}冲${ji.branch}）。`,
      baihua: `这一爻摇的时候没变，但被今天的地支冲到了——教学上叫「暗动」：表上不标动，仍可能暗地里起作用（力道常比明动弱一档）。`,
      source: '六爻古诀·日冲暗动（教学整理）',
    });
  }
  if (yuan && isAnDong(yuan, dayBranch)) {
    notes.push({
      classic: `元神${yuan.label}日冲暗动（日支${dayBranch}冲${yuan.branch}）。`,
      baihua: `助力这一层虽未明动，但被日支冲着——可当「暗处在动的补给」看，别完全当静爻忽略。`,
      source: '六爻古诀·日冲暗动（教学整理）',
    });
  }

  if (yuan && isHuiTouKe(yuan)) {
    notes.push({
      classic: `元神${yuan.label}化回头克。`,
      baihua: `元神发动后，变出的五行反而克自己——助力一边出力一边内耗，借力时要防「帮着帮着帮反了」。`,
      source: '六爻古诀·回头克（教学整理）',
    });
  }
  if (ji && isHuiTouKe(ji)) {
    notes.push({
      classic: `忌神${ji.label}化回头克。`,
      baihua: `忌神动而自克——干扰层自己打架，压力未必能完整落到用神上，仍宜观察，别松口气太早。`,
      source: '六爻古诀·回头克（教学整理）',
    });
  }

  if (yuan && ji && yuanOn && jiOn) {
    const yuanMark = yuan.changing ? '' : '（暗动）';
    const jiMark = ji.changing ? '' : '（暗动）';
    notes.push({
      classic: `忌神${ji.label}${jiMark}、元神${yuan.label}${yuanMark}同动，贪生忘克得两生也。`,
      baihua: `忌神本来会克用神，但元神也在动（含暗动）——忌神先去「贪」元神的生助，一时忘了去克用神；等于用神暂时多得一份照顾。`,
      source: '六爻古诀·贪生忘克（教学整理）',
    });

    if (yuan.changedBranch && isBranchLiuHe(yuan.branch, yuan.changedBranch)) {
      notes.push({
        classic: `但元神地支与元神变爻地支相合，贪合忘生，不生用神，故忌神仍克制用神。`,
        baihua: `元神自己又跟变出的那一支「粘」在一起（六合），顾着合局，顾不上生用神；于是忌神又回头来克用神——助力被自己绊住了。`,
        source: '六爻古诀·贪合忘生（教学整理）',
      });
    }
  }

  return notes;
}

/** 成段断语：用 / 元 / 忌 / 仇（对问题说话；落点标清本卦） */
export function buildSpiritNarrative(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): SpiritNarrative {
  const dressed = dressHexagram(cast, siZhuFromDate(castAt).dayStem);
  const sz = siZhuFromDate(castAt);
  const dayBranch = branchOfGanzhi(sz.day);
  const monthBranch = branchOfGanzhi(sz.month);
  const dayXunKong = sz.dayXunKong;
  const map = buildShengKeMap(cast, dressed, question);
  const yongDef = resolveYongShen(question);
  const domain = detectSceneDomain(question);
  const matter = matterOf(domain, question);
  const hexName = cast.primary.fullName;
  const paragraphs: SpiritNarrativePara[] = [];
  const emptyRoster: SpiritRosterItem[] = [];

  if (!map.yongQin) {
    const yongHint = yongLiuQinList(question)[0] ?? '父母';
    const means = qinMeans(yongHint, domain, matter);
    return {
      hexName,
      roster: emptyRoster,
      paragraphs: [
        {
          kind: 'yong',
          text: `你问的是「${matter}」，本题该盯【${means}】（六亲取${yongDef.name}）。本卦「${hexName}」还没把这一层落到具体爻——先对照装卦表找对应六亲，或把问题写得更具体。${qinDo(yongHint, domain, 'yong')}`,
        },
        {
          kind: 'verdict',
          text: '用神未落到爻——先写清所问、在本卦表里找锚点，再看谁帮谁拖。',
        },
      ],
      classicNotes: [],
      verdict: '用神未定——先写清所问，再看谁帮谁拖。',
    };
  }

  const yong = map.nodes.find((n) => n.role === '用神')?.row;
  const yuan = map.nodes.find((n) => n.role === '原神')?.row;
  const ji = map.nodes.find((n) => n.role === '忌神')?.row;
  const chouQin = chouOf(map.yongQin);
  const chou = pickRow(dressed.rows, chouQin);
  const yuanQin = YUAN_OF[map.yongQin];
  const jiQin = JI_OF[map.yongQin];
  const where = (row?: YaoDress) => whereOf(row, dayBranch, monthBranch, dayXunKong);

  const roster: SpiritRosterItem[] = [
    { role: '用神', qin: map.yongQin, where: where(yong) },
    { role: '元神', qin: yuanQin, where: where(yuan) },
    { role: '忌神', qin: jiQin, where: where(ji) },
    { role: '仇神', qin: chouQin, where: where(chou) },
  ];

  if (yong) {
    const means = qinMeans(map.yongQin, domain, matter);
    paragraphs.push({
      kind: 'yong',
      text: `你问的是「${matter}」，本题该盯的是【${means}】（六亲取${map.yongQin}）。落在本卦「${hexName}」的${rowTag(yong, dayBranch)}。${qinDo(map.yongQin, domain, 'yong')}`,
    });
  }

  if (yuan) {
    const means = qinMeans(yuan.liuqin, domain, matter);
    const yuanEff = isEffectivelyMoving(yuan, dayBranch);
    const yuanAn = isAnDong(yuan, dayBranch);
    paragraphs.push({
      kind: 'yuan',
      text: yuan.changing
        ? `能帮你的力在【${means}】这一层，落在本卦${rowTag(yuan, dayBranch)}，而且正在动——场上有明面助力。${qinDo(yuan.liuqin, domain, 'yuan')}`
        : yuanAn
          ? `能帮你的力在【${means}】这一层，落在本卦${rowTag(yuan, dayBranch)}——日冲暗动，助力在暗处抬头。${qinDo(yuan.liuqin, domain, 'yuan')}`
          : yuanEff
            ? `能帮你的力在【${means}】这一层，落在本卦${rowTag(yuan, dayBranch)}。${qinDo(yuan.liuqin, domain, 'yuan')}`
            : `能帮你的力在【${means}】这一层，落在本卦${rowTag(yuan, dayBranch)}（还没大动）——助力在场，别空等。${qinDo(yuan.liuqin, domain, 'yuan')}`,
    });
  } else {
    const means = qinMeans(yuanQin, domain, matter);
    paragraphs.push({
      kind: 'yuan',
      text: `本卦「${hexName}」没把「能帮你的力」（${LIUQIN_ENERGY[yuanQin].modern}·${yuanQin}，指${means}）清楚落到某一爻。推进更多靠你自己对齐节奏：先做可验证的一小步，别等外部突然救场。`,
    });
  }

  if (ji) {
    const means = qinMeans(ji.liuqin, domain, matter);
    const jiAn = isAnDong(ji, dayBranch);
    paragraphs.push({
      kind: 'ji',
      text: ji.changing
        ? `正在拖你的是【${means}】，落在本卦${rowTag(ji, dayBranch)}，而且发动了——干扰正在起来。${qinDo(ji.liuqin, domain, 'ji')}`
        : jiAn
          ? `拖节奏的是【${means}】，落在本卦${rowTag(ji, dayBranch)}——日冲暗动，干扰在暗处发力。${qinDo(ji.liuqin, domain, 'ji')}`
          : `拖节奏的是【${means}】，落在本卦${rowTag(ji, dayBranch)}（偏静）——未必喧哗，但会磨掉你的推进。${qinDo(ji.liuqin, domain, 'ji')}`,
    });
  } else {
    paragraphs.push({
      kind: 'ji',
      text: `本卦「拖你的那一层」（${LIUQIN_ENERGY[jiQin].modern}·${jiQin}）未明显现形。可更专注核心聚焦本身，少分心找假想敌。`,
    });
  }

  let greedyLine = '';
  if (chou && ji) {
    const means = qinMeans(chou.liuqin, domain, matter);
    greedyLine =
      isEffectivelyMoving(chou, dayBranch) || isEffectivelyMoving(ji, dayBranch)
        ? `【${means}】在本卦${rowTag(chou, dayBranch)}给上面的干扰续力，容易转成内耗循环。${qinDo(chou.liuqin, domain, 'chou')}`
        : `【${means}】在本卦${rowTag(chou, dayBranch)}在给干扰续力——干扰有源。顺序宜：先减干扰，再借助力。`;
    paragraphs.push({ kind: 'chou', text: greedyLine });
  } else if (chou) {
    const means = qinMeans(chou.liuqin, domain, matter);
    paragraphs.push({
      kind: 'chou',
      text: `给干扰续力的一层倾向【${means}】，落在本卦${rowTag(chou, dayBranch)}。耗散若再抬头，这一层会给它加油。${qinDo(chou.liuqin, domain, 'chou')}`,
    });
  } else {
    paragraphs.push({
      kind: 'chou',
      text: `「给干扰续力」的那一层（${LIUQIN_ENERGY[chouQin].modern}·${chouQin}）未直接落到爻上。先看拖你的那一层是否暗处牵制，再决定先清干扰还是先借助力。`,
    });
  }

  const classicNotes = buildSpiritClassicNotes(yuan, ji, dayBranch);
  const hasYuan = Boolean(yuan);
  const hasJi = Boolean(ji);
  const yuanMove = yuan ? isEffectivelyMoving(yuan, dayBranch) : false;
  const jiMove = ji ? isEffectivelyMoving(ji, dayBranch) : false;

  let verdict: string;
  if (classicNotes.some((n) => n.classic.includes('贪合忘生'))) {
    verdict = `古诀见「贪合忘生」：助力被自己绊住，干扰仍可能压住「${matter}」——先减干扰，别空等外援。`;
  } else if (classicNotes.some((n) => n.classic.includes('贪生忘克'))) {
    verdict = `古诀见「贪生忘克」：两边同动（含暗动）时用神暂得喘息——仍宜先减干扰，再借窗口推一小步。`;
  } else if (classicNotes.some((n) => n.classic.includes('暗动'))) {
    verdict = `见日冲暗动：表上虽静，暗处可能在动——对照用 / 忌落点，别只看明动爻。`;
  } else if (hasYuan && hasJi && yuanMove && jiMove) {
    verdict = `两边都在动：先保护「${matter}」不被拖垮（减干扰），再借助力推一小步——顺序比速度重要。`;
  } else if (hasJi && jiMove && !yuanMove) {
    verdict = `干扰发动更醒目：先稳住你能控的一层，别硬冲；用小步验证代替梭哈。`;
  } else if (hasYuan && yuanMove && !jiMove) {
    verdict = `助力在动、干扰未大动：可顺势推一小步，同时别把窗口当成永久。`;
  } else if (greedyLine) {
    verdict = `干扰有续力：防内耗循环——先减干扰，再谈借力。`;
  } else if (hasYuan && !hasJi) {
    verdict = `助力在场、干扰不明：借现成助力做准备，别空等结果。`;
  } else if (!hasYuan && hasJi) {
    verdict = `干扰在场、助力不明：先减消耗，再谈扩张。`;
  } else {
    verdict = map.tip || `先盯「${matter}」该看的那一层，再问：谁在帮你、谁在拖你。`;
  }

  paragraphs.push({ kind: 'verdict', text: verdict });

  return { hexName, roster, paragraphs, classicNotes, verdict };
}

function roleLabel(kind: SpiritNarrativePara['kind']): string {
  if (kind === 'yong') return '核心聚焦（用神）';
  if (kind === 'yuan') return '补给系统（元神）';
  if (kind === 'ji') return '耗散系统（忌神）';
  if (kind === 'chou') return '拉扯层（仇神）';
  return '收束';
}

export function renderSpiritNarrativeHtml(n: SpiritNarrative): string {
  const rosterHtml = n.roster.length
    ? `<ul class="ly-spirit-roster" data-spirit-roster>
        ${n.roster
          .map(
            (r) => `
          <li class="ly-spirit-roster-item is-${escapeHtml(r.role)}">
            <strong>${escapeHtml(r.role)}</strong>
            <span class="ly-spirit-roster-qin">${escapeHtml(r.qin)}</span>
            <span class="ly-spirit-roster-where">${escapeHtml(r.where)}</span>
          </li>`,
          )
          .join('')}
      </ul>`
    : '';

  const classicHtml = n.classicNotes.length
    ? `<div class="ly-spirit-classic" data-spirit-classic>
        ${n.classicNotes
          .map(
            (c) => `
          <blockquote class="ly-spirit-classic-block">
            <p class="ly-spirit-classic-src">${escapeHtml(c.source)}</p>
            <p class="ly-spirit-classic-zh"><span class="ly-classic-tag">古诀</span>${escapeHtml(c.classic)}</p>
            <p class="ly-spirit-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${escapeHtml(c.baihua)}</p>
          </blockquote>`,
          )
          .join('')}
      </div>`
    : '';

  const paras = n.paragraphs
    .map((p) => {
      const label = roleLabel(p.kind);
      return `
      <p class="ly-spirit-nar-p is-${p.kind}">
        <strong class="ly-spirit-nar-role is-${p.kind}">${escapeHtml(label)}</strong>
        <span>${escapeHtml(p.text)}</span>
      </p>`;
    })
    .join('');

  return `
    <section class="ly-spirit-nar" data-spirit-narrative>
      <h4 class="ly-spirit-nar-title">能量 · 用 / 元 / 忌 / 仇</h4>
      <p class="ly-guide-tip">用神、元神、忌神、仇神都落在<strong>本卦「${escapeHtml(
        n.hexName,
      )}」</strong>装卦表上的爻。绿看补给，红看耗散。若出现暗动 / 贪生忘克 / 回头克等，下方会自动补古诀与白话。</p>
      ${rosterHtml}
      <div class="ly-spirit-nar-body">${paras}</div>
      ${classicHtml}
    </section>
  `;
}

export function renderSpiritNarrativeForCast(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  return renderSpiritNarrativeHtml(buildSpiritNarrative(cast, question, castAt));
}
