import type { CastResult } from './engine.ts';
import { LINE_LABELS, upperLowerFromLines } from './hexagrams.ts';
import { dressHexagram, type YaoDress, type LiuQin } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { buildShengKeMap, YUAN_OF, JI_OF } from './shengke-map.ts';
import { detectSceneDomain, type SceneDomain } from './scene-map.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { glossLine, glossDaXiang } from './classic-gloss.ts';
import { resolveClassicDossier } from './classic-folder.ts';
import { formatClauseHtml } from './format-clause.ts';
import { teachFold } from './flip-teach.ts';
import { renderXiangVisual } from './xiang-visual.ts';
import { renderHexagramSvg } from '../ui/liuyao/hexagram-view.ts';
import { hexagramFormModern } from './trigrams.ts';
import {
  formatLiuqinShort,
  bindQinDict,
  renderQinDictHtml,
  buildEnergyFocusFromDress,
  renderEnergyFocusHtml,
} from './energy-lens.ts';
import { renderSpiritNarrativeForCast } from './spirit-narrative.ts';

/** 仇神 = 生忌神者 */
export function chouOf(yongQin: LiuQin): LiuQin {
  return YUAN_OF[JI_OF[yongQin]];
}

function pickRow(rows: YaoDress[], qin: LiuQin): YaoDress | undefined {
  const matches = rows.filter((r) => r.liuqin === qin);
  if (!matches.length) return undefined;
  return matches.find((r) => r.changing) ?? matches.find((r) => r.isShi) ?? matches[0];
}

/** 【卦象解析】为什么形成这个卦？上/下象代表 → 合成公式 */
export function renderGuaXiangCard(cast: CastResult): string {
  const { upper, lower } = upperLowerFromLines(cast.primaryLines);
  const visual = renderXiangVisual(upper, lower);
  const formEq = hexagramFormModern(
    cast.primary.name,
    cast.primary.gist,
    upper,
    lower,
  );
  const natureLine = `上卦为【${upper.id}】（${upper.nature}），下卦为【${lower.id}】（${lower.nature}）。`;
  const physics = `${lower.nature}在下、${upper.nature}在上。${upper.whyImage} ${lower.whyImage} 合在一起看：这件事里，谁在动、谁该停、场子是顺还是险。`;
  const upperRep = upper.represents.join('、');
  const lowerRep = lower.represents.join('、');

  return `
    <article class="ly-gua-card">
      <h4>卦象解析 · 为什么形成这个卦？</h4>
      <p class="ly-gua-card-name">${cast.primary.fullName}</p>
      <div class="ly-gua-card-symbols" aria-hidden="true">
        <span class="ly-gua-sym"><strong>${upper.symbol}</strong><em>上${upper.id}·${upper.nature}</em></span>
        <span class="ly-gua-sym-plus">+</span>
        <span class="ly-gua-sym"><strong>${lower.symbol}</strong><em>下${lower.id}·${lower.nature}</em></span>
      </div>
      ${visual}
      <div class="ly-gua-form-why">
        <div class="ly-gua-form-tri">
          <p class="ly-gua-form-tri-name">${upper.nature} ${upper.symbol}</p>
          <p class="ly-gua-form-tri-rep">代表：${upperRep}</p>
        </div>
        <div class="ly-gua-form-tri">
          <p class="ly-gua-form-tri-name">${lower.nature} ${lower.symbol}</p>
          <p class="ly-gua-form-tri-rep">代表：${lowerRep}</p>
        </div>
        <p class="ly-gua-form-arrow" aria-hidden="true">↓</p>
        <div class="ly-gua-form-result">
          <p class="ly-gua-form-result-name">${cast.primary.fullName}</p>
          <p class="ly-gua-form-result-eq">= ${formEq}</p>
        </div>
      </div>
      <p class="ly-gua-card-body">${natureLine}<br>${physics}</p>
    </article>
  `;
}

