export type CameraErrorCode = 'not-allowed' | 'not-found' | 'not-supported' | 'unknown';

export type CameraResult =
  | { ok: true; stream: MediaStream; video: HTMLVideoElement }
  | { ok: false; code: CameraErrorCode; message: string };

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async start(container?: HTMLElement): Promise<CameraResult> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        ok: false,
        code: 'not-supported',
        message: '当前浏览器不支持摄像头访问。',
      };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('webkit-playsinline', 'true');
      this.video.muted = true;
      this.video.autoplay = true;
      this.video.srcObject = this.stream;

      await this.video.play();

      if (container) {
        this.attachPreview(container);
      }

      return { ok: true, stream: this.stream, video: this.video };
    } catch (err) {
      const error = err as DOMException;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          ok: false,
          code: 'not-allowed',
          message: '摄像头权限被拒绝。请在系统设置中允许浏览器使用摄像头，或改用触控模式。',
        };
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return {
          ok: false,
          code: 'not-found',
          message: '未检测到可用摄像头。',
        };
      }
      return {
        ok: false,
        code: 'unknown',
        message: error.message || '摄像头启动失败。',
      };
    }
  }

  attachPreview(container: HTMLElement): void {
    if (!this.video) return;
    container.innerHTML = '';
    this.video.className = 'camera-preview';
    container.appendChild(this.video);
  }

  getVideo(): HTMLVideoElement | null {
    return this.video;
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  bindLifecycle(): () => void {
    const onHide = () => this.stop();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      this.stop();
    };
  }
}
