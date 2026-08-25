/** 图鉴海报在 CF Pages 上的展示尺寸（源图多为 3:4 竖版 webp） */
export type ZiweiArtSize = 'thumb' | 'stack' | 'hero' | 'full';

const SIZE_PARAMS: Record<Exclude<ZiweiArtSize, 'full'>, string> = {
  /** 列表/journey 缩略图（CSS ~44–48px，2x 屏） */
  thumb: 'width=160,quality=82,format=webp',
  /** 格局叠放成员星（更小） */
  stack: 'width=96,quality=80,format=webp',
  /** 详情页 hero（CSS max ~300px，2x 屏） */
  hero: 'width=640,quality=85,format=webp',
};

/**
 * 自定义域开启 CF Image Transformations 后改为 true。
 * 探针：https://mystic.starry-studio.cn/cdn-cgi/image/width=160,quality=82,format=webp/ziwei/stars/%E5%A4%A9%E6%9C%BA.webp
 * 须返回 200 且带 Cf-Resized；*.pages.dev 不支持。
 */
export const CF_IMAGE_TRANSFORM_READY = true;

function localOverrideOn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('ml_cf_img') === '1';
  } catch {
    return false;
  }
}

/** 生产自定义域启用 CF Image Transformations；本地 / pages.dev 直连原图 */
export function cfImageResizeEnabled(): boolean {
  if (!CF_IMAGE_TRANSFORM_READY && !localOverrideOn()) return false;
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return false;
  if (h.endsWith('.pages.dev')) return false;
  if (h === 'starry-studio.cn' || h.endsWith('.starry-studio.cn')) return true;
  return false;
}

export function artSizeForClass(className?: string): ZiweiArtSize {
  if (!className) return 'full';
  if (className.includes('ziwei-combo-stack-img')) return 'stack';
  if (className.includes('ziwei-detail-hero-img')) return 'hero';
  if (className.includes('ziwei-codex-short-thumb-img')) return 'thumb';
  return 'full';
}

/** 将站内绝对路径转为 CF 缩放 URL；未启用时原样返回 */
export function ziweiArtDisplayUrl(sourcePath: string, size: ZiweiArtSize = 'full'): string {
  if (size === 'full' || !cfImageResizeEnabled()) return sourcePath;
  const params = SIZE_PARAMS[size];
  const path = sourcePath.startsWith('/') ? sourcePath.slice(1) : sourcePath;
  return `/cdn-cgi/image/${params}/${path}`;
}
