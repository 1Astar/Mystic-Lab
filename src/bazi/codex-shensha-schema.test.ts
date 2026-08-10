import { describe, expect, it } from 'vitest';
import { SHENSHA_ATLAS } from './codex-atlas-catalog.ts';
import { buildCodexDossier, listHandwrittenShenshaRichIds } from './codex-dossier.ts';
import {
  buildAtlasShenshaFullText,
  isShenshaFullTextReady,
  materializeShenshaFullText,
} from './codex-shensha-schema.ts';
import { shenshaCardId } from './codex-tags.ts';

describe('shensha full-text schema', () => {
  it('天乙贵人满足查法表/落柱/使用边界', () => {
    const d = buildCodexDossier('ss:天乙贵人')!;
    expect(isShenshaFullTextReady(d)).toBe(true);
    expect(d.season).toMatch(/查法/);
    expect(d.combos.length).toBeGreaterThanOrEqual(3);
    expect(d.chartRole).toMatch(/辅助|不能脱离/);
  });

  it('未手写神煞（如学堂）由 atlas schema 推广到天乙级', () => {
    const d = buildCodexDossier('ss:学堂')!;
    expect(d).toBeTruthy();
    expect(isShenshaFullTextReady(d)).toBe(true);
    expect(d.season).toMatch(/查法|文学才华/);
    expect(d.combos.some((c) => c.note.includes('分类'))).toBe(true);
    expect(d.pillarMeaning.day).toMatch(/日柱/);
    expect(listHandwrittenShenshaRichIds()).not.toContain('ss:学堂');
  });

  it('SHENSHA_ATLAS 全部 dossier 达天乙级全文 schema', () => {
    const failed: string[] = [];
    for (const s of SHENSHA_ATLAS) {
      const d = buildCodexDossier(shenshaCardId(s.name));
      if (!d || !isShenshaFullTextReady(d)) failed.push(s.name);
    }
    expect(failed, failed.join(',')).toEqual([]);
  });

  it('全量神煞含他派差异（本产品查法+他派条目）', () => {
    for (const s of SHENSHA_ATLAS) {
      const d = buildCodexDossier(shenshaCardId(s.name))!;
      expect(d.schoolDiff?.productMethod, s.name).toMatch(/本产品/);
      expect(d.schoolDiff?.otherSchools.length, s.name).toBeGreaterThanOrEqual(2);
      expect(d.schoolDiff?.note, s.name).toMatch(/学习对照|不断语/);
    }
    const tianYi = buildCodexDossier('ss:天乙贵人')!;
    expect(tianYi.schoolDiff?.productMethod).toMatch(/日干/);
    expect(tianYi.schoolDiff?.otherSchools.some((x) => /年干/.test(x))).toBe(true);
  });

  it('atlas 推广输入含定义/查法/落柱/边界四件套', () => {
    const input = buildAtlasShenshaFullText({
      name: '天赦',
      category: '贵人类',
      gloss: '天赦日贵人 · 宽恕与解厄象。',
      tone: '吉',
    });
    expect(input.whatIs).toMatch(/天赦/);
    expect(input.lookup.lines.length).toBeGreaterThanOrEqual(3);
    expect(input.pillarMeaning.year).toMatch(/年柱/);
    const patch = materializeShenshaFullText(input);
    expect(patch.chartRole).toMatch(/辅助|不能脱离/);
    expect(patch.season).toMatch(/查法/);
  });
});
