import { describe, expect, it } from 'vitest';
import { HEXAGRAMS } from './hexagrams.ts';
import { TRIGRAMS } from './trigrams.ts';
import { composeScene, renderSceneXiangHtml } from './scene-map.ts';

describe('scene-map structure', () => {
  it('composeScene exposes structured fields', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '丰')!;
    const scene = composeScene(TRIGRAMS.震, TRIGRAMS.离, hex);
    expect(scene.bridgeCue).toMatch(/「火\+雷」译成|「雷\+火」译成/);
    expect(scene.bridgeCue).toMatch(/谁在动/);
    expect(scene.careerLower).toMatch(/看见|亮相|真相/);
    expect(scene.careerUpper).toMatch(/启动|突发|面试/);
    expect(scene.love).toMatch(/\n/);
  });

  it('renderSceneXiangHtml uses tags + merged body', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '豫')!;
    const scene = composeScene(TRIGRAMS.震, TRIGRAMS.坤, hex);
    const html = renderSceneXiangHtml(scene, { domain: 'general' });
    expect(html).toMatch(/ly-scene-xiang/);
    expect(html).toMatch(/ly-scene-cue/);
    expect(html).toMatch(/ly-oracle-tags/);
    expect(html).toMatch(/ly-scene-merged/);
    expect(html).toMatch(/「雷\+地」译成/);
    expect(html).not.toMatch(/ly-scene-block-title/);
    expect(html).not.toMatch(/工作上<\/p>/);
    expect(html).toMatch(/下卦这一边/);
    expect(html).toMatch(/此刻可自问/);
  });

  it('merges work and love for career domain too', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '豫')!;
    const scene = composeScene(TRIGRAMS.震, TRIGRAMS.坤, hex);
    const html = renderSceneXiangHtml(scene, { domain: 'career' });
    expect(html).not.toMatch(/ly-scene-block-title/);
    expect(html).toMatch(/工作上像/);
    expect(html).toMatch(/感情上则像/);
  });
});
