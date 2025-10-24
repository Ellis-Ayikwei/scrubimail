export function getOrCreateDeviceId(storageKey: string = 'mv_device_id'): string {
    try {
      const existing = localStorage.getItem(storageKey);
      if (existing && existing.length > 0) return existing;
      // Prefer Web Crypto UUID if available
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const newId: string = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `mv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem(storageKey, newId);
      return newId;
    } catch {
      return `mv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    }
  }
  
  export function getDeviceName(): string {
    try {
      const platform = (navigator && (navigator as any).platform) || '';
      const ua = (navigator && navigator.userAgent) || '';
      const prettyUa = ua.split(')')[0]?.replace('(', '')?.slice(0, 32) || '';
      return `${platform} • ${prettyUa}`.trim();
    } catch {
      return 'Unknown Device';
    }
  }
  
  export function generateDeviceFingerprint(): string {
    try {
      const ua = (navigator && navigator.userAgent) || '';
      const lang = (navigator && navigator.language) || '';
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const screenSize = (typeof screen !== 'undefined') ? `${screen.width}x${screen.height}` : '';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const payload = [ua, lang, screenSize, timezone].join('|');
      return btoa(unescape(encodeURIComponent(payload))).slice(0, 256);
    } catch {
      return `fp_${Math.random().toString(36).slice(2)}`;
    }
  }
  
  export function getDeviceInfo() {
    const device_id = getOrCreateDeviceId();
    const device_name = getDeviceName();
    const fingerprint = generateDeviceFingerprint();
    // Enriched device info for backend diagnostics and risk signals
    let device_info: any = {};
    try {
      const nav: any = typeof navigator !== 'undefined' ? navigator : {};
      const scr: any = typeof screen !== 'undefined' ? screen : {};
  
      // Attempt to gather GPU vendor/renderer via WebGL (best-effort)
      let gpuVendor = '';
      let gpuRenderer = '';
      try {
        const canvas = document ? document.createElement('canvas') : null;
        const gl = canvas && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        if (gl) {
          const debugInfo = (gl as any).getExtension && (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            gpuVendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
            gpuRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          }
        }
      } catch {}
  
      device_info = {
        userAgent: nav.userAgent || '',
        platform: nav.platform || '',
        language: nav.language || '',
        languages: Array.isArray(nav.languages) ? nav.languages : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        screen: {
          width: scr.width || undefined,
          height: scr.height || undefined,
          colorDepth: scr.colorDepth || undefined,
          pixelRatio: (typeof window !== 'undefined' && (window as any).devicePixelRatio) ? (window as any).devicePixelRatio : undefined,
        },
        hardware: {
          cores: nav.hardwareConcurrency || undefined,
          memoryGb: nav.deviceMemory || undefined,
          touchSupport: (
            (typeof window !== 'undefined' && 'ontouchstart' in window) ||
            (nav.maxTouchPoints && nav.maxTouchPoints > 0)
          ) || false,
        },
        gpu: {
          vendor: gpuVendor || undefined,
          renderer: gpuRenderer || undefined,
        },
        vendor: nav.vendor || undefined,
      };
    } catch {}
  
    return { device_id, device_name, fingerprint, device_info };
  }
  
  
  
  