/** 【能量现状推演】用/元/忌/仇 因果链 */
export function renderEnergyChainHtml(
  cast: CastResult,
  question: string,
  castAt: Date,
): string {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const domain = detectSceneDomain(question);
  const yong = map.nodes.find((n) => n.role === '用神')?.row;
  const yuan = map.nodes.find((n) => n.role === '原神')?.row;
  const ji = map.nodes.find((n) => n.role === '忌神')?.row;
  const chouQin = map.yongQin ? chouOf(map.yongQin) : null;
  const chou = chouQin ? pickRow(dressed.rows, chouQin) : undefined;

  // 重写为用户模板语气
  const matter =
    domain === 'career'
      ? '事业 / 面试'
      : domain === 'love'
        ? '感情 / 关系'
        : domain === 'life'
          ? '资源 / 钱财'
          : '你问的事';

  const lines: { emoji: string; title: string; body: string; note?: string }[] = [];

  if (yong && map.yongQin) {
    lines.push({
      emoji: '💪',
      title: `核心聚焦（用神）· ${formatLiuqinShort(map.yongQin)}`,
      body: `你问的事（比如${matter}），在这个卦里用「${formatLiuqinShort(map.yongQin)}」代表，落在${yong.label}——这是本题注意力该放的系统。`,
      note: `用神在${yong.label}${map.yongQin}`,
    });
  } else {
    lines.push({
      emoji: '💪',
      title: '核心聚焦（用神）',
      body: `本题关注「${matter}」，用神尚未落到具体爻——先写清问题再锚定「该看哪个系统」。`,
    });
  }

  if (yuan) {
    lines.push({
      emoji: '🛡️',
      title: `补给系统（元神）· ${formatLiuqinShort(yuan.liuqin)}`,
      body: yuan.changing
        ? `目前有很强的能量在${yuan.label}（${formatLiuqinShort(yuan.liuqin)}）辅助你的核心聚焦。外部环境其实对你是有利的——借力，别空等。`
        : `场上有「${formatLiuqinShort(yuan.liuqin)}」可作补给（${yuan.label}），虽未大动，仍值得借力。`,
      note: `元神在${yuan.label}${yuan.liuqin}${yuan.changing ? '发动' : ''}，生助用神`,
    });
  } else {
    lines.push({
      emoji: '🛡️',
      title: '补给系统（元神）',
      body: '未见明显补给系统。动力更多靠你自己对齐节奏、做小步验证。',
      note: '元神未现',
    });
  }

  if (ji) {
    lines.push({
      emoji: '⚠️',
      title: `耗散系统（忌神）· ${formatLiuqinShort(ji.liuqin)}`,
      body: ji.changing
        ? `底下有暗流在${ji.label}（${formatLiuqinShort(ji.liuqin)}）正在动，可能在拉走你的注意力与体感。建议先减这一层消耗，再谈大推进。`
        : `底下有暗流在${ji.label}（${formatLiuqinShort(ji.liuqin)}）悄悄拉扯——干扰未必喧哗，但会拖节奏。`,
      note: `忌神在${ji.label}${ji.liuqin}${ji.changing ? '发动' : '（静/暗处牵制）'}`,
    });
  } else {
    lines.push({
      emoji: '⚠️',
      title: '耗散系统（忌神）',
      body: '耗散系统不明显，干扰项相对少，可更专注核心聚焦本身。',
      note: '忌神未现',
    });
  }

  if (chou) {
    const yuanStrong = Boolean(yuan?.changing);
    lines.push({
      emoji: '🤝',
      title: `拉扯层（仇神）· ${formatLiuqinShort(chou.liuqin)}`,
      body: yuanStrong
        ? `虽然有干扰，但补给能量偏强，形成拉扯与拦截。结论：虽有内耗，结果仍可偏积极——先减耗散，再借补给。`
        : `拉扯层在${chou.label}（${formatLiuqinShort(chou.liuqin)}）参与博弈。建议：先减耗散干扰，再借补给推进，顺序比速度重要。`,
      note: `仇神倾向${chou.label}${chou.liuqin}（生忌神者）`,
    });
  } else {
    lines.push({
      emoji: '🤝',
      title: '拉扯层（仇神）',
      body: '拉扯层未直接落到爻上。先看耗散系统是否在暗处牵制，再决定先清干扰还是先借补给。',
      note: '仇神未直接落到爻',
    });
  }

  const focusHtml = renderEnergyFocusHtml(
    buildEnergyFocusFromDress(dressed.rows, cast.changingIndexes, dressed.palaceWx),
  );

  return `
    <section class="ly-energy-chain">
      ${focusHtml}
      <h4>【能量现状推演】</h4>
      <p class="ly-guide-tip">这里谈的是「注意力放哪」，不是谁克死谁。</p>
      ${lines
        .map(
          (l) => `
        <div class="ly-energy-chain-item">
          <p><strong>${l.emoji} ${l.title}：</strong>${l.body}</p>
          ${l.note ? `<p class="ly-classic-note">（注：传统断语为：${l.note}）</p>` : ''}
        </div>`,
        )
        .join('')}
    </section>
  `;
}

