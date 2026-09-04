import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from '../liuyao/engine.ts';
import { HEXAGRAMS, linesFromHexagram } from '../liuyao/hexagrams.ts';
import { buildOfflineAnswerPack } from './build-pack.ts';
import { buildScriptPlay } from './script-play.ts';
import {
  buildInstantDirectAnswer,
  buildPlainDirectAnswer,
  headlineLooksGeneric,
  routeQuestion,
} from './instant-answer.ts';
import { renderAnswerPackHtml } from './render-pack.ts';
import { buildQuestionThread } from '../interpretation/question-thread.ts';
import type { CardReading } from '../interpretation/types.ts';

/** 坤为地 → 山水蒙（与用户备份一致：二爻、上爻动） */
function castKunToMeng() {
  const kun = HEXAGRAMS.find((h) => h.name === '坤')!;
  const lines = linesFromHexagram(kun);
  const throws = lines.map((bit, i) => {
    const changing = i === 1 || i === 5;
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

const POLICE_Q = '报了警之后事情都走向会怎么样？';
const FAMILY_Q = '我爸威胁我妈这件事最终会怎么解决？或者怎么解决比较好？';

describe('instant-answer', () => {
  it('routes police report question to legal_after_report', () => {
    expect(routeQuestion(POLICE_Q)).toBe('legal_after_report');
  });

  it('answers police report in plain language without 用神 jargon', () => {
    const cast = castKunToMeng();
    expect(cast.primary.name).toBe('坤');
    expect(cast.changed?.name).toBe('蒙');

    const answer = buildInstantDirectAnswer({ question: POLICE_Q, cast });
    expect(answer).toMatch(/报警之后/);
    expect(answer).toMatch(/受理/);
    expect(answer).not.toMatch(/用神/);
    expect(answer).not.toMatch(/承载.*启蒙.*偏「/);
    expect(headlineLooksGeneric(answer)).toBe(false);
  });

  it('pack pins directAnswer once — no duplicate 一句话结论 / 核心方向 body', () => {
    const cast = castKunToMeng();
    const pack = buildOfflineAnswerPack({ question: POLICE_Q, cast });
    expect(pack.directAnswer).toBeTruthy();
    expect(pack.directAnswer).toMatch(/报警之后/);
    expect(pack.verdict.headline).toMatch(/报警之后/);
    expect(pack.script?.headline).toMatch(/报警之后/);
    expect(headlineLooksGeneric(pack.verdict.headline)).toBe(false);

    /** 六爻结果页：hero 已钉，正文不再重复 */
    const htmlPinned = renderAnswerPackHtml(pack, {
      cast,
      question: POLICE_Q,
      answerAlreadyPinned: true,
    });
    expect(htmlPinned).not.toMatch(/一句话结论/);
    expect(htmlPinned).not.toMatch(/data-instant-verdict/);
    const coreBlock =
      htmlPinned.split('data-layer="core"')[1]?.split('data-layer=')[0] ?? '';
    expect(coreBlock).not.toMatch(/报警之后，事情会走/);

    /** 无 hero 时：只在「对你这个问题」出现一次 */
    const htmlOnce = renderAnswerPackHtml(pack, { cast, question: POLICE_Q });
    expect(htmlOnce).not.toMatch(/一句话结论/);
    expect(htmlOnce).toMatch(/对你这个问题/);
    const matches = htmlOnce.match(/报警之后，事情会走/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('family dispute avoids 愉悦/过重 template lean on slices', () => {
    const cast = castKunToMeng();
    const pack = buildOfflineAnswerPack({ question: FAMILY_Q, cast });
    expect(pack.intents[0]?.id).toBe('family_dispute');
    expect(pack.directAnswer).toMatch(/家事|安全|证据/);
    for (const a of pack.answers) {
      expect(a.lean).not.toMatch(/本题核心宜用「愉悦」/);
      expect(a.lean).not.toMatch(/本题核心宜用「过重」/);
    }
  });

  it('truth fold uses human language for police question', () => {
    const cast = castKunToMeng();
    const play = buildScriptPlay({ question: POLICE_Q, cast });
    const truth = play.beats.find((b) => b.id === 'truth')?.body ?? '';
    expect(truth).toMatch(/报警|受理|书面/);
    expect(truth).not.toMatch(/用神偏「/);
    expect(truth).not.toMatch(/本题用神/);
  });

  it('buildPlainDirectAnswer works without cast (tarot/xiaoliuren path)', () => {
    const plain = buildPlainDirectAnswer(POLICE_Q);
    expect(plain).toMatch(/报警之后/);
    expect(plain).not.toMatch(/用神/);
  });

  it('tarot thread pins direct answer for family question', () => {
    const cards = [
      {
        cardId: 'major_16',
        cardName: '塔',
        keywords: ['突变', '震荡'],
        orientation: 'upright',
        topic: 'love',
        spreadType: 'three_card',
        position: '情况',
        positionMeaning: '现状',
        selectedCard: {
          deckId: 'rws',
          arcana: 'major',
          oneSentence: '突变',
          uprightMeaning: '突变',
        },
        interpretationLayers: { standard: { oneSentence: '突变' } },
      },
    ] as unknown as CardReading[];
    const thread = buildQuestionThread(cards, FAMILY_Q, 'mock');
    expect(thread?.synthesis).toMatch(/家事|安全|证据/);
    expect(thread?.synthesis).not.toMatch(/先抓住方向/);
  });
});
