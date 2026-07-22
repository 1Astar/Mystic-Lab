import { isAiConfigured, loadAiSettings, type AiSettings } from '../ai/settings.ts';
import type {
  ChoiceBranch,
  ChoiceSimulation,
  FiveYearArchive,
  LifeForecast,
  LifePortrait,
  LifeProfileInput,
  ParallelWorld,
} from './types.ts';
import { buildTemplateForecast } from './forecast-templates.ts';
import { buildTemplateSimulation } from './simulate-templates.ts';
import { buildTemplateArchive, buildTemplatePortrait } from './templates.ts';

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fence ? fence[1].trim() : trimmed;
}

function parseJsonObject(raw: string): unknown {
  const text = stripFence(raw);
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('AI 返回不是合法 JSON');
    return JSON.parse(text.slice(start, end + 1));
  }
}

function asStringList(value: unknown, max = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? '').trim())
    .filter((s) => s.length >= 2)
    .slice(0, max);
}

export function parsePortraitResponse(raw: string): Omit<LifePortrait, 'source' | 'generatedAt'> {
  const obj = parseJsonObject(raw) as Record<string, unknown>;
  const tendencies = asStringList(obj.tendencies, 4);
  const themes = asStringList(obj.themes, 4);
  const stageHints = asStringList(obj.stageHints, 4);
  const stageTitle = String(obj.stageTitle ?? '').trim();
  const stageSummary = String(obj.stageSummary ?? '').trim();
  if (tendencies.length < 2) throw new Error('画像缺少性格倾向');
  if (!stageTitle || stageSummary.length < 8) throw new Error('画像缺少人生阶段');
  return {
    tendencies,
    themes: themes.length > 0 ? themes : ['自我对照', '节奏重塑'],
    stageTitle,
    stageSummary,
    stageHints:
      stageHints.length > 0
        ? stageHints
        : ['用一周记录触发时刻', '做一次低成本对照实验'],
  };
}

export function parseArchiveResponse(raw: string): Omit<FiveYearArchive, 'source'> {
  const obj = parseJsonObject(raw) as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const summary = String(obj.summary ?? '').trim();
  const work = String(obj.work ?? '').trim();
  const lifestyle = String(obj.lifestyle ?? '').trim();
  const relationships = String(obj.relationships ?? '').trim();
  const growth = String(obj.growth ?? '').trim();
  const tone = String(obj.tone ?? '').trim() || '对照 · 可回看';
  if (!title || summary.length < 8) throw new Error('五年档案不完整');
  return {
    title,
    summary,
    work: work || '工作形态随分叉改写。',
    lifestyle: lifestyle || '生活节奏重新编排。',
    relationships: relationships || '关系圈按新选择重组。',
    growth: growth || '更清楚什么是想要的、什么是惯性。',
    tone,
  };
}

function profileBlock(profile: LifeProfileInput): string {
  return [
    `年龄：${profile.age.trim() || '未填'}`,
    `职业：${profile.occupation.trim() || '未填'}`,
    `城市：${profile.city.trim() || '未填'}`,
    `出生：${[profile.birthYear, profile.birthMonth, profile.birthDay].filter(Boolean).join('-') || '未填'} ${profile.birthHour.trim()}`.trim(),
    `出生地：${profile.birthPlace.trim() || '未填'}`,
    `当前困惑：${profile.confusion.trim() || '未填'}`,
  ].join('\n');
}

async function chatJson(
  system: string,
  user: string,
  settings: AiSettings,
): Promise<string> {
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI 请求失败 (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ''}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('AI 返回为空');
  return text;
}

const PORTRAIT_SYSTEM =
  '你是人生探索叙事助手，不是算命师。结合用户填写信息做「现状推演」与性格倾向描述。禁止断言命运、吉凶、必准日期。只用「倾向 / 阶段 / 可对照假设」。只输出合法 JSON，不要 markdown。';

