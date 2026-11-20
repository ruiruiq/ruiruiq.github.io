(() => {
  const canvas = document.getElementById('visitor-map-canvas');
  const link = canvas.querySelector('a');
  const dashboardLabel = link.getAttribute('aria-label');
  const loadLabel = 'Load the visitor map and count this visit with whos.amung.us';
  link.setAttribute('aria-label', loadLabel);
  link.title = loadLabel;
  link.addEventListener('click', loadMap);

  function loadMap(event) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    link.removeEventListener('click', loadMap);
    link.setAttribute('aria-label', dashboardLabel);
    link.title = dashboardLabel;

    const frame = document.createElement('iframe');
    frame.title = 'Recent visitor locations';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.referrerPolicy = 'no-referrer';

    function finish(ready) {
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      if (ready) canvas.classList.add('is-live');
      else frame.remove();
    }

    function onMessage(message) {
      if (message.source !== frame.contentWindow || message.origin !== 'null') return;
      if (message.data === 'visitor-map:ready') finish(true);
      else if (message.data === 'visitor-map:error') finish(false);
    }

    window.addEventListener('message', onMessage);
    const timeout = setTimeout(() => finish(false), 25000);
    frame.addEventListener('load', () => {
      // The local frame has an opaque origin because it is sandboxed.
      frame.contentWindow.postMessage('visitor-map:start', '*');
    }, { once: true });
    frame.addEventListener('error', () => finish(false), { once: true });
    frame.src = 'assets/visitor-map-frame.html';
    canvas.appendChild(frame);
  }
})();
