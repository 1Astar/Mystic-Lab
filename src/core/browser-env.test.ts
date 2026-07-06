import { describe, expect, it } from 'vitest';
import { detectBrowserEnv, parseIOSVersion } from './browser-env.ts';

describe('parseIOSVersion', () => {
  it('parses iOS version from UA', () => {
    expect(parseIOSVersion('iPhone OS 16_4 like Mac OS X')).toBe(16.4);
    expect(parseIOSVersion('Mozilla/5.0')).toBeNull();
  });
});

describe('detectBrowserEnv', () => {
  it('flags WeChat and disables gesture', () => {
    const env = detectBrowserEnv(
      'Mozilla/5.0 MicroMessenger/8.0',
      true,
      'https:',
      'example.com',
    );
    expect(env.isWeChat).toBe(true);
    expect(env.shouldShowWeChatWarning).toBe(true);
    expect(env.canUseGesture).toBe(false);
  });

  it('blocks camera on non-HTTPS non-localhost', () => {
    const env = detectBrowserEnv(
      'Mozilla/5.0 Chrome',
      false,
      'http:',
      'example.com',
    );
    expect(env.shouldBlockCamera).toBe(true);
    expect(env.canUseCamera).toBe(false);
  });

  it('allows camera on localhost', () => {
    const env = detectBrowserEnv(
      'Mozilla/5.0 Chrome',
      true,
      'http:',
      'localhost',
      { hasGetUserMedia: true, hasWorker: true, hasWasm: true },
    );
    expect(env.isLocalhost).toBe(true);
    expect(env.canUseCamera).toBe(true);
    expect(env.canUseGesture).toBe(true);
  });

  it('allows camera on HTTPS IP even if secure context flag is false', () => {
    const env = detectBrowserEnv(
      'Mozilla/5.0 Chrome',
      false,
      'https:',
      '172.16.107.40',
      { hasGetUserMedia: true, hasWorker: true, hasWasm: true },
    );
    expect(env.shouldBlockCamera).toBe(false);
    expect(env.canUseCamera).toBe(true);
    expect(env.canUseGesture).toBe(true);
  });
});
