import type { BaziEncyclopediaEntry } from './codex-encyclopedia-types.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { STEM_LORE, BRANCH_LORE, WUXING_ORDER } from './codex-lore.ts';
import { SHENG_OF, KE_OF, SHENG_ME, KE_ME } from './codex-wuxing-map.ts';
import type { WuXing } from './elements.ts';
import { getStarCard } from './codex-tags.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chips(items: string[], cls = 'bazi-st-chip'): string {
  return items
    .filter(Boolean)
    .map((t) => `<span class="${cls}">${escapeHtml(t)}</span>`)
    .join('');
}

/** 结构图专用补充（认知示意，不进记忆封面） */
export type StructureSchema = {
  /** 上方主题（十神）或意象词（干支） */
  top?: string[];
  /** 环绕现实标签 */
  orbit?: string[];
  /** 下方：对日主 / 在系统里的作用 */
  bottom?: string[];
  /** 意象（干支） */
  images?: string[];
  /** 气质 */
  temper?: string[];
};

const STEM_SCHEMA: Record<string, StructureSchema> = {
  甲: {
    images: ['大树', '栋梁', '头部', '骨架'],
    temper: ['直', '立', '向上', '生发'],
    orbit: ['原则', '成长', '主动性', '骨气'],
    bottom: ['定方向', '开开创', '扛结构'],
  },
  乙: {
    images: ['藤蔓', '花枝', '经络', '柔木'],
    temper: ['柔', '绕', '攀附', '顺势'],
    orbit: ['适应', '审美', '关系', '迂回'],
    bottom: ['柔韧推进', '借力生长', '留退路'],
  },
  丙: {
    images: ['太阳', '晨光', '大火球', '照耀'],
    temper: ['外放', '明亮', '热情', '可见'],
    orbit: ['表达', '曝光', '带动', '热度'],
    bottom: ['点燃场', '被看见', '给能量'],
  },
  丁: {
    images: ['灯芯', '烛火', '夜灯', '内光'],
    temper: ['细腻', '专注', '内明', '温热'],
    orbit: ['洞察', '文火', '一对一', '感受'],
    bottom: ['照亮细节', '养心神', '持续输出'],
  },
  戊: {
    images: ['高山', '厚土', '城墙', '承台'],
    temper: ['稳', '重', '承载', '可靠'],
    orbit: ['落地', '责任', '资产', '边界'],
    bottom: ['扛得住', '定根基', '给安全感'],
  },
  己: {
    images: ['田园', '湿土', '沃壤', '包容'],
    temper: ['滋养', '细作', '能藏', '黏合'],
    orbit: ['运营', '照顾', '消化', '整理'],
    bottom: ['养资源', '细落地', '接住情绪'],
  },
  庚: {
    images: ['刀剑', '矿石', '锋刃', '断金'],
    temper: ['果断', '锋利', '原则', '切割'],
    orbit: ['决断', '改革', '标准', '收口'],
    bottom: ['砍清楚', '立规矩', '破僵局'],
  },
  辛: {
    images: ['珠玉', '精金', '首饰', '细器'],
    temper: ['精致', '敏锐', '挑剔', '品质'],
    orbit: ['审美', '品控', '细节', '体面'],
    bottom: ['打磨品质', '立标准', '辨真伪'],
  },
  壬: {
    images: ['江河', '大海', '洪流', '吞吐'],
    temper: ['开阔', '流动', '智谋', '气魄'],
    orbit: ['战略', '扩张', '信息', '远行'],
    bottom: ['拓格局', '运资源', '定方向'],
  },
  癸: {
    images: ['雨露', '甘泉', '雾', '渗透'],
    temper: ['润泽', '直觉', '细流', '潜藏'],
    orbit: ['滋养', '倾听', '灵感', '休整'],
    bottom: ['润人心', '补储备', '悄悄渗透'],
  },
};

const BRANCH_SCHEMA: Record<string, StructureSchema> = {
  子: { images: ['夜半', '寒水', '起点'], temper: ['潜', '冷', '始'], orbit: ['潜能', '睡眠', '智慧'], bottom: ['藏气启动', '内在储备'] },
  丑: { images: ['冻土', '仓库'], temper: ['忍', '藏', '慢'], orbit: ['积累', '固定资产'], bottom: ['收藏待用'] },
  寅: { images: ['山林', '起步'], temper: ['冲', '开', '动'], orbit: ['开创', '行动'], bottom: ['敢开第一脚'] },
  卯: { images: ['清晨', '花木'], temper: ['萌', '美', '柔'], orbit: ['关系', '审美'], bottom: ['伸展生长'] },
  辰: { images: ['水库', '湿泥'], temper: ['吞', '吐', '变'], orbit: ['整合', '过渡'], bottom: ['吞吐资源'] },
  巳: { images: ['文明火', '内热'], temper: ['谋', '文', '巧'], orbit: ['文书', '策略'], bottom: ['内火聪明'] },
  午: { images: ['正午', '烈日'], temper: ['旺', '放', '显'], orbit: ['声誉', '表达'], bottom: ['外放照耀'] },
  未: { images: ['田园', '燥土'], temper: ['养', '沉', '护'], orbit: ['照顾', '情感'], bottom: ['滋养沉淀'] },
  申: { images: ['驿路', '刀兵'], temper: ['动', '技', '变'], orbit: ['出差', '技能'], bottom: ['动中推进'] },
  酉: { images: ['黄昏', '精金'], temper: ['收', '净', '准'], orbit: ['标准', '审美'], bottom: ['收束成器'] },
  戌: { images: ['火库', '堡垒'], temper: ['守', '忠', '固'], orbit: ['防卫', '成果'], bottom: ['守成果'] },
  亥: { images: ['夜水', '深海'], temper: ['深', '容', '幻'], orbit: ['想象', '慈悲'], bottom: ['深潜包容'] },
};

