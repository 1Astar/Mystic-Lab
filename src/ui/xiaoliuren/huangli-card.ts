import type { HuangliBrief } from '../../xiaoliuren/huangli.ts';



function joinActivities(items: string[]): string {

  const cleaned = items.filter((item) => item !== '无' && item !== '诸事不宜' && item !== '诸事不忌');

  return cleaned.length > 0 ? cleaned.join('、') : '—';

}



/** 提问页 · 今日黄历精简子卡（纯排版，不用整图素材） */

export function renderHuangliMiniCard(brief: HuangliBrief): string {

  return `

    <aside class="xlr-subcard xlr-huangli-mini xlr-stagger-item" style="--si:6" aria-label="今日黄历">

      <h3 class="xlr-subcard-title">今日黄历</h3>

      <dl class="xlr-huangli-lines">

        <div class="xlr-huangli-line xlr-huangli-line--yi">

          <dt>宜</dt>

          <dd>${brief.yiPreview}</dd>

        </div>

        <div class="xlr-huangli-line xlr-huangli-line--ji">

          <dt>忌</dt>

          <dd>${brief.jiPreview}</dd>

        </div>

        <div class="xlr-huangli-line">

          <dt>五行</dt>

          <dd>${brief.wuxingShort}</dd>

        </div>

      </dl>

      <p class="xlr-huangli-note">${brief.mood}</p>

      <button type="button" class="xlr-huangli-link" data-huangli-expand>展开完整黄历</button>

    </aside>

  `;

}



export function renderHuangliDrawer(brief: HuangliBrief, open: boolean): string {

  return `

    <div class="xlr-huangli-drawer${open ? ' is-open' : ''}" ${open ? '' : 'hidden'} aria-hidden="${open ? 'false' : 'true'}">

      <button type="button" class="xlr-huangli-drawer-backdrop" data-huangli-close aria-label="关闭黄历"></button>

      <div class="xlr-huangli-drawer-panel" role="dialog" aria-labelledby="xlr-huangli-drawer-title">

        <header class="xlr-huangli-drawer-head">

          <h2 id="xlr-huangli-drawer-title">今日黄历</h2>

          <button type="button" class="xlr-huangli-drawer-close" data-huangli-close aria-label="关闭">×</button>

        </header>

        <div class="xlr-huangli-drawer-body">

          <section class="xlr-huangli-section">

            <h3>今日概览</h3>

            <dl class="xlr-huangli-kv">

              <div><dt>公历</dt><dd>${brief.solarLabel}</dd></div>

              <div><dt>农历</dt><dd>${brief.lunarLabel}</dd></div>

              <div><dt>星期</dt><dd>${brief.weekdayLabel}</dd></div>

              <div><dt>时辰</dt><dd>${brief.hourLabel}</dd></div>

            </dl>

          </section>

          <section class="xlr-huangli-section">

            <h3>宜忌</h3>

            <dl class="xlr-huangli-kv">

              <div class="xlr-huangli-yi"><dt>宜</dt><dd>${joinActivities(brief.yi)}</dd></div>

              <div class="xlr-huangli-ji"><dt>忌</dt><dd>${joinActivities(brief.ji)}</dd></div>

            </dl>

          </section>

          <section class="xlr-huangli-section">

            <h3>今日气象</h3>

            <p class="xlr-huangli-mood">${brief.mood}</p>

          </section>

          <section class="xlr-huangli-section">

            <h3>五行 · 冲煞</h3>

            <dl class="xlr-huangli-kv">

              <div><dt>五行</dt><dd>${brief.wuxingNayin}</dd></div>

              <div><dt>冲煞</dt><dd>${brief.chongsha}</dd></div>

            </dl>

          </section>

        </div>

      </div>

    </div>

  `;

}



export function mountHuangliInteractions(

  root: HTMLElement,

  onToggle: (open: boolean) => void,

): void {

  root.querySelector('[data-huangli-expand]')?.addEventListener('click', () => onToggle(true));

  root.querySelectorAll('[data-huangli-close]').forEach((el) => {

    el.addEventListener('click', () => onToggle(false));

  });

}

