/**
 * 八字探索 · 记忆封面 Prompt 库
 * 干支/十神可保留档案卡；神煞＝东方命理博物志（古籍图谱页）
 */

import {
  SHENSHA_ATLAS_SCENES,
  atlasSubjectForSlug,
} from './codex-shensha-atlas-scenes.ts';
export { SHENSHA_ATLAS_STYLE } from './codex-shensha-atlas-scenes.ts';

export type CodexCoverKind = 'stem' | 'branch' | 'tengod' | 'shensha' | 'wuxing';

export type CodexCoverPrompt = {
  id: string;
  kind: CodexCoverKind;
  title: string;
  /** 资源文件名（无扩展名） */
  slug: string;
  wuxing?: string;
  accent: string;
  mood: string;
  metaphor: string;
  /** 对象专属主体描述 */
  subject: string;
  /** 是否已有 public 插画（webp 优先） */
  assetReady?: boolean;
};

export const COVER_STYLE_KEYWORDS = [
  'cosmic archive',
  'mystical knowledge card',
  'symbolic memory illustration',
  'elegant spiritual atlas',
  'soft luminous darkness',
  'eastern metaphysical editorial',
  'structured mystic diagram',
] as const;

export const WUXING_ACCENT: Record<string, string> = {
  木: 'green-gold, cyan-green, misty sage',
  火: 'vermillion, warm orange, red-gold',
  土: 'rice-gold, brown-gold, earthy umber',
  金: 'silver-white, pale gold, cool metallic gold',
  水: 'deep blue, indigo, misty gray-blue',
};

export const COVER_NEGATIVE =
  'no text, no Chinese characters, no watermark, no logo, no poster typography, no UI interface, no human face close-up, no anime character, no fantasy armor, no crowded composition, no excessive ornaments, no low resolution, no blurry details, no folk superstition shop style, no old paper overload, no cheesy tarot clichés, no random symbols, no bright rainbow palette, no cartoon style, no kitsch, no messy background, no photo collage';

const BASE_FRAME = `Create a vertical symbolic illustration card for a Chinese metaphysics knowledge atlas in a mystical, elegant, emotionally warm style.
The image should feel like a memory image for learning Bazi, not a literal poster and not a text-heavy infographic.
Use a deep indigo / midnight purple background with soft gold light, subtle glowing particles, and a calm cosmic atmosphere.
Style: mystical editorial × spiritual visual atlas.
Constraints: centered composition, high readability, strong silhouette memory, minimal clutter, symbolic not literal, warm but powerful, suitable for app card cover, no text in image, no watermark.
Negative: ${COVER_NEGATIVE}`;

/** 按类分化：天干材质 / 地支时令场域 / 十神人格原型 / 星煞徽章注脚 */
export const KIND_FRAME: Record<
  Exclude<CodexCoverKind, 'wuxing'>,
  string
> = {
  stem: `Category: Heavenly Stem (天干).
Keywords: element, material, temperament, essence.
Suitable visuals: abstract nature, mineral color, fluid / wood / firelight / metal / earth layer / water mist.
Avoid: story scenes, seasonal landscapes, badges, character roles.`,

  branch: `Category: Earthly Branch (地支).
Keywords: season, earth-qi, field, animal omen.
Suitable visuals: seasonal scene, landform, changing light, flora/fauna environment.
Avoid: pure material still-life, personae, badge emblems.`,

  tengod: `Category: Ten God (十神).
Keywords: personality, relationship, action pattern.
Suitable visuals: archetypal role presence, strong identification ("this is a facet of me"), relational energy.
May use distant silhouette or implied figure without face close-up.
Avoid: empty landscape only, pure badge emblems, pure material still-life.`,

  shensha: `Category: Star / Shen Sha (星煞) — Oriental metaphysics atlas folio (神煞图谱).
Keywords: omen, destiny footnote, illustrated almanac plate.
CRITICAL composition: vertical rice-paper atlas plate with symbolic omen object + living environment.
Thin ornamental frame, four corner gilt motifs, one vermilion seal stamp only.
CRITICAL: leave the bottom ~18% as empty blank rice-paper title band — App overlays the name in CSS.
ABSOLUTELY NO text / Chinese characters / glyphs / calligraphy in the image.
Avoid: round dark-void badge amulets, cosmic night posters, complex human faces.`,
};

