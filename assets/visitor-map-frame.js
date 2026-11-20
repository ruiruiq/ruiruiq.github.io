(() => {
  "use strict";

  // These are the public widget parameters issued by whos.amung.us.
  const siteId = "w5mpt36rh37h";
  const slot = "o7z";
  const width = 440;
  const height = 220;
  const widget = document.getElementById("widget");
  let started = false;

  function fitMap() {
    widget.style.transform = "scale(" + (document.documentElement.clientWidth / width) + ")";
  }

  window.addEventListener("message", (event) => {
    if (started || window.parent === window || event.source !== window.parent ||
        event.origin !== window.location.origin || event.data !== "visitor-map:start") {
      return;
    }
    started = true;
    const parentOrigin = event.origin;
    let settled = false;

    function finish(ok) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearTimeout(deadline);
      window.parent.postMessage(ok ? "visitor-map:ready" : "visitor-map:error", parentOrigin);
    }

    // A successful loader request alone doesn't mean the hosted map rendered.
    const observer = new MutationObserver(() => {
      const mapImage = widget.querySelector('img[src*="/mapbacks/"]');
      if (!mapImage) return;
      observer.disconnect();
      mapImage.alt = "World map with approximate visitor locations";
      if (mapImage.complete) {
        finish(mapImage.naturalWidth > 0);
      } else {
        mapImage.addEventListener("load", () => finish(true), { once: true });
        mapImage.addEventListener("error", () => finish(false), { once: true });
      }
    });

    const deadline = window.setTimeout(() => finish(false), 15000);
    observer.observe(widget, { childList: true });
    fitMap();
    window.addEventListener("resize", fitMap);
    window._wau = [["map", siteId, slot, String(width), String(height), "classic", "target-blue"]];
    const loader = document.createElement("script");
    loader.src = "https://waust.at/m.js";
    loader.async = true;
    loader.addEventListener("error", () => finish(false), { once: true });
    document.head.appendChild(loader);
  });
})();
