(function attachFullScreenChat() {
  // 1) Strong CSS rule we can point at a specific iframe once we find it.
  const forceRuleId = "chat-fullscreen-style";
  function ensureForceRule(selector) {
    let tag = document.getElementById(forceRuleId);
    if (!tag) {
      tag = document.createElement("style");
      tag.id = forceRuleId;
      document.head.appendChild(tag);
    }
    tag.textContent =
      `${selector}{
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100vh !important;
        max-width:100vw !important;
        max-height:100vh !important;
        border:0 !important;
        border-radius:0 !important;
        box-shadow:none !important;
        z-index:2147483647 !important;
      }`;
  }

  // 2) Heuristic to decide if an iframe is the chat.
  function looksLikeChatIframe(ifr) {
    if (!(ifr instanceof HTMLIFrameElement)) return false;
    const src = (ifr.getAttribute("src") || "").toLowerCase();
    const id  = (ifr.id || "").toLowerCase();
    const cls = (ifr.className || "").toLowerCase();

    // A. Host or path hints
    if (src.includes("imi.chat") || src.includes("imichat") || src.includes("icw")) return true;

    // B. Common id/class hints
    if (id.includes("imi") || id.includes("chat") || id.includes("icw")) return true;
    if (cls.includes("imi") || cls.includes("chat") || cls.includes("icw")) return true;

    // C. Default widget size heuristic (small docked bubble)
    const rect = ifr.getBoundingClientRect();
    const looksDocked =
      rect.width >= 300 && rect.width <= 460 &&
      rect.height >= 180 && rect.height <= 520 &&
      Math.abs((window.innerWidth - rect.right) < 80 ? (window.innerWidth - rect.right) : 0) >= 0 &&
      Math.abs((window.innerHeight - rect.bottom) < 100 ? (window.innerHeight - rect.bottom) : 0) >= 0 &&
      (getComputedStyle(ifr).position === "fixed" || getComputedStyle(ifr).position === "absolute");
    if (looksDocked) return true;

    return false;
  }

  // 3) Maximize the iframe: inline + CSS rule for permanence.
  function maximize(ifr) {
    try {
      if (ifr.__isFullscreenApplied) return;
      ifr.__isFullscreenApplied = true;
      ifr.setAttribute("data-fullscreen-chat", "1");

      // Inline, in case style recalcs strip classes.
      Object.assign(ifr.style, {
        position: "fixed",
        top: "0", left: "0", right: "0", bottom: "0",
        width: "100vw", height: "100vh",
        maxWidth: "100vw", maxHeight: "100vh",
        border: "0", borderRadius: "0",
        boxShadow: "none",
        zIndex: "2147483647"
      });

      // Add a strong CSS rule that directly targets this element by its unique path.
      const sel = `iframe[data-fullscreen-chat="1"]`;
      ensureForceRule(sel);

      // Hide hero
      document.documentElement.classList.add("is-chat-fullscreen");
    } catch (e) {
      // swallow
    }
  }

  // 4) First pass (in case it's already there)
  Array.from(document.getElementsByTagName("iframe")).forEach(ifr => {
    if (looksLikeChatIframe(ifr)) maximize(ifr);
  });

  // 5) Watch for new nodes (the SDK injects async)
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && Array.from(m.addedNodes).forEach(n => {
        if (n instanceof HTMLIFrameElement && looksLikeChatIframe(n)) {
          maximize(n);
        } else if (n.querySelectorAll) {
          n.querySelectorAll("iframe").forEach(ifr => {
            if (looksLikeChatIframe(ifr)) maximize(ifr);
          });
        }
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // 6) Keep it pinned on resize and if the SDK fights us
  window.addEventListener("resize", () => {
    const fr = document.querySelector('iframe[data-fullscreen-chat="1"]');
    if (fr) {
      fr.style.width = "100vw";
      fr.style.height = "100vh";
    }
  });

  // 7) Safety timer: re-check periodically in case the widget re-mounts
  setInterval(() => {
    const candidates = Array.from(document.getElementsByTagName("iframe"));
    const chat = candidates.find(looksLikeChatIframe);
    if (chat) maximize(chat);
  }, 800);
})();