/** 拼出可直接投模型的完整 prompt */
export function buildCoverPrompt(p: CodexCoverPrompt): string {
  const kindKey =
    p.kind === 'wuxing' ? 'stem' : (p.kind as Exclude<CodexCoverKind, 'wuxing'>);
  return `${BASE_FRAME}

${KIND_FRAME[kindKey]}

Subject: ${p.title} (${p.id}).
Accent colors: ${p.accent}, with soft gold highlights.
Mood: ${p.mood}.
Visual metaphor: ${p.metaphor}.
Scene: ${p.subject}
The image should make users intuitively feel what ${p.title} is about.`;
}

export const STEM_COVER_PROMPTS: CodexCoverPrompt[] = [
  {
    id: '甲',
    kind: 'stem',
    title: '甲木',
    slug: 'jia',
    wuxing: '木',
    accent: WUXING_ACCENT.木!,
    mood: 'upright, growth, courage, structure, principled strength',
    metaphor: 'tall ancient tree, pillar, trunk, upward breakthrough',
    subject:
      'A tall ancient tree rising into the sky, strong trunk, deep roots, branches reaching upward through mist and starlight. Sacred yet grounded atmosphere.',
    assetReady: true,
  },
  {
    id: '乙',
    kind: 'stem',
    title: '乙木',
    slug: 'yi',
    wuxing: '木',
    accent: WUXING_ACCENT.木!,
    mood: 'flexible, refined, alive, adaptive, quietly persistent',
    metaphor: 'elegant vines, soft branches, blooming leaves, climbing plant',
    subject:
      'Elegant vines and soft branches, blooming leaves or a graceful climbing plant winding upward in moonlit air. Delicate flowing composition.',
    assetReady: true,
  },
  {
    id: '丙',
    kind: 'stem',
    title: '丙火',
    slug: 'bing',
    wuxing: '火',
    accent: WUXING_ACCENT.火!,
    mood: 'brightness, generosity, leadership, warmth, visible power',
    metaphor: 'radiant sun, blazing dawn, great flame on the horizon',
    subject:
      'A radiant sun, blazing dawn light, or a great flame illuminating a vast horizon. Dramatic but elegant red-gold and orange light on dark cosmic background.',
    assetReady: true,
  },
  {
    id: '丁',
    kind: 'stem',
    title: '丁火',
    slug: 'ding',
    wuxing: '火',
    accent: WUXING_ACCENT.火!,
    mood: 'intimate, focused, warm, subtle, spiritually luminous',
    metaphor: 'candle flame, lantern, small sacred lamp in darkness',
    subject:
      'A candle flame, lantern light, or small sacred lamp glowing in darkness. Amber gold glow, quiet emotional warmth.',
    assetReady: true,
  },
  {
    id: '戊',
    kind: 'stem',
    title: '戊土',
    slug: 'wu',
    wuxing: '土',
    accent: WUXING_ACCENT.土!,
    mood: 'groundedness, stability, support, patience, structural strength',
    metaphor: 'mountain, plateau, vast steady land',
    subject:
      'A mountain, plateau, or vast steady land under a dark sky. Broad solid forms in earthy gold and muted brown.',
    assetReady: true,
  },
  {
    id: '己',
    kind: 'stem',
    title: '己土',
    slug: 'ji',
    wuxing: '土',
    accent: WUXING_ACCENT.土!,
    mood: 'soft, supportive, careful, receptive, nourishing',
    metaphor: 'fertile soil, garden bed, nurturing field with seeds',
    subject:
      'Fertile soil, cultivated earth, a quiet garden bed, or a nurturing field holding seeds and life. Muted earth-gold, olive-brown, calm moonlit atmosphere.',
    assetReady: true,
  },
  {
    id: '庚',
    kind: 'stem',
    title: '庚金',
    slug: 'geng',
    wuxing: '金',
    accent: WUXING_ACCENT.金!,
    mood: 'decisiveness, structure, sharpness, justice, cutting clarity',
    metaphor: 'forged metal, sword, raw ore, shining blade',
    subject:
      'Forged metal, a sword, raw ore, or a shining blade emerging from darkness. Cool silver-gold accents, bold clean composition.',
    assetReady: true,
  },
  {
    id: '辛',
    kind: 'stem',
    title: '辛金',
    slug: 'xin',
    wuxing: '金',
    accent: WUXING_ACCENT.金!,
    mood: 'delicate, precious, perceptive, pure, subtly sharp',
    metaphor: 'polished jewelry, luminous gem, refined metal ornament',
    subject:
      'Polished jewelry, a luminous gem, refined metal ornament, or crystalline elegance. Soft silver, pale gold, cool luminous tones.',
    assetReady: true,
  },
  {
    id: '壬',
    kind: 'stem',
    title: '壬水',
    slug: 'ren',
    wuxing: '水',
    accent: WUXING_ACCENT.水!,
    mood: 'expansive, intelligent, mobile, fluid, powerful',
    metaphor: 'vast river, ocean current, deep tide, moonlit sea',
    subject:
      'A vast river, ocean current, deep tide, or moonlit sea flowing under stars. Broad dynamic water motion, deep blue and silver light.',
    assetReady: true,
  },
  {
    id: '癸',
    kind: 'stem',
    title: '癸水',
    slug: 'gui',
    wuxing: '水',
    accent: WUXING_ACCENT.水!,
    mood: 'subtlety, intuition, quiet nourishment, emotional depth, invisible flow',
    metaphor: 'dew, fine rain, mist, hidden springs, soft droplets',
    subject:
      'Dew, fine rain, mist, hidden springs, or soft droplets in moonlight. Soft blue-gray, pale silver light, delicate atmospheric composition.',
    assetReady: true,
  },
];

