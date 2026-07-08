import {
  DEFAULT_AI_SETTINGS,
  isAiConfigured,
  loadAiSettings,
  maskApiKey,
  saveAiSettings,
} from '../ai/settings.ts';

export function mountAiSettingsPanel(container: HTMLElement): void {
  const section = document.createElement('section');
  section.className = 'ai-settings-card';

  let settings = loadAiSettings();
  let savedKey = settings.apiKey;

  function renderStatus(): string {
    if (isAiConfigured(settings)) {
      return `<p class="ai-settings-status is-on">已启用 AI 解读 · ${escapeHtml(settings.model)}</p>`;
    }
    return `<p class="ai-settings-status">当前使用<strong>内置规则解读</strong>（非真 AI）。配置 API 后才会调用大模型。</p>`;
  }

  section.innerHTML = `
    <header class="ai-settings-header">
      <h2 class="ai-settings-title">AI 解读（可选）</h2>
      <p class="ai-settings-desc">支持 OpenAI 兼容接口。密钥保存在本机 localStorage，不会上传到我们服务器。</p>
    </header>
    <div class="ai-settings-status-wrap">${renderStatus()}</div>
    <form class="ai-settings-form" autocomplete="off">
      <label class="ai-field ai-field-toggle">
        <input type="checkbox" name="enabled" ${settings.enabled ? 'checked' : ''} />
        <span>启用 AI 解读</span>
      </label>
      <label class="ai-field">
        <span class="ai-label">API Base URL</span>
        <input type="url" name="baseUrl" class="question-input" value="${escapeAttr(settings.baseUrl)}" placeholder="https://api.openai.com/v1" />
      </label>
      <label class="ai-field">
        <span class="ai-label">API Key</span>
        <input type="password" name="apiKey" class="question-input" value="" placeholder="${savedKey ? maskApiKey(savedKey) : 'sk-...'}" autocomplete="off" />
        <span class="ai-hint">${savedKey ? `已保存 ${escapeHtml(maskApiKey(savedKey))}，留空则保持不变` : '首次填写后保存'}</span>
      </label>
      <label class="ai-field">
        <span class="ai-label">模型</span>
        <input type="text" name="model" class="question-input" value="${escapeAttr(settings.model)}" placeholder="gpt-4o-mini" />
      </label>
      <div class="ai-settings-actions">
        <button type="submit" class="btn btn-secondary btn-sm">保存配置</button>
        <button type="button" class="btn btn-ghost btn-sm" data-clear>清除密钥</button>
      </div>
      <p class="ai-save-msg" hidden></p>
    </form>
  `;

  const form = section.querySelector<HTMLFormElement>('.ai-settings-form')!;
  const statusWrap = section.querySelector('.ai-settings-status-wrap')!;
  const saveMsg = section.querySelector<HTMLParagraphElement>('.ai-save-msg')!;

  function showMsg(text: string, ok = true): void {
    saveMsg.hidden = false;
    saveMsg.textContent = text;
    saveMsg.className = ok ? 'ai-save-msg is-ok' : 'ai-save-msg is-err';
    window.setTimeout(() => {
      saveMsg.hidden = true;
    }, 3200);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const nextKey = String(fd.get('apiKey') ?? '').trim();
    settings = {
      enabled: fd.get('enabled') === 'on',
      baseUrl: String(fd.get('baseUrl') ?? DEFAULT_AI_SETTINGS.baseUrl).trim() || DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: nextKey || savedKey,
      model: String(fd.get('model') ?? DEFAULT_AI_SETTINGS.model).trim() || DEFAULT_AI_SETTINGS.model,
    };
    if (settings.enabled && !settings.apiKey.trim()) {
      showMsg('请填写 API Key，或先关闭「启用 AI 解读」', false);
      return;
    }
    saveAiSettings(settings);
    savedKey = settings.apiKey;
    (form.querySelector('[name="apiKey"]') as HTMLInputElement).value = '';
    statusWrap.innerHTML = renderStatus();
    showMsg('已保存到本机');
  });

  section.querySelector('[data-clear]')?.addEventListener('click', () => {
    settings = { ...settings, apiKey: '', enabled: false };
    savedKey = '';
    saveAiSettings(settings);
    (form.querySelector('[name="enabled"]') as HTMLInputElement).checked = false;
    (form.querySelector('[name="apiKey"]') as HTMLInputElement).value = '';
    statusWrap.innerHTML = renderStatus();
    showMsg('已清除 API Key');
  });

  container.appendChild(section);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;');
}
