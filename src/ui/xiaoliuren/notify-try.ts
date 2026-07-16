import {
  getBrowserNotifyPermission,
  isBrowserNotifySupported,
  tryDemoBrowserNotification,
} from '../../xiaoliuren/browser-notify.ts';

/** 小六壬首页：试用浏览器通知（便于立刻看到系统弹窗） */
export function mountNotifyTryControl(host: HTMLElement): void {
  host.querySelector('.xlr-notify-try')?.remove();

  const box = document.createElement('div');
  box.className = 'xlr-notify-try';

  if (!isBrowserNotifySupported()) {
    box.innerHTML = `<p class="xlr-notify-try-note">当前浏览器不支持系统通知。</p>`;
    host.appendChild(box);
    return;
  }

  const perm = getBrowserNotifyPermission();
  const status =
    perm === 'granted' ? '已允许' : perm === 'denied' ? '已拒绝（可在浏览器设置里改）' : '尚未授权';

  box.innerHTML = `
    <button type="button" class="btn btn-ghost btn-sm xlr-notify-try-btn">试用浏览器通知</button>
    <p class="xlr-notify-try-note">权限：${status} · 点一下可立刻看到系统弹窗（不是短信推送）</p>
  `;

  const note = box.querySelector('.xlr-notify-try-note')!;
  box.querySelector('button')?.addEventListener('click', () => {
    void tryDemoBrowserNotification().then((result) => {
      if (result === 'shown') {
        note.textContent = '权限：已允许 · 若没看到弹窗，检查系统勿扰 / 浏览器通知开关';
      } else if (result === 'denied') {
        note.textContent = '权限：已拒绝 · 可在地址栏锁图标里重新允许通知';
      } else {
        note.textContent = '当前环境不支持系统通知';
      }
    });
  });

  host.appendChild(box);
}
