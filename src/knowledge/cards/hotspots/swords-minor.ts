import type { CardVisualHotspots } from '../../types.ts';

/** 宝剑组牌面热点（14 张） */
export const SWORDS_MINOR_HOTSPOTS: CardVisualHotspots[] = [
  {
    cardId: 'swords-ace',
    deckId: 'swords-ace',
    overview:
      '一只从云中伸出的手，握着一把直指天空的宝剑，剑尖戴着王冠，脚下是远山。像一道突然劈开迷雾的光——清晰的新念头、理性判断，或一个需要直接面对的真相。',
    hotspots: [
      { id: 'hand', label: '云端之手', x: 50, y: 28, meaning: '从更高视角递来的一把剑——清晰的新念头或决断。' },
      { id: 'sword', label: '宝剑', x: 50, y: 48, meaning: '锋利、直接、切开混乱——真相可能不好听，但能指路。' },
      { id: 'crown', label: '剑尖王冠', x: 50, y: 18, meaning: '突破旧框架的可能，但权力伴随责任。' },
      { id: 'mountains', label: '远山', x: 50, y: 82, meaning: '目标仍在远方，清晰只是第一步。' },
    ],
  },
  {
    cardId: 'swords-two',
    deckId: 'swords-two',
    overview:
      '蒙眼女子坐在海边，双手交叉握持双剑，身后水面平静。理性表面平衡，情绪在暗处流动——僵持不是和平，是尚未准备好面对的暂停。',
    hotspots: [
      { id: 'blindfold', label: '蒙眼', x: 50, y: 22, meaning: '刻意不看、或尚未准备好面对的信息。' },
      { id: 'swords', label: '双剑交叉', x: 50, y: 48, meaning: '两种立场在内心角力——僵持不是和平，是暂停。' },
      { id: 'water', label: '背后水面', x: 50, y: 78, meaning: '情绪在暗处流动，理性只是表面平衡。' },
    ],
  },
  {
    cardId: 'swords-three',
    deckId: 'swords-three',
    overview:
      '乌云下红心被三把剑刺中。伤害往往来自多方：他人、自己，或过去的累积——痛苦真实，但云层也会散去。',
    hotspots: [
      { id: 'heart', label: '红心', x: 50, y: 42, meaning: '被刺中的感受——失望、分离或言语伤人。' },
      { id: 'swords', label: '三把剑', x: 50, y: 28, meaning: '伤害往往来自多个方向：他人、自己、或过去的累积。' },
      { id: 'clouds', label: '乌云', x: 50, y: 12, meaning: '痛苦真实，但云层也会散去——不必把此刻当永恒。' },
    ],
  },
  {
    cardId: 'swords-four',
    deckId: 'swords-four',
    overview:
      '骑士卧于石棺之上，墙上三剑静挂，彩窗投下微光。主动休息——不是放弃，而是收起武器、重新连接信念。',
    hotspots: [
      { id: 'knight', label: '骑士', x: 50, y: 52, meaning: '主动休息——不是放弃，是恢复战斗力。' },
      { id: 'swords', label: '墙上三剑', x: 50, y: 28, meaning: '暂时收起的武器，仍随时可用。' },
      { id: 'stained_glass', label: '彩窗', x: 50, y: 18, meaning: '在静中重新连接信念与意义。' },
    ],
  },
  {
    cardId: 'swords-five',
    deckId: 'swords-five',
    overview:
      '一名持剑者得意拾剑，另两人背对离去，地上还留着剑。表面胜利代价可能是关系与自尊——赢了一局，未必赢得局面。',
    hotspots: [
      { id: 'winner', label: '持剑者', x: 62, y: 48, meaning: '表面胜利——但代价可能是关系或自尊。' },
      { id: 'losers', label: '离去的人', x: 28, y: 62, meaning: '冲突后的疏离，赢了一局却可能输掉更多。' },
      { id: 'swords', label: '地上双剑', x: 38, y: 78, meaning: '未带走的武器——怨恨或遗憾仍留在现场。' },
    ],
  },
  {
    cardId: 'swords-six',
    deckId: 'swords-six',
    overview:
      '小舟载着人与竖立的六剑，驶向远岸。从混乱驶向较平静水域——带走必要的，放下其余，才能真正轻行。',
    hotspots: [
      { id: 'boat', label: '小舟', x: 50, y: 55, meaning: '过渡与离开——从混乱地带驶向较平静的水域。' },
      { id: 'figure', label: '撑船人', x: 50, y: 42, meaning: '有人引导过渡，但最终你要自己上岸。' },
      { id: 'swords', label: '六把竖剑', x: 50, y: 38, meaning: '带走的只有必要的——其余放下，才能轻行。' },
      { id: 'far_shore', label: '远岸', x: 50, y: 22, meaning: '新阶段已在眼前，但尚未抵达。' },
    ],
  },
  {
    cardId: 'swords-seven',
    deckId: 'swords-seven',
    overview:
      '一人侧身潜行，怀里抱着五把剑，身后营帐里还立着两把未被带走的剑。画面不是单纯「偷窃好坏」，而是策略、取舍与时机：只拿走眼下用得上的，其余先留下。',
    hotspots: [
      { id: 'thief', label: '潜行者', x: 55, y: 52, meaning: '策略、迂回或不够光明正大的路径——动机值得审视。' },
      { id: 'swords', label: '偷走的剑', x: 45, y: 38, meaning: '只拿走得动的那几把——资源有限，需取舍。' },
      { id: 'camp', label: '远处营帐', x: 50, y: 22, meaning: '他人尚未察觉——窗口期不会永远存在。' },
      { id: 'left_swords', label: '留下的剑', x: 72, y: 48, meaning: '没带走的两把——你还没动用、或暂时不必动用的资源。' },
    ],
  },
  {
    cardId: 'swords-eight',
    deckId: 'swords-eight',
    overview:
      '女子被蒙眼绑缚，立于八剑围成的阵列中，脚边仍有水洼。感觉被困，但绳结未必如想象中坚固——视角一变，缝隙就在。',
    hotspots: [
      { id: 'blindfold', label: '蒙眼绑缚', x: 50, y: 38, meaning: '感觉被困，但束缚未必如想象中坚固。' },
      { id: 'ropes', label: '松散绳结', x: 50, y: 55, meaning: '限制部分来自想象——松绑的可能比你看见的更大。' },
      { id: 'swords', label: '剑阵', x: 50, y: 18, meaning: '威胁环绕，但仍有缝隙可出——关键是视角。' },
      { id: 'water', label: '脚边水洼', x: 50, y: 82, meaning: '情绪仍在流动，你并未真正干涸。' },
    ],
  },
  {
    cardId: 'swords-nine',
    deckId: 'swords-nine',
    overview:
      '夜色中一人坐于床上覆面悲泣，墙上悬着九剑。焦虑与失眠往往比现实更大声——痛苦发生在最私密处，旧恐惧也可能在重复。',
    hotspots: [
      { id: 'figure', label: '床上的人', x: 50, y: 48, meaning: '焦虑失眠——脑中的灾难往往比现实更大声。' },
      { id: 'swords', label: '墙上九剑', x: 50, y: 22, meaning: '反复盘旋的念头，像悬在头顶的判决。' },
      { id: 'quilt', label: '床榻', x: 50, y: 68, meaning: '痛苦发生在最私密处——别人未必看得见。' },
      { id: 'carving', label: '床板雕刻', x: 50, y: 58, meaning: '旧有的恐惧模式，可能已重复许多次。' },
    ],
  },
  {
    cardId: 'swords-ten',
    deckId: 'swords-ten',
    overview:
      '一个人俯卧在地，背上插着十把剑，远方已有曙光，脚边仍有暗水。画面残酷，但常指向「已经到极限」——旧模式结束，而非永远完了。',
    hotspots: [
      { id: 'figure', label: '倒地的人', x: 50, y: 58, meaning: '压力累积后的终点——像「已经撑到极限」的信号。' },
      { id: 'swords', label: '十把剑', x: 50, y: 32, meaning: '不只是一把剑的伤害，而是反复的自我攻击与灾难化想象。' },
      { id: 'hand', label: '手势', x: 62, y: 68, meaning: '仍有生命迹象——触底不等于毁灭，旧模式可以结束。' },
      { id: 'dawn', label: '远方曙光', x: 50, y: 12, meaning: '最暗处过去后，新的阶段会开始——但需先承认已到底。' },
      { id: 'water', label: '暗水', x: 50, y: 88, meaning: '情绪与潜意识仍在流动，结束的是模式，不是全部希望。' },
    ],
  },
  {
    cardId: 'swords-page',
    deckId: 'swords-page',
    overview:
      '青年侍从举起宝剑，风云在背景移动。好奇、观察与新消息——思维正在成形，判断尚未成熟，需落地验证。',
    hotspots: [
      { id: 'youth', label: '侍从', x: 50, y: 48, meaning: '好奇、观察、新消息——思维正在成形。' },
      { id: 'sword', label: '举起的剑', x: 62, y: 28, meaning: '尚未成熟的判断，但已准备好提问与探索。' },
      { id: 'clouds', label: '风与云', x: 50, y: 18, meaning: '想法多变，需落地验证，别只停在脑内。' },
    ],
  },
  {
    cardId: 'swords-knight',
    deckId: 'swords-knight',
    overview:
      '骑士策马高举宝剑疾驰，飞鸟在旁掠过。急速推进、态度直接——冲劲是资源，也可能忽略感受与周遭细节。',
    hotspots: [
      { id: 'knight', label: '骑士', x: 50, y: 45, meaning: '急速推进——行动快，但可能忽略感受与后果。' },
      { id: 'horse', label: '奔马', x: 50, y: 62, meaning: '冲劲是资源，失控则是风险。' },
      { id: 'sword', label: '高举的剑', x: 50, y: 22, meaning: '目标明确、态度直接——问：你要切开什么？' },
      { id: 'birds', label: '飞鸟', x: 72, y: 18, meaning: '混乱中的细节仍在——别只看见自己的方向。' },
    ],
  },
  {
    cardId: 'swords-queen',
    deckId: 'swords-queen',
    overview:
      '王后端坐，宝剑竖直，一朵单云在顶，蝶饰点缀。清晰边界与独立判断——真相优先，清晰却不等于全知。',
    hotspots: [
      { id: 'queen', label: '王后', x: 50, y: 42, meaning: '清晰的边界与独立判断——情感不淹没理性。' },
      { id: 'sword', label: '竖直的剑', x: 58, y: 32, meaning: '真相优先，即使温柔也要准确。' },
      { id: 'cloud', label: '单云', x: 50, y: 12, meaning: '高处仍有不确定——清晰不等于全知。' },
      { id: 'butterfly', label: '蝶与冠', x: 50, y: 18, meaning: '转化与蜕变的可能，在冷静中发生。' },
    ],
  },
  {
    cardId: 'swords-king',
    deckId: 'swords-king',
    overview:
      '国王斜持宝剑坐于石座，双鸟飞过。权威、逻辑与决断在握——力量可用，何时出剑更需判断，也要听见不同声音。',
    hotspots: [
      { id: 'king', label: '国王', x: 50, y: 42, meaning: '权威、逻辑与决断——用头脑掌舵。' },
      { id: 'sword', label: '斜持的剑', x: 62, y: 55, meaning: '力量随时可用，但何时出剑需要判断。' },
      { id: 'throne', label: '石座', x: 50, y: 68, meaning: '稳固来自原则——但原则也可能变成僵化。' },
      { id: 'birds', label: '双鸟', x: 28, y: 22, meaning: '仍要听见不同声音，避免陷入绝对正确。' },
    ],
  },
];
