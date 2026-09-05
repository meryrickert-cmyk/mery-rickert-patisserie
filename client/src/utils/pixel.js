// Safe wrapper para fbq — no falla si el pixel no cargó
export function fbTrack(event, params) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', event, params || {});
  }
}