/** 地支：季节 / 地气 / 场域 / 动物象 · 时令场景 */
export const BRANCH_COVER_PROMPTS: CodexCoverPrompt[] = [
  { id: '子', kind: 'branch', title: '子水', slug: 'zi', wuxing: '水', accent: WUXING_ACCENT.水!, mood: 'latent, cool, midnight beginning', metaphor: 'winter midnight field, rat-hour stillness, hidden spring', subject: 'A winter midnight landscape: deep cold water under starlight, quiet earth-qi at the year’s turning point. Seasonal field, not a material still-life.', assetReady: true },
  { id: '丑', kind: 'branch', title: '丑土', slug: 'chou', wuxing: '土', accent: WUXING_ACCENT.土!, mood: 'endurance, storage, late-winter chill', metaphor: 'frozen barnland, oxen earth, cold store', subject: 'Late-winter frozen farmland and a sealed earth storehouse in cold moonlight. Slow season, storage earth-qi, landscape of waiting.', assetReady: true },
  { id: '寅', kind: 'branch', title: '寅木', slug: 'yin', wuxing: '木', accent: WUXING_ACCENT.木!, mood: 'impulse, dawn, tiger-season opening', metaphor: 'early-spring mountain forest at first light', subject: 'Early-spring mountain forest at dawn: mist, new green, tiger-season energy opening the year. Seasonal action field.', assetReady: true },
  { id: '卯', kind: 'branch', title: '卯木', slug: 'mao', wuxing: '木', accent: WUXING_ACCENT.木!, mood: 'blooming, soft mid-spring, relational', metaphor: 'rabbit-moon garden in soft morning light', subject: 'Mid-spring garden in soft morning light: blossoms, gentle wood field, delicate animal-omen atmosphere of affinity.', assetReady: true },
  { id: '辰', kind: 'branch', title: '辰土', slug: 'chen', wuxing: '土', accent: WUXING_ACCENT.土!, mood: 'transition, dragon humidity, holding water', metaphor: 'late-spring reservoir hills, wet earth', subject: 'Late-spring hills and a wet-earth reservoir under changing sky. Transitional season absorbing and releasing water.', assetReady: true },
  { id: '巳', kind: 'branch', title: '巳火', slug: 'si', wuxing: '火', accent: WUXING_ACCENT.火!, mood: 'early-summer clever heat, civilized', metaphor: 'snake-season inner courtyard heat at dusk', subject: 'Early-summer dusk courtyard with civilized inner heat—warm air, subtle firelight in architecture, seasonal cleverness.', assetReady: true },
  { id: '午', kind: 'branch', title: '午火', slug: 'wu-branch', wuxing: '火', accent: WUXING_ACCENT.火!, mood: 'peak noon heat, fame, exposure', metaphor: 'midsummer noon plain under blazing sun', subject: 'Midsummer noon over an open plain: peak solar heat, exposed field, horse-season radiance. Seasonal climax of fire.', assetReady: true },
  { id: '未', kind: 'branch', title: '未土', slug: 'wei', wuxing: '土', accent: WUXING_ACCENT.土!, mood: 'late-summer ripening, care, settling', metaphor: 'sheep-season dry garden in golden evening', subject: 'Late-summer dry garden and ripening fields in golden evening light. Nurturing seasonal earth settling into harvest.', assetReady: true },
  { id: '申', kind: 'branch', title: '申金', slug: 'shen', wuxing: '金', accent: WUXING_ACCENT.金!, mood: 'early-autumn motion, skill, roads', metaphor: 'monkey-season mountain pass and travel light', subject: 'Early-autumn mountain pass and a luminous travel road at dusk. Seasonal motion, skill, changing place.', assetReady: true },
  { id: '酉', kind: 'branch', title: '酉金', slug: 'you', wuxing: '金', accent: WUXING_ACCENT.金!, mood: 'mid-autumn precision, dusk refinement', metaphor: 'rooster-season harvest dusk, polished air', subject: 'Mid-autumn harvest dusk: clear refined light, precise seasonal closing, cool gold air over quiet land.', assetReady: true },
  { id: '戌', kind: 'branch', title: '戌土', slug: 'xu', wuxing: '土', accent: WUXING_ACCENT.土!, mood: 'late-autumn fortress, loyalty, fire vault', metaphor: 'dog-season earthen fort under autumn stars', subject: 'Late-autumn earthen fortress holding a warm fire vault under autumn stars. Loyal seasonal defense of the field.', assetReady: true },
  { id: '亥', kind: 'branch', title: '亥水', slug: 'hai', wuxing: '水', accent: WUXING_ACCENT.水!, mood: 'early-winter deep night, dreamlike, inclusive', metaphor: 'pig-season night sea and soft rain', subject: 'Early-winter deep night sea and soft rain merging into mist. Dreamlike seasonal water field, inclusive and deep.', assetReady: true },
];

