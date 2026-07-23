import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  wangXiangOf,
  wangXiangReason,
  buildYongStatusPack,
  renderYongStatusHtml,
} from './yao-strength.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';

function castSample() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('yao-strength', () => {
  it('maps month vs yao to 旺相休囚死', () => {
    expect(wangXiangOf('木', '木')).toBe('旺');
    expect(wangXiangOf('火', '木')).toBe('相'); // 令生者相
    expect(wangXiangOf('水', '木')).toBe('休'); // 生令者休
    expect(wangXiangOf('金', '木')).toBe('囚'); // 克令者囚
    expect(wangXiangOf('土', '木')).toBe('死'); // 令克者死
  });

  it('explains 旺衰 as 生克一步', () => {
    expect(wangXiangReason('水', '土')).toBe('土克水 → 死');
    expect(wangXiangReason('火', '木')).toBe('木生火 → 相');
    expect(wangXiangReason('木', '木')).toBe('同属木 → 旺');
  });

  it('builds 用神状态 pack with key lines', () => {
    const cast = castSample();
    const pack = buildYongStatusPack(cast, '这次面试能过吗', new Date('2026-07-21T10:00:00'));
    expect(pack.monthBranch.length).toBe(1);
    expect(pack.keyLines.length).toBeGreaterThan(0);
    expect(pack.keyLines.some((k) => k.roles.includes('世') || k.roles.includes('用神'))).toBe(
      true,
    );
    const html = renderYongStatusHtml(pack);
    expect(html).toMatch(/用神状态/);
    expect(html).toMatch(/ly-yong-status/);
    expect(html).toMatch(/月建|空亡/);
    expect(html).toMatch(/data-yong-why/);
    expect(html).toMatch(/看什么/);
    expect(html).toMatch(/你这例/);
    expect(html).toMatch(/data-term="yue-jian"/);
    expect(html).toMatch(/该盯的是/);
  });
});
describe('dress-archive yong status', () => {
  it('puts plate first, then 六神/六亲/能量 tabs with 用神状态 inside 能量', () => {
    const cast = castSample();
    const html = renderDressArchiveHtml(cast, new Date('2026-07-21T10:00:00'), '面试能过吗');
    expect(html).toMatch(/data-dress-lens-host/);
    expect(html).toMatch(/data-dress-lens="shen"/);
    expect(html).toMatch(/data-dress-lens="qin"/);
    expect(html).toMatch(/data-dress-lens="energy"/);
    expect(html).toMatch(/ly-xiang-rail/);
    expect(html).toMatch(/data-yong-status/);
    expect(html).toMatch(/用神状态/);
    expect(html).toMatch(/ly-spirit-nar/);
    expect(html).toMatch(/data-yao-modal/);
    expect(html).not.toMatch(/data-yao-card-slot/);
    expect(html).not.toMatch(/data-key-wangxiang/);
    expect(html).toMatch(/>旺衰</);
    const tableAt = html.indexOf('ly-dress-table');
    const energyPaneAt = html.indexOf('data-dress-lens-pane="energy"');
    const statusAt = html.indexOf('data-yong-status');
    expect(tableAt).toBeGreaterThan(-1);
    expect(energyPaneAt).toBeGreaterThan(tableAt);
    expect(statusAt).toBeGreaterThan(energyPaneAt);
  });
});