/** 动爻专属卡：原文 + 现代话 + 行动建议 */
export function renderMovingYaoCards(cast: CastResult, domain: SceneDomain): string {
  if (cast.changingIndexes.length === 0) {
    return `
      <section class="ly-move-cards">
        <h4>动爻拆解</h4>
        <p class="ly-guide-tip">本卦无动爻：格局相对稳，先把本卦场景与世应看清即可。</p>
      </section>`;
  }

  const corpus = getClassicCorpus(cast.primary.name);
  const topic =
    domain === 'career' ? '求职 / 工作' : domain === 'love' ? '感情' : '你关心的事';

  const cards = cast.changingIndexes
    .map((i) => {
      const classic = corpus?.lineClassics?.[i] ?? '';
      const gloss =
        glossLine(cast.primary.name, i) ??
        corpus?.lineNotes?.[i] ??
        '这一层正在变心——先停半步看清，再决定要不要推。';
      const label = LINE_LABELS[i]!;
      const action =
        i <= 1
          ? '根基层在动，先稳住底盘与情绪，切忌一次梭哈。'
          : i <= 3
            ? '过渡层在动，此时切忌强行突破，停下来深呼吸，看清楚再走。'
            : '结果层在动，把「想要的结果」写成可验证的一小步，而不是空想终点。';

      return `
        <article class="ly-move-card">
          <p class="ly-move-card-head">这支爻动了 · ${label}</p>
          <p class="ly-classic-note">传统辞：${classic || '（本库暂无逐爻原文）'}</p>
          <p><strong>翻译成现代话：</strong>${gloss}</p>
          <p class="ly-move-action">
            <span class="ly-move-action-mark" aria-hidden="true">「</span>
            <span class="ly-move-action-k">行动建议</span>
            <span class="ly-move-action-body">对照「${topic}」：${action}</span>
            <span class="ly-move-action-mark" aria-hidden="true">」</span>
          </p>
        </article>`;
    })
    .join('');

  return `
    <section class="ly-move-cards">
      <h4>卦爻辞拆解 · 动爻</h4>
      <div class="ly-move-cards-hex">
        ${renderHexagramSvg({
          lines: cast.primaryLines,
          shiLine: cast.shiLine,
          yingLine: cast.yingLine,
          changingIndexes: cast.changingIndexes,
          pulseChanging: true,
          showAskButtons: true,
          showTrigramLabels: true,
        })}
      </div>
      ${cards}
    </section>
  `;
}

function renderClassicLibRight(cast: CastResult): string {
  const d = resolveClassicDossier(cast.primary.name);
  const daBai = glossDaXiang(cast.primary.name) ?? d.modern;
  const body = `
    <p class="ly-guide-tip">这些是古人针对这个卦的原话。如果你觉得字眼生僻，可以直接看左侧的现代生活翻译。</p>
    ${
      d.judgment
        ? `<div class="ly-classic-block"><p class="ly-classic-zh"><span class="ly-classic-tag">《易经》卦辞</span>${d.judgment}</p>
           <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(daBai)}</p></div>`
        : ''
    }
    ${
      d.zengshan
        ? teachFold(
            '《增删卜易》摘录',
            `<p>${d.zengshan.replace(/^《增删卜易》义理摘录（教学整理）：/, '')}</p>`,
          )
        : ''
    }
  `;
  return `
    <details class="ly-classic-lib-fold" open>
      <summary>📖 古籍文献资料库（进阶）</summary>
      <div class="ly-classic-lib-body">${body}</div>
    </details>
  `;
}