/** 十神：人格 / 关系 / 行动模式 · 原型角色感 */
export const TENGOD_COVER_PROMPTS: CodexCoverPrompt[] = [
  { id: 'tg:正官', kind: 'tengod', title: '正官', slug: 'zhengguan', accent: 'cool gold, indigo', mood: 'rules, goals, responsibility — the upright self under structure', metaphor: 'archetype of the orderly officer / keeper of standards', subject: 'Archetypal role of upright duty: a composed silhouette facing a luminous pillar of order, or hands near a seal of standards. Feels like “the responsible face of me.” Relational: structure toward the self.', assetReady: true },
  { id: 'tg:七杀', kind: 'tengod', title: '七杀', slug: 'qisha', accent: 'cold silver, ember red', mood: 'challenge, pressure, speed — the edge that forces breakthrough', metaphor: 'archetype of the challenger / blade under pressure', subject: 'Archetypal challenger energy: distant silhouette against a sharp metallic edge and storm light. Feels like “the part of me that cuts through under pressure.” Intense, decisive, not a landscape.', assetReady: true },
  { id: 'tg:正财', kind: 'tengod', title: '正财', slug: 'zhengcai', accent: 'steady gold', mood: 'steady return, contract — the reliable earner', metaphor: 'archetype of the steady steward of resources', subject: 'Archetypal steward: composed presence with balanced golden coin or contract light. Feels like “my reliable earning / keeping face.” Measured relationship to resources.', assetReady: true },
  { id: 'tg:偏财', kind: 'tengod', title: '偏财', slug: 'piancai', accent: 'flowing gold', mood: 'opportunity, mobility — the window-catcher', metaphor: 'archetype of the opportunistic networker', subject: 'Archetypal opportunity-catcher: implied figure amid flowing gold fragments and open window-light. Feels like “my mobile, networking face.” Action pattern of seizing windows.', assetReady: true },
  { id: 'tg:正印', kind: 'tengod', title: '正印', slug: 'zhengyin', accent: 'soft moon gold', mood: 'support, learning, shelter — the protected / protecting self', metaphor: 'archetype of the sheltered learner under a soft seal', subject: 'Archetypal sheltered learner: soft protective seal-light around a calm silhouette. Feels like “the part of me that is held / that holds knowledge.” Warm relational shelter.', assetReady: true },
  { id: 'tg:偏印', kind: 'tengod', title: '偏印', slug: 'pianyin', accent: 'violet silver', mood: 'intuition, odd paths — the solitary insightful self', metaphor: 'archetype of the odd-path sage with a strange lamp', subject: 'Archetypal solitary insight: a quiet silhouette with an angled unusual lamp. Feels like “my unconventional mind.” Introspective relationship to knowledge.', assetReady: true },
  { id: 'tg:食神', kind: 'tengod', title: '食神', slug: 'shishen', accent: 'warm amber', mood: 'expression, ease, talent — the relaxed creator', metaphor: 'archetype of the easy talent / gentle expresser', subject: 'Archetypal easy creator: warm amber vessel-light near a relaxed silhouette. Feels like “my talent at ease.” Soft expressive action pattern.', assetReady: true },
  { id: 'tg:伤官', kind: 'tengod', title: '伤官', slug: 'shangguan', accent: 'bright spark gold', mood: 'edge, innovation, defiance — the rule-breaker talent', metaphor: 'archetype of the brilliant defier / spark against lines', subject: 'Archetypal brilliant defier: silhouette with a bright spark cutting ordered lines. Feels like “my sharp creative rebellion.” No face close-up; strong persona energy.', assetReady: true },
  { id: 'tg:比肩', kind: 'tengod', title: '比肩', slug: 'bijian', accent: 'twin silver', mood: 'peer, parallel, self — the equal companion', metaphor: 'archetype of twin selves / peer alliance', subject: 'Archetypal peer alliance: two equal silhouettes or twin luminous pillars as “another me beside me.” Relational equality and parallel strength.', assetReady: true },
  { id: 'tg:劫财', kind: 'tengod', title: '劫财', slug: 'jiecai', accent: 'split gold', mood: 'sharing, rivalry, exchange — the contested self', metaphor: 'archetype of contested sharing / split paths', subject: 'Archetypal contested exchange: implied figures or presence where treasure-light splits into two paths. Feels like “my rivalrous / sharing face.” Relational tension of divide.', assetReady: true },
];

