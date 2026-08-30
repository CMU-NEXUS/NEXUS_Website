/* ==========================================================================
   NEXUS Research Group — site engine
   Every page is rendered from the JSON files in /data. To change content,
   edit the JSON — never this file, and never the HTML.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- utils */

  var DATA = "data/";

  function esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Allow only http(s), mailto and same-document/relative hrefs. */
  function safeHref(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return "";
    if (/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(s)) return esc(s);
    if (/^[\w./-]+(\.html|\.pdf)?(#.*)?$/i.test(s)) return esc(s);
    return "";
  }

  function el(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function loadJSON(name) {
    return fetch(DATA + name, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " loading " + name);
      return r.json();
    });
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    if (parts.length < 3) return esc(iso);
    var d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    if (isNaN(d.getTime())) return esc(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }

  function initials(name) {
    var w = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!w.length) return "?";
    if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
    return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  }

  function param(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function bootError(err, target) {
    var host = target || qs("main") || document.body;
    host.innerHTML =
      '<div class="wrap"><div class="boot-error">' +
      "<h2>Content could not be loaded</h2>" +
      "<p>This site reads its content from the JSON files in <code>/data</code>. Browsers block those reads when a page is opened directly from the file system.</p>" +
      "<p>Serve the folder over HTTP instead — from the project directory run:</p>" +
      "<pre>python3 -m http.server 8000</pre>" +
      '<p>then open <code>http://localhost:8000</code>.</p>' +
      "<p style=\"color:var(--faint);font-size:.82rem\">Details: " + esc(err && err.message ? err.message : err) + "</p>" +
      "</div></div>";
    if (window.console) console.error(err);
  }

  /* ----------------------------------------------------------------- icons */

  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    building: '<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h4a2 2 0 0 1 2 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    scholar: '<path d="M12 3 2 8.5 12 14l10-5.5L12 3z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    graph: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/>',
    doc: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>'
  };

  function icon(name, size) {
    var p = ICONS[name];
    if (!p) return "";
    var s = size || 16;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + "</svg>";
  }

  /* ----------------------------------------------------------------- theme */

  var Theme = {
    key: "nexus-theme",
    get: function () { try { return localStorage.getItem(this.key); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(this.key, v); } catch (e) {} },
    fallback: "light",              /* overridden by site.json -> theme.default */
    resolved: function () {
      var stored = this.get();
      if (stored === "dark" || stored === "light") return stored;
      if (this.fallback === "system") {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return this.fallback === "dark" ? "dark" : "light";
    },
    apply: function (v) {
      if (v === "dark" || v === "light") document.documentElement.setAttribute("data-theme", v);
      else document.documentElement.removeAttribute("data-theme");
    },
    toggle: function () {
      var next = this.resolved() === "dark" ? "light" : "dark";
      this.set(next); this.apply(next);
      var btn = qs(".theme-toggle");
      if (btn) btn.setAttribute("aria-label", "Switch to " + (next === "dark" ? "light" : "dark") + " mode");
      return next;
    }
  };
  Theme.apply(Theme.get());

  /* ---------------------------------------------------------------- chrome */

  function currentPage() {
    var f = window.location.pathname.split("/").pop();
    return (!f || f === "") ? "index.html" : f;
  }

  function renderHeader(site) {
    var here = currentPage();
    var navHtml = site.nav.map(function (item) {
      var active = item.href.split("#")[0] === here;
      return '<a href="' + safeHref(item.href) + '"' + (active ? ' aria-current="page"' : "") + ">" + esc(item.label) + "</a>";
    }).join("");

    if (site.navCta && site.navCta.href) {
      navHtml += '<a class="btn btn--primary btn--sm nav-cta" href="' + safeHref(site.navCta.href) + '">' + esc(site.navCta.label) + "</a>";
    }

    var resolved = Theme.resolved();
    var header = qs(".site-header");
    if (!header) return;
    header.innerHTML =
      '<div class="wrap header-inner">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark" aria-hidden="true">' + esc(site.brand.logoMark || "N") + "</span>" +
          '<span class="brand-text">' +
            '<span class="brand-name">' + esc(site.brand.acronym) + "</span>" +
            '<span class="brand-sub">' + esc(site.institution.universityShort) + " · " + esc(site.institution.department) + "</span>" +
          "</span>" +
        "</a>" +
        '<nav class="nav" id="site-nav" aria-label="Primary">' + navHtml + "</nav>" +
        '<div class="header-tools">' +
          (site.theme && site.theme.allowToggle === false ? "" :
            '<button class="theme-toggle" type="button" aria-label="Switch to ' + (resolved === "dark" ? "light" : "dark") + ' mode">' +
              '<span class="icon-sun">' + icon("sun", 17) + "</span>" +
              '<span class="icon-moon">' + icon("moon", 17) + "</span>" +
            "</button>") +
          '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">' +
            icon("menu", 18) +
          "</button>" +
        "</div>" +
      "</div>";

    var toggle = qs(".theme-toggle", header);
    if (toggle) toggle.addEventListener("click", function () { Theme.toggle(); });

    var navBtn = qs(".nav-toggle", header);
    var nav = qs("#site-nav", header);
    if (navBtn && nav) {
      navBtn.addEventListener("click", function () {
        var open = nav.getAttribute("data-open") === "true";
        nav.setAttribute("data-open", String(!open));
        navBtn.setAttribute("aria-expanded", String(!open));
        navBtn.setAttribute("aria-label", open ? "Open menu" : "Close menu");
        navBtn.innerHTML = icon(open ? "menu" : "close", 18);
      });
    }

    // Track the OS only when site.json opts into "system".
    if (window.matchMedia && Theme.fallback === "system") {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { if (!Theme.get()) Theme.apply(Theme.resolved()); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  function renderFooter(site) {
    var f = site.footer || {};
    var cols = (f.columns || []).map(function (c) {
      return '<div class="footer-col"><h4>' + esc(c.title) + "</h4><ul>" +
        (c.links || []).map(function (l) {
          return "<li><a href=\"" + safeHref(l.href) + "\"" + (l.external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + esc(l.label) + "</a></li>";
        }).join("") + "</ul></div>";
    }).join("");

    var social = (site.social || []).map(function (s) {
      var ext = /^https?:/i.test(s.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<a href="' + safeHref(s.href) + '"' + ext + ' aria-label="' + esc(s.label) + '" title="' + esc(s.label) + '">' + icon(s.icon || "link", 16) + "</a>";
    }).join("");

    var footer = qs(".site-footer");
    if (!footer) return;
    footer.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<a class="brand" href="index.html">' +
              '<span class="brand-mark" aria-hidden="true">' + esc(site.brand.logoMark || "N") + "</span>" +
              '<span class="brand-text"><span class="brand-name">' + esc(site.brand.acronym) + "</span>" +
              '<span class="brand-sub">' + esc(site.brand.expansion) + "</span></span>" +
            "</a>" +
            '<p class="footer-blurb">' + esc(f.blurb) + "</p>" +
            '<div class="social-row">' + social + "</div>" +
          "</div>" +
          cols +
          '<div class="footer-col"><h4>Find us</h4><address>' +
            (f.address || []).map(esc).join("<br>") +
            (f.email ? '<br><br><a href="mailto:' + esc(f.email) + '">' + esc(f.email) + "</a>" : "") +
          "</address></div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " " + esc(f.copyright) + "</span>" +
          "<span>" + esc(f.legal) + "</span>" +
        "</div>" +
      "</div>";
  }

  function setMeta(meta) {
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    if (meta.description) {
      var m = qs('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
      m.setAttribute("content", meta.description);
    }
  }

  function reveal() {
    var nodes = qsa("[data-reveal]");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .05 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function pageHead(h) {
    return '<header class="page-head"><div class="wrap">' +
      (h.eyebrow ? '<span class="eyebrow">' + esc(h.eyebrow) + "</span>" : "") +
      "<h1>" + esc(h.title) + "</h1>" +
      (h.lead ? '<p class="lead">' + esc(h.lead) + "</p>" : "") +
      "</div></header>";
  }

  function actions(list) {
    return (list || []).map(function (a) {
      var ext = /^https?:/i.test(a.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<a class="btn btn--' + (a.style === "primary" ? "primary" : "ghost") + '" href="' + safeHref(a.href) + '"' + ext + ">" + esc(a.label) + "</a>";
    }).join("");
  }

  /* ------------------------------------------------------------- news list */

  function newsListHtml(items) {
    return '<div class="news-list">' + items.map(function (n) {
      var title = n.url
        ? '<a href="' + safeHref(n.url) + '" target="_blank" rel="noopener noreferrer">' + esc(n.title) + "</a>"
        : esc(n.title);
      return '<article class="news-item">' +
        '<time class="news-date" datetime="' + esc(n.date) + '">' + fmtDate(n.date) + "</time>" +
        '<div class="news-body"><h3>' + title + "</h3>" + (n.text ? "<p>" + esc(n.text) + "</p>" : "") + "</div>" +
        (n.tag ? '<span class="tag">' + esc(n.tag) + "</span>" : "<span></span>") +
        "</article>";
    }).join("") + "</div>";
  }

  function sortByDateDesc(a, b) { return String(b.date).localeCompare(String(a.date)); }

  /* ----------------------------------------------------------------- forms */

  function fieldHtml(f) {
    var id = "f-" + f.name;
    var width = f.width === "half" ? "field--half" : "field--full";
    var req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : "";
    var reqAttr = f.required ? " required" : "";
    var help = f.help ? '<p class="field-help" id="' + id + '-help">' + esc(f.help) + "</p>" : "";
    var describedBy = f.help ? ' aria-describedby="' + id + '-help"' : "";
    var body;

    switch (f.type) {
      case "textarea":
        body = '<textarea id="' + id + '" name="' + esc(f.name) + '" rows="' + (f.rows || 5) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + reqAttr + describedBy + "></textarea>";
        break;
      case "select":
        body = '<select id="' + id + '" name="' + esc(f.name) + '"' + reqAttr + describedBy + ">" +
          '<option value="">Select…</option>' +
          (f.options || []).map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("") +
          "</select>";
        break;
      case "checkboxes":
        body = '<div class="check-grid" role="group" aria-labelledby="' + id + '-label">' +
          (f.options || []).map(function (o, i) {
            return '<label class="check"><input type="checkbox" name="' + esc(f.name) + '" value="' + esc(o) + '" id="' + id + "-" + i + '"><span>' + esc(o) + "</span></label>";
          }).join("") + "</div>";
        return '<div class="field ' + width + '" data-field="' + esc(f.name) + '" data-type="checkboxes"' + (f.required ? ' data-required="true"' : "") + ">" +
          '<span class="field-label" id="' + id + '-label">' + esc(f.label) + req + "</span>" + body + help +
          '<p class="field-error">Please select at least one option.</p></div>';
      case "checkbox":
        return '<div class="field ' + width + '" data-field="' + esc(f.name) + '" data-type="checkbox"' + (f.required ? ' data-required="true"' : "") + ">" +
          '<label class="check check--single"><input type="checkbox" id="' + id + '" name="' + esc(f.name) + '" value="yes"' + reqAttr + "><span>" + esc(f.label) + req + "</span></label>" + help +
          '<p class="field-error">This box must be ticked to continue.</p></div>';
      default:
        body = '<input type="' + esc(f.type || "text") + '" id="' + id + '" name="' + esc(f.name) + '"' +
          (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") +
          (f.autocomplete ? ' autocomplete="' + esc(f.autocomplete) + '"' : "") + reqAttr + describedBy + ">";
    }

    return '<div class="field ' + width + '" data-field="' + esc(f.name) + '" data-type="' + esc(f.type || "text") + '"' + (f.required ? ' data-required="true"' : "") + ">" +
      '<label for="' + id + '">' + esc(f.label) + req + "</label>" + body + help +
      '<p class="field-error">Please complete this field.</p></div>';
  }

  function formHtml(cfg, formId) {
    return '<form class="form-shell" id="' + esc(formId) + '" novalidate>' +
      '<div class="form-grid">' + (cfg.fields || []).map(fieldHtml).join("") + "</div>" +
      '<div class="hp-field" aria-hidden="true"><label>Leave this field empty<input type="text" name="_hp" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="form-foot">' +
        (cfg.privacyNote ? '<p class="privacy-note">' + esc(cfg.privacyNote) + "</p>" : "<span></span>") +
        '<button class="btn btn--primary" type="submit">' + esc(cfg.submitLabel || "Submit") + "</button>" +
      "</div>" +
      '<p class="form-status" role="status" aria-live="polite"></p>' +
      "</form>";
  }

  function validate(form) {
    var ok = true, first = null;
    qsa(".field[data-required='true']", form).forEach(function (field) {
      var type = field.getAttribute("data-type");
      var valid;
      if (type === "checkboxes") {
        valid = qsa("input[type=checkbox]", field).some(function (c) { return c.checked; });
      } else if (type === "checkbox") {
        valid = qs("input[type=checkbox]", field).checked;
      } else {
        var input = qs("input, select, textarea", field);
        valid = !!(input && input.value.trim());
        if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        if (valid && input.type === "url" && input.value.trim()) valid = /^https?:\/\/.+/i.test(input.value.trim());
      }
      field.setAttribute("data-invalid", String(!valid));
      var control = qs("input, select, textarea", field);
      if (control) control.setAttribute("aria-invalid", String(!valid));
      if (!valid) { ok = false; if (!first) first = field; }
    });
    if (first) {
      var focusable = qs("input, select, textarea", first);
      if (focusable) focusable.focus();
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  }

  function collect(form, cfg) {
    var out = {};
    (cfg.fields || []).forEach(function (f) {
      if (f.type === "checkboxes") {
        out[f.name] = qsa("input[name='" + f.name + "']:checked", form).map(function (c) { return c.value; }).join(", ");
      } else if (f.type === "checkbox") {
        var c = qs("input[name='" + f.name + "']", form);
        out[f.name] = c && c.checked ? "Yes" : "No";
      } else {
        var i = qs("[name='" + f.name + "']", form);
        out[f.name] = i ? i.value.trim() : "";
      }
    });
    return out;
  }

  function labelFor(cfg, name) {
    var f = (cfg.fields || []).filter(function (x) { return x.name === name; })[0];
    return f ? f.label : name;
  }

  function wireForm(formId, cfg) {
    var form = el(formId);
    if (!form) return;
    var status = qs(".form-status", form);

    qsa(".field", form).forEach(function (field) {
      field.addEventListener("change", function () {
        if (field.getAttribute("data-invalid") === "true") {
          field.setAttribute("data-invalid", "false");
          var c = qs("input, select, textarea", field);
          if (c) c.setAttribute("aria-invalid", "false");
        }
      });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var hp = qs("input[name='_hp']", form);
      if (hp && hp.value) return; // bot
      if (!validate(form)) {
        status.setAttribute("data-state", "error");
        status.textContent = "Please fix the highlighted fields and try again.";
        return;
      }

      var data = collect(form, cfg);
      var submitBtn = qs("button[type=submit]", form);

      if (cfg.endpoint) {
        status.setAttribute("data-state", "pending");
        status.textContent = "Sending…";
        submitBtn.setAttribute("aria-disabled", "true");
        fetch(cfg.endpoint, {
          method: cfg.method || "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          status.setAttribute("data-state", "success");
          status.textContent = cfg.successMessage || "Thank you — your submission has been received.";
          form.reset();
        }).catch(function () {
          status.setAttribute("data-state", "error");
          status.textContent = cfg.errorMessage || "Something went wrong. Please email us directly.";
        }).then(function () {
          submitBtn.removeAttribute("aria-disabled");
        });
        return;
      }

      // No endpoint configured: compose a pre-filled email instead.
      var lines = (cfg.fields || []).map(function (f) {
        return labelFor(cfg, f.name) + ": " + (data[f.name] || "—");
      }).join("\n");
      var mailto = "mailto:" + encodeURIComponent(cfg.fallbackEmail || "") +
        "?subject=" + encodeURIComponent(cfg.fallbackSubject || "Website enquiry") +
        "&body=" + encodeURIComponent(lines);
      window.location.href = mailto;
      status.setAttribute("data-state", "success");
      status.textContent = (cfg.successMessage || "Thank you.") +
        " Your email client should now be open with the details pre-filled — press send to complete your submission.";
    });
  }

  /* ------------------------------------------------------------ hero: art */

  /* Deterministic PRNG: the trace field looks hand-routed but never changes. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var NEIGHBOURS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];

  /* Routes PCB-style traces out of the wordmark's footprint towards the edges.
     w/h are the hero's pixel size; keep is the keep-out box around the wordmark. */
  function circuitField(w, h, keep, withPulses) {
    var G = w > 1000 ? 28 : 22;
    var cols = Math.round(w / G), rows = Math.round(h / G);
    var rnd = mulberry32(0x4e455855);
    var occ = {}, traces = [], pads = [];

    var k = {
      x0: Math.max(1, Math.floor(keep.x0 / G)),
      y0: Math.max(1, Math.floor(keep.y0 / G)),
      x1: Math.min(cols - 1, Math.ceil(keep.x1 / G)),
      y1: Math.min(rows - 1, Math.ceil(keep.y1 / G))
    };
    if (k.x1 - k.x0 < 2 || k.y1 - k.y0 < 2) return "";

    function key(cx, cy) { return cx + "," + cy; }

    function free(cx, cy, id) {
      if (cx < 0 || cy < 0 || cx > cols || cy > rows) return false;
      if (cx >= k.x0 && cx <= k.x1 && cy >= k.y0 && cy <= k.y1) return false;
      for (var i = 0; i < NEIGHBOURS.length; i++) {
        var o = occ[key(cx + NEIGHBOURS[i][0], cy + NEIGHBOURS[i][1])];
        if (o !== undefined && o !== id) return false;
      }
      return true;
    }

    /* One trace: straight runs out from the pin, joined by 45° jogs. */
    function walk(id, cx, cy, ax, ay, sign) {
      var px = -ay, py = ax;
      var dx = ax, dy = ay, mode = "out";
      var run = 3 + Math.floor(rnd() * 7);
      var budget = cols + rows;
      var pts = [[cx, cy]];
      var stopped = false;
      occ[key(cx, cy)] = id;

      while (budget-- > 0) {
        var nx = cx + dx, ny = cy + dy;
        if (!free(nx, ny, id)) {
          stopped = nx >= 0 && ny >= 0 && nx <= cols && ny <= rows; // blocked, not off-canvas
          break;
        }
        cx = nx; cy = ny;
        occ[key(cx, cy)] = id;
        if (--run > 0) continue;

        pts.push([cx, cy]);
        if (rnd() < .18) sign = -sign;
        if (mode === "out") {
          mode = "diag"; dx = ax + px * sign; dy = ay + py * sign; run = 1 + Math.floor(rnd() * 3);
        } else if (mode === "diag" && rnd() < .34) {
          mode = "side"; dx = px * sign; dy = py * sign; run = 2 + Math.floor(rnd() * 5);
        } else if (mode === "diag") {
          mode = "out"; dx = ax; dy = ay; run = 3 + Math.floor(rnd() * 9);
        } else {
          mode = "diag"; dx = ax + px * sign; dy = ay + py * sign; run = 1 + Math.floor(rnd() * 3);
        }
      }

      pts.push([cx, cy]);
      return pts.length > 2 ? { pts: pts, via: stopped } : null;
    }

    /* Pins sit on the keep-out boundary, like pads around a die. */
    var midX = (k.x0 + k.x1) / 2, midY = (k.y0 + k.y1) / 2, pins = [];
    var room = { left: k.x0 >= 4, right: cols - k.x1 >= 4, top: k.y0 >= 4, bottom: rows - k.y1 >= 4 };
    for (var y = k.y0; y <= k.y1; y += 2) {
      if (room.left) pins.push([k.x0, y, -1, 0]);
      if (room.right) pins.push([k.x1, y, 1, 0]);
    }
    for (var x = k.x0 + 2; x <= k.x1 - 2; x += 2) {
      if (room.top) pins.push([x, k.y0, 0, -1]);
      if (room.bottom) pins.push([x, k.y1, 0, 1]);
    }

    pins.forEach(function (pin, i) {
      if (rnd() < .12) return;                                 // leave gaps in the fan-out
      var ax = pin[2], ay = pin[3];
      var px = -ay, py = ax;
      var away = (pin[0] - midX) * px + (pin[1] - midY) * py;  // jog outwards, not inwards
      var t = walk(i + 1, pin[0], pin[1], ax, ay, away >= 0 ? 1 : -1);
      if (!t) return;
      pads.push({ x: pin[0] * G, y: pin[1] * G, r: 3, via: false });
      var d = t.pts.map(function (p, n) { return (n ? "L" : "M") + p[0] * G + " " + p[1] * G; }).join("");
      var last = t.pts[t.pts.length - 1];
      var len = Math.abs(last[0] - pin[0]) + Math.abs(last[1] - pin[1]);
      traces.push({ d: d, len: len });
      if (t.via) pads.push({ x: last[0] * G, y: last[1] * G, r: 3.5, via: true });
    });

    var paths = traces.map(function (t) { return '<path d="' + t.d + '"/>'; }).join("");

    var pulses = "";
    if (withPulses) {
      var longest = traces.slice().sort(function (a, b) { return b.len - a.len; }).slice(0, 22);
      pulses = longest.filter(function (_, i) { return i % 2 === 0; }).map(function (t, i) {
        var dur = (5.5 + rnd() * 5).toFixed(2), delay = (rnd() * -12).toFixed(2);
        return '<path d="' + t.d + '" pathLength="100" style="animation-duration:' + dur + 's;animation-delay:' + delay + 's"/>';
      }).join("");
    }

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<rect class="nx-die" x="' + (k.x0 * G) + '" y="' + (k.y0 * G) + '" width="' + ((k.x1 - k.x0) * G) +
        '" height="' + ((k.y1 - k.y0) * G) + '" rx="18"/>' +
      '<g class="nx-glow">' + paths + "</g>" +
      '<g class="nx-lines">' + paths + "</g>" +
      '<g class="nx-pads">' + pads.map(function (p) {
        return '<circle class="' + (p.via ? "is-via" : "") + '" cx="' + p.x + '" cy="' + p.y + '" r="' + p.r + '"/>';
      }).join("") + "</g>" +
      (pulses ? '<g class="nx-pulses">' + pulses + "</g>" : "") +
      "</svg>";
  }

  function statsHtml(items) {
    return (items || []).map(function (s) {
      return '<div class="stat"><div class="stat-value">' + esc(s.value) + "</div>" +
        '<div class="stat-label">' + esc(s.label) + "</div>" +
        '<div class="stat-detail">' + esc(s.detail) + "</div></div>";
    }).join("");
  }

  function heroHtml(h, stats) {
    var word = String(h.wordmark || "NEXUS");
    var letters = word.split(/\s+/).filter(Boolean).map(function (part) {
      return '<span class="hero-line">' + part.split("").map(function (ch) {
        return '<span class="hero-letter">' + esc(ch) + "</span>";
      }).join("") + "</span>";
    }).join("");

    var tiles = ((h.graphic && h.graphic.tiles) || []).map(function (t, i) {
      return '<button class="hero-tier" type="button" data-tile="' + i + '"' +
        ' aria-controls="hero-panel" aria-expanded="false" data-active="false">' +
        '<span class="tier-label">' + esc(t.label) + "</span>" +
        '<span class="tier-sub">' + esc(t.sub) + "</span>" +
      "</button>";
    }).join("");

    var sub = h.sub || {};
    var name = sub.href
      ? '<a href="' + safeHref(sub.href) + '">' + esc(sub.name) + "</a>"
      : esc(sub.name);
    var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;

    return '<section class="hero" id="hero">' +
      '<div class="hero-rail">' +
        '<div class="hero-scene">' +
          '<div class="hero-circuit hero-circuit--base" aria-hidden="true"></div>' +
          '<div class="hero-circuit hero-circuit--live" aria-hidden="true"></div>' +
          '<div class="hero-inner">' +
            '<div class="hero-copy">' +
              '<h1 class="hero-word">' +
                '<span class="sr-only">' + esc(word) + (h.expansion ? " — " + esc(h.expansion) : "") + "</span>" +
                '<span class="hero-letters" aria-hidden="true">' + letters + "</span>" +
              "</h1>" +
              (sub.name ? '<p class="hero-sub">' + esc(sub.prefix || "Led by") + " " + name + "</p>" : "") +
            "</div>" +
            '<div class="hero-stack-wrap"><div class="hero-stack">' + tiles + "</div></div>" +
          "</div>" +
          '<div class="hero-panel" id="hero-panel" aria-live="polite">' +
            '<p class="hero-hint">' + esc((touch && h.hintTouch) || h.hint || "Hover a tier to see its projects") + "</p>" +
            '<div class="panel-body"></div>' +
          "</div>" +
          (stats ? '<div class="stats hero-stats">' + statsHtml(stats) + "</div>" : "") +
        "</div>" +
      "</div>" +
    "</section>";
  }

  function panelHtml(t) {
    return '<span class="panel-eyebrow">Projects</span>' +
      '<h2 class="panel-title">' + esc(t.label) + "</h2>" +
      '<ul class="panel-list">' + (t.projects || []).map(function (pr) {
        return "<li>" + esc(pr) + "</li>";
      }).join("") + "</ul>" +
      (t.href ? '<a class="textlink" href="' + safeHref(t.href) + '">Explore the thrust<span class="arrow">' + icon("arrow", 13) + "</span></a>" : "");
  }

  function initHero(hero_data) {
    var hero = qs(".hero");
    var scene = hero && qs(".hero-scene", hero);
    var copy = hero && qs(".hero-copy", hero);
    if (!hero || !scene || !copy) return;

    var rail = qs(".hero-rail", hero);
    var base = qs(".hero-circuit--base", hero);
    var live = qs(".hero-circuit--live", hero);
    var builtW = 0, builtH = 0;

    /* Keep the scene exactly one viewport tall under the sticky header. */
    function measureHeader() {
      var header = qs(".site-header");
      if (header) document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    }

    function build() {
      var w = Math.round(scene.clientWidth), h = Math.round(scene.clientHeight);
      if (!w || !h) return;
      var sr = scene.getBoundingClientRect(), cr = copy.getBoundingClientRect();
      var padX = Math.max(40, w * .035), padY = Math.max(30, h * .05);
      var keep = {
        x0: cr.left - sr.left - padX, y0: cr.top - sr.top - padY,
        x1: cr.right - sr.left + padX, y1: cr.bottom - sr.top + padY
      };
      base.innerHTML = circuitField(w, h, keep, true);
      if (live) live.innerHTML = circuitField(w, h, keep, false);
      builtW = w; builtH = h;
    }

    measureHeader();
    build();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measureHeader(); build(); }).catch(function () {});
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measureHeader();
        if (Math.abs(scene.clientWidth - builtW) > 30 || Math.abs(scene.clientHeight - builtH) > 30) build();
      }, 220);
    });

    /* --- tiers: hover, focus or tap lists that thrust's projects --- */
    var list = (hero_data && hero_data.graphic && hero_data.graphic.tiles) || [];
    var tiers = qsa(".hero-tier", hero);
    var panel = qs(".hero-panel", hero);
    var body = qs(".panel-body", hero);
    var hideTimer;

    function activate(i) {
      clearTimeout(hideTimer);
      if (!list[i]) return;
      body.innerHTML = panelHtml(list[i]);
      hero.setAttribute("data-tile", String(i));
      tiers.forEach(function (t, n) {
        t.setAttribute("data-active", String(n === i));
        t.setAttribute("aria-expanded", String(n === i));
      });
    }
    function clearPanel() {
      hero.removeAttribute("data-tile");
      body.innerHTML = "";
      tiers.forEach(function (t) { t.setAttribute("data-active", "false"); t.setAttribute("aria-expanded", "false"); });
    }
    function clearSoon() { clearTimeout(hideTimer); hideTimer = setTimeout(clearPanel, 180); }

    tiers.forEach(function (tier, i) {
      tier.addEventListener("mouseenter", function () { activate(i); });
      tier.addEventListener("mouseleave", clearSoon);
      tier.addEventListener("focus", function () { activate(i); });
      tier.addEventListener("blur", clearSoon);
      tier.addEventListener("click", function () {
        if (hero.getAttribute("data-tile") === String(i)) clearPanel();
        else activate(i);
      });
    });
    if (panel) {
      panel.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
      panel.addEventListener("mouseleave", clearSoon);
    }

    /* --- scroll drives the stack from the side to the centre --- */
    var flat = window.matchMedia && window.matchMedia("(max-width: 900px), (prefers-reduced-motion: reduce)");
    var ticking = false;

    function progress() {
      ticking = false;
      if (flat && flat.matches) {
        hero.style.setProperty("--p", "0");
        hero.setAttribute("data-zoom", "false");
        return;
      }
      var span = rail.offsetHeight - scene.offsetHeight;
      var raw = span > 0 ? -rail.getBoundingClientRect().top / span : 0;
      var p = Math.max(0, Math.min(1, raw / .62));       // hold at full zoom for the last stretch
      hero.style.setProperty("--p", p.toFixed(4));
      hero.setAttribute("data-zoom", p > .45 ? "true" : "false");
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (flat && flat.addEventListener) flat.addEventListener("change", onScroll);
    progress();

    /* --- the stack tilts and the traces light up under the pointer --- */
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, visible = true;

    function frame() {
      raf = 0;
      cx += (tx - cx) * .085;
      cy += (ty - cy) * .085;
      hero.style.setProperty("--tilt-x", (cx * 8).toFixed(2) + "deg");
      hero.style.setProperty("--tilt-y", (cy * -7).toFixed(2) + "deg");
      if (Math.abs(tx - cx) > .0015 || Math.abs(ty - cy) > .0015) raf = requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", function (ev) {
      if (!visible || ev.pointerType === "touch") return;
      var r = scene.getBoundingClientRect();
      var mx = ev.clientX - r.left, my = ev.clientY - r.top;
      var inside = mx >= 0 && my >= 0 && mx <= r.width && my <= r.height;
      hero.setAttribute("data-pointer", String(inside));
      if (inside) {
        hero.style.setProperty("--mx", mx.toFixed(1) + "px");
        hero.style.setProperty("--my", my.toFixed(1) + "px");
      }
      tx = Math.max(-1, Math.min(1, (mx / r.width - .5) * 2));
      ty = Math.max(-1, Math.min(1, (my / r.height - .5) * 2));
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) { tx = ty = 0; if (!raf) raf = requestAnimationFrame(frame); hero.setAttribute("data-pointer", "false"); }
      }, { threshold: 0 }).observe(scene);
    }
  }

  /* ------------------------------------------------------------ page: home */

  function renderHome(site, home, news) {
    setMeta(home.meta);
    var out = [];

    var showStats = home.stats && home.stats.enabled !== false && (home.stats.items || []).length;
    var statsInHero = false;

    if (home.hero && home.hero.enabled !== false) {
      statsInHero = !!showStats;                       // the strip floats over the hero
      out.push(heroHtml(home.hero, statsInHero ? home.stats.items : null));
    }

    if (showStats && !statsInHero) {
      out.push('<section class="section section--tight"><div class="wrap"><div class="stats" data-reveal>' +
        statsHtml(home.stats.items) + "</div></div></section>");
    }

    if (home.about && home.about.enabled !== false) {
      var a = home.about;
      out.push('<section class="section section--alt" id="about"><div class="wrap split" data-reveal>' +
        "<div>" +
          '<span class="eyebrow">' + esc(a.eyebrow) + "</span>" +
          "<h2>" + esc(a.title) + "</h2>" +
          a.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
        "</div>" +
        '<ul class="checklist">' + (a.highlights || []).map(function (x) {
          return '<li><span class="tick">' + icon("check", 11) + "</span><span>" + esc(x) + "</span></li>";
        }).join("") + "</ul>" +
      "</div></section>");
    }

    if (home.research && home.research.enabled !== false) {
      var r = home.research;
      out.push('<section class="section" id="research"><div class="wrap">' +
        '<div class="section-head" data-reveal><span class="eyebrow">' + esc(r.eyebrow) + "</span><h2>" + esc(r.title) + "</h2>" +
          '<p class="lead">' + esc(r.lead) + "</p></div>" +
        '<div class="card-grid card-grid--3">' + r.areas.map(function (area) {
          return '<article class="card card--interactive area" id="' + esc(area.id) + '" data-expanded="false" data-reveal>' +
            '<div class="card-icon">' + icon(area.icon || "chip", 19) + "</div>" +
            "<h3>" + esc(area.title) + "</h3>" +
            "<p>" + esc(area.summary) + "</p>" +
            '<div class="tag-row">' + (area.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
            '<div class="area-body">' + (area.body || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
            '<button class="area-toggle" type="button" aria-expanded="false" aria-controls="' + esc(area.id) + '"><span class="label">Read more</span>' + icon("chevron", 13) + "</button>" +
          "</article>";
        }).join("") + "</div></div></section>");
    }

    if (home.newsPreview && home.newsPreview.enabled !== false) {
      var np = home.newsPreview;
      var items = (news.items || []).slice().sort(sortByDateDesc).slice(0, np.count || 5);
      out.push('<section class="section section--alt" id="news"><div class="wrap" data-reveal>' +
        '<div class="section-head" style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap;max-width:none">' +
          '<div><span class="eyebrow">' + esc(np.eyebrow) + "</span><h2 style=\"margin:0\">" + esc(np.title) + "</h2></div>" +
          '<a class="textlink" href="' + safeHref(np.linkHref) + '">' + esc(np.linkLabel) + '<span class="arrow">' + icon("arrow", 14) + "</span></a>" +
        "</div>" + newsListHtml(items) + "</div></section>");
    }

    if (home.teaching && home.teaching.enabled !== false) {
      var t = home.teaching;
      out.push('<section class="section" id="teaching"><div class="wrap" data-reveal>' +
        '<div class="section-head"><span class="eyebrow">' + esc(t.eyebrow) + "</span><h2>" + esc(t.title) + "</h2></div>" +
        '<div class="card-grid card-grid--2">' + t.courses.map(function (c) {
          return '<article class="card"><span class="tag tag--accent">' + esc(c.number) + "</span>" +
            '<h3 style="margin-top:.9rem">' + esc(c.title) + "</h3><p>" + esc(c.description) + "</p></article>";
        }).join("") + "</div></div></section>");
    }

    if (home.cta && home.cta.enabled !== false) {
      out.push('<section class="section section--tight"><div class="wrap"><div class="cta-band" data-reveal>' +
        "<div><h2>" + esc(home.cta.title) + "</h2><p>" + esc(home.cta.text) + "</p></div>" +
        '<div class="cta-actions">' + actions(home.cta.actions) + "</div>" +
        "</div></div></section>");
    }

    qs("main").innerHTML = out.join("");
    initHero(home.hero);

    qsa(".area-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var area = btn.closest(".area");
        var open = area.getAttribute("data-expanded") === "true";
        area.setAttribute("data-expanded", String(!open));
        btn.setAttribute("aria-expanded", String(!open));
        qs(".label", btn).textContent = open ? "Read more" : "Show less";
      });
    });
  }

  /* ---------------------------------------------------------- page: people */

  function avatarHtml(person) {
    if (person.photo) {
      return '<div class="avatar"><img src="' + safeHref(person.photo) + '" alt="' + esc(person.name) + '" loading="lazy"></div>';
    }
    return '<div class="avatar" role="img" aria-label="' + esc(person.name) + '">' + esc(initials(person.name)) + "</div>";
  }

  function renderPeople(site, people) {
    setMeta(people.meta);
    var pi = people.pi;
    var out = [pageHead(people.header)];

    out.push('<section class="section"><div class="wrap">' +
      '<article class="pi-card" data-reveal>' +
        "<div>" + avatarHtml(pi) + "</div>" +
        "<div>" +
          "<h2>" + esc(pi.name) + "</h2>" +
          '<p class="pi-role">' + esc(pi.role) + "</p>" +
          '<p class="pi-affil">' + esc(pi.affiliation) + "</p>" +
          (pi.bio || []).map(function (p) { return '<p style="color:var(--muted);font-size:.94rem">' + esc(p) + "</p>"; }).join("") +
          '<div class="tag-row">' + (pi.interests || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
          '<div class="pi-meta">' +
            (pi.office ? '<div><span class="k">Office</span><span>' + esc(pi.office) + "</span></div>" : "") +
            (pi.email ? '<div><span class="k">Email</span><a href="mailto:' + esc(pi.email) + '">' + esc(pi.email) + "</a></div>" : "") +
            ((pi.links || []).length ? '<div><span class="k">Links</span><span>' + pi.links.map(function (l) {
              return '<a href="' + safeHref(l.href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + "</a>";
            }).join(" · ") + "</span></div>" : "") +
          "</div>" +
        "</div>" +
      "</article></div></section>");

    var groups = (people.groups || []).map(function (g) {
      return '<div class="group-block" id="' + esc(g.id) + '" data-reveal>' +
        '<div class="group-head"><h2>' + esc(g.title) + "</h2>" + (g.blurb ? "<p>" + esc(g.blurb) + "</p>" : "") + "</div>" +
        '<div class="people-grid">' + (g.members || []).map(function (m) {
          return '<article class="person">' + avatarHtml(m) +
            '<div class="person-name">' + esc(m.name) + "</div>" +
            '<div class="person-role">' + esc(m.role) + "</div>" +
            (m.note ? '<div class="person-note">' + esc(m.note) + "</div>" : "") +
            ((m.interests || []).length ? '<div class="tag-row">' + m.interests.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
            "</article>";
        }).join("") + "</div></div>";
    }).join("");
    out.push('<section class="section section--alt"><div class="wrap">' + groups + "</div></section>");

    if (people.collaborators && people.collaborators.enabled !== false && (people.collaborators.items || []).length) {
      out.push('<section class="section"><div class="wrap" data-reveal>' +
        '<div class="section-head"><h2>' + esc(people.collaborators.title) + "</h2>" +
        (people.collaborators.blurb ? '<p class="lead">' + esc(people.collaborators.blurb) + "</p>" : "") + "</div>" +
        '<ul class="pill-list">' + people.collaborators.items.map(function (i) { return '<li><span class="pill">' + esc(i) + "</span></li>"; }).join("") + "</ul>" +
      "</div></section>");
    }

    if (people.alumni && people.alumni.enabled !== false && (people.alumni.items || []).length) {
      out.push('<section class="section section--alt"><div class="wrap" data-reveal>' +
        '<div class="section-head"><h2>' + esc(people.alumni.title) + "</h2>" +
        (people.alumni.blurb ? '<p class="lead">' + esc(people.alumni.blurb) + "</p>" : "") + "</div>" +
        '<div class="people-grid">' + people.alumni.items.map(function (m) {
          return '<article class="person">' + avatarHtml(m) +
            '<div class="person-name">' + esc(m.name) + "</div>" +
            '<div class="person-role">' + esc(m.role || "") + "</div>" +
            (m.now ? '<div class="person-note">Now: ' + esc(m.now) + "</div>" : "") + "</article>";
        }).join("") + "</div></div></section>");
    }

    if (people.joinPrompt && people.joinPrompt.enabled !== false) {
      out.push('<section class="section section--tight"><div class="wrap"><div class="cta-band" data-reveal>' +
        "<div><h2>" + esc(people.joinPrompt.title) + "</h2><p>" + esc(people.joinPrompt.text) + "</p></div>" +
        '<div class="cta-actions">' + actions([{ label: people.joinPrompt.action.label, href: people.joinPrompt.action.href, style: "primary" }]) + "</div>" +
        "</div></div></section>");
    }

    qs("main").innerHTML = out.join("");
  }

  /* ---------------------------------------------------- page: publications */

  function renderPublications(site, pubs) {
    setMeta(pubs.meta);
    var items = (pubs.items || []).slice();
    var years = items.map(function (p) { return p.year; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return b - a; });
    var types = items.map(function (p) { return p.type; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var typeLabel = { journal: "Journal", conference: "Conference", patent: "Patents" };

    var head = pubs.header;
    var out = [pageHead(head)];

    out.push('<section class="section"><div class="wrap">' +
      '<div class="filters">' +
        '<div class="filter-search">' + icon("search", 15) +
          '<input type="text" id="pub-search" placeholder="Search titles, authors, venues…" aria-label="Search publications">' +
        "</div>" +
        '<div class="chip-row" id="type-chips" role="group" aria-label="Filter by type">' +
          '<button class="chip" type="button" data-type="all" aria-pressed="true">All</button>' +
          types.map(function (t) { return '<button class="chip" type="button" data-type="' + esc(t) + '" aria-pressed="false">' + esc(typeLabel[t] || t) + "</button>"; }).join("") +
        "</div>" +
        '<span class="filter-count" id="pub-count"></span>' +
      "</div>" +
      (head.scholarLink ? '<p style="margin:-1rem 0 2rem"><a class="textlink" href="' + safeHref(head.scholarLink.href) + '" target="_blank" rel="noopener noreferrer">' + esc(head.scholarLink.label) + '<span class="arrow">' + icon("external", 13) + "</span></a></p>" : "") +
      '<div id="pub-results"></div>' +
    "</div></section>");

    qs("main").innerHTML = out.join("");

    var me = pubs.piName || "";
    function authorsHtml(list) {
      return (list || []).map(function (a) {
        return a === me ? '<span class="me">' + esc(a) + "</span>" : esc(a);
      }).join(", ");
    }

    function pubHtml(p) {
      var title = p.url
        ? '<a href="' + safeHref(p.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + "</a>"
        : esc(p.title);
      var badges = [];
      if (p.highlight) badges.push('<span class="tag tag--accent">Highlight</span>');
      if (p.note) badges.push('<span class="tag">' + esc(p.note) + "</span>");
      if (p.url) badges.push('<a class="btn btn--ghost btn--sm" href="' + safeHref(p.url) + '" target="_blank" rel="noopener noreferrer">' + icon("external", 12) + " Link</a>");
      return '<article class="pub">' +
        "<div>" +
          '<div class="pub-title">' + title + "</div>" +
          '<div class="pub-authors">' + authorsHtml(p.authors) + "</div>" +
          '<div class="pub-venue">' + esc(p.venue) + "</div>" +
        "</div>" +
        '<div class="pub-badges">' + badges.join("") + "</div>" +
      "</article>";
    }

    var state = { q: "", type: "all" };

    function render() {
      var q = state.q.toLowerCase();
      var filtered = items.filter(function (p) {
        if (state.type !== "all" && p.type !== state.type) return false;
        if (!q) return true;
        var hay = (p.title + " " + (p.authors || []).join(" ") + " " + p.venue + " " + p.year).toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      el("pub-count").textContent = filtered.length + " of " + items.length;

      if (!filtered.length) {
        el("pub-results").innerHTML = '<div class="empty-state"><strong>No matching publications</strong>Try a different search term or filter.</div>';
        return;
      }

      var html = years.map(function (y) {
        var inYear = filtered.filter(function (p) { return p.year === y; });
        if (!inYear.length) return "";
        return '<div class="year-block"><div class="year-head">' + esc(y) + "</div>" + inYear.map(pubHtml).join("") + "</div>";
      }).join("");
      el("pub-results").innerHTML = html;
    }

    var search = el("pub-search");
    var debounce;
    search.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { state.q = search.value; render(); }, 140);
    });
    qsa("#type-chips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        qsa("#type-chips .chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        state.type = chip.getAttribute("data-type");
        render();
      });
    });

    render();
  }

  /* ------------------------------------------------------------ page: blog */

  function renderBlog(site, blog, news) {
    setMeta(blog.meta);
    var L = blog.labels || {};
    var tldrLabel = L.tldr || "TL;DR";
    var ctaLabel = L.cta || "Read the full post";

    var posts = (blog.posts || []).slice().sort(sortByDateDesc);
    /* A handful of posts read better as full-width features; a longer run wants a grid. */
    var wide = posts.length <= 2;

    var allTags = [];
    posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { if (allTags.indexOf(t) === -1) allTags.push(t); });
    });
    var showFilter = posts.length >= 4 && allTags.length >= 2;

    function tile(p) {
      var meta = [];
      if (p.date) meta.push(fmtDate(p.date));
      if (p.author) meta.push(esc(p.author));
      if (p.readingTime) meta.push(esc(p.readingTime));

      var extra = (p.links || []).map(function (l) {
        return '<a class="btn btn--ghost btn--sm" href="' + safeHref(l.href) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + "</a>";
      }).join("");

      return '<article class="tile' + (wide ? " tile--featured" : "") + '" data-reveal>' +
        (meta.length ? '<div class="tile-meta">' + meta.join('<span class="dot" aria-hidden="true">·</span>') + "</div>" : "") +
        "<h3>" + esc(p.title) + "</h3>" +
        (p.subtitle ? '<p class="tile-sub">' + esc(p.subtitle) + "</p>" : "") +
        (p.tldr ? '<div class="tldr"><span class="tldr-label">' + esc(tldrLabel) + "</span><p>" + esc(p.tldr) + "</p></div>" : "") +
        ((p.tags || []).length ? '<div class="tag-row">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
        '<div class="tile-actions">' +
          '<a class="btn btn--primary btn--sm" href="' + safeHref(p.url) + '" target="_blank" rel="noopener noreferrer">' +
            esc(ctaLabel) + icon("external", 13) +
          "</a>" + extra +
        "</div>" +
      "</article>";
    }

    var out = [pageHead(blog.header)];

    out.push('<section class="section"><div class="wrap">' +
      '<div class="tabs" role="tablist">' +
        '<button class="tab" type="button" role="tab" id="tab-blog" aria-controls="panel-blog" aria-selected="true">' + esc(blog.tabs.blogLabel) + "</button>" +
        '<button class="tab" type="button" role="tab" id="tab-news" aria-controls="panel-news" aria-selected="false">' + esc(blog.tabs.newsLabel) + "</button>" +
      "</div>" +

      '<div id="panel-blog" role="tabpanel" aria-labelledby="tab-blog">' +
        (showFilter ?
          '<div class="chip-row" id="tag-chips" style="margin-bottom:1.75rem" role="group" aria-label="Filter by topic">' +
            '<button class="chip" type="button" data-tag="all" aria-pressed="true">All topics</button>' +
            allTags.map(function (t) { return '<button class="chip" type="button" data-tag="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>"; }).join("") +
          "</div>" : "") +
        '<div id="post-list" class="tile-grid' + (wide ? " tile-grid--wide" : "") + '"></div>' +
        '<div id="tile-empty"></div>' +
      "</div>" +

      '<div id="panel-news" role="tabpanel" aria-labelledby="tab-news" hidden>' +
        newsListHtml((news.items || []).slice().sort(sortByDateDesc)) +
      "</div>" +
    "</div></section>");

    if (blog.resources && blog.resources.enabled !== false && (blog.resources.items || []).length) {
      out.push('<section class="section section--alt" id="resources"><div class="wrap" data-reveal>' +
        '<div class="section-head"><h2>' + esc(L.resourcesTitle || "Related resources") + "</h2></div>" +
        '<div class="card-grid card-grid--2">' + blog.resources.items.map(function (r) {
          return '<article class="card"><div class="card-icon">' + icon("doc", 19) + "</div>" +
            "<h3>" + esc(r.title) + "</h3><p>" + esc(r.detail) + "</p>" +
            '<p style="margin:1.1rem 0 0"><a class="textlink" href="' + safeHref(r.href) + '" target="_blank" rel="noopener noreferrer">' +
              esc(r.label) + '<span class="arrow">' + icon("external", 13) + "</span></a></p></article>";
        }).join("") + "</div></div></section>");
    }

    qs("main").innerHTML = out.join("");

    var tag = "all";
    function matches(p) { return tag === "all" || (p.tags || []).indexOf(tag) !== -1; }

    function renderTiles() {
      var shown = posts.filter(matches);
      el("post-list").innerHTML = shown.map(tile).join("");
      el("tile-empty").innerHTML = shown.length ? "" :
        '<div class="empty-state"><strong>Nothing here yet</strong>No posts match that topic.</div>';
      reveal();
    }

    qsa("#tag-chips .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        qsa("#tag-chips .chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        tag = chip.getAttribute("data-tag");
        renderTiles();
      });
    });
    renderTiles();

    function selectTab(which) {
      var isBlog = which === "blog";
      el("tab-blog").setAttribute("aria-selected", String(isBlog));
      el("tab-news").setAttribute("aria-selected", String(!isBlog));
      el("panel-blog").hidden = !isBlog;
      el("panel-news").hidden = isBlog;
    }
    el("tab-blog").addEventListener("click", function () { selectTab("blog"); });
    el("tab-news").addEventListener("click", function () { selectTab("news"); });
    if (window.location.hash === "#news") selectTab("news");
  }

  /* ------------------------------------------------------------ page: join */

  function renderJoin(site, join) {
    setMeta(join.meta);
    var out = [pageHead(join.header)];

    out.push('<section class="section"><div class="wrap">' +
      '<div class="section-head"><span class="eyebrow">Open positions</span><h2>Where we have room</h2></div>' +
      (join.positions || []).map(function (p) {
        var ext = p.action && /^(https?|mailto):/i.test(p.action.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
        return '<article class="position" data-reveal>' +
          '<div class="position-head">' +
            "<h3>" + esc(p.title) + "</h3>" +
            '<span class="tag tag--ok">' + esc(p.status) + "</span>" +
            '<span class="position-summary">' + esc(p.summary) + "</span>" +
          "</div>" +
          '<div class="position-body">' +
            (p.details || []).map(function (d) { return "<p>" + esc(d) + "</p>"; }).join("") +
            (p.action ? '<a class="btn btn--ghost btn--sm" href="' + safeHref(p.action.href) + '"' + ext + ' style="margin-top:.5rem">' + esc(p.action.label) + "</a>" : "") +
          "</div></article>";
      }).join("") +
    "</div></section>");

    if (join.expectations && join.expectations.enabled !== false) {
      out.push('<section class="section section--alt"><div class="wrap split" data-reveal>' +
        "<div><h2>" + esc(join.expectations.title) + "</h2>" +
        '<p class="lead">Research here sits between device physics, circuits, CAD, and architecture. These are the qualities that tend to matter more than any specific background.</p></div>' +
        '<ul class="checklist">' + join.expectations.items.map(function (i) {
          return '<li><span class="tick">' + icon("check", 11) + "</span><span>" + esc(i) + "</span></li>";
        }).join("") + "</ul></div></section>");
    }

    out.push('<section class="section" id="interest-form"><div class="wrap" style="max-width:860px">' +
      '<div class="section-head"><span class="eyebrow">Sign up</span><h2>' + esc(join.form.title) + "</h2>" +
      '<p class="lead">' + esc(join.form.lead) + "</p></div>" +
      formHtml(join.form, "join-form") +
    "</div></section>");

    if (join.faq && join.faq.enabled !== false) {
      out.push('<section class="section section--alt"><div class="wrap" style="max-width:860px" data-reveal>' +
        "<h2>" + esc(join.faq.title) + "</h2><div style=\"margin-top:1.5rem\">" +
        join.faq.items.map(function (f, i) {
          return '<div class="faq-item" data-open="false">' +
            '<button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-a-' + i + '">' + esc(f.q) + icon("plus", 14) + "</button>" +
            '<div class="faq-a" id="faq-a-' + i + '">' + esc(f.a) + "</div></div>";
        }).join("") + "</div></div></section>");
    }

    qs("main").innerHTML = out.join("");
    wireForm("join-form", join.form);

    qsa(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var open = item.getAttribute("data-open") === "true";
        item.setAttribute("data-open", String(!open));
        btn.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  /* --------------------------------------------------------- page: contact */

  function renderContact(site, contact) {
    setMeta(contact.meta);
    var out = [pageHead(contact.header)];

    out.push('<section class="section"><div class="wrap">' +
      '<div class="contact-cards">' + (contact.cards || []).map(function (c) {
        var ext = /^https?:/i.test(c.action.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
        return '<article class="card contact-card" data-reveal>' +
          '<div class="card-icon">' + icon(c.icon, 19) + "</div>" +
          "<h3>" + esc(c.title) + "</h3>" +
          "<address>" + (c.lines || []).map(esc).join("<br>") + "</address>" +
          (c.action ? '<p style="margin-top:1rem;margin-bottom:0"><a class="textlink" href="' + safeHref(c.action.href) + '"' + ext + ">" + esc(c.action.label) + '<span class="arrow">' + icon("arrow", 13) + "</span></a></p>" : "") +
        "</article>";
      }).join("") + "</div></div></section>");

    if (contact.map && contact.map.enabled !== false) {
      out.push('<section class="section section--tight"><div class="wrap"><div class="map-frame" data-reveal>' +
        '<iframe src="' + safeHref(contact.map.embedUrl) + '" title="' + esc(contact.map.title) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '<div class="map-caption"><span>' + esc(contact.map.title) + "</span>" +
          '<a class="textlink" href="' + safeHref(contact.map.linkUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(contact.map.linkLabel) + '<span class="arrow">' + icon("external", 13) + "</span></a>" +
        "</div></div></div></section>");
    }

    if (contact.enquiries && contact.enquiries.enabled !== false) {
      out.push('<section class="section section--alt"><div class="wrap" data-reveal>' +
        '<div class="section-head"><h2>' + esc(contact.enquiries.title) + "</h2></div>" +
        contact.enquiries.items.map(function (i) {
          var ext = /^(https?|mailto):/i.test(i.action.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return '<div class="enquiry-row"><span class="enquiry-type">' + esc(i.type) + "</span>" +
            "<p>" + esc(i.detail) + "</p>" +
            '<a class="btn btn--ghost btn--sm" href="' + safeHref(i.action.href) + '"' + ext + ">" + esc(i.action.label) + "</a></div>";
        }).join("") + "</div></section>");
    }

    out.push('<section class="section"><div class="wrap split">' +
      "<div>" +
        (contact.quickForm && contact.quickForm.enabled !== false ?
          '<div class="section-head"><h2>' + esc(contact.quickForm.title) + "</h2>" +
          '<p class="lead">' + esc(contact.quickForm.lead) + "</p></div>" +
          formHtml(contact.quickForm, "contact-form") : "") +
      "</div>" +
      "<div>" +
        "<h3>" + esc(contact.mailing.title) + "</h3>" +
        '<address style="font-style:normal;color:var(--muted);font-size:.92rem;line-height:1.7">' + contact.mailing.lines.map(esc).join("<br>") + "</address>" +
        (contact.directions && contact.directions.enabled !== false ?
          '<h3 style="margin-top:2.25rem">' + esc(contact.directions.title) + "</h3>" +
          '<ul class="checklist" style="margin-top:1rem">' + contact.directions.items.map(function (d) {
            return '<li><span class="tick">' + icon("pin", 11) + '</span><span><strong style="color:var(--text)">' + esc(d.label) + ".</strong> " + esc(d.text) + "</span></li>";
          }).join("") + "</ul>" : "") +
      "</div>" +
    "</div></section>");

    qs("main").innerHTML = out.join("");
    if (contact.quickForm && contact.quickForm.enabled !== false) wireForm("contact-form", contact.quickForm);
  }

  /* ----------------------------------------------------------------- boot */

  var ROUTES = {
    home:         { needs: ["home.json", "news.json"], render: function (s, d) { renderHome(s, d[0], d[1]); } },
    people:       { needs: ["people.json"],            render: function (s, d) { renderPeople(s, d[0]); } },
    publications: { needs: ["publications.json"],      render: function (s, d) { renderPublications(s, d[0]); } },
    blog:         { needs: ["blog.json", "news.json"], render: function (s, d) { renderBlog(s, d[0], d[1]); } },
    join:         { needs: ["join.json"],              render: function (s, d) { renderJoin(s, d[0]); } },
    contact:      { needs: ["contact.json"],           render: function (s, d) { renderContact(s, d[0]); } }
  };

  function boot() {
    var page = document.body.getAttribute("data-page") || "home";
    var route = ROUTES[page];
    if (!route) { bootError(new Error('Unknown page "' + page + '"')); return; }

    loadJSON("site.json").then(function (site) {
      Theme.fallback = (site.theme && site.theme.default) || "light";
      Theme.apply(Theme.resolved());
      renderHeader(site);
      renderFooter(site);
      return Promise.all(route.needs.map(loadJSON)).then(function (data) {
        route.render(site, data);
        reveal();
      });
    }).catch(bootError);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
