/**
 * 八字图鉴 · 记忆封面 Prompt 库
 * 风格：宇宙档案 / 神秘知识卡 / 象征记忆图
 */

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

  shensha: `Category: Star / Shen Sha (星煞).
Keywords: tag, added temperament, destiny footnote.
Suitable visuals: badge, star sigil, amulet, small emblematic talisman card.
Composition: compact centered emblem, like a collectible seal — not a wide landscape.
Avoid: large scenic vistas, character drama, material-only abstracts.`,
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

/** 星煞：标签 / 附加气质 / 命运注脚 · 徽章护符小象征卡 */
export const SHENSHA_COVER_PROMPTS: CodexCoverPrompt[] = [
  { id: 'ss:天乙贵人', kind: 'shensha', title: '天乙贵人', slug: 'tianyi', accent: 'warm lamp gold', mood: 'help in darkness — a protective footnote', metaphor: 'amulet-badge: ancient lantern seal of aid', subject: 'Compact amulet card: a small ancient copper lantern as a glowing talisman-badge centered on dark indigo, soft star-sigil rim. Destiny footnote of help — not a landscape.', assetReady: true },
  { id: 'ss:文昌', kind: 'shensha', title: '文昌', slug: 'wenchang', accent: 'ink gold', mood: 'study, wit — scholarly tag', metaphor: 'amulet-badge: scroll-and-arrow seal of insight', subject: 'Compact emblem: dark-gold mini scroll crossed by a bronze insight arrow, framed like a scholarly seal-badge on midnight field. Tag of wit — small, iconic.', assetReady: true },
  { id: 'ss:禄神', kind: 'shensha', title: '禄神', slug: 'lushen', accent: 'rice gold', mood: 'foundation, livelihood — basic-disk tag', metaphor: 'amulet-badge: grain vessel seal of livelihood', subject: 'Compact talisman: a small glowing grain vessel as livelihood badge, centered, soft gold rim on indigo. Footnote of foundation — emblematic, not scenic.', assetReady: true },
  { id: 'ss:将星', kind: 'shensha', title: '将星', slug: 'jiangxing', accent: 'command gold', mood: 'leadership, backbone — command tag', metaphor: 'amulet-badge: command crest / star seal', subject: 'Compact command crest badge of light — star-sigil leadership seal centered. Destiny tag of backbone — heraldic miniature, not a fortress scene.', assetReady: true },
  { id: 'ss:红鸾', kind: 'shensha', title: '红鸾', slug: 'hongluan', accent: 'soft rose gold', mood: 'joyful bond beginning — celebration tag', metaphor: 'amulet-badge: rose-gold bird seal of celebration', subject: 'Compact seal-badge: soft rose-gold bird emblem in a round amulet frame. Joyful affinity tag — small symbolic card.', assetReady: true },
  { id: 'ss:天喜', kind: 'shensha', title: '天喜', slug: 'tianxi', accent: 'warm festive gold', mood: 'delight, atmosphere — festive tag', metaphor: 'amulet-badge: festive bloom seal', subject: 'Compact festive bloom seal as a warm gold amulet-badge. Delight footnote — emblem only, minimal field.', assetReady: true },
  { id: 'ss:桃花', kind: 'shensha', title: '桃花', slug: 'taohua', accent: 'petal rose gold', mood: 'charm, affinity — attraction tag', metaphor: 'amulet-badge: bronze mirror with peach-blossom seal', subject: 'Compact charm badge: tiny bronze mirror with soft peach-blossom light as a round amulet. Attraction tag — not a garden vista.', assetReady: true },
  { id: 'ss:羊刃', kind: 'shensha', title: '羊刃', slug: 'yangren', accent: 'cold blade silver', mood: 'fierce edge — burst tag', metaphor: 'amulet-badge: sheathed blade seal', subject: 'Compact blade-seal badge: a short blade leaving a miniature sheath, cold silver emblem on indigo. Fierce footnote — talisman scale.', assetReady: true },
  { id: 'ss:华盖', kind: 'shensha', title: '华盖', slug: 'huagai', accent: 'violet silver', mood: 'solitude, spirit — canopy tag', metaphor: 'amulet-badge: spiritual canopy seal', subject: 'Compact canopy emblem: elegant spiritual parasol/canopy as a violet-silver seal-badge over quiet star mist. Solitude tag — small, iconic.', assetReady: true },
  { id: 'ss:孤辰寡宿', kind: 'shensha', title: '孤辰寡宿', slug: 'guchen', accent: 'cold mist silver', mood: 'aloneness — introspection tag', metaphor: 'amulet-badge: lone stone on empty board seal', subject: 'Compact seal: a single stone on a tiny empty board inside an amulet frame, cold mist silver. Loneliness footnote — emblematic, not a wide boardroom scene.', assetReady: true },
  { id: 'ss:驿马', kind: 'shensha', title: '驿马', slug: 'yima', accent: 'wind silver', mood: 'travel, change of place — motion tag', metaphor: 'amulet-badge: wind trail and hoofprint seal', subject: 'Compact travel seal: silver wind trails and a luminous hoofprint as a round motion-badge. Departure tag — not a full road landscape.', assetReady: true },
  { id: 'ss:劫煞', kind: 'shensha', title: '劫煞', slug: 'jiesha', accent: 'storm iron', mood: 'sudden rupture — warning tag', metaphor: 'amulet-badge: broken balance seal in rain', subject: 'Compact warning badge: broken balance scales as a small iron seal under a hint of rain light. Sudden-rupture footnote — talisman, not a storm panorama.', assetReady: true },
];

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