const WX_SCHEMA: Record<WuXing, StructureSchema> = {
  木: { images: ['枝条', '生长'], temper: ['生发', '伸展', '方向'], orbit: ['计划', '筋络', '仁'], bottom: ['给方向', '推动生长'] },
  火: { images: ['热源', '光'], temper: ['发散', '照耀', '可见'], orbit: ['表达', '热情', '礼'], bottom: ['给热度', '被看见'] },
  土: { images: ['田地', '山体'], temper: ['承载', '稳定', '落地'], orbit: ['消化', '信任', '信'], bottom: ['托住局面'] },
  金: { images: ['刀器', '矿物'], temper: ['收敛', '规整', '切割'], orbit: ['边界', '决断', '义'], bottom: ['收口断事'] },
  水: { images: ['江雾', '流动'], temper: ['渗透', '智慧', '润泽'], orbit: ['冷静', '储备', '智'], bottom: ['润与流动'] },
};

const TENGOD_SCHEMA: Record<string, StructureSchema> = {
  正官: {
    top: ['规则', '目标', '责任'],
    orbit: ['上级', '岗位', 'KPI', '约束', '社会评价'],
    bottom: ['立结构', '给压力', '定标准'],
  },
  七杀: {
    top: ['挑战', '压迫', '速度'],
    orbit: ['关口', '竞争', '军令', '极限'],
    bottom: ['逼突破', '给魄力', '需制化'],
  },
  正财: {
    top: ['稳健', '回报', '经营'],
    orbit: ['工资', '合同', '储蓄', '正职'],
    bottom: ['给资源', '要可预期', '忌过稳僵'],
  },
  偏财: {
    top: ['机会', '流动', '人脉'],
    orbit: ['项目', '横财气', '应酬', '窗口'],
    bottom: ['给流动资源', '抓窗口', '易散'],
  },
  正印: {
    top: ['支持', '学习', '庇护'],
    orbit: ['导师', '证书', '母亲式托住', '知识'],
    bottom: ['滋养日主', '给名分', '忌过懒'],
  },
  偏印: {
    top: ['异质', '直觉', '抽离'],
    orbit: ['偏门', '技艺', '孤独聪明', '小众'],
    bottom: ['给独特思路', '利钻研', '易钻牛角'],
  },
  食神: {
    top: ['表达', '享受', '松弛'],
    orbit: ['才艺', '口福', '内容', '从容'],
    bottom: ['泄秀产出', '养身心', '忌过散'],
  },
  伤官: {
    top: ['锋芒', '革新', '不服'],
    orbit: ['吐槽', '创意', '破局', '先锋'],
    bottom: ['突破规则', '才华外露', '见官需慎'],
  },
  比肩: {
    top: ['同我', '并肩', '主张'],
    orbit: ['朋友', '合伙', '同侪', '竞争/支持'],
    bottom: ['助身', '分担', '易较劲'],
  },
  劫财: {
    top: ['分夺', '互换', '冒险'],
    orbit: ['拆借', '竞争', '被动分享', '边界'],
    bottom: ['流动互换', '提醒边界', '易被分走'],
  },
};

const SHENSHA_SCHEMA: Record<string, StructureSchema> = {
  天乙贵人: { top: ['贵人', '援助'], orbit: ['关键时刻', '逢凶化吉'], bottom: ['指路', '出手相助'] },
  文昌: { top: ['学业', '文书'], orbit: ['考试', '机智', '表达'], bottom: ['利聪明', '要落地'] },
  禄神: { top: ['根基', '衣食'], orbit: ['基本盘', '站住'], bottom: ['给底气'] },
  将星: { top: ['担当', '主心骨'], orbit: ['带队', '权威'], bottom: ['扛事'] },
  红鸾: { top: ['喜庆', '缘起'], orbit: ['约会', '庆典'], bottom: ['开喜窗'] },
  天喜: { top: ['欢喜', '暖场'], orbit: ['气氛', '开心事'], bottom: ['提气氛'] },
  桃花: { top: ['人缘', '魅力'], orbit: ['姻缘', '社交'], bottom: ['拉缘分'] },
  羊刃: { top: ['刚烈', '爆发'], orbit: ['果决', '极端'], bottom: ['出锋需收'] },
  华盖: { top: ['孤独', '精神'], orbit: ['艺术', '信仰'], bottom: ['独处养分'] },
  孤辰寡宿: { top: ['独处', '清冷'], orbit: ['缘薄感', '内省'], bottom: ['深精神世界'] },
  驿马: { top: ['奔波', '换场'], orbit: ['出行', '变动'], bottom: ['动中求进'] },
  劫煞: { top: ['突发', '阻碍'], orbit: ['破耗', '翻车感'], bottom: ['留缓冲'] },
};

