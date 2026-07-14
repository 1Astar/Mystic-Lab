import { fetchAvailableModels, getFallbackModels } from '../ai/models.ts';
import { testAiConnection } from '../ai/llm-client.ts';
import { AI_PROVIDER_PRESETS, getProviderPreset } from '../ai/providers.ts';
import {
  DEFAULT_AI_SETTINGS,
  isAiConfigured,
  loadAiSettings,
  maskApiKey,
  saveAiSettings,
  type AiSettings,
} from '../ai/settings.ts';

export function mountAiSettingsPanel(container: HTMLElement): void {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ai-settings-trigger';
  trigger.setAttribute('aria-label', 'AI 解读配置');

  function updateTrigger(settings: AiSettings): void {
    const on = isAiConfigured(settings);
    trigger.classList.toggle('is-on', on);
    trigger.innerHTML = `
      <span class="ai-settings-trigger-dot" aria-hidden="true"></span>
      <span class="ai-settings-trigger-label">AI 解读</span>
      <span class="ai-settings-trigger-hint">${on ? `已启用 · ${escapeHtml(settings.model)}` : '可选配置'}</span>
    `;
  }

  updateTrigger(loadAiSettings());

  trigger.addEventListener('click', () => {
    openAiSettingsModal((settings) => updateTrigger(settings));
  });

  container.appendChild(trigger);
}

