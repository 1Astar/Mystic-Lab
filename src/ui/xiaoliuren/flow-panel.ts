/** 设计稿统一面板：章节标题（不显示 01–06 编号） */
export type FlowPanelMeta = {
  num?: string;
  section: string;
  title: string;
};

export function renderFlowKicker(meta: FlowPanelMeta): string {
  return `<p class="xlr-flow-kicker">${meta.section} · ${meta.title}</p>`;
}

export function renderFlowPanel(
  meta: FlowPanelMeta,
  body: string,
  extraClass = '',
): string {
  return `
    <div class="xlr-flow-panel xlr-stagger-root ${extraClass}">
      <p class="xlr-flow-kicker xlr-stagger-item" style="--si:1">${meta.section} · ${meta.title}</p>
      <div class="xlr-flow-body">${body}</div>
    </div>
  `;
}
