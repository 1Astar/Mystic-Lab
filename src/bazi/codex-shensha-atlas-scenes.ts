/**
 * 八字神煞 · 东方命理博物志场景库（图内无字，底栏 CSS 叠名）
 */

/** 神煞共用母版（与紫微宇宙海报分家） */
export const SHENSHA_ATLAS_STYLE = [
  'vertical Chinese classical metaphysics atlas plate (神煞图谱)',
  'rice-paper cream ground (#f3ead8)',
  'mineral pigments: cinnabar, indigo, ochre, soft gilt',
  'fine ink linework with soft wash and sparse gold dust',
  'thin ornamental frame, four corner gilt motifs, one vermilion seal stamp only',
  'CRITICAL: leave the bottom ~18% as empty blank rice-paper title band',
  'ABSOLUTELY NO text, NO letters, NO Chinese characters, NO glyphs, NO calligraphy anywhere in the image',
  'mystical but NOT dark oppressive cosmic void — brighter than night-sky posters',
  'no complex human faces',
  'symbolic omen object plus living environment (landscape / objects / animals / plants)',
  'ancient illustrated almanac / natural-history of destiny signs',
].join('; ');

export type AtlasScene = {
  accent: string;
  mood: string;
  metaphor: string;
  scene: string;
};

function s(accent: string, mood: string, metaphor: string, scene: string): AtlasScene {
  return { accent, mood, metaphor, scene };
}