function renderStudyNotesRight(): string {
  return `
    <section class="ly-study-notes">
      <h4>学习笔记</h4>
      <p class="ly-layer-guide">写下来，才真正变成你的六爻日记。</p>
      <label class="ly-study-note-field">
        <span>我的直觉感受：</span>
        <textarea class="question-input" rows="2" data-study-note="feel" placeholder="第一眼的感觉…"></textarea>
      </label>
      <label class="ly-study-note-field">
        <span>卦象中最触动我的一句话：</span>
        <textarea class="question-input" rows="2" data-study-note="touch" placeholder="左侧哪一句戳到你…"></textarea>
      </label>
      <label class="ly-study-note-field">
        <span>这事几天后 / 几周后回过头来看，我的反思是：</span>
        <textarea class="question-input" rows="2" data-study-note="reflect" placeholder="预留回看空位…"></textarea>
      </label>
    </section>
  `;
}

/** 六亲黑话对照（笔记区共用） */
export function renderDictFooter(): string {
  return `
    <section class="ly-dict-footer">
      <h4>【易学黑话翻译对照表】</h4>
      <ul class="ly-dict-footer-list">
        <li><strong>父母爻</strong> = 学历、知识、合同、长辈支持、安全基地。</li>
        <li><strong>官鬼爻</strong> = 事业目标、外部竞争、压力、社会规则。</li>
        <li><strong>妻财爻</strong> = 财务回报、资源、你自身的价值底气。</li>
        <li><strong>子孙爻</strong> = 创造力、破局、身体与放松的源泉。</li>
        <li><strong>兄弟爻</strong> = 同侪环境、盟友与竞争拉扯。</li>
      </ul>
      <p class="ly-guide-tip">提示：这些都是能量名词。遇到不会的词，随时回来看对照表。也可点下面标签展开详解。</p>
      ${renderQinDictHtml()}
    </section>
  `;
}

/** 学习模式：左推演教学 / 右笔记对照 */
export function renderLearnStudioHtml(
  cast: CastResult,
  question: string,
  castAt: Date,
): string {
  const domain = detectSceneDomain(question);
  return `
    <div class="ly-studio" data-learn-studio>
      <div class="ly-studio-left">
        <p class="ly-studio-col-label">【左侧】推演与教学区</p>
        ${renderGuaXiangCard(cast)}
        ${renderEnergyChainHtml(cast, question, castAt)}
        ${renderSpiritNarrativeForCast(cast, question, castAt)}
        ${renderMovingYaoCards(cast, domain)}
      </div>
      <div class="ly-studio-right">
        <p class="ly-studio-col-label">【右侧】笔记与对照区</p>
        ${renderClassicLibRight(cast)}
        ${renderStudyNotesRight()}
        ${renderDictFooter()}
      </div>
    </div>
  `;
}

export function bindLearnStudio(root: HTMLElement): void {
  bindQinDict(root);
}

export function collectStudyNotes(root: HTMLElement): string {
  const keys = ['feel', 'touch', 'reflect'] as const;
  const labels: Record<(typeof keys)[number], string> = {
    feel: '我的直觉感受',
    touch: '最触动我的一句话',
    reflect: '事后反思',
  };
  const parts: string[] = [];
  for (const k of keys) {
    const el = root.querySelector<HTMLTextAreaElement>(`[data-study-note="${k}"]`);
    const v = el?.value.trim() ?? '';
    if (v) parts.push(`${labels[k]}：${v}`);
  }
  return parts.join('\n');
}
