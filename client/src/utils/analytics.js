// Analytics propio — genera session_id y envía eventos al backend
function getSessionId() {
  let sid = sessionStorage.getItem('mr_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('mr_sid', sid);
  }
  return sid;
}

const SESSION_START = Date.now();

export function track(event, meta = {}) {
  const payload = {
    session_id: getSessionId(),
    event,
    meta: JSON.stringify(meta),
    referrer: document.referrer || null,
    ua: navigator.userAgent,
    path: window.location.pathname,
  };
  // fire-and-forget
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

// Tiempo en página — llama al salir
export function trackExit() {
  const seconds = Math.round((Date.now() - SESSION_START) / 1000);
  track('time_on_page', { seconds });
}

// Registrar trackExit automáticamente
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') trackExit();
  });
}