/** slug → 场景 */
export const SHENSHA_ATLAS_SCENES: Record<string, AtlasScene> = {
  tianyi: s('warm gilt, celadon', 'helped, ease', 'jade seal + lamps + carriage', 'white jade seal, two soft lamps, supportive hands in cloud without face, distant noble carriage on pale road'),
  wenchang: s('ink, cinnabar, old gold', 'talent, study', 'books brush inkstone pages', 'aged classics, brush, inkstone, pages lifting with tiny star-dots on paper'),
  lushen: s('rice gold, earth', 'livelihood footing', 'grain vessel fields', 'glowing grain vessel on wooden stand, soft rice sheaves, quiet storehouse corner'),
  jiangxing: s('command gold, banner', 'backbone command', 'banner spear ridge', 'command banner and short spear on mountain ridge at dusk, no army crowd'),
  hongluan: s('rose gold, blossom', 'joyful bond', 'red bird peach', 'elegant red bird among soft peach blossoms and silk ribbon'),
  tianxi: s('festive gold, coral', 'delight', 'lantern blossom', 'festive paper lanterns and blooming sprigs over quiet courtyard'),
  taohua: s('old rose, celadon', 'attraction flow', 'peach mirror moon', 'peach tree by water, falling petals, bronze mirror, faintly blushing moon'),
  yangren: s('cinnabar, iron gray', 'edge boundary', 'blade cord thorns', 'polished blade on stone platform, red cord, thorn branches, keen gleam without gore'),
  huagai: s('gray-blue, moss', 'solitude spirit', 'peak canopy deer', 'solitary high peak, canopy-shaped tree, quiet deer, sparse soft stars'),
  guchen: s('cold mist silver', 'aloneness', 'lone stone empty board', 'single cold stone on empty board under pale mist, distant empty pavilion'),
  yima: s('ochre, sand gold', 'journey change', 'road horse banners', 'ancient road, running horse, travel pack, distant mountains, wind banners'),
  jiesha: s('storm iron, amber', 'sudden shift', 'crossed spears storm', 'crossed iron spears and torn banner in sudden wind, soft caution not doom'),
  tiande: s('soft virtue gold', 'protective resolve', 'virtue lamp mist', 'soft golden virtue lamp among gentle mountain mist and pine'),
  yuede: s('moon silver, indigo', 'gentle shelter', 'crescent willow', 'silver crescent over quiet willow pond, soft shelter mood'),
  fuxing: s('warm fortune gold', 'blessing footing', 'star over grain', 'warm five-point star glow above full grain basket'),
  jinyu: s('carriage gold', 'dignified carriage', 'bronze carriage road', 'bronze ceremonial carriage on pale ceremonial road with soft clouds'),
  tianchu: s('hearth gold', 'nourishment', 'hearth vessel steam', 'warm hearth vessel with gentle steam, herbs and wooden ladle'),
  xuetang: s('ink study gold', 'learning field', 'open book window', 'open book and bamboo brush by paper window light, quiet study corner'),
  kongwang: s('void silver', 'gap pause', 'dashed hollow gate', 'dashed hollow gate in misty empty courtyard, pause not abyss'),
  bingfu: s('sage green', 'recovery reminder', 'herb pouch seal', 'soft herb pouch and care cloth on clean wooden tray, not medical horror'),
  baihu: s('cold white metal', 'sharp guard', 'white tiger ridge', 'stylized white tiger silhouette on cold stone ridge, guard not gore'),
  zaisha: s('amber warning', 'caution factor', 'cracked bell thorn', 'cracked warning bell among dry thorns, soft caution'),
  wangshen: s('ash silver', 'fading rhythm', 'wilting reed dusk', 'wilting reeds at ash dusk river, soft fading mood'),
  xianchi: s('rose mist gold', 'affinity pool', 'lotus pool mist', 'lotus pool in rose mist with floating petals'),
  tiandehe: s('paired virtue gold', 'buffer union', 'twin lamps path', 'two soft virtue lamps meeting on a pale shared path'),
  yuedehe: s('moon-pair silver', 'soft buffer', 'twin crescents pond', 'two pale crescents meeting over quiet pond'),
  tianshe: s('pardon gold', 'release window', 'open cage birds', 'open bamboo cage with birds rising into soft sky, pardon release'),
  sanqi: s('triple spark gold', 'rare opening', 'three gems tray', 'three luminous gems on silk tray under soft daylight'),
  tianyimed: s('healing sage', 'care recover', 'mortar herbs', 'stone mortar with sage herbs and soft cloth wrap'),
  jieshen: s('unknot gold', 'untangle', 'unknot ribbon', 'gold ribbon unknotting itself among calm bamboo'),
  ciguan: s('ink folio gold', 'writing hall', 'folio tablets', 'stacked folio tablets and ink sticks on scholar desk'),
  wenqu: s('ink flourish gold', 'clever expression', 'ink splash crane', 'ink flourish splash forming crane silhouette on rice paper'),
  tianma: s('sky wind silver', 'far travel', 'winged horse cloud', 'pale winged horse crossing high cloud road'),
  diaoke: s('ash farewell silver', 'farewell tone', 'white cloth gate', 'pale farewell cloth at quiet gate, soft not grim'),
  tianku: s('mist sorrow silver', 'wistful tone', 'rain stone tears', 'raindrops on stone with soft mist willow, gentle wistful'),
  tianxu: s('hollow cool silver', 'empty-feel', 'empty bowl niche', 'empty porcelain bowl in quiet wall niche'),
  posui: s('crack amber', 'fragile backup', 'cracked jar kintsugi', 'cracked ceramic jar with soft gold seam repair'),
  dahao: s('drain amber', 'leak outflow', 'leaking purse sand', 'cloth purse leaking sand coins onto ground, reminder not doom'),
  sangmen: s('threshold ash', 'grief window', 'ash threshold door', 'ash-toned threshold door ajar with soft light beyond'),
  kuigang: s('decisive steel gold', 'resolve edge', 'spearhead stone', 'steel-gold spearhead upright on stone, decisive emblem'),
  muyu: s('water-soft blue', 'soft exposure', 'bathing stream', 'clear shallow stream with soft ripples and pale stones'),
  fengliu: s('charm rose', 'charm boundary', 'breeze petals fan', 'silk fan and breeze-blown petals over water'),
  liuxia: s('dusk rose gold', 'emotional wave', 'dusk ribbon sky', 'dusk rose-gold sky ribbon over quiet hills'),
  xueren: s('guard rose steel', 'sharp guard', 'blade tip silk', 'soft rose-steel blade tip wrapped with silk, guard not gore'),
  guoyin: s('seal gold', 'authority stamp', 'square seal silk', 'gold square official seal on vermilion silk pad'),
  taige: s('platform gold', 'institution', 'pavilion platform', 'elevated pavilion platform with gilt rail under soft sky'),
  quanxing: s('command orb gold', 'decision handle', 'orb staff', 'gold command orb on short staff among clouds'),
  feiren: s('flying edge silver', 'sharp motion', 'blade trail wind', 'silver blade leaving soft wind trail across sky, no gore'),
  ziwei: s('violet center gold', 'hub center', 'violet star pavilion', 'violet central star above quiet imperial pavilion roof'),
  tianguan: s('honor gold', 'name honor', 'honor plaque cloud', 'honor plaque hanging in soft cloud light'),
  cangling: s('storehouse gold', 'storage reserve', 'granary doors', 'wooden granary doors half open with grain glow inside'),
  feicai: s('mobile gold', 'money motion', 'coins wind road', 'gold coins lifting on wind along a travel road'),
  jinshen: s('advance green-gold', 'push forward', 'uphill path sun', 'uphill stone path toward soft morning sun'),
  tuishen: s('retreat cool silver', 'pull back', 'downstream boat', 'small boat drifting downstream into cool mist'),
  caixing: s('abundance gold', 'resource plenty', 'coin pile peony', 'stacked coins beside peony bloom, abundance footing'),
  guchenxing: s('lone cool silver', 'self-standing', 'lone pine cliff', 'lone pine on cool cliff under pale sky'),
  guasu: s('quiet mist silver', 'quiet solitude', 'empty twin stools', 'two empty stools under quiet mist lantern'),
  gejiao: s('gap amber', 'misalignment', 'split corner path', 'path split at angled corner with amber gap light'),
  yuanchen: s('inner drain mauve', 'inner friction', 'opposing waves well', 'two opposing mauve waves around a quiet well'),
  tianluo: s('net cool silver', 'encircle detour', 'net over sky gate', 'cool silver net draping over sky gate, detour not doom'),
  diwang: s('grid earth silver', 'ground tangle', 'earth grid vines', 'soft earth grid with tangled vines, clear step by step'),
  matoudaojian: s('travel edge silver', 'motion with edge', 'horsehead blade', 'horse head silhouette with sheathed blade at side, guard while moving'),
  yinchayangcuo: s('misalign mauve', 'timing twist', 'crossed sundials', 'two misaligned sundial shadows on pale stone'),
  tongzi: s('clear gold', 'plain practice', 'simple school desk', 'simple child desk with clear ink and blank paper, practice path'),
  guajian: s('sheathed silver', 'edge standby', 'hanging sheathed sword', 'sheathed sword hanging on wooden rack, standby guard'),
  sifu: s('still cool silver', 'stagnation pause', 'still pond ice', 'still cool pond with thin quiet ice, pause reminder not death'),
  jiaosha: s('knot mauve', 'entangle caution', 'tangled silk loops', 'tangled mauve silk loops on wooden frame, untangle carefully'),
  wugui: s('scatter violet', 'scatter noise', 'five lanterns wind', 'five small violet lanterns scattered by wind, noise reminder not haunt'),
  goujiao: s('hook rose silver', 'pull tangle', 'twin hooks rope', 'twin metal hooks linked by soft rope, caution'),
  pima: s('mourning ash', 'farewell cloth', 'ash hemp cloth', 'folded ash hemp cloth on quiet stool, soft farewell'),
  liue: s('hardship amber', 'hard stretch', 'steep amber stairs', 'steep amber stone stairs under heavy sky, stretch reminder'),
  taishen: s('seed rose gold', 'gestation care', 'seed in nest', 'rose-gold seed nestled in soft nest of silk and straw'),
  yangshen: s('nourish sage', 'nurture footing', 'sprout watering', 'sage sprout being watered from small clay pot'),
  jielukongwang: s('blocked path silver', 'detour gap', 'blocked road mist', 'road blocked by fallen timber in mist with side detour path'),
  zhengyin: s('seal nurture gold', 'support study', 'nurture seal books', 'nurture seal beside stacked support books'),
  huagaiyi: s('canopy wind silver', 'travel solitude', 'canopy on road', 'spiritual canopy shade on a solitary travel road'),
  dongtai: s('motion teal silver', 'motion overview', 'river current map', 'teal river current with soft motion curves returning to shore'),
  yangrenxiong: s('fierce blade rose', 'sharp caution', 'fierce blade thorns', 'fiercer blade tip among denser thorns, caution not gore'),
  tianxihongluan: s('festive rose gold', 'joy bond pair', 'lantern and red bird', 'festive lantern paired with elegant red bird among blossoms'),
  xianchitaohua: s('pool blossom rose', 'affinity pool', 'lotus peach water', 'lotus pool meeting peach petals on water'),
  qiqie: s('pair bond rose', 'partner role', 'twin hairpins silk', 'twin hairpins on shared silk cloth, role note not judgment'),
  fuxingrole: s('partner crest gold', 'partner role', 'crest and belt', 'partner crest plaque beside ceremonial belt'),
  ciguanxuetang: s('study hall gold', 'learning hall', 'hall books window', 'study hall interior with books and bright paper window'),
  zisunxing: s('offspring sage', 'next-gen role', 'twin sprouts soil', 'two young sprouts in shared soil bowl'),
  changsheng: s('sprout green-gold', 'life-cycle start', 'new sprout dawn', 'new green-gold sprout at soft dawn soil'),
  diwangstage: s('peak gold', 'life-cycle peak', 'sun peak mountain', 'peak sun over mountain crest, stage mark not throne'),
  muku: s('storehouse ash gold', 'life-cycle store', 'closed storehouse', 'closed storehouse doors with ash-gold latch, storage stage'),
  xunkong: s('void dashed silver', 'gap pause', 'empty decade gate', 'dashed empty gate of a decade cycle in soft mist'),
  tianluodiwang: s('net-grid silver', 'encircle detour', 'net over earth grid', 'sky net overlapping earth grid paths, detour step by step'),
};

export function atlasSubjectForSlug(slug: string): string | null {
  const row = SHENSHA_ATLAS_SCENES[slug];
  if (!row) return null;
  return `${SHENSHA_ATLAS_STYLE} Scene: ${row.scene}.`;
}
