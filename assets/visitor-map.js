(() => {
  const preferenceKey = 'visitor-map.whos-amung-us.opt-in.v1';
  const checkbox = document.getElementById('visitor-map-consent');
  const canvas = document.getElementById('visitor-map-canvas');
  const status = document.getElementById('visitor-map-status');
  const retry = document.getElementById('visitor-map-retry');
  let frame;
  let timeout;

  function savedPreference() {
    try {
      return localStorage.getItem(preferenceKey) === 'enabled';
    } catch {
      return null;
    }
  }

  function clearFrame() {
    clearTimeout(timeout);
    frame?.remove();
    frame = null;
    canvas.classList.remove('is-live');
    retry.hidden = true;
  }

  function showError() {
    clearFrame();
    status.textContent = 'The live map could not load. Please try again later.';
    retry.hidden = false;
  }

  function loadMap() {
    clearFrame();
    if (!checkbox.checked) {
      status.textContent = '';
      return;
    }

    status.textContent = 'Loading live map…';
    const nextFrame = document.createElement('iframe');
    nextFrame.title = 'Live visitor map showing approximate locations';
    nextFrame.setAttribute('sandbox', 'allow-scripts allow-top-navigation-by-user-activation');
    nextFrame.referrerPolicy = 'no-referrer';
    nextFrame.tabIndex = -1;
    nextFrame.setAttribute('aria-hidden', 'true');
    nextFrame.addEventListener('load', () => {
      if (frame === nextFrame && checkbox.checked) {
        // The sandbox gives this local frame an opaque origin.
        nextFrame.contentWindow.postMessage('visitor-map:start', '*');
      }
    }, { once: true });
    nextFrame.addEventListener('error', () => {
      if (frame === nextFrame) showError();
    }, { once: true });
    frame = nextFrame;
    nextFrame.src = 'assets/visitor-map-frame.html';
    timeout = setTimeout(() => {
      if (frame === nextFrame) showError();
    }, 25000);
    canvas.appendChild(nextFrame);
  }

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== 'null') return;
    if (event.data === 'visitor-map:error') {
      showError();
    } else if (event.data === 'visitor-map:ready') {
      clearTimeout(timeout);
      frame.removeAttribute('aria-hidden');
      frame.removeAttribute('tabindex');
      canvas.classList.add('is-live');
      status.textContent = 'Live map enabled.';
    }
  });

  function syncPreference() {
    const saved = savedPreference();
    if (saved !== null && saved !== checkbox.checked) {
      checkbox.checked = saved;
      loadMap();
    }
  }

  checkbox.addEventListener('change', () => {
    try {
      if (checkbox.checked) localStorage.setItem(preferenceKey, 'enabled');
      else localStorage.removeItem(preferenceKey);
    } catch {
      // Browsers with storage disabled can still opt in for the current page.
    }
    loadMap();
  });
  retry.addEventListener('click', loadMap);
  window.addEventListener('storage', event => {
    if (event.key === preferenceKey || event.key === null) syncPreference();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncPreference();
  });

  checkbox.checked = savedPreference() === true;
  document.getElementById('visitor-map-control').hidden = false;
  if (checkbox.checked) loadMap();
})();
