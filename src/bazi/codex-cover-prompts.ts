/**
 * 八字探索 · 记忆封面 Prompt 库
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

  shensha: `Category: Star / Shen Sha (星煞) — FEATURED BADGE only.
Keywords: tag, destiny footnote, amulet.
CRITICAL composition: a SINGLE small round badge / talisman floating in the CENTER.
The emblem must occupy ONLY about 25–35% of the frame height.
MOST of the canvas is empty deep indigo void with faint dust light — generous negative space.
Looks like a collectible seal sticker on a dark card, NOT a landscape, NOT a large relic filling the frame.
Avoid: mountains, rivers, wide scenery, oversized lanterns/objects, character drama.`,
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

/** 星煞封面：精品 AI + 扩展 SVG 光栅；图鉴名录尽量出齐章面 */
export const SHENSHA_COVER_PROMPTS: CodexCoverPrompt[] = [
  { id: 'ss:天乙贵人', kind: 'shensha', title: '天乙贵人', slug: 'tianyi', accent: 'warm lamp gold', mood: 'protective help footnote', metaphor: 'tiny lantern amulet badge', subject: 'A tiny ancient copper lantern as a ROUND amulet badge only 30% of frame height, centered in vast empty midnight indigo. Soft gold glow inside the small lantern. No mountains, no river, no landscape.', assetReady: true },
  { id: 'ss:文昌', kind: 'shensha', title: '文昌', slug: 'wenchang', accent: 'ink gold', mood: 'scholarly wit footnote', metaphor: 'tiny scroll-and-arrow seal', subject: 'A tiny dark-gold mini scroll crossed by a small bronze arrow, as a round scholarly seal-badge ~30% of frame, centered in empty indigo void. No desk scene, no landscape.', assetReady: true },
  { id: 'ss:禄神', kind: 'shensha', title: '禄神', slug: 'lushen', accent: 'rice gold', mood: 'livelihood foundation footnote', metaphor: 'tiny grain-vessel badge', subject: 'A tiny glowing grain vessel as a round livelihood badge ~30% of frame height, centered in vast empty indigo. Soft gold rim only. No fields, no landscape.', assetReady: true },
  { id: 'ss:将星', kind: 'shensha', title: '将星', slug: 'jiangxing', accent: 'command gold', mood: 'backbone command footnote', metaphor: 'tiny command crest badge', subject: 'A tiny command crest / star seal as a heraldic round badge ~30% of frame, centered in empty midnight void. No fortress, no army.', assetReady: true },
  { id: 'ss:红鸾', kind: 'shensha', title: '红鸾', slug: 'hongluan', accent: 'soft rose gold', mood: 'joyful bond footnote', metaphor: 'tiny rose-gold bird seal', subject: 'A tiny rose-gold bird emblem inside a small round amulet frame ~30% of frame, centered in empty indigo. No garden vista.', assetReady: true },
  { id: 'ss:天喜', kind: 'shensha', title: '天喜', slug: 'tianxi', accent: 'warm festive gold', mood: 'delight footnote', metaphor: 'tiny festive bloom seal', subject: 'A tiny festive bloom seal as a warm gold round badge ~30% of frame, centered in empty cosmic dark. Emblem only.', assetReady: true },
  { id: 'ss:桃花', kind: 'shensha', title: '桃花', slug: 'taohua', accent: 'petal rose gold', mood: 'charm affinity footnote', metaphor: 'tiny mirror-and-blossom badge', subject: 'A tiny bronze mirror with a soft peach-blossom mark as a round charm badge ~30% of frame, centered in empty indigo. No garden.', assetReady: true },
  { id: 'ss:羊刃', kind: 'shensha', title: '羊刃', slug: 'yangren', accent: 'cold blade silver', mood: 'fierce edge footnote', metaphor: 'tiny blade-seal badge', subject: 'A tiny short blade leaving a miniature sheath as a cold silver round seal ~30% of frame, centered in empty indigo. No stone platform landscape.', assetReady: true },
  { id: 'ss:华盖', kind: 'shensha', title: '华盖', slug: 'huagai', accent: 'violet silver', mood: 'solitude spirit footnote', metaphor: 'tiny canopy parasol seal', subject: 'A tiny elegant spiritual canopy/parasol as a violet-silver round badge ~30% of frame, centered in empty star-dust void. No wide mist scenery.', assetReady: true },
  { id: 'ss:孤辰寡宿', kind: 'shensha', title: '孤辰寡宿', slug: 'guchen', accent: 'cold mist silver', mood: 'aloneness footnote', metaphor: 'tiny lone-stone board seal', subject: 'A tiny single stone on a miniature empty board inside a small round amulet ~30% of frame, centered in empty cold indigo. Not a wide boardroom.', assetReady: true },
  { id: 'ss:驿马', kind: 'shensha', title: '驿马', slug: 'yima', accent: 'wind silver', mood: 'travel motion footnote', metaphor: 'tiny hoofprint wind seal', subject: 'A tiny luminous hoofprint with silver wind trails as a round motion badge ~30% of frame, centered in empty indigo. No road landscape.', assetReady: true },
  { id: 'ss:劫煞', kind: 'shensha', title: '劫煞', slug: 'jiesha', accent: 'storm iron silver', mood: 'sudden shift footnote', metaphor: 'tiny crossed-alert seal', subject: 'Tiny cool iron crossed-alert seal ~30% of frame, empty indigo. Backup reminder, not doom.', assetReady: true },
  // 扩展章：SVG 光栅化 webp（与精品同路径；仍可用 AI 日后替换 png）
  { id: 'ss:天德', kind: 'shensha', title: '天德', slug: 'tiande', accent: 'soft virtue gold', mood: 'protective resolve footnote', metaphor: 'tiny soft-gold virtue droplet seal', subject: 'A tiny soft-gold virtue droplet inside a round amulet badge ~30% of frame, centered in empty midnight indigo. No landscape.', assetReady: true },
  { id: 'ss:月德', kind: 'shensha', title: '月德', slug: 'yuede', accent: 'cool moon silver', mood: 'gentle shelter footnote', metaphor: 'tiny crescent moon seal', subject: 'A tiny silver crescent moon as a round amulet badge ~30% of frame, centered in empty indigo void. Emblem only.', assetReady: true },
  { id: 'ss:福星', kind: 'shensha', title: '福星', slug: 'fuxing', accent: 'warm fortune gold', mood: 'blessing footing footnote', metaphor: 'tiny star-seal badge', subject: 'A tiny warm-gold five-point star seal as a round badge ~30% of frame, centered in empty indigo. No temple scenery.', assetReady: true },
  { id: 'ss:金舆', kind: 'shensha', title: '金舆', slug: 'jinyu', accent: 'carriage gold', mood: 'dignified carriage footnote', metaphor: 'tiny carriage-seal badge', subject: 'A tiny bronze carriage emblem as a round amulet ~30% of frame, centered in empty indigo. No road landscape.', assetReady: true },
  { id: 'ss:天厨', kind: 'shensha', title: '天厨', slug: 'tianchu', accent: 'hearth gold', mood: 'nourishment footnote', metaphor: 'tiny vessel-hearth seal', subject: 'A tiny warm vessel / hearth seal as a round badge ~30% of frame, centered in empty indigo. No kitchen scene.', assetReady: true },
  { id: 'ss:学堂', kind: 'shensha', title: '学堂', slug: 'xuetang', accent: 'ink study gold', mood: 'learning field footnote', metaphor: 'tiny open-book seal', subject: 'A tiny open-book diamond seal as a round scholarly badge ~30% of frame, centered in empty indigo. No classroom.', assetReady: true },
  { id: 'ss:空亡', kind: 'shensha', title: '空亡', slug: 'kongwang', accent: 'void silver', mood: 'gap / pause footnote', metaphor: 'tiny dashed-ring void seal', subject: 'A tiny dashed hollow ring as a cool silver round seal ~30% of frame, centered in empty indigo. Emblem only, no abyss scenery.', assetReady: true },
  { id: 'ss:病符', kind: 'shensha', title: '病符', slug: 'bingfu', accent: 'healing sage green', mood: 'recovery reminder footnote', metaphor: 'tiny cross-care seal', subject: 'A tiny soft sage-green care cross seal as a round badge ~30% of frame, centered in empty indigo. Not medical horror.', assetReady: true },
  { id: 'ss:白虎', kind: 'shensha', title: '白虎', slug: 'baihu', accent: 'cold white metal', mood: 'sharp guard footnote', metaphor: 'tiny white-tiger mask seal', subject: 'A tiny stylized white-tiger mask seal as a cold silver round badge ~30% of frame, centered in empty indigo. No mountain landscape.', assetReady: true },
  { id: 'ss:灾煞', kind: 'shensha', title: '灾煞', slug: 'zaisha', accent: 'amber warning', mood: 'caution factor footnote', metaphor: 'tiny alert triangle seal', subject: 'A tiny amber alert triangle seal as a round badge ~30% of frame, centered in empty indigo. Soft caution, not gore.', assetReady: true },
  { id: 'ss:亡神', kind: 'shensha', title: '亡神', slug: 'wangshen', accent: 'ash silver', mood: 'fading / loss rhythm footnote', metaphor: 'tiny fading-wave seal', subject: 'A tiny ash-silver fading curve seal as a round badge ~30% of frame, centered in empty indigo. Emblem only.', assetReady: true },
  { id: 'ss:咸池', kind: 'shensha', title: '咸池', slug: 'xianchi', accent: 'rose mist gold', mood: 'affinity pool footnote', metaphor: 'tiny rose-pool seal', subject: 'A tiny rose-gold pool-circle seal as a round charm badge ~30% of frame, centered in empty indigo. No garden vista.', assetReady: true },
  { id: 'ss:天德合', kind: 'shensha', title: '天德合', slug: 'tiandehe', accent: 'paired virtue gold', mood: 'buffer via union footnote', metaphor: 'tiny twin-ring seal', subject: 'Two tiny overlapping gold rings as a round amulet ~30% of frame, empty indigo. Emblem only.', assetReady: true },
  { id: 'ss:月德合', kind: 'shensha', title: '月德合', slug: 'yuedehe', accent: 'moon-pair silver', mood: 'soft relational buffer', metaphor: 'crescent meeting circle', subject: 'Tiny crescent meeting a pale ring as round badge ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:天赦', kind: 'shensha', title: '天赦', slug: 'tianshe', accent: 'pardon gold', mood: 'release window footnote', metaphor: 'tiny cross-of-pardon seal', subject: 'Tiny soft-gold pardon cross in a round seal ~30% of frame, empty indigo. Not a court scene.', assetReady: true },
  { id: 'ss:三奇贵人', kind: 'shensha', title: '三奇贵人', slug: 'sanqi', accent: 'triple spark gold', mood: 'rare opening footnote', metaphor: 'three tiny sparks seal', subject: 'Three tiny gold sparks as a round badge ~30% of frame, empty indigo. Emblem only.', assetReady: true },
  { id: 'ss:天医', kind: 'shensha', title: '天医', slug: 'tianyimed', accent: 'healing sage', mood: 'care / recover footnote', metaphor: 'tiny care-cross seal', subject: 'Tiny sage-green care cross seal ~30% of frame, empty indigo. Soft care, not clinic.', assetReady: true },
  { id: 'ss:解神', kind: 'shensha', title: '解神', slug: 'jieshen', accent: 'unknot gold', mood: 'untangle footnote', metaphor: 'tiny unknot ribbon seal', subject: 'Tiny gold unknot / open-loop seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:词馆', kind: 'shensha', title: '词馆', slug: 'ciguan', accent: 'ink folio gold', mood: 'writing hall footnote', metaphor: 'tiny folio tablet seal', subject: 'Tiny dark folio tablet with gold lines as round badge ~30% of frame, empty indigo. No library hall.', assetReady: true },
  { id: 'ss:文曲', kind: 'shensha', title: '文曲', slug: 'wenqu', accent: 'ink flourish gold', mood: 'clever expression footnote', metaphor: 'tiny ink-curve seal', subject: 'Tiny gold ink flourish curve as round badge ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:天马', kind: 'shensha', title: '天马', slug: 'tianma', accent: 'sky wind silver', mood: 'far travel footnote', metaphor: 'tiny wind-arrow seal', subject: 'Tiny silver wind-arrow travel seal ~30% of frame, empty indigo. No road landscape.', assetReady: true },
  { id: 'ss:吊客', kind: 'shensha', title: '吊客', slug: 'diaoke', accent: 'ash farewell silver', mood: 'farewell tone footnote', metaphor: 'tiny farewell plaque seal', subject: 'Tiny ash-silver farewell plaque seal ~30% of frame, empty indigo. Soft, not grim.', assetReady: true },
  { id: 'ss:天哭', kind: 'shensha', title: '天哭', slug: 'tianku', accent: 'mist sorrow silver', mood: 'wistful tone footnote', metaphor: 'tiny tear-curve seal', subject: 'Tiny mist-silver soft curve seal ~30% of frame, empty indigo. Gentle mood, not horror.', assetReady: true },
  { id: 'ss:天虚', kind: 'shensha', title: '天虚', slug: 'tianxu', accent: 'hollow cool silver', mood: 'empty-feel footnote', metaphor: 'tiny hollow dashed ring', subject: 'Tiny dashed hollow ring seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:破碎', kind: 'shensha', title: '破碎', slug: 'posui', accent: 'crack amber', mood: 'fragile backup footnote', metaphor: 'tiny cracked vessel seal', subject: 'Tiny cracked vessel outline seal ~30% of frame, empty indigo. Soft caution.', assetReady: true },
  { id: 'ss:大耗', kind: 'shensha', title: '大耗', slug: 'dahao', accent: 'drain amber', mood: 'leak / outflow footnote', metaphor: 'tiny outflow arrow seal', subject: 'Tiny amber outflow arrow seal ~30% of frame, empty indigo. Reminder, not doom.', assetReady: true },
  { id: 'ss:丧门', kind: 'shensha', title: '丧门', slug: 'sangmen', accent: 'threshold ash', mood: 'grief-window footnote', metaphor: 'tiny gate outline seal', subject: 'Tiny ash gate outline seal ~30% of frame, empty indigo. Soft reminder.', assetReady: true },
  { id: 'ss:魁罡', kind: 'shensha', title: '魁罡', slug: 'kuigang', accent: 'decisive steel gold', mood: 'resolve / edge footnote', metaphor: 'tiny spearhead seal', subject: 'Tiny steel-gold spearhead seal ~30% of frame, empty indigo. Emblem only.', assetReady: true },
  { id: 'ss:沐浴', kind: 'shensha', title: '沐浴', slug: 'muyu', accent: 'water-soft blue', mood: 'exposure / soft field footnote', metaphor: 'tiny ripple seal', subject: 'Tiny soft water-ripple seal as round badge ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:风流', kind: 'shensha', title: '风流', slug: 'fengliu', accent: 'charm rose', mood: 'charm / gossip boundary footnote', metaphor: 'tiny breeze-petal seal', subject: 'Tiny rose breeze-petal outline seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:流霞', kind: 'shensha', title: '流霞', slug: 'liuxia', accent: 'dusk rose gold', mood: 'emotional wave footnote', metaphor: 'tiny dusk-ribbon seal', subject: 'Tiny dusk ribbon seal ~30% of frame, empty indigo. Soft caution.', assetReady: true },
  { id: 'ss:血刃', kind: 'shensha', title: '血刃', slug: 'xueren', accent: 'guard rose steel', mood: 'sharp guard footnote', metaphor: 'tiny blade tip seal', subject: 'Tiny soft-rose steel blade tip seal ~30% of frame, empty indigo. Guard, not gore.', assetReady: true },
  { id: 'ss:国印', kind: 'shensha', title: '国印', slug: 'guoyin', accent: 'seal gold', mood: 'authority stamp footnote', metaphor: 'tiny square seal badge', subject: 'Tiny gold square official seal badge ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:台阁', kind: 'shensha', title: '台阁', slug: 'taige', accent: 'platform gold', mood: 'institution platform footnote', metaphor: 'tiny pavilion roof seal', subject: 'Tiny pavilion / platform roof seal ~30% of frame, empty indigo. No cityscape.', assetReady: true },
  { id: 'ss:权星', kind: 'shensha', title: '权星', slug: 'quanxing', accent: 'command orb gold', mood: 'decision handle footnote', metaphor: 'tiny orb-and-stem seal', subject: 'Tiny gold orb with stem seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:飞刃', kind: 'shensha', title: '飞刃', slug: 'feiren', accent: 'flying edge silver', mood: 'sharp motion footnote', metaphor: 'tiny flying blade seal', subject: 'Tiny silver flying-blade trail seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:紫微', kind: 'shensha', title: '紫微', slug: 'ziwei', accent: 'violet center gold', mood: 'hub / center footnote', metaphor: 'tiny violet star seal', subject: 'Tiny violet-gold center star seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:天官', kind: 'shensha', title: '天官', slug: 'tianguan', accent: 'honor gold', mood: 'name / honor footnote', metaphor: 'tiny honor crest seal', subject: 'Tiny honor crest triangle seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:仓廪', kind: 'shensha', title: '仓廪', slug: 'cangling', accent: 'storehouse gold', mood: 'storage / reserve footnote', metaphor: 'tiny granary seal', subject: 'Tiny granary storehouse seal ~30% of frame, empty indigo. No farmland.', assetReady: true },
  { id: 'ss:飞财', kind: 'shensha', title: '飞财', slug: 'feicai', accent: 'mobile gold', mood: 'money in motion footnote', metaphor: 'tiny coin-flight seal', subject: 'Tiny coin with flight arrow seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:进神', kind: 'shensha', title: '进神', slug: 'jinshen', accent: 'advance green-gold', mood: 'push forward footnote', metaphor: 'tiny upward chevron seal', subject: 'Tiny upward advance chevron seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:退神', kind: 'shensha', title: '退神', slug: 'tuishen', accent: 'retreat cool silver', mood: 'pull back footnote', metaphor: 'tiny downward chevron seal', subject: 'Tiny cool downward retreat chevron seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:富星', kind: 'shensha', title: '富星', slug: 'caixing', accent: 'abundance gold', mood: 'resource plenty footnote', metaphor: 'tiny coin-cross seal', subject: 'Tiny abundance coin-cross seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:孤辰', kind: 'shensha', title: '孤辰', slug: 'guchenxing', accent: 'lone cool silver', mood: 'self-standing footnote', metaphor: 'tiny lone stone seal', subject: 'Tiny lone cool stone seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:寡宿', kind: 'shensha', title: '寡宿', slug: 'guasu', accent: 'quiet mist silver', mood: 'quiet solitude footnote', metaphor: 'tiny twin pale rings', subject: 'Tiny quiet twin pale rings seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:隔角', kind: 'shensha', title: '隔角', slug: 'gejiao', accent: 'gap amber', mood: 'misalignment footnote', metaphor: 'tiny split-corner seal', subject: 'Tiny split-corner gap seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:元辰', kind: 'shensha', title: '元辰', slug: 'yuanchen', accent: 'inner drain mauve', mood: 'inner friction footnote', metaphor: 'tiny opposing curves seal', subject: 'Tiny opposing mauve curves seal ~30% of frame, empty indigo. Soft reminder.', assetReady: true },
  { id: 'ss:天罗', kind: 'shensha', title: '天罗', slug: 'tianluo', accent: 'net cool silver', mood: 'encircle / detour footnote', metaphor: 'tiny crossed-net seal', subject: 'Tiny cool crossed-net ring seal ~30% of frame, empty indigo. Detour, not doom.', assetReady: true },
  { id: 'ss:地网', kind: 'shensha', title: '地网', slug: 'diwang', accent: 'grid earth silver', mood: 'ground tangle footnote', metaphor: 'tiny grid seal', subject: 'Tiny soft earth-grid seal ~30% of frame, empty indigo. Clear step by step.', assetReady: true },
  { id: 'ss:马头带剑', kind: 'shensha', title: '马头带剑', slug: 'matoudaojian', accent: 'travel edge silver', mood: 'motion with edge footnote', metaphor: 'tiny hoof-and-blade seal', subject: 'Tiny hoof-and-blade travel seal ~30% of frame, empty indigo. Guard while moving.', assetReady: true },
  { id: 'ss:阴差阳错', kind: 'shensha', title: '阴差阳错', slug: 'yinchayangcuo', accent: 'misalign mauve', mood: 'timing twist footnote', metaphor: 'tiny opposing arcs seal', subject: 'Tiny opposing mauve arcs seal ~30% of frame, empty indigo. Align timing, soft reminder.', assetReady: true },
  { id: 'ss:童子', kind: 'shensha', title: '童子', slug: 'tongzi', accent: 'clear gold', mood: 'plain practice footnote', metaphor: 'tiny clear-head seal', subject: 'Tiny clear-gold simple head-and-curve seal ~30% of frame, empty indigo. Practice path, not doom.', assetReady: true },
  { id: 'ss:挂剑', kind: 'shensha', title: '挂剑', slug: 'guajian', accent: 'sheathed silver', mood: 'edge on standby footnote', metaphor: 'tiny hanging blade seal', subject: 'Tiny hanging silver blade seal ~30% of frame, empty indigo. Guard posture.', assetReady: true },
  { id: 'ss:死符', kind: 'shensha', title: '死符', slug: 'sifu', accent: 'still cool silver', mood: 'stagnation reminder footnote', metaphor: 'tiny still plaque seal', subject: 'Tiny cool still plaque seal ~30% of frame, empty indigo. Pause reminder, not literal death.', assetReady: true },
  { id: 'ss:绞煞', kind: 'shensha', title: '绞煞', slug: 'jiaosha', accent: 'knot mauve', mood: 'entangle caution footnote', metaphor: 'tiny loop-knot seal', subject: 'Tiny soft mauve loop-knot seal ~30% of frame, empty indigo. Untangle carefully.', assetReady: true },
  { id: 'ss:五鬼', kind: 'shensha', title: '五鬼', slug: 'wugui', accent: 'scatter violet', mood: 'scatter / noise footnote', metaphor: 'tiny five-dot seal', subject: 'Tiny five soft violet dots seal ~30% of frame, empty indigo. Noise reminder, not haunt.', assetReady: true },
  { id: 'ss:勾绞', kind: 'shensha', title: '勾绞', slug: 'goujiao', accent: 'hook rose silver', mood: 'pull-and-tangle footnote', metaphor: 'tiny twin hooks seal', subject: 'Tiny twin hook curves seal ~30% of frame, empty indigo. Soft caution.', assetReady: true },
  { id: 'ss:披麻', kind: 'shensha', title: '披麻', slug: 'pima', accent: 'mourning ash', mood: 'farewell cloth footnote', metaphor: 'tiny vertical cloth lines', subject: 'Tiny ash vertical cloth-line seal ~30% of frame, empty indigo. Soft farewell tone.', assetReady: true },
  { id: 'ss:六厄', kind: 'shensha', title: '六厄', slug: 'liue', accent: 'hardship amber', mood: 'hard stretch footnote', metaphor: 'tiny hardship chevron', subject: 'Tiny amber hardship chevron seal ~30% of frame, empty indigo. Stretch reminder.', assetReady: true },
  { id: 'ss:胎神', kind: 'shensha', title: '胎神', slug: 'taishen', accent: 'seed rose gold', mood: 'gestation care footnote', metaphor: 'tiny seed oval seal', subject: 'Tiny rose-gold seed oval seal ~30% of frame, empty indigo. Care / beginning.', assetReady: true },
  { id: 'ss:养神', kind: 'shensha', title: '养神', slug: 'yangshen', accent: 'nourish sage', mood: 'nurture footing footnote', metaphor: 'tiny nurture curve seal', subject: 'Tiny sage nurture curve seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:截路空亡', kind: 'shensha', title: '截路空亡', slug: 'jielukongwang', accent: 'blocked path silver', mood: 'detour / gap footnote', metaphor: 'tiny blocked-path seal', subject: 'Tiny dashed blocked-path ring seal ~30% of frame, empty indigo. Detour, not doom.', assetReady: true },
  { id: 'ss:正印', kind: 'shensha', title: '正印', slug: 'zhengyin', accent: 'seal nurture gold', mood: 'support / study footing footnote', metaphor: 'tiny nurture seal plaque', subject: 'Tiny gold nurture seal plaque ~30% of frame, empty indigo. Support footing, not ten-god lecture.', assetReady: true },
  { id: 'ss:华盖（驿）', kind: 'shensha', title: '华盖（驿）', slug: 'huagaiyi', accent: 'canopy wind silver', mood: 'travel solitude footnote', metaphor: 'tiny canopy-with-trail seal', subject: 'Tiny canopy with wind trail seal ~30% of frame, empty indigo. Move then rest.', assetReady: true },
  { id: 'ss:动态', kind: 'shensha', title: '动态', slug: 'dongtai', accent: 'motion teal silver', mood: 'motion overview footnote', metaphor: 'tiny motion curve seal', subject: 'Tiny teal motion-curve seal ~30% of frame, empty indigo. Return to shore.', assetReady: true },
  { id: 'ss:羊刃（凶读）', kind: 'shensha', title: '羊刃（凶读）', slug: 'yangrenxiong', accent: 'fierce blade rose', mood: 'sharp edge caution footnote', metaphor: 'tiny fierce blade tip seal', subject: 'Tiny rose-steel fierce blade tip seal ~30% of frame, empty indigo. Soft caution, not gore.', assetReady: true },
  { id: 'ss:天喜红鸾', kind: 'shensha', title: '天喜红鸾', slug: 'tianxihongluan', accent: 'festive rose gold', mood: 'joy bond pair footnote', metaphor: 'tiny twin joy seals', subject: 'Tiny twin festive rose-gold seals ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:咸池桃花', kind: 'shensha', title: '咸池桃花', slug: 'xianchitaohua', accent: 'pool blossom rose', mood: 'affinity pool footnote', metaphor: 'tiny pool-blossom seal', subject: 'Tiny rose pool-blossom seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:妻妾', kind: 'shensha', title: '妻妾', slug: 'qiqie', accent: 'pair bond rose', mood: 'partner role footnote', metaphor: 'tiny twin rings seal', subject: 'Tiny twin pale rose rings seal ~30% of frame, empty indigo. Role note, not judgment.', assetReady: true },
  { id: 'ss:夫星', kind: 'shensha', title: '夫星', slug: 'fuxingrole', accent: 'partner crest gold', mood: 'partner role footnote', metaphor: 'tiny crest triangle seal', subject: 'Tiny gold partner crest seal ~30% of frame, empty indigo. Role note.', assetReady: true },
  { id: 'ss:词馆学堂', kind: 'shensha', title: '词馆学堂', slug: 'ciguanxuetang', accent: 'study hall gold', mood: 'learning hall footnote', metaphor: 'tiny hall-book seal', subject: 'Tiny study-hall book seal ~30% of frame, empty indigo. No classroom scene.', assetReady: true },
  { id: 'ss:子孙星', kind: 'shensha', title: '子孙星', slug: 'zisunxing', accent: 'offspring sage', mood: 'next-gen role footnote', metaphor: 'tiny sprout curve seal', subject: 'Tiny sage sprout curve seal ~30% of frame, empty indigo.', assetReady: true },
  { id: 'ss:长生', kind: 'shensha', title: '长生', slug: 'changsheng', accent: 'sprout green-gold', mood: 'life-cycle start footnote', metaphor: 'tiny sprout seal', subject: 'Tiny sprout green-gold seal ~30% of frame, empty indigo. Stage mark.', assetReady: true },
  { id: 'ss:帝旺', kind: 'shensha', title: '帝旺', slug: 'diwangstage', accent: 'peak gold', mood: 'life-cycle peak footnote', metaphor: 'tiny peak star seal', subject: 'Tiny peak gold star seal ~30% of frame, empty indigo. Stage mark, not throne scene.', assetReady: true },
  { id: 'ss:墓库', kind: 'shensha', title: '墓库', slug: 'muku', accent: 'storehouse ash gold', mood: 'life-cycle store footnote', metaphor: 'tiny storehouse seal', subject: 'Tiny ash-gold storehouse seal ~30% of frame, empty indigo. Storage stage.', assetReady: true },
  { id: 'ss:旬空', kind: 'shensha', title: '旬空', slug: 'xunkong', accent: 'void dashed silver', mood: 'gap / pause footnote', metaphor: 'tiny dashed void ring', subject: 'Tiny dashed void ring seal ~30% of frame, empty indigo. Borrow real footing.', assetReady: true },
  { id: 'ss:天罗地网', kind: 'shensha', title: '天罗地网', slug: 'tianluodiwang', accent: 'net-grid silver', mood: 'encircle detour footnote', metaphor: 'tiny net-over-grid seal', subject: 'Tiny net-over-grid seal ~30% of frame, empty indigo. Detour step by step.', assetReady: true },
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