export function openAiSettingsModal(onSaved?: (settings: AiSettings) => void): void {
  document.querySelector('.ai-settings-modal')?.remove();

  let settings = loadAiSettings();
  let savedKey = settings.apiKey;
  let savedStarSecret = settings.starPmCaptureSecret;
  let modelOptions = getFallbackModels(settings.providerId, settings.model);
  let modelsLoading = false;
  let modelsError = '';
  let testLoading = false;
  let testResult: { ok: boolean; text: string } | null = null;

  const overlay = document.createElement('div');
  overlay.className = 'ai-settings-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'ai-settings-modal-title');

  function renderStatus(): string {
    if (isAiConfigured(settings)) {
      return `<p class="ai-settings-status is-on">已启用 AI 解读 · ${escapeHtml(settings.model)}</p>`;
    }
    return `<p class="ai-settings-status">未配置时使用<strong>内置规则解读</strong>，占问、图鉴、手札均可正常使用。</p>`;
  }

  function renderProviderChips(): string {
    return AI_PROVIDER_PRESETS.map(
      (p) => `
      <button type="button" class="ai-provider-chip ${settings.providerId === p.id ? 'is-active' : ''}" data-provider="${p.id}">
        ${escapeHtml(p.name)}
      </button>`,
    ).join('');
  }

  function renderModelField(): string {
    const options = modelOptions
      .map(
        (m) =>
          `<option value="${escapeAttr(m)}" ${m === settings.model ? 'selected' : ''}>${escapeHtml(m)}</option>`,
      )
      .join('');
    const customSelected = !modelOptions.includes(settings.model) && settings.model;
    const customOption = customSelected
      ? `<option value="${escapeAttr(settings.model)}" selected>${escapeHtml(settings.model)}（当前）</option>`
      : '';

    return `
      <label class="ai-field">
        <span class="ai-label-row">
          <span class="ai-label">模型</span>
          <button type="button" class="ai-fetch-models-btn" ${modelsLoading ? 'disabled' : ''}>
            ${modelsLoading ? '拉取中…' : '拉取模型列表'}
          </button>
        </span>
        <select name="model" class="question-input ai-model-select">
          ${customOption}${options}
        </select>
        <input type="text" name="modelCustom" class="question-input ai-model-custom" value="${escapeAttr(settings.model)}" placeholder="或手动输入模型名" />
        <span class="ai-hint">${modelsError ? escapeHtml(modelsError) : '填写 Key 后可拉取；也可直接手填模型名'}</span>
      </label>
    `;
  }

  function renderForm(): string {
    const preset = getProviderPreset(settings.providerId);
    const isCustom = settings.providerId === 'custom';

    return `
      <div class="ai-settings-status-wrap">${renderStatus()}</div>
      <form class="ai-settings-form" autocomplete="off">
        <label class="ai-field ai-field-toggle">
          <input type="checkbox" name="enabled" ${settings.enabled ? 'checked' : ''} />
          <span>启用 AI 解读（可选，不启用不影响使用）</span>
        </label>
        <div class="ai-field">
          <span class="ai-label">服务商</span>
          <div class="ai-provider-chips" role="group" aria-label="选择服务商">${renderProviderChips()}</div>
          ${preset.hint ? `<p class="ai-hint">${escapeHtml(preset.hint)}</p>` : ''}
        </div>
        <label class="ai-field">
          <span class="ai-label">API Base URL</span>
          <input type="url" name="baseUrl" class="question-input" value="${escapeAttr(settings.baseUrl)}" placeholder="https://api.openai.com/v1" ${isCustom ? '' : 'readonly'} />
        </label>
        <label class="ai-field">
          <span class="ai-label">API Key</span>
          <input type="password" name="apiKey" class="question-input" value="" placeholder="${savedKey ? maskApiKey(savedKey) : 'sk-...'}" autocomplete="off" />
          <span class="ai-hint">${savedKey ? `已保存 ${escapeHtml(maskApiKey(savedKey))}，留空则保持不变` : '密钥仅保存在本机'}</span>
        </label>
        ${renderModelField()}
        <div class="ai-field ai-starpm-block">
          <span class="ai-label">问法反馈同步到 Star PM（可选）</span>
          <input type="url" name="starPmBaseUrl" class="question-input" value="${escapeAttr(settings.starPmBaseUrl)}" placeholder="https://your-star-pm.vercel.app" />
          <input type="password" name="starPmCaptureSecret" class="question-input" value="" placeholder="${savedStarSecret ? maskApiKey(savedStarSecret) : 'IDEAS_CAPTURE_SECRET'}" autocomplete="off" />
          <span class="ai-hint">${savedStarSecret ? `已保存 ${escapeHtml(maskApiKey(savedStarSecret))}，留空保持不变。` : ''}不满意问法时写入随心而行收件箱；密钥仅本机。</span>
        </div>
        <div class="ai-settings-actions">
          <button type="submit" class="btn btn-secondary btn-sm">保存配置</button>
          <button type="button" class="btn btn-ghost btn-sm ai-test-api-btn" ${testLoading ? 'disabled' : ''}>
            ${testLoading ? '测试中…' : '测试连接'}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-clear>清除密钥</button>
        </div>
        ${testResult ? `<p class="ai-test-result ${testResult.ok ? 'is-ok' : 'is-err'}">${escapeHtml(testResult.text)}</p>` : ''}
        <p class="ai-save-msg" hidden></p>
      </form>
    `;
  }

  overlay.innerHTML = `
    <div class="ai-settings-modal-backdrop"></div>
    <div class="ai-settings-modal-card">
      <header class="ai-settings-modal-header">
        <div>
          <h2 id="ai-settings-modal-title" class="ai-settings-title">AI 解读（可选）</h2>
          <p class="ai-settings-desc">支持 OpenAI 兼容接口。不配置也能完整使用；配置后「结合你的问题」会调用大模型。</p>
        </div>
        <button type="button" class="ai-settings-modal-close" aria-label="关闭">×</button>
      </header>
      <div class="ai-settings-modal-body">${renderForm()}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const body = overlay.querySelector('.ai-settings-modal-body')!;

  function readFormSettings(form: HTMLFormElement): AiSettings {
    const fd = new FormData(form);
    const nextKey = String(fd.get('apiKey') ?? '').trim();
    const nextStarSecret = String(fd.get('starPmCaptureSecret') ?? '').trim();
    const modelFromSelect = String(fd.get('model') ?? '').trim();
    const modelFromCustom = String(fd.get('modelCustom') ?? '').trim();
    return {
      enabled: fd.get('enabled') === 'on',
      providerId: settings.providerId,
      baseUrl: String(fd.get('baseUrl') ?? DEFAULT_AI_SETTINGS.baseUrl).trim() || DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: nextKey || savedKey,
      model: modelFromCustom || modelFromSelect || DEFAULT_AI_SETTINGS.model,
      starPmBaseUrl: String(fd.get('starPmBaseUrl') ?? '').trim(),
      starPmCaptureSecret: nextStarSecret || savedStarSecret,
    };
  }

  function refreshForm(): void {
    body.innerHTML = renderForm();
    wireForm();
  }

  async function loadModels(): Promise<void> {
    const form = body.querySelector<HTMLFormElement>('.ai-settings-form');
    if (!form) return;

    const fd = new FormData(form);
    const key = String(fd.get('apiKey') ?? '').trim() || savedKey;
    const baseUrl = String(fd.get('baseUrl') ?? settings.baseUrl).trim();

    modelsLoading = true;
    modelsError = '';
    refreshForm();

    try {
      modelOptions = await fetchAvailableModels(baseUrl, key, settings.providerId);
      const select = body.querySelector<HTMLSelectElement>('[name="model"]');
      const current = select?.value || settings.model;
      if (current && modelOptions.includes(current)) {
        settings.model = current;
      } else if (!modelOptions.includes(settings.model)) {
        settings.model = modelOptions[0] ?? settings.model;
      }
      modelsError = '';
    } catch (err) {
      modelOptions = getFallbackModels(settings.providerId, settings.model);
      modelsError = err instanceof Error ? err.message : '拉取失败，已显示预设模型';
    } finally {
      modelsLoading = false;
      refreshForm();
    }
  }

  async function runApiTest(): Promise<void> {
    const form = body.querySelector<HTMLFormElement>('.ai-settings-form');
    if (!form) return;

    const draft = readFormSettings(form);
    if (!draft.apiKey.trim()) {
      testResult = { ok: false, text: '请先填写 API Key' };
      refreshForm();
      return;
    }

    testLoading = true;
    testResult = null;
    refreshForm();

    try {
      const preview = await testAiConnection(draft);
      testResult = { ok: true, text: `连接成功 · 模型 ${draft.model} · 回复：${preview}` };
    } catch (err) {
      testResult = {
        ok: false,
        text: err instanceof Error ? err.message : '连接失败，请检查 URL、Key 与模型名',
      };
    } finally {
      testLoading = false;
      refreshForm();
    }
  }

  function wireForm(): void {
    const form = body.querySelector<HTMLFormElement>('.ai-settings-form')!;
    const statusWrap = body.querySelector('.ai-settings-status-wrap')!;
    const saveMsg = body.querySelector<HTMLParagraphElement>('.ai-save-msg')!;
    const modelSelect = form.querySelector<HTMLSelectElement>('[name="model"]');
    const modelCustom = form.querySelector<HTMLInputElement>('[name="modelCustom"]');

    modelSelect?.addEventListener('change', () => {
      if (modelCustom && modelSelect.value) {
        modelCustom.value = modelSelect.value;
      }
    });

    modelCustom?.addEventListener('input', () => {
      settings.model = modelCustom.value.trim();
    });

    body.querySelectorAll<HTMLButtonElement>('.ai-provider-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.provider ?? 'openai';
        const preset = getProviderPreset(id);
        settings.providerId = id;
        if (id !== 'custom') {
          settings.baseUrl = preset.baseUrl;
          if (preset.defaultModel) settings.model = preset.defaultModel;
        }
        modelOptions = getFallbackModels(id, settings.model);
        modelsError = '';
        refreshForm();
      });
    });

    form.querySelector('[name="baseUrl"]')?.addEventListener('input', (e) => {
      if (settings.providerId !== 'custom') return;
      settings.baseUrl = (e.target as HTMLInputElement).value.trim();
    });

    body.querySelector('.ai-fetch-models-btn')?.addEventListener('click', () => {
      void loadModels();
    });

    body.querySelector('.ai-test-api-btn')?.addEventListener('click', () => {
      void runApiTest();
    });

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
      settings = readFormSettings(form);
      if (settings.enabled && !settings.apiKey.trim()) {
        showMsg('请填写 API Key，或先关闭「启用 AI 解读」', false);
        return;
      }
      saveAiSettings(settings);
      savedKey = settings.apiKey;
      savedStarSecret = settings.starPmCaptureSecret;
      (form.querySelector('[name="apiKey"]') as HTMLInputElement).value = '';
      const starSecretInput = form.querySelector('[name="starPmCaptureSecret"]') as HTMLInputElement | null;
      if (starSecretInput) starSecretInput.value = '';
      statusWrap.innerHTML = renderStatus();
      showMsg('已保存到本机');
      onSaved?.(settings);
    });

    body.querySelector('[data-clear]')?.addEventListener('click', () => {
      settings = { ...DEFAULT_AI_SETTINGS };
      savedKey = '';
      savedStarSecret = '';
      modelOptions = getFallbackModels(settings.providerId);
      modelsError = '';
      testResult = null;
      saveAiSettings(settings);
      refreshForm();
      onSaved?.(settings);
    });
  }

  wireForm();

  const close = (): void => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 280);
  };

  overlay.querySelector('.ai-settings-modal-close')?.addEventListener('click', close);
  overlay.querySelector('.ai-settings-modal-backdrop')?.addEventListener('click', close);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);
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
