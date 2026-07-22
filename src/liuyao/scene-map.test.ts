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

  it('renderSceneXiangHtml is block-structured', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '豫')!;
    const scene = composeScene(TRIGRAMS.震, TRIGRAMS.坤, hex);
    const html = renderSceneXiangHtml(scene, { domain: 'general' });
    expect(html).toMatch(/ly-scene-xiang/);
    expect(html).toMatch(/ly-scene-cue/);
    expect(html).toMatch(/「雷\+地」译成/);
    expect(html).not.toMatch(/别停在/);
    expect(html).not.toMatch(/还没写下具体问题/);
    expect(html).toMatch(/工作上/);
    expect(html).toMatch(/感情上/);
    expect(html).toMatch(/下卦（你这边）/);
    expect(html).toMatch(/上卦（关系场\/对方）/);
    expect(html).toMatch(/自问：/);
  });

  it('always shows both 工作上 and 感情上 even for career domain', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '豫')!;
    const scene = composeScene(TRIGRAMS.震, TRIGRAMS.坤, hex);
    const html = renderSceneXiangHtml(scene, { domain: 'career' });
    expect(html).toMatch(/工作上/);
    expect(html).toMatch(/感情上/);
    expect(html.indexOf('工作上')).toBeLessThan(html.indexOf('感情上'));
  });
});
