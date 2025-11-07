// If you’re using the official webexCCWidget.init, keep it here (optional).
// window.onload = function () {
//   window.webexCCWidget?.init({
//     orgId: "YOUR_ORG_ID",
//     tenantId: "YOUR_TENANT_ID",
//     flowId: "YOUR_FLOW_ID",
//     channelId: "YOUR_CHANNEL_ID",
//   });
// };

/**
 * Make the injected chat iframe full-screen whenever it appears.
 * Works regardless of when the Connect script loads.
 */
(function forceFullscreenChat() {
  function markAndStretch(node) {
    try {
      if (!(node instanceof HTMLIFrameElement)) return false;
      const src = node.getAttribute("src") || "";
      const id  = (node.id || "").toLowerCase();
      if (src.includes("imi.chat") || src.includes("imichat") || id.includes("imi")) {
        node.setAttribute("data-fullscreen-chat", "1");
        document.documentElement.classList.add("is-chat-fullscreen");
        // Pin styles (in case inline styles are later changed).
        requestAnimationFrame(() => {
          Object.assign(node.style, {
            position: "fixed",
            top: "0", left: "0", right: "0", bottom: "0",
            width: "100vw", height: "100vh",
            maxWidth: "100vw", maxHeight: "100vh",
            border: "0", borderRadius: "0",
            boxShadow: "none",
            zIndex: "2147483647"
          });
        });
        return true;
      }
    } catch {}
    return false;
  }

  // First pass for fast loads
  Array.from(document.getElementsByTagName("iframe")).some(markAndStretch);

  // Watch for the injected iframe
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && Array.from(m.addedNodes).forEach(n => {
        if (markAndStretch(n)) return;
        if (n.querySelectorAll) {
          n.querySelectorAll("iframe").forEach(markAndStretch);
        }
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // Keep pinned on resize
  window.addEventListener("resize", () => {
    const fr = document.querySelector('iframe[data-fullscreen-chat="1"]');
    if (fr) {
      fr.style.width = "100vw";
      fr.style.height = "100vh";
    }
  });
})();
