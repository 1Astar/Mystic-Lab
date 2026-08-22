import type { QuestionTheme } from '../codex/collection.ts';
import { detectQuestionTheme } from '../codex/collection.ts';
import type { QuestionPattern } from './question-coach.ts';
import { analyzeQuestion } from './question-coach.ts';
import type { SpreadType } from './spreads.ts';

export type SpreadRecommendation = {
  spreadType: SpreadType;
  /** 为何推荐此牌阵（展示给用户） */
  reason: string;
  /** 自定义牌阵张数（仅 custom） */
  customCount?: number;
  /** 自定义位次名（仅 custom） */
  customLabels?: string[];
};

function familySubject(q: string): string {
  if (/我爸|父亲|爸爸/.test(q)) return '你父亲';
  if (/我妈|母亲|妈妈/.test(q)) return '你母亲';
  if (/他/.test(q)) return '他';
  if (/她/.test(q)) return '她';
  return '家人';
}

/**
 * 根据问句与识别到的模式，推荐牌阵（用户仍可改选）。
 */
export function recommendSpread(
  question: string,
  pattern?: QuestionPattern,
  topic?: QuestionTheme,
): SpreadRecommendation {
  const q = question.trim();
  const coach = pattern ? null : analyzeQuestion(q);
  const pat = pattern ?? coach?.pattern ?? 'open';
  const th = topic ?? coach?.topic ?? detectQuestionTheme(q);

  switch (pat) {
    case 'family_action_outcome':
      return {
        spreadType: 'past-present-future',
        reason: `问「${familySubject(q)}会做什么、有什么后果」适合用过去·现在·未来，串起行为轨迹与可能走势。`,
      };

    case 'family_motive':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: `问家人动机适合「情况·阻碍·建议」：先看${familySubject(q)}的状态与卡点，再谈你能守住什么边界。`,
      };

    case 'family_general':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '家庭议题适合先看清局面、阻碍与你能调整的部分，再决定下一步。',
      };

    case 'love_likes':
    case 'love_return':
    case 'love_contact':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '感情类问题适合「情况·阻碍·建议」，先看联结与卡点，再看你能怎么调整。',
      };

    case 'love_third':
      return {
        spreadType: 'five-lens',
        reason: '关系里含第三者/不确定时，五镜阵能多看一层外在影响与可能走向。',
      };

    case 'interview':
    case 'offer':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '求职/机会类问题适合先看局面、卡点与可行动作。',
      };

    case 'job_search':
    case 'quit':
    case 'promotion':
    case 'team_conflict':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '职场议题适合「情况·阻碍·建议」，先结构再行动。',
      };

    case 'study_exam':
      return {
        spreadType: 'single',
        reason: '备考阶段单张牌足够聚焦当下心态与最需要抓住的重点。',
      };

    case 'study_path':
      return {
        spreadType: 'past-present-future',
        reason: '学业路径选择适合用时间线看清来路与可能延伸方向。',
      };

    case 'money':
    case 'move_city':
    case 'anxiety_decide':
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '抉择类问题适合先看局面、风险/阻碍，再收束到可执行建议。',
      };

    case 'generic_closed':
      if (/后果|未来|接下来|会怎样|做什么/.test(q)) {
        return {
          spreadType: 'past-present-future',
          reason: '你在追问走势与后果，三张时间线比单点答案更容易串成故事。',
        };
      }
      if (/为什么|为何|动机|原因/.test(q)) {
        return {
          spreadType: 'situation-obstacle-advice',
          reason: '你在追问原因，先看局面与阻碍往往比直接要「是或否」更有用。',
        };
      }
      return {
        spreadType: 'situation-obstacle-advice',
        reason: '封闭式问题也能占；此牌阵帮你看清结构，再决定要不要换开放式角度。',
      };

    default:
      if (th === 'love' || th === 'work') {
        return {
          spreadType: 'situation-obstacle-advice',
          reason: '开放式问题适合先看清局面结构，再谈下一步怎么调整。',
        };
      }
      return {
        spreadType: 'past-present-future',
        reason: '默认推荐三张牌：帮你看清事情如何走到这里、当下力量与可能延伸。',
      };
  }
}
