import {
  backupFilename,
  buildBackupPayload,
  importBackupPayload,
  parseBackupJson,
  serializeBackup,
} from '../journal/backup.ts';

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 挂在「我的旅程」：导出 / 导入 JSON 备份 */
export function mountJourneyBackupBar(host: HTMLElement): void {
  const bar = document.createElement('section');
  bar.className = 'journey-backup-bar';
  bar.innerHTML = `
    <div class="journey-backup-copy">
      <h2>备份与恢复</h2>
      <p>导出图鉴 + 各体系占问/手札/进度/档案 + AI 设置（含 API Key）。导入按 id 合并：不同记录保留双方，同 id 保留较新；AI 设置以备份为准。请妥善保管备份文件。</p>
    </div>
    <div class="journey-backup-actions">
      <button type="button" class="btn btn-secondary btn-sm" data-export>导出 JSON</button>
      <button type="button" class="btn btn-sm" data-import>导入恢复</button>
      <input type="file" accept="application/json,.json" hidden data-file />
    </div>
    <p class="journey-backup-status" data-status hidden></p>
  `;

  const status = bar.querySelector<HTMLElement>('[data-status]')!;
  const fileInput = bar.querySelector<HTMLInputElement>('[data-file]')!;

  function setStatus(text: string, kind: 'ok' | 'err' = 'ok'): void {
    status.hidden = false;
    status.textContent = text;
    status.dataset.kind = kind;
  }

  bar.querySelector('[data-export]')?.addEventListener('click', () => {
    try {
      const backup = buildBackupPayload(localStorage, 'Mystic Lab');
      const count = Object.keys(backup.keys).length;
      downloadText(backupFilename(), serializeBackup(backup));
      setStatus(`已导出 ${count} 项数据。`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '导出失败', 'err');
    }
  });

  bar.querySelector('[data-import]')?.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const ok = window.confirm(
      '导入将按 id 与本机合并（不同记录都保留，同 id 保留较新）。AI 设置以备份为准。确定继续？',
    );
    if (!ok) {
      fileInput.value = '';
      return;
    }
    try {
      const text = await file.text();
      const backup = parseBackupJson(text);
      const result = importBackupPayload(backup, localStorage, { mode: 'merge' });
      setStatus(
        `已合并：写入 ${result.written} 项（本机独有记录已保留）。页面将刷新。`,
      );
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '导入失败', 'err');
    } finally {
      fileInput.value = '';
    }
  });

  host.appendChild(bar);
}