const SHENSHA_COVER_META: { id: string; title: string; slug: string }[] = [
  { id: 'ss:天乙贵人', title: '天乙贵人', slug: 'tianyi' },
  { id: 'ss:文昌', title: '文昌', slug: 'wenchang' },
  { id: 'ss:禄神', title: '禄神', slug: 'lushen' },
  { id: 'ss:将星', title: '将星', slug: 'jiangxing' },
  { id: 'ss:红鸾', title: '红鸾', slug: 'hongluan' },
  { id: 'ss:天喜', title: '天喜', slug: 'tianxi' },
  { id: 'ss:桃花', title: '桃花', slug: 'taohua' },
  { id: 'ss:羊刃', title: '羊刃', slug: 'yangren' },
  { id: 'ss:华盖', title: '华盖', slug: 'huagai' },
  { id: 'ss:孤辰寡宿', title: '孤辰寡宿', slug: 'guchen' },
  { id: 'ss:驿马', title: '驿马', slug: 'yima' },
  { id: 'ss:劫煞', title: '劫煞', slug: 'jiesha' },
  { id: 'ss:天德', title: '天德', slug: 'tiande' },
  { id: 'ss:月德', title: '月德', slug: 'yuede' },
  { id: 'ss:福星', title: '福星', slug: 'fuxing' },
  { id: 'ss:金舆', title: '金舆', slug: 'jinyu' },
  { id: 'ss:天厨', title: '天厨', slug: 'tianchu' },
  { id: 'ss:学堂', title: '学堂', slug: 'xuetang' },
  { id: 'ss:空亡', title: '空亡', slug: 'kongwang' },
  { id: 'ss:病符', title: '病符', slug: 'bingfu' },
  { id: 'ss:白虎', title: '白虎', slug: 'baihu' },
  { id: 'ss:灾煞', title: '灾煞', slug: 'zaisha' },
  { id: 'ss:亡神', title: '亡神', slug: 'wangshen' },
  { id: 'ss:咸池', title: '咸池', slug: 'xianchi' },
  { id: 'ss:天德合', title: '天德合', slug: 'tiandehe' },
  { id: 'ss:月德合', title: '月德合', slug: 'yuedehe' },
  { id: 'ss:天赦', title: '天赦', slug: 'tianshe' },
  { id: 'ss:三奇贵人', title: '三奇贵人', slug: 'sanqi' },
  { id: 'ss:天医', title: '天医', slug: 'tianyimed' },
  { id: 'ss:解神', title: '解神', slug: 'jieshen' },
  { id: 'ss:词馆', title: '词馆', slug: 'ciguan' },
  { id: 'ss:文曲', title: '文曲', slug: 'wenqu' },
  { id: 'ss:天马', title: '天马', slug: 'tianma' },
  { id: 'ss:吊客', title: '吊客', slug: 'diaoke' },
  { id: 'ss:天哭', title: '天哭', slug: 'tianku' },
  { id: 'ss:天虚', title: '天虚', slug: 'tianxu' },
  { id: 'ss:破碎', title: '破碎', slug: 'posui' },
  { id: 'ss:大耗', title: '大耗', slug: 'dahao' },
  { id: 'ss:丧门', title: '丧门', slug: 'sangmen' },
  { id: 'ss:魁罡', title: '魁罡', slug: 'kuigang' },
  { id: 'ss:沐浴', title: '沐浴', slug: 'muyu' },
  { id: 'ss:风流', title: '风流', slug: 'fengliu' },
  { id: 'ss:流霞', title: '流霞', slug: 'liuxia' },
  { id: 'ss:血刃', title: '血刃', slug: 'xueren' },
  { id: 'ss:国印', title: '国印', slug: 'guoyin' },
  { id: 'ss:台阁', title: '台阁', slug: 'taige' },
  { id: 'ss:权星', title: '权星', slug: 'quanxing' },
  { id: 'ss:飞刃', title: '飞刃', slug: 'feiren' },
  { id: 'ss:紫微', title: '紫微', slug: 'ziwei' },
  { id: 'ss:天官', title: '天官', slug: 'tianguan' },
  { id: 'ss:仓廪', title: '仓廪', slug: 'cangling' },
  { id: 'ss:飞财', title: '飞财', slug: 'feicai' },
  { id: 'ss:进神', title: '进神', slug: 'jinshen' },
  { id: 'ss:退神', title: '退神', slug: 'tuishen' },
  { id: 'ss:富星', title: '富星', slug: 'caixing' },
  { id: 'ss:孤辰', title: '孤辰', slug: 'guchenxing' },
  { id: 'ss:寡宿', title: '寡宿', slug: 'guasu' },
  { id: 'ss:隔角', title: '隔角', slug: 'gejiao' },
  { id: 'ss:元辰', title: '元辰', slug: 'yuanchen' },
  { id: 'ss:天罗', title: '天罗', slug: 'tianluo' },
  { id: 'ss:地网', title: '地网', slug: 'diwang' },
  { id: 'ss:马头带剑', title: '马头带剑', slug: 'matoudaojian' },
  { id: 'ss:阴差阳错', title: '阴差阳错', slug: 'yinchayangcuo' },
  { id: 'ss:童子', title: '童子', slug: 'tongzi' },
  { id: 'ss:挂剑', title: '挂剑', slug: 'guajian' },
  { id: 'ss:死符', title: '死符', slug: 'sifu' },
  { id: 'ss:绞煞', title: '绞煞', slug: 'jiaosha' },
  { id: 'ss:五鬼', title: '五鬼', slug: 'wugui' },
  { id: 'ss:勾绞', title: '勾绞', slug: 'goujiao' },
  { id: 'ss:披麻', title: '披麻', slug: 'pima' },
  { id: 'ss:六厄', title: '六厄', slug: 'liue' },
  { id: 'ss:胎神', title: '胎神', slug: 'taishen' },
  { id: 'ss:养神', title: '养神', slug: 'yangshen' },
  { id: 'ss:截路空亡', title: '截路空亡', slug: 'jielukongwang' },
  { id: 'ss:正印', title: '正印', slug: 'zhengyin' },
  { id: 'ss:华盖（驿）', title: '华盖（驿）', slug: 'huagaiyi' },
  { id: 'ss:动态', title: '动态', slug: 'dongtai' },
  { id: 'ss:羊刃（凶读）', title: '羊刃（凶读）', slug: 'yangrenxiong' },
  { id: 'ss:天喜红鸾', title: '天喜红鸾', slug: 'tianxihongluan' },
  { id: 'ss:咸池桃花', title: '咸池桃花', slug: 'xianchitaohua' },
  { id: 'ss:妻妾', title: '妻妾', slug: 'qiqie' },
  { id: 'ss:夫星', title: '夫星', slug: 'fuxingrole' },
  { id: 'ss:词馆学堂', title: '词馆学堂', slug: 'ciguanxuetang' },
  { id: 'ss:子孙星', title: '子孙星', slug: 'zisunxing' },
  { id: 'ss:长生', title: '长生', slug: 'changsheng' },
  { id: 'ss:帝旺', title: '帝旺', slug: 'diwangstage' },
  { id: 'ss:墓库', title: '墓库', slug: 'muku' },
  { id: 'ss:旬空', title: '旬空', slug: 'xunkong' },
  { id: 'ss:天罗地网', title: '天罗地网', slug: 'tianluodiwang' },
];