export async function generatePortrait(
  profile: LifeProfileInput,
  options?: { settings?: AiSettings; preferAi?: boolean },
): Promise<LifePortrait> {
  const settings = options?.settings ?? loadAiSettings();
  const preferAi = options?.preferAi ?? true;
  if (preferAi && isAiConfigured(settings)) {
    try {
      const raw = await chatJson(
        PORTRAIT_SYSTEM,
        [
          '根据以下现实信息，生成轻画像与当前人生阶段推演。',
          'JSON 格式：',
          '{"tendencies":["...","..."],"themes":["...","..."],"stageTitle":"...","stageSummary":"...","stageHints":["...","..."]}',
          '要求：中文；tendencies 3条；themes 2-3条；stageSummary 80-160字，必须引用用户已填的职业/城市/困惑（若有）；stageHints 2-3条可执行小实验。',
          '',
          profileBlock(profile),
        ].join('\n'),
        settings,
      );
      const parsed = parsePortraitResponse(raw);
      return {
        ...parsed,
        source: 'ai',
        generatedAt: new Date().toISOString(),
      };
    } catch {
      /* fall through to template */
    }
  }
  return buildTemplatePortrait(profile);
}

const ARCHIVE_SYSTEM =
  '你是平行人生叙事助手。基于「现在的我」与一条人生分叉，写五年后的探索档案。禁止宿命断语与「一定会」。只输出合法 JSON。';

export async function generateArchives(
  profile: LifeProfileInput,
  worlds: ParallelWorld[],
  options?: { settings?: AiSettings; preferAi?: boolean },
): Promise<ParallelWorld[]> {
  const settings = options?.settings ?? loadAiSettings();
  const preferAi = options?.preferAi ?? true;
  const selected = worlds.filter((w) => w.selected && w.divergence.trim());
  const results: ParallelWorld[] = worlds.map((w) => ({ ...w }));

  for (const world of selected) {
    const idx = results.findIndex((w) => w.id === world.id);
    if (idx < 0) continue;

    if (preferAi && isAiConfigured(settings)) {
      try {
        const raw = await chatJson(
          ARCHIVE_SYSTEM,
          [
            '为这条平行分叉写「五年后人生档案」。',
            'JSON：{"title":"...","summary":"...","work":"...","lifestyle":"...","relationships":"...","growth":"...","tone":"..."}',
            '要求：中文；summary 80-140字；各字段一句到两句；tone 用「词 · 词」；结合用户现状，对照分叉差异。',
            '',
            '现在的我：',
            profileBlock(profile),
            '',
            `分叉：${world.label} — ${world.divergence}`,
          ].join('\n'),
          settings,
        );
        const parsed = parseArchiveResponse(raw);
        results[idx] = {
          ...results[idx]!,
          archive: { ...parsed, source: 'ai' },
        };
        continue;
      } catch {
        /* template fallback */
      }
    }

    results[idx] = {
      ...results[idx]!,
      archive: buildTemplateArchive(profile, world),
    };
  }

  return results;
}

export function parseSimulationResponse(
  raw: string,
  fallbackQuestion: string,
): Omit<ChoiceSimulation, 'source' | 'generatedAt' | 'selectedBranchId'> {
  const obj = parseJsonObject(raw) as Record<string, unknown>;
  const question = String(obj.question ?? fallbackQuestion).trim() || fallbackQuestion;
  const horizonLabel = String(obj.horizonLabel ?? '').trim();
  if (!horizonLabel) throw new Error('缺少时间视界');

  const branchesRaw = Array.isArray(obj.branches) ? obj.branches : [];
  const branches: ChoiceBranch[] = [];
  const labels = ['选择 A', '选择 B', '选择 C', '选择 D'];
  for (let i = 0; i < branchesRaw.length && branches.length < 4; i += 1) {
    const row = branchesRaw[i];
    if (!row || typeof row !== 'object') continue;
    const b = row as Record<string, unknown>;
    const title = String(b.title ?? '').trim();
    const trajectory = asStringList(b.trajectory, 5);
    const note = String(b.note ?? '').trim();
    if (!title || trajectory.length < 2) continue;
    branches.push({
      id: String(b.id ?? '').trim() || String.fromCharCode(97 + branches.length),
      label: String(b.label ?? '').trim() || labels[branches.length] || `选择 ${branches.length + 1}`,
      title,
      trajectory,
      note: note || '对照这条轨迹是否贴近你真正在意的东西。',
    });
  }
  if (branches.length < 2) throw new Error('至少需要 2 条选择轨迹');
  return { question, horizonLabel, branches };
}

