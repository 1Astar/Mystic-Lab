/** 十二宫位探索 · 人生场景 */
export type PalaceLore = {
  id: string;
  title: string;
  hint: string;
  oneLiner: string;
  keywords: string[];
  asks: string;
  strongWhen: string;
  watchOut: string;
  oppositeHint: string;
};

export const PALACE_LORE: PalaceLore[] = [
  {
    id: '命宫',
    title: '命宫',
    hint: '我是谁',
    oneLiner: '你人生戏的主角设定——别人第一眼读到的「你」。',
    keywords: ['自我', '主轴', '气质', '出场方式'],
    asks: '我用什么姿态走进世界？别人天然把我当成什么样的人？',
    strongWhen: '主星清、吉化会照：自我认同稳，行动与人设一致。',
    watchOut: '空象或化忌：容易飘、靠环境定义自己，要主动写「我是谁」实验。',
    oppositeHint: '对宫迁移：内在我 vs 外面世界如何看见我。',
  },
  {
    id: '兄弟',
    title: '兄弟宫',
    hint: '同辈 / 伙伴',
    oneLiner: '同辈、手足、早期伙伴——你怎么与「平级的人」相处。',
    keywords: ['伙伴', '平级', '协作', '竞争'],
    asks: '我和同辈是并肩还是较劲？谁是我的第一圈同盟？',
    strongWhen: '吉星同宫：兄弟/朋友缘实质，能互相抬。',
    watchOut: '煞忌：同辈口舌或资源争夺；把「竞争」改成「分工」。',
    oppositeHint: '对宫奴仆：近友 vs 更广的协作圈。',
  },
  {
    id: '夫妻',
    title: '夫妻宫',
    hint: '亲密关系',
    oneLiner: '一对一亲密戏——伴侣、深度绑定、长期同行者。',
    keywords: ['亲密', '绑定', '欲望', '承诺'],
    asks: '我在亲密里要什么？我怕被困还是怕被弃？',
    strongWhen: '桃花与禄权得宜：关系有热度也有结构。',
    watchOut: '忌与空：纠缠或抽离；把期待说成可核对的约定。',
    oppositeHint: '对宫官禄：爱与事业是否互相抢戏。',
  },
  {
    id: '子女',
    title: '子女宫',
    hint: '创造与延续',
    oneLiner: '创造、表达、子代与作品——你留下什么。',
    keywords: ['创造', '作品', '传承', '表达'],
    asks: '我通过什么「生」出新东西？孩子、项目、还是风格？',
    strongWhen: '文星桃花：创作欲与表达欲旺。',
    watchOut: '耗忌：创作易半途；先交付最小成品再迭代。',
    oppositeHint: '对宫田宅：创造冲动 vs 安稳根基。',
  },
  {
    id: '财帛',
    title: '财帛宫',
    hint: '资源与钱',
    oneLiner: '钱与资源怎么进账、怎么留住。',
    keywords: ['钱', '资源', '进账', '经营'],
    asks: '我靠什么赚钱？留存靠纪律还是靠感觉？',
    strongWhen: '财星与禄：进账路径清晰。',
    watchOut: '破耗忌：赚得快漏得也快；先建蓄水池。',
    oppositeHint: '对宫福德：外财 vs 内心是否真满足。',
  },
  {
    id: '疾厄',
    title: '疾厄宫',
    hint: '身心状态',
    oneLiner: '身体与心理的边界——哪里容易过载。',
    keywords: ['身心', '边界', '压力', '修复'],
    asks: '压力落在哪？我用什么方式硬扛或逃避？',
    strongWhen: '吉护：恢复力强，知道何时停。',
    watchOut: '煞忌：过劳与情绪淤积；把休息当成技能。',
    oppositeHint: '对宫父母：自我照料 vs 权威期待。',
  },
  {
    id: '迁移',
    title: '迁移宫',
    hint: '外部世界',
    oneLiner: '出门、远方、外界舞台——你在外面怎么演。',
    keywords: ['外出', '舞台', '环境', '流转'],
    asks: '离开舒适区时，我是开拓还是漂泊？',
    strongWhen: '马星与吉：外出有收获、有贵人。',
    watchOut: '空劫：漂而无根；外出要有「回得来」的锚。',
    oppositeHint: '对宫命宫：外面的我 vs 内核的我。',
  },
  {
    id: '仆役',
    title: '奴仆宫',
    hint: '协作 / 社交圈',
    oneLiner: '同事、朋友圈、可调用的人脉网络。',
    keywords: ['社交', '协作', '人脉', '圈子'],
    asks: '谁愿意为我出力？我又如何回馈圈子？',
    strongWhen: '贵人辅弼：圈子能托事。',
    watchOut: '煞忌：小人或无效社交；精简名单。',
    oppositeHint: '对宫兄弟：广人脉 vs 近伙伴。',
  },
  {
    id: '官禄',
    title: '官禄宫',
    hint: '事业轨道',
    oneLiner: '事业、志业、社会角色——你靠什么被世界雇用。',
    keywords: ['事业', '角色', '志向', '轨道'],
    asks: '我的专业身份是什么？升迁靠稳还是靠冲？',
    strongWhen: '官禄主星有力：轨道清楚。',
    watchOut: '变动煞：频繁换轨；每次换要写清「为何换」。',
    oppositeHint: '对宫夫妻：事业与亲密是否互耗。',
  },
  {
    id: '田宅',
    title: '田宅宫',
    hint: '居住与安全感',
    oneLiner: '家、资产、可退守的根据地。',
    keywords: ['家', '资产', '安全感', '退路'],
    asks: '我的安全基地在哪？房产、积蓄还是人？',
    strongWhen: '府库之星：有可守的家底。',
    watchOut: '破耗：安稳被掏空；先守现金流再谈置产。',
    oppositeHint: '对宫子女：安稳 vs 创造冲动。',
  },
  {
    id: '福德',
    title: '福德宫',
    hint: '内在快乐系统',
    oneLiner: '心里那套快乐算法——什么让你真的满足。',
    keywords: ['快乐', '精神', '享受', '内耗'],
    asks: '什么活动能把我充满？我是在享受还是在逃避？',
    strongWhen: '福星：精神账户常有盈余。',
    watchOut: '忌耗：娱乐变麻醉；快乐要可复盘。',
    oppositeHint: '对宫财帛：内心满足 vs 外在进账。',
  },
  {
    id: '父母',
    title: '父母宫',
    hint: '支持系统 / 规则',
    oneLiner: '长辈、权威、规则来源——谁教你「应该怎样」。',
    keywords: ['长辈', '权威', '规则', '支持'],
    asks: '我继承了谁的规则？支持来自哪里，压力又来自哪里？',
    strongWhen: '荫贵：有可依靠的支持系统。',
    watchOut: '煞忌：权威冲突或规则内化成自我苛责。',
    oppositeHint: '对宫疾厄：外在规则 vs 身心负荷。',
  },
];

export function getPalaceLore(id: string): PalaceLore | undefined {
  const key = id.replace(/宫$/, '');
  return (
    PALACE_LORE.find((p) => p.id === id || p.id === key || p.title === id) ??
    PALACE_LORE.find((p) => p.title.startsWith(key))
  );
}