function schemaFor(id: string, entry: BaziEncyclopediaEntry): StructureSchema {
  if (entry.kind === 'stem') return STEM_SCHEMA[id] ?? {};
  if (entry.kind === 'branch') return BRANCH_SCHEMA[id] ?? {};
  if (entry.kind === 'wuxing') return WX_SCHEMA[id as WuXing] ?? {};
  if (entry.kind === 'tengod') {
    const name = id.replace(/^tg:/, '');
    return TENGOD_SCHEMA[name] ?? {};
  }
  if (entry.kind === 'shensha') {
    const name = id.replace(/^ss:/, '');
    return SHENSHA_SCHEMA[name] ?? {};
  }
  return {};
}

function metaRow(entry: BaziEncyclopediaEntry): string {
  const bits: string[] = [];
  if (entry.tags.wuxing) bits.push(`五行 · ${entry.tags.wuxing}`);
  if (entry.tags.yinyang) bits.push(`阴阳 · ${entry.tags.yinyang}`);
  bits.push(`类别 · ${entry.tags.category}`);
  return `<div class="bazi-st-meta">${chips(bits, 'bazi-st-meta-chip')}</div>`;
}

function flowRow(wx: WuXing): string {
  return `
    <div class="bazi-st-flow" aria-label="生克流向">
      <span class="bazi-st-flow-item"><em>生</em>${escapeHtml(SHENG_OF[wx])}</span>
      <span class="bazi-st-flow-item"><em>克</em>${escapeHtml(KE_OF[wx])}</span>
      <span class="bazi-st-flow-item"><em>被生</em>${escapeHtml(SHENG_ME[wx])}</span>
      <span class="bazi-st-flow-item"><em>被克</em>${escapeHtml(KE_ME[wx])}</span>
    </div>`;
}

function band(label: string, items: string[] | undefined, extraClass = ''): string {
  if (!items?.length) return '';
  return `
    <div class="bazi-st-band ${extraClass}">
      <span class="bazi-st-band-label">${escapeHtml(label)}</span>
      <div class="bazi-st-band-chips">${chips(items)}</div>
    </div>`;
}

/**
 * 结构图：认知示意（CSS 块图，不复用记忆封面）
 */
export function renderStructureMapHtml(id: string): string {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '';
  const schema = schemaFor(id, entry);
  const kw = entry.structure.keywords;
  const map = entry.structure.mappings;

  const center = `
    <div class="bazi-st-center">
      <strong>${escapeHtml(entry.title)}</strong>
      <em>${escapeHtml(entry.tags.category)}</em>
    </div>`;

  let wxFlow = '';
  if (entry.kind === 'wuxing' && (WUXING_ORDER as string[]).includes(id)) {
    wxFlow = flowRow(id as WuXing);
  } else if (entry.kind === 'stem' || entry.kind === 'branch') {
    const lore =
      entry.kind === 'stem'
        ? STEM_LORE.find((s) => s.id === id)
        : BRANCH_LORE.find((b) => b.id === id);
    if (lore) wxFlow = flowRow(lore.wuxing);
  }

  const isRole = entry.kind === 'tengod' || entry.kind === 'shensha';

  const core = isRole
    ? `
      <div class="bazi-st-core is-role">
        ${center}
        <div class="bazi-st-orbit" aria-label="现实标签">
          ${chips(schema.orbit ?? [], 'bazi-st-chip is-orbit')}
        </div>
      </div>`
    : `
      <div class="bazi-st-core is-gz">
        ${band('气质', schema.temper, 'is-side')}
        ${center}
        ${band('常见对应', schema.orbit, 'is-side')}
      </div>`;

  return `
    <div class="bazi-st-map is-${escapeHtml(entry.kind)}" data-structure-map>
      <p class="bazi-st-hint">认知示意 · 看它在系统里的位置</p>
      ${metaRow(entry)}
      ${band(isRole ? '主题' : '意象', isRole ? schema.top : schema.images, 'is-top')}
      ${core}
      ${band(isRole ? '对日主' : '在盘里的作用', schema.bottom, 'is-bottom')}
      ${wxFlow}
      ${band('关键词', kw, 'is-kw')}
      ${
        map.length
          ? `<div class="bazi-st-band is-map">
              <span class="bazi-st-band-label">现实映射</span>
              <ul class="bazi-st-map-list">${map.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>
            </div>`
          : ''
      }
      <p class="bazi-st-note">${escapeHtml(entry.structure.diagram)}</p>
    </div>`;
}

export function hasStructureMap(id: string): boolean {
  return Boolean(getBaziEncyclopedia(id) || getStarCard(id));
}