const SIMULATE_SYSTEM =
  '你是人生选择对照助手，不是算命师。针对用户决策问题，给出 3 条可并行对照的可能轨迹。禁止断言哪条更好、禁止必准日期。只用「可能轨迹 / 值得观察」。只输出合法 JSON。';

export async function generateSimulation(
  question: string,
  profile: LifeProfileInput,
  options?: { settings?: AiSettings; preferAi?: boolean },
): Promise<ChoiceSimulation> {
  const settings = options?.settings ?? loadAiSettings();
  const preferAi = options?.preferAi ?? true;
  const q = question.trim() || profile.confusion.trim() || '下一步怎么选？';

  if (preferAi && isAiConfigured(settings)) {
    try {
      const raw = await chatJson(
        SIMULATE_SYSTEM,
        [
          '根据决策问题与用户现状，生成选择模拟。',
          'JSON：{"question":"...","horizonLabel":"2026年8月","branches":[{"id":"a","label":"选择 A","title":"...","trajectory":["...","...","..."],"note":"..."}]}',
          '要求：中文；恰好 3 条 branches；trajectory 3 个短节点（箭头式推进）；note 一句提醒；horizonLabel 用「YYYY年M月」表示推演起点月；结合职业/城市/困惑。',
          '',
          `决策问题：${q}`,
          '',
          '现在的我：',
          profileBlock(profile),
        ].join('\n'),
        settings,
      );
      const parsed = parseSimulationResponse(raw, q);
      return {
        ...parsed,
        source: 'ai',
        generatedAt: new Date().toISOString(),
      };
    } catch {
      /* template fallback */
    }
  }

  return buildTemplateSimulation(q, profile);
}

export function parseForecastResponse(
  raw: string,
  fallbackQuestion: string,
  fallbackContext: string,
): Pick<LifeForecast, 'question' | 'context' | 'prediction' | 'rationale' | 'checkBy'> {
  const obj = parseJsonObject(raw) as Record<string, unknown>;
  const question = String(obj.question ?? fallbackQuestion).trim() || fallbackQuestion;
  const context = String(obj.context ?? fallbackContext).trim() || fallbackContext;
  const prediction = String(obj.prediction ?? '').trim();
  const rationale = String(obj.rationale ?? '').trim();
  const checkBy = String(obj.checkBy ?? '').trim();
  if (prediction.length < 8) throw new Error('缺少预测内容');
  if (rationale.length < 8) throw new Error('缺少依据');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkBy)) throw new Error('复查日期格式应为 YYYY-MM-DD');
  return { question, context, prediction, rationale, checkBy };
}

const FORECAST_SYSTEM =
  '你是人生对照助手，不是算命师。针对用户猜测题，给出可日后打卡的「预测假设」与「依据」。禁止必准、禁止宿命断语。checkBy 用 YYYY-MM-DD。只输出合法 JSON。';

export async function generateForecast(
  question: string,
  context: string,
  profile: LifeProfileInput,
  options?: { settings?: AiSettings; preferAi?: boolean },
): Promise<Omit<LifeForecast, 'id' | 'result' | 'reflection' | 'checkedAt'>> {
  const settings = options?.settings ?? loadAiSettings();
  const preferAi = options?.preferAi ?? true;
  const q = question.trim() || '接下来会发生什么？';
  const ctx = context.trim() || profile.confusion.trim() || '未补充更多现实细节';

  if (preferAi && isAiConfigured(settings)) {
    try {
      const raw = await chatJson(
        FORECAST_SYSTEM,
        [
          '根据猜测题与现实信息，生成一条可打卡的预测假设。',
          'JSON：{"question":"...","context":"...","prediction":"...","rationale":"...","checkBy":"2026-08-20"}',
          '要求：中文；prediction 2-4句假设；rationale 必须写清依据，并提示用户如何对照；checkBy 合理（今天类1-3天，工作/买房类更长）；不要写「一定会」。',
          '',
          `猜测题：${q}`,
          `现实补充：${ctx}`,
          '',
          '现在的我：',
          profileBlock(profile),
        ].join('\n'),
        settings,
      );
      const parsed = parseForecastResponse(raw, q, ctx);
      return {
        ...parsed,
        source: 'ai',
        createdAt: new Date().toISOString(),
      };
    } catch {
      /* template fallback */
    }
  }

  return buildTemplateForecast(q, ctx, profile);
}