/** 星煞封面：东方命理博物志竖幅图谱（图内无字，CSS 叠名） */
export const SHENSHA_COVER_PROMPTS: CodexCoverPrompt[] = SHENSHA_COVER_META.map((m) => {
  const sc = SHENSHA_ATLAS_SCENES[m.slug];
  if (!sc) throw new Error('missing atlas scene for ' + m.slug);
  const subject = atlasSubjectForSlug(m.slug);
  if (!subject) throw new Error('missing atlas subject for ' + m.slug);
  return {
    id: m.id,
    kind: 'shensha' as const,
    title: m.title,
    slug: m.slug,
    accent: sc.accent,
    mood: sc.mood,
    metaphor: sc.metaphor,
    subject,
    assetReady: true,
  };
});

export const ALL_COVER_PROMPTS: CodexCoverPrompt[] = [
  ...STEM_COVER_PROMPTS,
  ...BRANCH_COVER_PROMPTS,
  ...TENGOD_COVER_PROMPTS,
  ...SHENSHA_COVER_PROMPTS,
];

export function getCoverPrompt(id: string): CodexCoverPrompt | undefined {
  return ALL_COVER_PROMPTS.find((p) => p.id === id);
}

export function coverPublicPath(slug: string): string {
  return `/bazi/covers/${slug}.webp`;
}
