var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

// assets/customer-ui/js/surfaces/iching-customer-entry.js
var iching_customer_entry_exports = {};
function render() {
  if (!button) return;
  button.disabled = !ready;
  button.textContent = ready ? text("Start an I Ching reading", "\u5F00\u59CB\u6613\u7ECF\u9605\u8BFB") : text("Reading temporarily unavailable", "\u9605\u8BFB\u6682\u65F6\u4E0D\u53EF\u7528");
  const hint = button.previousElementSibling;
  if (hint?.classList?.contains("cx-muted")) hint.textContent = text("Ask one clear question, choose a casting method, and then read the primary hexagram, changing lines, and relating hexagram in order.", "\u5199\u4E0B\u4E00\u4E2A\u6E05\u695A\u7684\u95EE\u9898\uFF0C\u9009\u62E9\u8D77\u5366\u65B9\u5F0F\uFF0C\u518D\u6309\u987A\u5E8F\u9605\u8BFB\u672C\u5366\u3001\u53D8\u723B\u4E0E\u4E4B\u5366\u3002");
}
var button, card, text, ready;
var init_iching_customer_entry = __esm({
  "assets/customer-ui/js/surfaces/iching-customer-entry.js"() {
    button = document.querySelector("[data-iching-full-entry]");
    card = document.querySelector("[data-iching-availability-title]")?.closest("aside");
    text = (en, zh) => String(document.documentElement.lang || "").toLowerCase().startsWith("zh") ? zh : en;
    ready = false;
    if (card) card.remove();
    button?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (ready) location.assign("/perspectives/iching/consult/");
    }, true);
    fetch("/api/iching-full-production-status", { cache: "no-store", headers: { accept: "application/json" } }).then((r) => r.json()).then((payload) => {
      ready = payload?.production?.runAllowed === true && payload?.production?.globalPublicExecution === true;
      render();
    }).catch(() => render());
    window.addEventListener("phios:localechange", render);
    render();
  }
});

// assets/customer-ui/js/surfaces/iching-run-cutover.js
var iching_run_cutover_exports = {};
var init_iching_run_cutover = __esm({
  "assets/customer-ui/js/surfaces/iching-run-cutover.js"() {
    if (document.body.dataset.cxSurface === "ICHING_FULL_PRODUCTION") {
      document.body.dataset.ichingRunCutover = "redirecting";
      document.documentElement.style.visibility = "hidden";
      location.replace("/perspectives/iching/consult/");
    }
  }
});

// assets/customer-ui/js/surfaces/ritual-sequence.js
function startRitual(host, { kind = "tarot", zh = false } = {}) {
  const panel = document.createElement("section");
  panel.className = "cx-ritual";
  panel.style.cssText = "width:100%;box-sizing:border-box;padding:24px;background:#171d22;color:#f5e6b8;border-radius:16px;margin:20px 0";
  const canvas = document.createElement("canvas");
  canvas.width = 1e3;
  canvas.height = 500;
  canvas.style.cssText = "display:block;width:100%;height:auto";
  canvas.setAttribute("aria-hidden", "true");
  const label = document.createElement("p");
  label.setAttribute("role", "status");
  const progress = document.createElement("progress");
  progress.max = RITUAL_DURATION_MS;
  progress.style.width = "100%";
  progress.setAttribute("aria-label", zh ? "\u4EEA\u5F0F\u8FDB\u5EA6" : "Sequence progress");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = zh ? "\u53D6\u6D88\u672C\u6B21\u8FC7\u7A0B" : "Cancel this sequence";
  const proceed = document.createElement("button");
  proceed.type = "button";
  proceed.textContent = zh ? "\u7ACB\u5373\u7EE7\u7EED" : "Continue now";
  panel.append(label, canvas, progress, proceed, cancel);
  host.before(panel);
  const ctx = canvas.getContext("2d"), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let audio, frame, ended = false, lastCue = -1, lastLabel = "", resolveDone;
  const done = new Promise((resolve) => resolveDone = resolve);
  try {
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (Audio) {
      audio = new Audio();
      audio.resume().catch(() => {
      });
    }
  } catch {
  }
  function cue(coin) {
    if (!audio || audio.state !== "running") return;
    const now = audio.currentTime, gain = audio.createGain();
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(1e-4, now);
    gain.gain.exponentialRampToValueAtTime(coin ? 0.065 : 0.045, now + 6e-3);
    gain.gain.exponentialRampToValueAtTime(1e-4, now + 0.16);
    if (coin) {
      const o = audio.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(1200, now);
      o.frequency.exponentialRampToValueAtTime(430, now + 0.14);
      o.connect(gain);
      o.start(now);
      o.stop(now + 0.17);
    } else {
      const b = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.17), audio.sampleRate), a = b.getChannelData(0);
      for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
      const s = audio.createBufferSource(), f = audio.createBiquadFilter();
      s.buffer = b;
      f.type = "bandpass";
      f.frequency.value = 1800;
      s.connect(f).connect(gain);
      s.start(now);
      s.stop(now + 0.17);
    }
  }
  function stop(completed = false) {
    if (ended) return;
    ended = true;
    cancelAnimationFrame(frame);
    if (audio && audio.state !== "closed") audio.close().catch(() => {
    });
    document.removeEventListener("visibilitychange", hidden);
    window.removeEventListener("pagehide", pagehide);
    panel.remove();
    resolveDone(completed);
  }
  function hidden() {
    if (document.hidden) stop(kind === "tarot");
  }
  const pagehide = () => stop(false);
  window.addEventListener("pagehide", pagehide, { once: true });
  document.addEventListener("visibilitychange", hidden);
  cancel.onclick = () => stop(false);
  proceed.onclick = () => stop(true);
  const start = performance.now();
  function tick(now) {
    if (ended) return;
    const elapsed = Math.min(now - start, RITUAL_DURATION_MS), p = elapsed / RITUAL_DURATION_MS;
    progress.value = elapsed;
    ctx.clearRect(0, 0, 1e3, 500);
    ctx.fillStyle = "#25302f";
    ctx.beginPath();
    ctx.ellipse(500, 285, 460, 195, 0, 0, Math.PI * 2);
    ctx.fill();
    const cycle = kind === "tarot" ? RITUAL_DURATION_MS : RITUAL_DURATION_MS / 6, phase = elapsed % cycle / cycle, round = Math.min(kind === "tarot" ? 0 : 5, Math.floor(elapsed / cycle));
    const phaseName = kind === "tarot" ? phase < 0.25 ? zh ? "\u5206\u724C" : "Cut" : phase < 0.65 ? zh ? "\u4EA4\u9519\u6D17\u724C" : "Interleave" : zh ? "\u6536\u62E2\u724C\u5806" : "Gather" : phase < 0.25 ? zh ? "\u805A\u62E2\u94DC\u94B1" : "Gather coins" : phase < 0.7 ? zh ? "\u629B\u63B7\u94DC\u94B1" : "Toss coins" : zh ? "\u843D\u5B9A" : "Settle";
    const text2 = (kind === "tarot" ? zh ? "\u6D17\u724C" : "Shuffling" : zh ? "\u8D77\u5366 \xB7 \u7B2C " + (round + 1) + " \u8F6E" : "Casting \xB7 round " + (round + 1)) + " \xB7 " + phaseName + " \xB7 " + Math.ceil((RITUAL_DURATION_MS - elapsed) / 1e3) + "s";
    if (text2 !== lastLabel) {
      label.textContent = text2;
      lastLabel = text2;
    }
    if (kind === "tarot") {
      const split = phase < 0.25 ? phase / 0.25 : phase < 0.65 ? 1 - (phase - 0.25) / 0.4 : 0;
      for (let i = 0; i < 32; i++) {
        const side = i % 2 ? 1 : -1, layer = Math.floor(i / 2), wave = phase > 0.25 && phase < 0.65 ? Math.sin((phase - 0.25) / 0.4 * Math.PI) : 0;
        const x = 500 + side * split * (reduced ? 70 : 235) + layer * 1.5, y = 270 - layer * 3 - wave * (i % 4) * 9;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(reduced ? 0 : side * split * 0.24);
        ctx.fillStyle = "#102332";
        ctx.strokeStyle = "#c8a55c";
        ctx.lineWidth = 2;
        ctx.fillRect(-49, -77, 98, 154);
        ctx.strokeRect(-46, -74, 92, 148);
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 36, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (phase > 0.25 && phase < 0.65) {
        const cueId = round * 100 + Math.floor(phase * 40);
        if (cueId !== lastCue) {
          cue(false);
          lastCue = cueId;
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const flight = phase > 0.25 && phase < 0.7 ? Math.sin((phase - 0.25) / 0.45 * Math.PI) : 0, x = 380 + i * 120 + (i - 1) * flight * 35, y = 320 - flight * (reduced ? 30 : 195), squash = flight ? Math.max(0.16, Math.abs(Math.cos(phase * 45 + i))) : 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, reduced ? 1 : squash);
        ctx.fillStyle = "#b68a40";
        ctx.strokeStyle = "#f9dfa0";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#25302f";
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
      }
      if (phase >= 0.7 && lastCue !== round) {
        cue(true);
        lastCue = round;
      }
      ctx.fillStyle = "#f5e6b8";
      ctx.font = "20px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(zh ? "\u7531\u4E0B\u5F80\u4E0A\uFF0C\u4F9D\u6B21\u5F62\u6210\u516D\u723B" : "Six rounds, from the bottom line upward", 500, 455);
    }
    if (elapsed >= RITUAL_DURATION_MS) {
      window.removeEventListener("pagehide", pagehide);
      stop(true);
    } else frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return { done, stop: () => {
    window.removeEventListener("pagehide", pagehide);
    stop(false);
  } };
}
var RITUAL_DURATION_MS;
var init_ritual_sequence = __esm({
  "assets/customer-ui/js/surfaces/ritual-sequence.js"() {
    RITUAL_DURATION_MS = 1800;
  }
});

// assets/customer-ui/js/surfaces/iching-full.js
async function loadContext() {
  try {
    const response = await fetch("/api/iching-full-context", { cache: "no-store" });
    contextPayload = await response.json();
    if (!contextPayload?.ok) throw new Error("CONTEXT_UNAVAILABLE");
    q("[data-iching-production-state]").textContent = human(contextPayload.production.state);
    const disclosure = contextPayload.realityContext;
    q("[data-reality-context-disclosure]").innerHTML = `<strong>${escape(disclosure.label)}</strong>${disclosure.contextItems?.length ? `<ul>${disclosure.contextItems.map((x) => `<li>${escape(x.label)}: ${escape(x.value)}</li>`).join("")}</ul>` : ""}`;
    q("[data-iching-execute]").disabled = contextPayload.production?.runAllowed !== true;
    q("[data-iching-save]").disabled = !(contextPayload.guest?.saveContractAvailable && currentView);
    q("[data-save-status]").textContent = contextPayload.guest?.saveContractAvailable ? localeText("Guest saving is available after explicit retention consent; nothing is saved automatically.", "\u8BBF\u5BA2\u53EF\u4EE5\u5728\u660E\u786E\u540C\u610F\u4FDD\u5B58\u540E\u4FDD\u7559\u8FD9\u6B21\u9605\u8BFB\uFF1B\u7CFB\u7EDF\u4E0D\u4F1A\u81EA\u52A8\u4FDD\u5B58\u3002") : localeText("Guest saving is not available on this deployment.", "\u8FD9\u4E2A\u90E8\u7F72\u76EE\u524D\u6CA1\u6709\u5F00\u653E\u8BBF\u5BA2\u4FDD\u5B58\u3002");
  } catch {
    q("[data-execution-status]").textContent = localeText("Method context is unavailable. No execution was started.", "\u65B9\u6CD5\u4E0A\u4E0B\u6587\u76EE\u524D\u4E0D\u53EF\u7528\uFF0C\u7CFB\u7EDF\u6CA1\u6709\u542F\u52A8\u6267\u884C\u3002");
  }
}
function list(items, { empty = "\u2014" } = {}) {
  const values = arr(items).filter(Boolean);
  if (!values.length) return `<p class="sp-empty">${escape(empty)}</p>`;
  return `<ul class="sp-detail-list">${values.map((value) => `<li>${typeof value === "string" ? escape(value) : escape(value.statement || value.reason || JSON.stringify(value))}</li>`).join("")}</ul>`;
}
function lineName(value) {
  return { 6: localeText("old yin \xB7 changing", "\u8001\u9634 \xB7 \u53D8\u723B"), 7: localeText("young yang \xB7 stable", "\u5C11\u9633 \xB7 \u9759\u723B"), 8: localeText("young yin \xB7 stable", "\u5C11\u9634 \xB7 \u9759\u723B"), 9: localeText("old yang \xB7 changing", "\u8001\u9633 \xB7 \u53D8\u723B") }[Number(value)] || String(value ?? "\u2014");
}
function lineGlyph(bit) {
  return Number(bit) === 1 ? '<span class="ich-line-glyph ich-line-glyph--yang" aria-label="yang line"></span>' : '<span class="ich-line-glyph ich-line-glyph--yin" aria-label="yin line"><i></i><i></i></span>';
}
function evidenceMarkup(data = {}) {
  const lines = arr(data.sixLines);
  return `<div class="sp-evidence-grid"><div><span>${localeText("Input mode", "\u8F93\u5165\u65B9\u5F0F")}</span><strong>${escape(human(data.inputMode || "MANUAL_LINES"))}</strong></div><div><span>${localeText("Line order", "\u723B\u5E8F")}</span><strong>${escape(human(data.lineOrder || "BOTTOM_TO_TOP"))}</strong></div><div><span>${localeText("AI selected", "AI \u9009\u62E9")}</span><strong>${data.aiSelected === true ? localeText("Yes", "\u662F") : localeText("No", "\u5426")}</strong></div><div><span>${localeText("Rerolled in calculation", "\u8BA1\u7B97\u5185\u91CD\u63B7")}</span><strong>${data.rerolledInsideCalculation === true ? localeText("Yes", "\u662F") : localeText("No", "\u5426")}</strong></div></div><ol class="ich-six-line-evidence">${lines.map((item, index) => {
    const value = typeof item === "object" ? item.lineValue : item;
    const changing = typeof item === "object" ? item.changing : Number(value) === 6 || Number(value) === 9;
    return `<li><span>${index + 1}</span><strong>${escape(value)}</strong><small>${escape(lineName(value))}</small>${changing ? `<em>${localeText("changing", "\u53D8")}</em>` : ""}</li>`;
  }).join("")}</ol>`;
}
function projectionMarkup(data = {}) {
  const primary = data.primary || {}, relating = data.relating || {}, lines = arr(data.lines);
  const figure = (hex, label, bits) => `<article class="ich-hexagram"><p class="sp-kicker">${escape(label)}</p><h4>${escape(hex.number || "\u2014")} \xB7 ${escape(hex.chineseNameZhHans || hex.chineseName || "")} ${escape(hex.canonicalName || "")}</h4><div class="ich-hexagram-lines">${[...bits].reverse().map((bit, index) => `<div><small>${6 - index}</small>${lineGlyph(bit)}</div>`).join("")}</div><p>${escape(hex.lowerTrigramId || "\u2014")} \u2192 ${escape(hex.upperTrigramId || "\u2014")}</p></article>`;
  const primaryBits = lines.length ? lines.map((x) => x.primaryBit) : String(primary.binary || "").split("").map(Number);
  const relatingBits = lines.length ? lines.map((x) => x.relatingBit) : String(relating.binary || "").split("").map(Number);
  return `<div class="ich-hexagram-grid">${figure(primary, localeText("Primary hexagram", "\u672C\u5366"), primaryBits)}${figure(relating, localeText("Relating hexagram", "\u4E4B\u5366"), relatingBits)}</div><p class="sp-boundary-note">${localeText(`Changing lines: ${arr(data.changingLines).join(", ") || "none"}`, `\u53D8\u723B\uFF1A${arr(data.changingLines).join("\u3001") || "\u65E0"}`)}</p>`;
}
function interpretationMarkup(data = {}) {
  const pattern = data.structuralPattern || {}, tension = data.possibleTension || {}, transition = data.possibleTransition || {};
  const candidates = arr(data.commentaryCandidates || tension.candidates);
  return `<article class="sp-perspective-card"><header><div><p class="sp-kicker">${localeText("Source-bound lens", "\u6765\u6E90\u7EA6\u675F\u89C6\u89D2")}</p><h4>${escape(pattern.primaryHexagramId || "I Ching")}</h4></div><span class="sp-status">${escape(human(data.coverage?.primary || tension.status || "UNKNOWN"))}</span></header><section><h5>${localeText("Structural pattern", "\u7ED3\u6784\u6A21\u5F0F")}</h5><p>${escape(pattern.primaryHexagramId || "\u2014")} \u2192 ${escape(pattern.relatingHexagramId || transition.toHexagramId || "\u2014")}</p><p>${localeText("Changing lines", "\u53D8\u723B")}: ${escape(arr(pattern.changingLines || transition.changingLines).join(", ") || localeText("none", "\u65E0"))}</p></section><section><h5>${localeText("Source-bound commentary", "\u6765\u6E90\u7EA6\u675F\u91CA\u4E49")}</h5>${candidates.length ? list(candidates.map((item) => ({ statement: `${item.sourceId} \xB7 ${item.linePosition ? `line ${item.linePosition} \xB7 ` : ""}${item.claim}` }))) : `<p class="sp-empty" data-source-gap-state="SOURCE_COMMENTARY_NOT_YET_INGESTED">${localeText("Canonical structure is available; source commentary has not yet been ingested for this hexagram.", "\u89C4\u8303\u7ED3\u6784\u53EF\u7528\uFF1B\u6B64\u5366\u7684\u6765\u6E90\u91CA\u4E49\u5C1A\u672A\u5F55\u5165\u3002")}</p>`}</section><section><h5>${localeText("Boundary", "\u8FB9\u754C")}</h5><p>${localeText("This is a symbolic lens, not a fact, diagnosis, directive, or guaranteed prediction.", "\u8FD9\u662F\u8C61\u5F81\u89C6\u89D2\uFF0C\u4E0D\u662F\u4E8B\u5B9E\u3001\u8BCA\u65AD\u3001\u6307\u4EE4\u6216\u4FDD\u8BC1\u6027\u9884\u6D4B\u3002")}</p></section></article>`;
}
function realityMarkup(data = {}) {
  const groups = [[localeText("Supporting evidence", "\u652F\u6301\u8BC1\u636E"), data.supportingEvidence], [localeText("Contradictory evidence", "\u77DB\u76FE\u8BC1\u636E"), data.contradictoryEvidence], [localeText("Unknown", "\u672A\u77E5"), data.unknown], [localeText("Observation", "\u89C2\u5BDF"), data.observation]];
  return `<div class="sp-rcc-grid">${groups.map(([label, items]) => `<section><h4>${escape(label)}</h4>${list(items, { empty: localeText("None supplied.", "\u672A\u63D0\u4F9B\u3002") })}</section>`).join("")}</div><p class="sp-boundary-note">${localeText("An I Ching hexagram is not Reality evidence. Reality may support, contradict, or leave the reflection unresolved.", "\u6613\u7ECF\u5366\u8C61\u4E0D\u662F\u73B0\u5B9E\u8BC1\u636E\u3002\u73B0\u5B9E\u53EF\u4EE5\u652F\u6301\u3001\u53CD\u9A73\uFF0C\u6216\u8BA9\u8FD9\u4E2A\u89C6\u89D2\u4FDD\u6301\u672A\u51B3\u3002")}</p>`;
}
function uncertaintyMarkup(data) {
  const items = arr(data);
  return items.length ? `<div class="sp-uncertainty-list">${items.map((item) => `<article><strong>${escape(human(item.status || "UNKNOWN"))}</strong><p>${escape(human(item.reason || ""))}</p></article>`).join("")}</div>` : `<p class="sp-empty">${localeText("No single Reality conclusion is authorized.", "\u7CFB\u7EDF\u6CA1\u6709\u88AB\u6388\u6743\u7ED9\u51FA\u5355\u4E00\u73B0\u5B9E\u7ED3\u8BBA\u3002")}</p>`;
}
function nextMarkup(data) {
  return list(arr(data).map((item) => typeof item === "object" ? isZh() ? item.zhHans : item.en : item).filter(Boolean), { empty: localeText("No next question is prescribed.", "\u6CA1\u6709\u88AB\u89C4\u5B9A\u7684\u4E0B\u4E00\u6B65\u95EE\u9898\u3002") });
}
function renderLayer(id, data) {
  if (id === "YOUR_INPUT") return `<blockquote class="sp-question">${escape(data?.question || "")}</blockquote>`;
  if (id === "METHOD_EVIDENCE") return evidenceMarkup(data);
  if (id === "PROJECTION") return projectionMarkup(data);
  if (id === "SYMBOLIC_INTERPRETATION") return interpretationMarkup(data);
  if (id === "REALITY_COMPARISON") return realityMarkup(data);
  if (id === "WHAT_REMAINS_UNCERTAIN") return uncertaintyMarkup(data);
  if (id === "POSSIBLE_NEXT_QUESTIONS_ACTIONS") return nextMarkup(data);
  return `<pre>${escape(JSON.stringify(data, null, 2))}</pre>`;
}
function sourceMarkup(source = {}) {
  const units = arr(source.sourceUnits);
  return `<article class="sp-source-card"><header><div><p class="sp-kicker">${escape(source.perspectiveClass || source.perspectiveId || "SOURCE")}</p><h4>${escape(source.sourceTitle || source.sourceId || "Source")}</h4></div><span class="sp-status">${escape(human(source.availability || "UNKNOWN"))}</span></header><dl><div><dt>${localeText("Source ID", "\u6765\u6E90 ID")}</dt><dd>${escape(source.sourceId || "\u2014")}</dd></div><div><dt>${localeText("Edition", "\u7248\u672C")}</dt><dd>${escape(source.sourceEdition || "\u2014")}</dd></div><div><dt>${localeText("Authority", "\u6743\u5A01\u5C42\u7EA7")}</dt><dd>${escape(source.authorityTier || "\u2014")}</dd></div><div><dt>${localeText("Rights", "\u6743\u5229\u72B6\u6001")}</dt><dd>${escape(source.rightsClass || "\u2014")}</dd></div></dl>${units.length ? `<ul class="sp-source-units">${units.map((unit) => `<li><span>${escape(unit.unitType || "SOURCE UNIT")}</span><strong>${escape(unit.sourceHeading || "")}</strong>${unit.sourceLocator ? `<small>${escape(unit.sourceLocator)}</small>` : ""}${unit.sourceUrl ? `<a href="${escape(unit.sourceUrl)}" target="_blank" rel="noopener noreferrer">${localeText("Open source locator", "\u6253\u5F00\u6765\u6E90\u5B9A\u4F4D")}</a>` : ""}</li>`).join("")}</ul>` : ""}</article>`;
}
function renderIChingView(view) {
  currentView = view;
  const results = q("[data-iching-results]");
  results.hidden = false;
  for (const layer of view.hierarchy || []) {
    const target = q(`[data-result-layer="${layer.id}"] [data-result-content]`);
    if (target) target.innerHTML = renderLayer(layer.id, layer.data);
  }
  const sources = view.sourceVisibility?.sources || [];
  q("[data-source-list]").innerHTML = sources.length ? sources.map(sourceMarkup).join("") : `<p class="sp-empty">${localeText("No source commentary is available for this projection.", "\u6B64\u6295\u5C04\u6682\u65E0\u6765\u6E90\u91CA\u4E49\u3002")}</p>`;
  q("[data-complex-journey]").hidden = view.complexCaseHandoff?.show !== true;
  q("[data-iching-save]").disabled = !contextPayload?.guest?.saveContractAvailable;
  results.focus({ preventScroll: true });
}
async function execute() {
  const button2 = q("[data-iching-execute]");
  if (button2?.disabled) return;
  const question2 = q("[data-iching-question]")?.value?.trim();
  if (!question2) {
    q("[data-execution-status]").textContent = localeText("Add a question before continuing.", "\u8BF7\u5148\u586B\u5199\u4F60\u60F3\u7406\u89E3\u7684\u95EE\u9898\u3002");
    q("[data-iching-question]")?.focus();
    return;
  }
  const lines = qa("[data-iching-line]").sort((a, b) => Number(a.dataset.ichingLine) - Number(b.dataset.ichingLine)).map((item) => Number(item.value));
  button2.disabled = true;
  q("[data-execution-status]").textContent = localeText("Preparing the governed perspective\u2026", "\u6B63\u5728\u51C6\u5907\u53D7\u6CBB\u7406\u7684\u8C61\u5F81\u89C6\u89D2\u2026\u2026");
  try {
    const response = await fetch("/api/iching-full-execute", { method: "POST", headers: { "content-type": "application/json", "accept": "application/json" }, cache: "no-store", body: JSON.stringify({ method: "I_CHING", question: question2, inputMode: "MANUAL_LINES", lines, sessionId: globalThis.crypto?.randomUUID?.() || `ICH-${Date.now()}`, timestamp: (/* @__PURE__ */ new Date()).toISOString(), projectionVersion: "1.0.0", useCurrentRealityContext: q("[data-use-reality-context]")?.checked === true }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error?.code || "EXECUTION_UNAVAILABLE");
    renderIChingView(payload.publicView);
    q("[data-execution-status]").textContent = "";
  } catch (error) {
    q("[data-execution-status]").textContent = localeText(`Execution remains unavailable: ${error.message}`, `\u6267\u884C\u4ECD\u4E0D\u53EF\u7528\uFF1A${error.message}`);
  } finally {
    button2.disabled = contextPayload?.production?.runAllowed !== true;
  }
}
var q, qa, contextPayload, currentView, escape, arr, isZh, localeText, human;
var init_iching_full = __esm({
  "assets/customer-ui/js/surfaces/iching-full.js"() {
    q = (selector) => document.querySelector(selector);
    qa = (selector) => [...document.querySelectorAll(selector)];
    contextPayload = null;
    currentView = null;
    escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    arr = (value) => Array.isArray(value) ? value : [];
    isZh = () => String(document.documentElement.lang || "").toLowerCase().startsWith("zh");
    localeText = (en, zh) => isZh() ? zh : en;
    human = (value) => String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    q("[data-view-sources]")?.addEventListener("click", (event) => {
      const list2 = q("[data-source-list]");
      const open = list2.hidden;
      list2.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    q("[data-iching-execute]")?.addEventListener("click", execute);
    q("[data-iching-save]")?.addEventListener("click", async () => {
      if (!currentView) return;
      const consent = globalThis.confirm(localeText("Save this reading to a signed guest session for the stated retention period? Nothing is saved unless you choose OK.", "\u662F\u5426\u628A\u8FD9\u6B21\u9605\u8BFB\u4FDD\u5B58\u5230\u7B7E\u540D\u8BBF\u5BA2\u4F1A\u8BDD\uFF0C\u5E76\u6309\u9875\u9762\u8BF4\u660E\u7684\u4FDD\u7559\u671F\u9650\u4FDD\u5B58\uFF1F\u53EA\u6709\u4F60\u9009\u62E9\u201C\u786E\u5B9A\u201D\u540E\u624D\u4F1A\u4FDD\u5B58\u3002"));
      if (!consent) {
        q("[data-save-status]").textContent = localeText("Not saved.", "\u672A\u4FDD\u5B58\u3002");
        return;
      }
      const body = { question: q("[data-iching-question]").value, methodEvidence: currentView.hierarchy?.[1]?.data, projection: currentView.hierarchy?.[2]?.data, reading: currentView, userNotes: "", retentionConsent: { accepted: true, scope: "SYMBOLIC_READING", policyVersion: "ICHING-GUEST-RETENTION-v1" } };
      const response = await fetch("/api/iching-full-save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null);
      q("[data-save-status]").textContent = payload?.ok ? localeText("Saved to this guest session.", "\u5DF2\u4FDD\u5B58\u5230\u5F53\u524D\u8BBF\u5BA2\u4F1A\u8BDD\u3002") : payload?.error?.code || localeText("Save unavailable.", "\u6682\u65F6\u65E0\u6CD5\u4FDD\u5B58\u3002");
    });
    window.addEventListener("phios:localechange", () => {
      loadContext();
      if (currentView) renderIChingView(currentView);
    });
    loadContext();
  }
});

// assets/customer-ui/js/surfaces/iching-casting.js
var iching_casting_exports = {};
function installStyles() {
  if (document.querySelector("link[data-iching-casting-style]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/assets/customer-ui/surfaces/iching-casting.css";
  link.dataset.ichingCastingStyle = "";
  document.head.append(link);
}
function lineName2(value) {
  return {
    6: t("old yin \xB7 changing", "\u8001\u9634 \xB7 \u53D8\u723B"),
    7: t("young yang \xB7 stable", "\u5C11\u9633 \xB7 \u9759\u723B"),
    8: t("young yin \xB7 stable", "\u5C11\u9634 \xB7 \u9759\u723B"),
    9: t("old yang \xB7 changing", "\u8001\u9633 \xB7 \u53D8\u723B")
  }[Number(value)] || String(value);
}
function lineMark(value) {
  return { 6: "\u268B \xD7", 7: "\u268A", 8: "\u268B", 9: "\u268A \u25CB" }[Number(value)] || "\u2014";
}
function status(message = "") {
  const node = q2("[data-iching-casting-status]");
  if (node) node.textContent = message;
}
function question() {
  return normalize(q2("[data-iching-question]")?.value);
}
function executeButton() {
  return q2("[data-iching-execute]");
}
function modeLabel(next) {
  return {
    SYSTEM_RANDOM: t("PHI OS casts for me", "PHI OS \u4E3A\u6211\u8D77\u5366"),
    MANUAL_LINES: t("I already have six lines", "\u6211\u5DF2\u7ECF\u8D77\u597D\u5366"),
    COIN_CAST: t("Record my three-coin tosses", "\u8BB0\u5F55\u6211\u7684\u6295\u5E01\u7ED3\u679C")
  }[next];
}
function setExecuteCopy() {
  const button2 = executeButton();
  if (!button2) return;
  if (mode === "SYSTEM_RANDOM") {
    button2.textContent = currentCast ? t("Explore this cast", "\u63A2\u7D22\u8FD9\u6B21\u5366\u8C61") : t("Cast first", "\u8BF7\u5148\u8D77\u5366");
    button2.disabled = !productionReady || !currentCast;
  } else if (mode === "COIN_CAST") {
    button2.textContent = t("Explore recorded coins", "\u63A2\u7D22\u5DF2\u8BB0\u5F55\u7684\u6295\u5E01\u7ED3\u679C");
    button2.disabled = !productionReady;
  } else {
    button2.textContent = t("Explore perspective", "\u63A2\u7D22\u89C6\u89D2");
    button2.disabled = !productionReady;
  }
}
function renderCast() {
  const node = q2("[data-iching-cast-result]");
  const repeat = q2("[data-iching-recast]");
  if (!node) return;
  if (!currentCast) {
    node.innerHTML = `<p class="cx-muted">${escape2(t(
      "No cast has been created yet. The question is used only to bind this evidence; it does not steer the random selection.",
      "\u5C1A\u672A\u5F62\u6210\u5366\u8C61\u3002\u95EE\u9898\u53EA\u7528\u4E8E\u7ED1\u5B9A\u8FD9\u4EFD\u8BC1\u636E\uFF0C\u4E0D\u4F1A\u53C2\u4E0E\u6216\u5F15\u5BFC\u968F\u673A\u53D6\u6837\u3002"
    ))}</p>`;
    if (repeat) repeat.hidden = true;
    return;
  }
  const lines = currentCast.selection?.selectedSymbols || [];
  const coins = currentCast.selection?.coinGroups || [];
  node.innerHTML = `
    <div class="cx-cast-evidence-head">
      <div>
        <span>${escape2(t("Cast ID", "\u8D77\u5366 ID"))}</span>
        <strong>${escape2(currentCast.castId)}</strong>
      </div>
      <div>
        <span>${escape2(t("Evidence digest", "\u8BC1\u636E\u6458\u8981"))}</span>
        <strong>${escape2(String(currentCast.randomSelectionEvidence?.entropyEvidence?.digest || "").slice(0, 16))}\u2026</strong>
      </div>
    </div>
    <ol class="cx-cast-lines">
      ${lines.map((value, index) => `<li>
        <span>${index + 1}${index === 0 ? ` \xB7 ${escape2(t("bottom", "\u521D\u723B"))}` : index === 5 ? ` \xB7 ${escape2(t("top", "\u4E0A\u723B"))}` : ""}</span>
        <strong class="cx-cast-line-mark">${escape2(lineMark(value))}</strong>
        <b>${escape2(value)} \xB7 ${escape2(lineName2(value))}</b>
        <small>${escape2((coins[index] || []).join(" + "))}</small>
      </li>`).join("")}
    </ol>
    <p class="cx-meta">${escape2(t(
    "This is one frozen sampling event. PHI OS did not choose a favorable hexagram and will not reroll it during calculation.",
    "\u8FD9\u662F\u4E00\u6B21\u5DF2\u7ECF\u51BB\u7ED3\u7684\u53D6\u6837\u4E8B\u4EF6\u3002PHI OS \u4E0D\u4F1A\u6311\u9009\u201C\u66F4\u597D\u201D\u7684\u5366\uFF0C\u4E5F\u4E0D\u4F1A\u5728\u8BA1\u7B97\u8FC7\u7A0B\u4E2D\u91CD\u65B0\u8D77\u5366\u3002"
  ))}</p>`;
  if (repeat) repeat.hidden = false;
}
function guideMarkup() {
  const lineRows = [
    [6, t("old yin", "\u8001\u9634"), "\u268B \xD7", t("changing yin \u2192 yang", "\u53D8\u723B\uFF1A\u9634 \u2192 \u9633")],
    [7, t("young yang", "\u5C11\u9633"), "\u268A", t("stable yang", "\u9759\u723B\uFF1A\u9633")],
    [8, t("young yin", "\u5C11\u9634"), "\u268B", t("stable yin", "\u9759\u723B\uFF1A\u9634")],
    [9, t("old yang", "\u8001\u9633"), "\u268A \u25CB", t("changing yang \u2192 yin", "\u53D8\u723B\uFF1A\u9633 \u2192 \u9634")]
  ];
  return `
    <div class="cx-cast-guide__intro">
      <p>${escape2(t(
    "You do not need to know the line numbers in advance. Every method ends with six values recorded from the bottom line to the top line.",
    "\u4F60\u4E0D\u9700\u8981\u9884\u5148\u61C2\u5F97 6\u30017\u30018\u30019\u3002\u65E0\u8BBA\u91C7\u7528\u54EA\u79CD\u65B9\u6CD5\uFF0C\u6700\u540E\u90FD\u628A\u516D\u4E2A\u723B\u503C\u6309\u201C\u521D\u723B\u5728\u4E0B\u3001\u4E0A\u723B\u5728\u4E0A\u201D\u8BB0\u5F55\u3002"
  ))}</p>
      <div class="cx-cast-guide__rule"><strong>${escape2(t("Always record bottom \u2192 top", "\u6C38\u8FDC\u4ECE\u4E0B\u5F80\u4E0A\u8BB0\u5F55"))}</strong><span>${escape2(t("1st result = bottom line \xB7 6th result = top line", "\u7B2C 1 \u6B21 = \u521D\u723B \xB7 \u7B2C 6 \u6B21 = \u4E0A\u723B"))}</span></div>
    </div>
    <section class="cx-cast-guide__section">
      <h4>${escape2(t("What do 6, 7, 8 and 9 mean?", "6\u30017\u30018\u30019 \u5206\u522B\u662F\u4EC0\u4E48\uFF1F"))}</h4>
      <div class="cx-cast-guide__table" role="table" aria-label="${escape2(t("I Ching line values", "\u6613\u7ECF\u723B\u503C"))}">
        ${lineRows.map(([value, name, mark, meaning]) => `<div class="cx-cast-guide__row" role="row"><b>${value}</b><span>${escape2(name)}</span><strong>${escape2(mark)}</strong><small>${escape2(meaning)}</small></div>`).join("")}
      </div>
      <p class="cx-meta">${escape2(t(
    "Even values are yin and odd values are yang. 6 and 9 are changing lines; 7 and 8 are stable lines.",
    "\u5076\u6570\u4E3A\u9634\uFF0C\u5947\u6570\u4E3A\u9633\uFF1B6 \u4E0E 9 \u662F\u53D8\u723B\uFF0C7 \u4E0E 8 \u662F\u9759\u723B\u3002"
  ))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape2(t("Method A \xB7 Three coins, one line at a time", "\u65B9\u6CD5 A \xB7 \u4E09\u679A\u786C\u5E01\u9010\u723B\u8D77\u5366"))}</h4>
      <p>${escape2(t(
    "This is the simplest common self-casting method when you want changing lines. Before you start, choose one face of the coin as 3 / yang and the other face as 2 / yin. Different traditions may name the physical faces differently, so consistency within one cast matters more than the printed face.",
    "\u8FD9\u662F\u6700\u5BB9\u6613\u81EA\u884C\u64CD\u4F5C\u3001\u53C8\u80FD\u5F97\u5230\u53D8\u723B\u7684\u5E38\u89C1\u65B9\u6CD5\u3002\u5F00\u59CB\u524D\uFF0C\u5148\u7EA6\u5B9A\u94B1\u5E01\u7684\u4E00\u9762\u4EE3\u8868 3 / \u9633\uFF0C\u53E6\u4E00\u9762\u4EE3\u8868 2 / \u9634\u3002\u4E0D\u540C\u6D41\u6D3E\u5BF9\u5B9E\u4F53\u6B63\u53CD\u9762\u7684\u79F0\u547C\u53EF\u80FD\u4E0D\u540C\uFF0C\u56E0\u6B64\u6700\u91CD\u8981\u7684\u662F\uFF1A\u4E00\u6B21\u8D77\u5366\u4E2D\u4E0D\u8981\u4E2D\u9014\u4EA4\u6362\u5B9A\u4E49\u3002"
  ))}</p>
      <ol>
        <li>${escape2(t("Hold three coins together and toss them once.", "\u540C\u65F6\u6295\u63B7\u4E09\u679A\u786C\u5E01\u4E00\u6B21\u3002"))}</li>
        <li>${escape2(t("Add the three values. The total will be 6, 7, 8 or 9.", "\u628A\u4E09\u679A\u94B1\u5E01\u7684\u6570\u503C\u76F8\u52A0\uFF0C\u7ED3\u679C\u4E00\u5B9A\u662F 6\u30017\u30018 \u6216 9\u3002"))}</li>
        <li>${escape2(t("Write that as line 1 (the bottom line). Repeat until line 6 (the top line).", "\u7B2C\u4E00\u6B21\u8BB0\u4E3A\u521D\u723B\uFF1B\u91CD\u590D\u516D\u6B21\uFF0C\u6700\u540E\u4E00\u6B21\u8BB0\u4E3A\u4E0A\u723B\u3002"))}</li>
      </ol>
      <div class="cx-cast-guide__mapping">
        <span>2 + 2 + 2 = <b>6 \xB7 ${escape2(t("old yin", "\u8001\u9634"))}</b></span>
        <span>2 + 2 + 3 = <b>7 \xB7 ${escape2(t("young yang", "\u5C11\u9633"))}</b></span>
        <span>2 + 3 + 3 = <b>8 \xB7 ${escape2(t("young yin", "\u5C11\u9634"))}</b></span>
        <span>3 + 3 + 3 = <b>9 \xB7 ${escape2(t("old yang", "\u8001\u9633"))}</b></span>
      </div>
      <p class="cx-meta">${escape2(t("Three-coin probabilities: 6 = 1/8 \xB7 7 = 3/8 \xB7 8 = 3/8 \xB7 9 = 1/8.", "\u4E09\u94B1\u6CD5\u6982\u7387\uFF1A6 = 1/8 \xB7 7 = 3/8 \xB7 8 = 3/8 \xB7 9 = 1/8\u3002"))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape2(t("Method B \xB7 Six coins in one toss (static hexagram)", "\u65B9\u6CD5 B \xB7 \u516D\u679A\u94DC\u94B1\u4E00\u6B21\u6392\u5366\uFF08\u9759\u5366\uFF09"))}</h4>
      <p>${escape2(t(
    "Based on the six-coin method in the reference you provided: decide which face is yang and which is yin, toss six coins together, keep their left-to-right order, then record the first result as the bottom line and continue upward.",
    "\u6839\u636E\u4F60\u63D0\u4F9B\u7684\u516D\u679A\u94DC\u94B1\u6447\u5366\u8D44\u6599\uFF1A\u5148\u5B9A\u94B1\u5E01\u9634\u9633\u9762\uFF0C\u518D\u628A\u516D\u679A\u94DC\u94B1\u4E00\u8D77\u6447\u843D\u5E76\u4FDD\u6301\u7531\u5DE6\u5230\u53F3\u7684\u987A\u5E8F\uFF1B\u7B2C\u4E00\u679A\u7ED3\u679C\u8BB0\u4F5C\u521D\u723B\uFF0C\u4F9D\u6B21\u5411\u4E0A\u8BB0\u5F55\u81F3\u4E0A\u723B\u3002"
  ))}</p>
      <div class="cx-cast-guide__mapping"><span>${escape2(t("Yang face", "\u9633\u9762"))} \u2192 <b>7 \xB7 ${escape2(t("young yang", "\u5C11\u9633"))}</b></span><span>${escape2(t("Yin face", "\u9634\u9762"))} \u2192 <b>8 \xB7 ${escape2(t("young yin", "\u5C11\u9634"))}</b></span></div>
      <p class="cx-meta">${escape2(t(
    "By itself this six-coin arrangement produces a primary/static hexagram and no 6/9 changing lines. Use the three-coin or yarrow method when you want a standard moving-line mechanism.",
    "\u8FD9\u79CD\u516D\u679A\u94B1\u5E01\u4E00\u6B21\u6392\u5366\u6CD5\u672C\u8EAB\u53EA\u5F62\u6210\u4E00\u4E2A\u672C\u5366 / \u9759\u5366\uFF0C\u4E0D\u4F1A\u81EA\u7136\u4EA7\u751F 6\u30019 \u53D8\u723B\u3002\u5982\u9700\u8981\u6807\u51C6\u7684\u53D8\u723B\u673A\u5236\uFF0C\u53EF\u4F7F\u7528\u4E09\u94B1\u6CD5\u6216\u84CD\u8349\u6CD5\u3002"
  ))}</p>
    </section>
    <section class="cx-cast-guide__section">
      <h4>${escape2(t("Method C \xB7 Traditional yarrow stalks", "\u65B9\u6CD5 C \xB7 \u4F20\u7EDF\u84CD\u8349\u6CD5"))}</h4>
      <p>${escape2(t("The traditional yarrow method uses 50 stalks, sets one aside, and works with 49. Each line is formed through three changes.", "\u4F20\u7EDF\u84CD\u8349\u6CD5\u7528 50 \u6839\u84CD\u8349\uFF0C\u5148\u53D6 1 \u6839\u4E0D\u7528\uFF0C\u4EE5 49 \u6839\u64CD\u4F5C\uFF1B\u6BCF\u4E00\u723B\u9700\u8981\u5B8C\u6210\u201C\u4E09\u53D8\u201D\u3002"))}</p>
      <ol>
        <li>${escape2(t("Divide the 49 working stalks into two heaps. Take one stalk aside from one heap.", "\u628A 49 \u6839\u968F\u610F\u5206\u6210\u4E24\u5806\uFF0C\u5E76\u4ECE\u5176\u4E2D\u4E00\u5806\u53D6 1 \u6839\u5939\u7F6E\u4E00\u65C1\u3002"))}</li>
        <li>${escape2(t("Count each heap in groups of four and set aside the remainders.", "\u4E24\u5806\u5206\u522B\u4EE5\u56DB\u6839\u4E00\u7EC4\u6570\u8FC7\uFF0C\u5C06\u4F59\u6570\u53D6\u51FA\u3002"))}</li>
        <li>${escape2(t("Repeat the operation three times for one line.", "\u540C\u4E00\u723B\u8FDE\u7EED\u5B8C\u6210\u4E09\u6B21\u8FD9\u6837\u7684\u64CD\u4F5C\u3002"))}</li>
        <li>${escape2(t("The remaining working total is 24, 28, 32 or 36; divide by four to obtain 6, 7, 8 or 9.", "\u6700\u540E\u5DE5\u4F5C\u84CD\u8349\u4F1A\u5269 24\u300128\u300132 \u6216 36 \u6839\uFF1B\u9664\u4EE5 4\uFF0C\u5373\u5F97\u5230 6\u30017\u30018 \u6216 9\u3002"))}</li>
        <li>${escape2(t("Restore the 49 working stalks and repeat for the next line, from bottom to top, until six lines are complete.", "\u91CD\u65B0\u5408\u56DE 49 \u6839\uFF0C\u518D\u505A\u4E0B\u4E00\u723B\uFF1B\u7531\u521D\u723B\u5230\u4E0A\u723B\u5171\u5B8C\u6210\u516D\u723B\u3002"))}</li>
      </ol>
      <p class="cx-meta">${escape2(t("Yarrow probabilities differ from the three-coin method: 6 = 1/16 \xB7 7 = 5/16 \xB7 8 = 7/16 \xB7 9 = 3/16.", "\u84CD\u8349\u6CD5\u4E0E\u4E09\u94B1\u6CD5\u7684\u6982\u7387\u4E0D\u540C\uFF1A6 = 1/16 \xB7 7 = 5/16 \xB7 8 = 7/16 \xB7 9 = 3/16\u3002"))}</p>
    </section>
    <section class="cx-cast-guide__section cx-cast-guide__boundary">
      <h4>${escape2(t("If you already have a hexagram", "\u5982\u679C\u4F60\u5DF2\u7ECF\u8D77\u597D\u5366"))}</h4>
      <p>${escape2(t("Choose \u201CI already have six lines\u201D and enter the six canonical values directly. Do not reverse the order: line 1 is always the bottom line.", "\u9009\u62E9\u201C\u6211\u5DF2\u7ECF\u8D77\u597D\u5366\u201D\uFF0C\u76F4\u63A5\u8F93\u5165\u516D\u4E2A\u6807\u51C6\u723B\u503C\u5373\u53EF\u3002\u4E0D\u8981\u628A\u987A\u5E8F\u5012\u8F6C\uFF1A\u7B2C 1 \u723B\u6C38\u8FDC\u662F\u6700\u4E0B\u9762\u7684\u521D\u723B\u3002"))}</p>
      <p class="cx-meta">${escape2(t("Different casting methods have different probability distributions. PHI OS records the method you chose; it does not claim that every method is mathematically equivalent.", "\u4E0D\u540C\u8D77\u5366\u65B9\u6CD5\u5177\u6709\u4E0D\u540C\u6982\u7387\u5206\u5E03\u3002PHI OS \u4F1A\u5C0A\u91CD\u4F60\u9009\u62E9\u7684\u65B9\u6CD5\uFF0C\u4E0D\u4F1A\u58F0\u79F0\u6240\u6709\u65B9\u6CD5\u5728\u6570\u5B66\u4E0A\u5B8C\u5168\u7B49\u4EF7\u3002"))}</p>
    </section>`;
}
function coinPanelMarkup() {
  return `<div class="cx-cast-coin-grid">
    ${Array.from({ length: 6 }, (_, line) => `<fieldset>
      <legend>${line + 1}${line === 0 ? ` \xB7 ${t("bottom", "\u521D\u723B")}` : line === 5 ? ` \xB7 ${t("top", "\u4E0A\u723B")}` : ""}</legend>
      <div>
        ${Array.from({ length: 3 }, (_2, coin) => `<label><span>${t("Coin", "\u94B1\u5E01")} ${coin + 1}</span><select data-iching-coin-line="${line + 1}" data-iching-coin="${coin + 1}"><option value="2">2 \xB7 ${t("yin", "\u9634")}</option><option value="3">3 \xB7 ${t("yang", "\u9633")}</option></select></label>`).join("")}
      </div>
    </fieldset>`).join("")}
  </div>`;
}
function installSurface() {
  if (installed || document.body.dataset.cxSurface !== "ICHING_FULL_PRODUCTION") return;
  const fieldset = q2(".cx-iching-fieldset");
  const lineGrid = q2(".cx-iching-lines");
  if (!fieldset || !lineGrid) return;
  installed = true;
  installStyles();
  document.body.dataset.ichingCastingSurface = "ready";
  const legacyHint = [...fieldset.children].find((node) => node.tagName === "P" && node.classList.contains("cx-muted"));
  const manual = document.createElement("div");
  manual.dataset.ichingModePanel = "MANUAL_LINES";
  manual.className = "cx-cast-mode-panel";
  if (legacyHint) manual.append(legacyHint);
  manual.append(lineGrid);
  const controls = document.createElement("div");
  controls.className = "cx-casting-surface";
  controls.innerHTML = `
    <section class="cx-cast-mode-picker" aria-label="${escape2(t("Casting input mode", "\u8D77\u5366\u8F93\u5165\u65B9\u5F0F"))}">
      <p class="cx-eyebrow" data-cast-mode-eyebrow>${escape2(t("HOW TO FORM THIS READING", "\u5982\u4F55\u53D6\u5F97\u8FD9\u6B21\u5366\u8C61"))}</p>
      <div class="cx-cast-mode-buttons" role="group">
        ${["SYSTEM_RANDOM", "MANUAL_LINES", "COIN_CAST"].map((value) => `<button type="button" data-iching-cast-mode="${value}" aria-pressed="${value === "SYSTEM_RANDOM"}">${escape2(modeLabel(value))}</button>`).join("")}
      </div>
    </section>
    <section class="cx-cast-mode-panel" data-iching-mode-panel="SYSTEM_RANDOM">
      <div class="cx-cast-intro">
        <div>
          <h3 data-cast-heading>${escape2(t("Create one governed cast", "\u5F62\u6210\u4E00\u6B21\u53D7\u6CBB\u7406\u7684\u8D77\u5366"))}</h3>
          <p data-cast-intro-copy>${escape2(t(
    "PHI OS uses server cryptographic randomness to form six three-coin lines once, bottom to top. Your question does not influence which lines are selected.",
    "PHI OS \u4F7F\u7528\u670D\u52A1\u5668\u52A0\u5BC6\u7EA7\u968F\u673A\u6E90\uFF0C\u4E00\u6B21\u5F62\u6210\u516D\u7EC4\u4E09\u94B1\u53D6\u6837\uFF0C\u4ECE\u521D\u723B\u5230\u4E0A\u723B\u3002\u4F60\u7684\u95EE\u9898\u4E0D\u4F1A\u5F71\u54CD\u7CFB\u7EDF\u9009\u62E9\u54EA\u4E9B\u723B\u3002"
  ))}</p>
        </div>
        <button class="cx-button cx-button--primary" type="button" data-iching-cast>${escape2(t("Start this cast", "\u5F00\u59CB\u8FD9\u6B21\u8D77\u5366"))}</button>
      </div>
      <div class="cx-cast-result" data-iching-cast-result aria-live="polite"></div>
      <button class="cx-button cx-button--quiet" type="button" data-iching-recast hidden>${escape2(t("Create another independent cast", "\u91CD\u65B0\u5EFA\u7ACB\u4E00\u6B21\u72EC\u7ACB\u8D77\u5366"))}</button>
    </section>
    <section class="cx-cast-mode-panel" data-iching-mode-panel="COIN_CAST" hidden>
      <p class="cx-muted" data-cast-coin-copy>${escape2(t(
    "Record the three 2/3 coin values you obtained for each line. PHI OS records them bottom to top and does not toss again for you.",
    "\u9010\u723B\u8BB0\u5F55\u4F60\u5B9E\u9645\u53D6\u5F97\u7684\u4E09\u4E2A 2/3 \u94B1\u5E01\u503C\u3002PHI OS \u53EA\u6309\u521D\u723B\u5230\u4E0A\u723B\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u66FF\u4F60\u91CD\u65B0\u6295\u63B7\u3002"
  ))}</p>
      ${coinPanelMarkup()}
    </section>
    <details class="cx-cast-guide" data-self-casting-guide>
      <summary>${escape2(t("How do I cast for myself?", "\u6211\u60F3\u81EA\u5DF1\u8D77\u5366\uFF1A\u5B8C\u6574\u65B9\u6CD5\u8BF4\u660E"))}</summary>
      <div class="cx-cast-guide__body" data-self-casting-guide-body>${guideMarkup()}</div>
    </details>
    <p class="cx-meta cx-cast-boundary" data-cast-boundary-copy>${escape2(t(
    "Casting creates symbolic sampling evidence, not Reality evidence, diagnosis, professional advice or a guaranteed future.",
    "\u8D77\u5366\u53EA\u5F62\u6210\u8C61\u5F81\u53D6\u6837\u8BC1\u636E\uFF0C\u4E0D\u4F1A\u5F62\u6210\u73B0\u5B9E\u4E8B\u5B9E\u3001\u8BCA\u65AD\u3001\u4E13\u4E1A\u5EFA\u8BAE\u6216\u88AB\u4FDD\u8BC1\u7684\u672A\u6765\u3002"
  ))}</p>
    <p class="cx-meta" data-iching-casting-status role="status" aria-live="polite"></p>`;
  fieldset.append(controls);
  fieldset.append(manual);
  q2("[data-iching-cast]")?.addEventListener("click", () => createCast(false));
  q2("[data-iching-recast]")?.addEventListener("click", () => {
    if (globalThis.confirm(t(
      "Create a new independent cast? The previous cast will not be rewritten.",
      "\u8981\u5EFA\u7ACB\u4E00\u6B21\u65B0\u7684\u72EC\u7ACB\u8D77\u5366\u5417\uFF1F\u4E4B\u524D\u7684\u5366\u4E0D\u4F1A\u88AB\u6539\u5199\u3002"
    ))) createCast(true);
  });
  qa2("[data-iching-cast-mode]").forEach((button2) => button2.addEventListener("click", () => setMode(button2.dataset.ichingCastMode)));
  q2("[data-iching-question]")?.addEventListener("input", () => {
    if (currentCast && question() !== boundQuestion) {
      currentCast = null;
      boundQuestion = "";
      renderCast();
      status(t("The question changed. Create a new cast before execution.", "\u95EE\u9898\u5DF2\u7ECF\u6539\u53D8\uFF0C\u8BF7\u91CD\u65B0\u8D77\u5366\u540E\u518D\u6267\u884C\u3002"));
      setExecuteCopy();
    }
  });
  executeButton()?.addEventListener("click", (event) => {
    if (mode === "MANUAL_LINES") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (mode === "SYSTEM_RANDOM") executeSystemCast();
    else executeCoinCast();
  }, true);
  renderCast();
  setMode("SYSTEM_RANDOM");
  refreshAuthority();
  setTimeout(refreshAuthority, 250);
  setTimeout(refreshAuthority, 900);
}
function setMode(next) {
  if (!["SYSTEM_RANDOM", "MANUAL_LINES", "COIN_CAST"].includes(next)) return;
  mode = next;
  qa2("[data-iching-cast-mode]").forEach((button2) => button2.setAttribute("aria-pressed", String(button2.dataset.ichingCastMode === mode)));
  qa2("[data-iching-mode-panel]").forEach((panel) => panel.hidden = panel.dataset.ichingModePanel !== mode);
  status("");
  setExecuteCopy();
}
async function refreshAuthority() {
  try {
    const response = await fetch("/api/iching-full-production-status", { cache: "no-store", headers: { accept: "application/json" } });
    const payload = await response.json();
    productionReady = response.ok && payload?.production?.runAllowed === true && payload?.production?.globalPublicExecution === true;
  } catch {
    productionReady = false;
  }
  setExecuteCopy();
}
async function createCast(isRepeat) {
  if (casting) return;
  if (!productionReady) {
    status(t("Full Production authority is not active on this deployment.", "\u5F53\u524D\u90E8\u7F72\u5C1A\u672A\u53D6\u5F97 Full Production \u6743\u9650\u3002"));
    return;
  }
  const currentQuestion = question();
  if (!currentQuestion) {
    status(t("Add the situation you want to understand before casting.", "\u8BF7\u5148\u586B\u5199\u4F60\u60F3\u7406\u89E3\u7684\u5904\u5883\uFF0C\u518D\u5F00\u59CB\u8D77\u5366\u3002"));
    q2("[data-iching-question]")?.focus();
    return;
  }
  casting = true;
  currentCast = null;
  boundQuestion = "";
  renderCast();
  setExecuteCopy();
  const button2 = q2("[data-iching-cast]");
  const controls = qa2("[data-iching-cast-mode], [data-iching-recast], [data-iching-question]");
  const previous = controls.map((x) => x.disabled);
  controls.forEach((x) => x.disabled = true);
  if (button2) button2.disabled = true;
  const ritual = startRitual(q2("[data-iching-cast-result]"), { kind: "iching", zh: isZh2() });
  status(isRepeat ? t("Creating a new independent cast\u2026", "\u6B63\u5728\u5F62\u6210\u4E00\u6B21\u65B0\u7684\u72EC\u7ACB\u8D77\u5366\u2026\u2026") : t("Creating one governed cast\u2026", "\u6B63\u5728\u5F62\u6210\u4E00\u6B21\u53D7\u6CBB\u7406\u7684\u8D77\u5366\u2026\u2026"));
  try {
    const response = await fetch("/api/iching-full-cast", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2e4),
      body: JSON.stringify({ method: "I_CHING", intent: "CREATE_NEW_CAST", question: currentQuestion })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload.cast) throw new Error(payload?.error?.code || "CAST_UNAVAILABLE");
    if (!await ritual.done) {
      status(t("Casting cancelled. Start again when ready.", "\u8D77\u5366\u5DF2\u53D6\u6D88\uFF0C\u51C6\u5907\u597D\u540E\u53EF\u91CD\u65B0\u5F00\u59CB\u3002"));
      renderCast();
      return;
    }
    if (question() !== currentQuestion || mode !== "SYSTEM_RANDOM") throw new Error("CAST_CONTEXT_CHANGED");
    currentCast = payload.cast;
    boundQuestion = currentQuestion;
    renderCast();
    status(t("Cast evidence is frozen. You can now explore this perspective.", "\u8D77\u5366\u8BC1\u636E\u5DF2\u7ECF\u51BB\u7ED3\uFF0C\u73B0\u5728\u53EF\u4EE5\u63A2\u7D22\u8FD9\u6B21\u89C6\u89D2\u3002"));
  } catch (error) {
    currentCast = null;
    boundQuestion = "";
    renderCast();
    status(t(`Cast unavailable: ${error.message}`, `\u8D77\u5366\u6682\u65F6\u4E0D\u53EF\u7528\uFF1A${error.message}`));
  } finally {
    ritual.stop();
    casting = false;
    controls.forEach((x, i) => x.disabled = previous[i]);
    if (button2) button2.disabled = false;
    setExecuteCopy();
  }
}
async function executeSystemCast() {
  if (!productionReady) {
    status(t("Execution authority is unavailable.", "\u6267\u884C\u6743\u9650\u76EE\u524D\u4E0D\u53EF\u7528\u3002"));
    return;
  }
  if (!currentCast) {
    status(t("Create one cast before exploring the perspective.", "\u8BF7\u5148\u5B8C\u6210\u4E00\u6B21\u8D77\u5366\uFF0C\u518D\u63A2\u7D22\u8FD9\u4E2A\u89C6\u89D2\u3002"));
    return;
  }
  if (question() !== boundQuestion) {
    status(t("The question changed. Create a new cast first.", "\u95EE\u9898\u5DF2\u7ECF\u6539\u53D8\uFF0C\u8BF7\u5148\u91CD\u65B0\u8D77\u5366\u3002"));
    return;
  }
  await executeRequest({
    method: "I_CHING",
    question: boundQuestion,
    inputMode: "SYSTEM_RANDOM",
    randomSelectionEvidence: currentCast.randomSelectionEvidence,
    sessionId: currentCast.castId,
    timestamp: currentCast.createdAt,
    projectionVersion: "1.0.0",
    useCurrentRealityContext: q2("[data-use-reality-context]")?.checked === true
  });
}
function coinLines() {
  return Array.from(
    { length: 6 },
    (_, line) => qa2(`[data-iching-coin-line="${line + 1}"]`).sort((a, b) => Number(a.dataset.ichingCoin) - Number(b.dataset.ichingCoin)).map((item) => Number(item.value))
  );
}
async function executeCoinCast() {
  if (!productionReady) {
    status(t("Execution authority is unavailable.", "\u6267\u884C\u6743\u9650\u76EE\u524D\u4E0D\u53EF\u7528\u3002"));
    return;
  }
  const currentQuestion = question();
  if (!currentQuestion) {
    status(t("Add a question before continuing.", "\u8BF7\u5148\u586B\u5199\u4F60\u60F3\u7406\u89E3\u7684\u95EE\u9898\u3002"));
    q2("[data-iching-question]")?.focus();
    return;
  }
  await executeRequest({
    method: "I_CHING",
    question: currentQuestion,
    inputMode: "COIN_CAST",
    coinLines: coinLines(),
    sessionId: globalThis.crypto?.randomUUID?.() || `ICH-COIN-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    projectionVersion: "1.0.0",
    useCurrentRealityContext: q2("[data-use-reality-context]")?.checked === true
  });
}
async function executeRequest(body) {
  const button2 = executeButton();
  if (button2) button2.disabled = true;
  status(t("Preparing the governed perspective\u2026", "\u6B63\u5728\u51C6\u5907\u53D7\u6CBB\u7406\u7684\u8C61\u5F81\u89C6\u89D2\u2026\u2026"));
  try {
    const response = await fetch("/api/iching-full-execute", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      cache: "no-store",
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error?.code || "EXECUTION_UNAVAILABLE");
    renderIChingView(payload.publicView);
    status("");
  } catch (error) {
    status(t(`Execution remains unavailable: ${error.message}`, `\u6267\u884C\u4ECD\u4E0D\u53EF\u7528\uFF1A${error.message}`));
  } finally {
    setExecuteCopy();
  }
}
function rerenderLocale() {
  if (!installed) return;
  qa2("[data-iching-cast-mode]").forEach((button2) => {
    button2.textContent = modeLabel(button2.dataset.ichingCastMode);
  });
  const eyebrow = q2("[data-cast-mode-eyebrow]");
  if (eyebrow) eyebrow.textContent = t("HOW TO FORM THIS READING", "\u5982\u4F55\u53D6\u5F97\u8FD9\u6B21\u5366\u8C61");
  const heading = q2("[data-cast-heading]");
  if (heading) heading.textContent = t("Create one governed cast", "\u5F62\u6210\u4E00\u6B21\u53D7\u6CBB\u7406\u7684\u8D77\u5366");
  const intro = q2("[data-cast-intro-copy]");
  if (intro) intro.textContent = t(
    "PHI OS uses server cryptographic randomness to form six three-coin lines once, bottom to top. Your question does not influence which lines are selected.",
    "PHI OS \u4F7F\u7528\u670D\u52A1\u5668\u52A0\u5BC6\u7EA7\u968F\u673A\u6E90\uFF0C\u4E00\u6B21\u5F62\u6210\u516D\u7EC4\u4E09\u94B1\u53D6\u6837\uFF0C\u4ECE\u521D\u723B\u5230\u4E0A\u723B\u3002\u4F60\u7684\u95EE\u9898\u4E0D\u4F1A\u5F71\u54CD\u7CFB\u7EDF\u9009\u62E9\u54EA\u4E9B\u723B\u3002"
  );
  const coinCopy = q2("[data-cast-coin-copy]");
  if (coinCopy) coinCopy.textContent = t(
    "Record the three 2/3 coin values you obtained for each line. PHI OS records them bottom to top and does not toss again for you.",
    "\u9010\u723B\u8BB0\u5F55\u4F60\u5B9E\u9645\u53D6\u5F97\u7684\u4E09\u4E2A 2/3 \u94B1\u5E01\u503C\u3002PHI OS \u53EA\u6309\u521D\u723B\u5230\u4E0A\u723B\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u66FF\u4F60\u91CD\u65B0\u6295\u63B7\u3002"
  );
  const guideBody = q2("[data-self-casting-guide-body]");
  if (guideBody) guideBody.innerHTML = guideMarkup();
  const guideSummary = q2("[data-self-casting-guide] summary");
  if (guideSummary) guideSummary.textContent = t("How do I cast for myself?", "\u6211\u60F3\u81EA\u5DF1\u8D77\u5366\uFF1A\u5B8C\u6574\u65B9\u6CD5\u8BF4\u660E");
  const boundary = q2("[data-cast-boundary-copy]");
  if (boundary) boundary.textContent = t(
    "Casting creates symbolic sampling evidence, not Reality evidence, diagnosis, professional advice or a guaranteed future.",
    "\u8D77\u5366\u53EA\u5F62\u6210\u8C61\u5F81\u53D6\u6837\u8BC1\u636E\uFF0C\u4E0D\u4F1A\u5F62\u6210\u73B0\u5B9E\u4E8B\u5B9E\u3001\u8BCA\u65AD\u3001\u4E13\u4E1A\u5EFA\u8BAE\u6216\u88AB\u4FDD\u8BC1\u7684\u672A\u6765\u3002"
  );
  qa2(".cx-cast-coin-grid fieldset").forEach((fieldset, index) => {
    const legend = fieldset.querySelector("legend");
    if (legend) legend.textContent = `${index + 1}${index === 0 ? ` \xB7 ${t("bottom", "\u521D\u723B")}` : index === 5 ? ` \xB7 ${t("top", "\u4E0A\u723B")}` : ""}`;
    [...fieldset.querySelectorAll("label span")].forEach((span, coin) => {
      span.textContent = `${t("Coin", "\u94B1\u5E01")} ${coin + 1}`;
    });
  });
  const castButton = q2("[data-iching-cast]");
  if (castButton) castButton.textContent = t("Start this cast", "\u5F00\u59CB\u8FD9\u6B21\u8D77\u5366");
  const recast = q2("[data-iching-recast]");
  if (recast) recast.textContent = t("Create another independent cast", "\u91CD\u65B0\u5EFA\u7ACB\u4E00\u6B21\u72EC\u7ACB\u8D77\u5366");
  renderCast();
  setExecuteCopy();
}
var q2, qa2, normalize, isZh2, t, escape2, mode, currentCast, boundQuestion, productionReady, installed, casting;
var init_iching_casting = __esm({
  "assets/customer-ui/js/surfaces/iching-casting.js"() {
    init_ritual_sequence();
    init_iching_full();
    q2 = (selector) => document.querySelector(selector);
    qa2 = (selector) => [...document.querySelectorAll(selector)];
    normalize = (value) => String(value ?? "").normalize("NFKC").trim();
    isZh2 = () => String(document.documentElement.lang || "").toLowerCase().startsWith("zh");
    t = (en, zh) => isZh2() ? zh : en;
    escape2 = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    mode = "SYSTEM_RANDOM";
    currentCast = null;
    boundQuestion = "";
    productionReady = false;
    installed = false;
    casting = false;
    window.addEventListener("phios:localechange", rerenderLocale);
    installSurface();
  }
});

// assets/customer-ui/js/navigation-intent.js
function knowledgeNavigationIntent(question2, locale = "en") {
  const q3 = String(question2 || "").trim().toLowerCase().replace(/[?？。.!！]+$/, "");
  const zh = locale === "zh-Hans";
  const routes = [[/^(?:文章|找文章|看文章|阅读文章|文章在哪(?:里)?|打开文章(?:页面)?|articles?|show (?:me )?(?:the )?articles?|browse articles|where are (?:the )?articles)$/, "/articles", zh ? "\u6D4F\u89C8\u6587\u7AE0" : "Browse articles"], [/^(?:书籍|书籍在哪|书在哪里|书在哪|打开书籍|books|browse books|where are (?:the )?books)$/, "/books", zh ? "\u6D4F\u89C8\u4E66\u7C4D" : "Browse books"], [/^(?:图示|图在哪里|查看图示|figures|browse figures|where are (?:the )?figures)$/, "/figures", zh ? "\u67E5\u770B\u56FE\u793A" : "Browse figures"]];
  routes.push([/^(?:ask|ask phi os)$/, "/knowledge/ask/", zh ? "\u63D0\u95EE" : "Ask PHI OS"], [/^(?:my reality|我的现实)$/, "/reality/", zh ? "\u6211\u7684\u73B0\u5B9E" : "My Reality"], [/^(?:tarot|塔罗)$/, "/perspectives/tarot/", zh ? "\u5854\u7F57" : "Tarot"], [/^(?:i ching|易经)$/, "/perspectives/iching/", zh ? "\u6613\u7ECF" : "I Ching"]);
  for (const [pattern, href, title] of routes) if (pattern.test(q3)) return { href, title, text: zh ? `\u53EF\u4EE5\uFF0C\u70B9\u51FB\u4E0B\u65B9\u300C${title}\u300D\u3002` : `Sure\u2014open \u201C${title}\u201D below.` };
  return null;
}

// assets/customer-ui/js/navigation.js
var CX_NAVIGATION = Object.freeze({
  primary: Object.freeze([
    Object.freeze({ id: "WORLD", href: "/world", en: "World", zh: "\u4E16\u754C" }),
    Object.freeze({ id: "EXPLORE", href: "/explore/", en: "Explore", zh: "\u63A2\u7D22" }),
    Object.freeze({ id: "MY_REALITY", href: "/reality/", en: "My Reality", zh: "\u6211\u7684\u73B0\u5B9E" }),
    Object.freeze({ id: "PERSPECTIVES", href: "/perspectives/", en: "Perspectives", zh: "\u89C6\u89D2" }),
    Object.freeze({ id: "KNOWLEDGE", href: "/knowledge/", en: "Knowledge", zh: "\u77E5\u8BC6" }),
    Object.freeze({ id: "PROFESSIONAL", href: "/professional/", en: "Professional", zh: "\u4E13\u4E1A" })
  ]),
  utilities: Object.freeze([
    Object.freeze({ id: "SEARCH", mode: "dialog", dialogId: "cx-shell-search", en: "Search", zh: "\u641C\u7D22" }),
    Object.freeze({ id: "ASK", mode: "dialog", dialogId: "cx-shell-ask", en: "Ask PHI OS", zh: "Ask PHI OS" }),
    Object.freeze({ id: "ACCOUNT", mode: "link", href: "/account/", en: "Account", zh: "\u8D26\u6237" })
  ])
});
function installNavigationToggle(header, scope = document) {
  const button2 = header?.querySelector("[data-cx-menu]");
  const drawerId = button2?.getAttribute("aria-controls");
  const drawer = drawerId ? scope.getElementById(drawerId) : null;
  if (!button2 || !(drawer instanceof HTMLDialogElement)) return;
  const set = (open) => {
    header.dataset.open = String(open);
    button2.setAttribute("aria-expanded", String(open));
  };
  button2.addEventListener("click", () => set(true));
  drawer.addEventListener("close", () => set(false));
  drawer.querySelectorAll("[data-cx-nav-link]").forEach((link) => link.addEventListener("click", () => drawer.close("navigate")));
}

// assets/customer-ui/js/locale.js
var KEY = "phios-cx-locale";
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}
var CROSS_DIMENSION_ZH = Object.freeze({
  "Operating posture": "\u8FD0\u884C\u59FF\u6001",
  Decision: "\u51B3\u7B56",
  Perception: "\u611F\u77E5",
  Expression: "\u8868\u8FBE",
  Energy: "\u80FD\u91CF",
  Rhythm: "\u8282\u5F8B",
  Pressure: "\u538B\u529B",
  Relationship: "\u5173\u7CFB",
  Resources: "\u8D44\u6E90",
  Work: "\u5DE5\u4F5C",
  Environment: "\u73AF\u5883",
  Change: "\u53D8\u5316",
  Recovery: "\u6062\u590D",
  Timing: "\u65F6\u95F4",
  Identity: "\u8EAB\u4EFD",
  Direction: "\u65B9\u5411"
});
var CROSS_HEADLINE_PREFIX = Object.freeze({
  COMMON: "Shared emphasis:",
  COMPLEMENTARY: "Complementary perspectives:",
  TENSION: "Tension remains visible:",
  CONTEXT_DEPENDENT: "Context matters:",
  OPEN: "Open perspective:"
});
function crossDimensionLabel(headline, supportType) {
  const text2 = String(headline || "").trim();
  const prefix = CROSS_HEADLINE_PREFIX[supportType];
  if (prefix && text2.startsWith(prefix)) return text2.slice(prefix.length).trim();
  return "";
}
function crossChineseCopy(supportType, labelEn, methodRefs = "") {
  const label = CROSS_DIMENSION_ZH[labelEn] || labelEn || "\u8FD9\u4E00\u4E3B\u9898";
  const methods = String(methodRefs || "").trim();
  if (supportType === "COMMON") return Object.freeze({
    headline: `\u5171\u540C\u5F3A\u8C03\uFF1A${label}`,
    narrative: `${methods || "\u8FD9\u4E9B\u8BFB\u53D6"}\u5728\u300C${label}\u300D\u4E0A\u5206\u522B\u7ED9\u51FA\u76F8\u4F3C\u5F3A\u8C03\u3002\u8FD9\u91CC\u4FDD\u7559\u7684\u662F\u76F8\u9047\u70B9\uFF0C\u4E0D\u628A\u76F8\u4F3C\u5F53\u6210\u4E8B\u5B9E\u8BC1\u660E\uFF0C\u4E5F\u4E0D\u4F1A\u56E0\u4E3A\u591A\u4E2A\u65B9\u6CD5\u76F8\u4F3C\u5C31\u63D0\u9AD8\u201C\u6B63\u786E\u6027\u201D\u3002`
  });
  if (supportType === "COMPLEMENTARY") return Object.freeze({
    headline: `\u4E92\u8865\u89C6\u89D2\uFF1A${label}`,
    narrative: `${methods || "\u8FD9\u4E9B\u8BFB\u53D6"}\u4ECE\u4E0D\u540C\u89D2\u5EA6\u89E6\u53CA\u300C${label}\u300D\u3002\u8FD9\u4E9B\u89C2\u70B9\u4F1A\u5E76\u5217\u4FDD\u7559\uFF0C\u4F5C\u4E3A\u4E92\u8865\u9605\u8BFB\uFF0C\u4E0D\u4F1A\u88AB\u5F3A\u884C\u63C9\u6210\u4E00\u4E2A\u7B54\u6848\u3002`
  });
  if (supportType === "TENSION") return Object.freeze({
    headline: `\u4FDD\u7559\u5F20\u529B\uFF1A${label}`,
    narrative: `\u5728\u300C${label}\u300D\u4E0A\uFF0C\u4E0D\u540C\u8BFB\u53D6\u4E4B\u95F4\u5B58\u5728\u660E\u786E\u5F20\u529B\u3001\u53D6\u820D\u6216\u53CD\u4F8B\u3002\u4E24\u8FB9\u90FD\u4F1A\u4FDD\u7559\uFF0C\u4E0D\u4F1A\u9009\u51FA\u67D0\u4E00\u79CD\u65B9\u6CD5\u4F5C\u4E3A\u201C\u8D62\u5BB6\u201D\u3002`
  });
  if (supportType === "CONTEXT_DEPENDENT") return Object.freeze({
    headline: `\u9700\u8981\u7ED3\u5408\u60C5\u5883\uFF1A${label}`,
    narrative: `\u300C${label}\u300D\u9700\u8981\u7ED3\u5408\u660E\u786E\u6761\u4EF6\u6216\u65F6\u95F4\u60C5\u5883\u6765\u7406\u89E3\u3002\u8DE8\u89C6\u89D2\u8BFB\u53D6\u4F1A\u4FDD\u7559\u8FD9\u4E9B\u6761\u4EF6\uFF0C\u4E0D\u4F1A\u628A\u6709\u6761\u4EF6\u7684\u89C2\u5BDF\u53D8\u6210\u56FA\u5B9A\u7ED3\u8BBA\u3002`
  });
  if (supportType === "OPEN") return Object.freeze({
    headline: `\u5F00\u653E\u89C2\u5BDF\uFF1A${label}`,
    narrative: `\u300C${label}\u300D\u4ECD\u6709\u660E\u786E\u672A\u51B3\u4E4B\u5904\u3002\u8DE8\u89C6\u89D2\u8BFB\u53D6\u4F1A\u4FDD\u7559\u8FD9\u4E2A\u5F00\u653E\u72B6\u6001\uFF0C\u4E0D\u4F1A\u7528\u5176\u4ED6\u65B9\u6CD5\u7684\u5185\u5BB9\u628A\u7A7A\u7F3A\u81EA\u52A8\u8865\u4E0A\u3002`
  });
  return null;
}
function applyLocalizedNodeText(node, locale) {
  if (!node?.dataset?.cxEn || !node?.dataset?.cxZh) return;
  const next = locale === "zh-Hans" ? node.dataset.cxZh : node.dataset.cxEn;
  if (node.textContent !== next) node.textContent = next;
}
function localizeCrossPerspectiveClaims(scope = document, locale = document.documentElement.lang) {
  const next = locale === "zh-Hans" ? "zh-Hans" : "en";
  scope.querySelectorAll?.(".cx-cross-reading__claims article[data-support]").forEach((article) => {
    const heading = article.querySelector("h3"), narrative = article.querySelector("p"), methodRefs = article.querySelector("small")?.textContent || "";
    if (!heading || !narrative) return;
    const supportType = String(article.dataset.support || "");
    const englishHeadline = heading.dataset.cxEn || heading.textContent || "";
    const englishNarrative = narrative.dataset.cxEn || narrative.textContent || "";
    const labelEn = crossDimensionLabel(englishHeadline, supportType);
    if (!labelEn) return;
    const zh = crossChineseCopy(supportType, labelEn, methodRefs);
    if (!zh) return;
    heading.dataset.cxEn = englishHeadline;
    heading.dataset.cxZh = zh.headline;
    narrative.dataset.cxEn = englishNarrative;
    narrative.dataset.cxZh = zh.narrative;
    applyLocalizedNodeText(heading, next);
    applyLocalizedNodeText(narrative, next);
  });
}
var dynamicLocaleObserver = null;
function installDynamicLocaleProjection(scope = document) {
  if (dynamicLocaleObserver || typeof MutationObserver === "undefined") return dynamicLocaleObserver;
  const root = scope.documentElement || scope;
  if (!root) return null;
  dynamicLocaleObserver = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => [...mutation.addedNodes].some((node) => node?.nodeType === 1 && (node.matches?.(".cx-cross-reading,.cx-cross-reading__claims article") || node.querySelector?.(".cx-cross-reading__claims article"))));
    if (relevant) localizeCrossPerspectiveClaims(scope, document.documentElement.lang);
  });
  dynamicLocaleObserver.observe(root, { subtree: true, childList: true });
  return dynamicLocaleObserver;
}
function preferredCustomerLocale() {
  const explicit = new URLSearchParams(location.search).get("locale");
  if (explicit === "en" || explicit === "zh-Hans") return explicit;
  const stored = readStorage("phiOSLocale") || readStorage(KEY);
  if (stored === "en" || stored === "zh-Hans") return stored;
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh-Hans" : "en";
}
function applyCustomerLocale(locale, scope = document) {
  const next = locale === "zh-Hans" ? "zh-Hans" : "en";
  document.documentElement.lang = next;
  document.documentElement.dataset.cxLocale = next;
  writeStorage(KEY, next);
  writeStorage("phiOSLocale", next);
  localizeCrossPerspectiveClaims(scope, next);
  scope.querySelectorAll("[data-cx-en][data-cx-zh]").forEach((node) => applyLocalizedNodeText(node, next));
  scope.querySelectorAll("[data-cx-en-placeholder][data-cx-zh-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", next === "zh-Hans" ? node.dataset.cxZhPlaceholder : node.dataset.cxEnPlaceholder);
  });
  scope.querySelectorAll("[data-cx-en-aria-label][data-cx-zh-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", next === "zh-Hans" ? node.dataset.cxZhAriaLabel : node.dataset.cxEnAriaLabel);
  });
  scope.querySelectorAll("[data-cx-locale]").forEach((button2) => {
    const active = button2.dataset.cxLocale === next;
    button2.setAttribute("aria-pressed", String(active));
  });
  window.dispatchEvent(new CustomEvent("phios:localechange", { detail: { locale: next } }));
  return next;
}
function installLocaleControls(scope = document) {
  scope.querySelectorAll("[data-cx-locale]").forEach((button2) => button2.addEventListener("click", () => applyCustomerLocale(button2.dataset.cxLocale, document)));
  installDynamicLocaleProjection(scope);
  return applyCustomerLocale(preferredCustomerLocale(), document);
}
var HD_INTAKE_COPY = Object.freeze({
  en: { review: "Review your Human Design details", intro: "PHI OS uses your uploaded Human Design chart and birth details to prefill the structure below. Only items marked \u201CNeeds confirmation\u201D require your attention.", CONFIRMED: "Confirmed", CONFLICT: "Needs confirmation", UNKNOWN: "Unable to confirm", CALCULATED: "Calculated \xB7 needs confirmation", EXTRACTED: "Chart reading \xB7 needs confirmation", DERIVED: "Automatic", edit: "Edit", view: "View", variable: "Variable \xB7 four arrows", help: "How to read it", guide: "Find the four arrows around the BodyGraph head. Match each arrow\u2019s actual direction. PHI OS converts your choices automatically; no technical codes are needed.", positions: ["Top left", "Bottom left", "Top right", "Bottom right"], left: "Left", right: "Right", check: "Do these four arrows match your chart?", yes: "Correct", change: "Change arrows", gates: "Activated gates" },
  "zh-Hans": { review: "\u8BF7\u6838\u5BF9\u4EE5\u4E0B\u8D44\u6599", intro: "\u7CFB\u7EDF\u4F1A\u7ED3\u5408\u4F60\u4E0A\u4F20\u7684 Human Design \u56FE\u8868\u4E0E\u51FA\u751F\u8D44\u6599\u9884\u586B\u3002\u53EA\u6709\u6807\u8BB0\u4E3A\u300C\u9700\u8981\u786E\u8BA4\u300D\u7684\u9879\u76EE\u9700\u8981\u4F60\u68C0\u67E5\u6216\u8865\u5145\u3002", CONFIRMED: "\u5DF2\u786E\u8BA4", CONFLICT: "\u9700\u8981\u786E\u8BA4", UNKNOWN: "\u672A\u80FD\u786E\u8BA4", CALCULATED: "\u5185\u90E8\u8BA1\u7B97 \xB7 \u9700\u8981\u786E\u8BA4", EXTRACTED: "\u56FE\u8868\u8BFB\u53D6 \xB7 \u9700\u8981\u786E\u8BA4", DERIVED: "\u81EA\u52A8", edit: "\u4FEE\u6539", view: "\u67E5\u770B", variable: "Variable\uFF5C\u56DB\u7BAD\u5934", help: "\u600E\u4E48\u770B\uFF1F", guide: "\u627E\u5230 BodyGraph \u5934\u90E8\u5468\u56F4\u7684\u56DB\u4E2A\u7BAD\u5934\uFF0C\u6309\u7167\u6BCF\u4E2A\u7BAD\u5934\u5B9E\u9645\u671D\u5411\u9009\u62E9\u3002PHI OS \u4F1A\u81EA\u52A8\u8F6C\u6362\uFF0C\u4F60\u4E0D\u9700\u8981\u7406\u89E3\u4E13\u4E1A\u4EE3\u7801\u3002", positions: ["\u5DE6\u4E0A\u7BAD\u5934", "\u5DE6\u4E0B\u7BAD\u5934", "\u53F3\u4E0A\u7BAD\u5934", "\u53F3\u4E0B\u7BAD\u5934"], left: "\u5411\u5DE6", right: "\u5411\u53F3", check: "\u8FD9\u56DB\u4E2A\u7BAD\u5934\u65B9\u5411\u4E0E\u4F60\u7684\u56FE\u8868\u4E00\u81F4\u5417\uFF1F", yes: "\u6B63\u786E", change: "\u4FEE\u6539\u7BAD\u5934", gates: "\u6FC0\u6D3B\u95F8\u95E8" }
});

// assets/customer-ui/js/assets.js
var REGISTRY_URL = "/content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json";
var DARK_SURFACE_LOGO_MAP = Object.freeze({
  "LOGO-001": "LOGO-008",
  "LOGO-003": "LOGO-010",
  "LOGO-007": "LOGO-008",
  "LOGO-009": "LOGO-010"
});
var LIGHT_SURFACE_LOGO_MAP = Object.freeze({
  "LOGO-008": "LOGO-001",
  "LOGO-010": "LOGO-003"
});
var cache = null;
async function customerAssetRegistry() {
  if (cache) return cache;
  const response = await fetch(REGISTRY_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`CX_ASSET_REGISTRY_${response.status}`);
  cache = await response.json();
  return cache;
}
function deliveryFor(record) {
  const delivery = record?.delivery || {};
  return Object.freeze({
    loading: delivery.loading || "lazy",
    decoding: delivery.decoding || "async",
    fetchPriority: delivery.fetchPriority || "auto"
  });
}
function resolveCustomerAssetFromRegistry(registry2, assetId) {
  const record = registry2?.entries?.find((item) => item.assetId === assetId);
  if (!record) throw new Error(`CX_ASSET_UNKNOWN:${assetId}`);
  if (record.available !== true || !record.publicUrl) throw new Error(`CX_ASSET_UNAVAILABLE:${assetId}`);
  return Object.freeze({ ...record, delivery: deliveryFor(record) });
}
function resolveCustomerAssetRoleFromRegistry(registry2, roleId) {
  const binding = registry2?.roleBindings?.find((item) => item.roleId === roleId);
  if (!binding) throw new Error(`CX_ASSET_ROLE_UNKNOWN:${roleId}`);
  if (binding.available !== true) throw new Error(`CX_ASSET_ROLE_UNAVAILABLE:${roleId}`);
  const asset = resolveCustomerAssetFromRegistry(registry2, binding.assetId);
  return Object.freeze({ ...asset, roleId, binding: Object.freeze({ ...binding }) });
}
function localizedUnavailableLabel(node) {
  if (node.dataset.cxAssetFallbackText) return node.dataset.cxAssetFallbackText;
  return String(document.documentElement.lang || "").toLowerCase().startsWith("zh") ? "\u89C6\u89C9\u8D44\u6E90\u6682\u65F6\u65E0\u6CD5\u663E\u793A" : "Visual unavailable";
}
function fallbackFor(node) {
  const explicit = node.parentElement?.querySelector?.("[data-cx-asset-fallback]");
  if (explicit) return explicit;
  if (node.nextElementSibling?.hasAttribute?.("data-cx-asset-fallback")) return node.nextElementSibling;
  const fallback = document.createElement("span");
  fallback.dataset.cxAssetFallback = "";
  fallback.setAttribute("role", "status");
  fallback.textContent = localizedUnavailableLabel(node);
  node.insertAdjacentElement("afterend", fallback);
  return fallback;
}
function applyImageDelivery(node, asset) {
  const delivery = asset.delivery || {};
  node.loading = delivery.loading || "lazy";
  node.decoding = delivery.decoding || "async";
  if ("fetchPriority" in node) node.fetchPriority = delivery.fetchPriority || "auto";
  if (asset.width && !node.hasAttribute("width")) node.width = Number(asset.width);
  if (asset.height && !node.hasAttribute("height")) node.height = Number(asset.height);
}
async function loadImage(node, asset) {
  node.hidden = false;
  node.removeAttribute("src");
  applyImageDelivery(node, asset);
  return new Promise((resolve, reject) => {
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`CX_ASSET_IMAGE_LOAD_FAILED:${asset.assetId}`));
    };
    const cleanup = () => {
      node.removeEventListener("load", onLoad);
      node.removeEventListener("error", onError);
    };
    node.addEventListener("load", onLoad, { once: true });
    node.addEventListener("error", onError, { once: true });
    node.src = asset.publicUrl;
    if (node.complete && node.naturalWidth > 0) {
      cleanup();
      resolve();
    }
  });
}
function revealFallback(node, fallback, error) {
  node.dataset.cxAssetState = "unavailable";
  node.hidden = true;
  fallback.hidden = false;
  fallback.dataset.cxAssetState = "unavailable";
  fallback.dataset.cxAssetError = error?.message || "CX_ASSET_UNAVAILABLE";
}
function parseColorToRgba(value) {
  const source = String(value || "").trim();
  if (!source || source === "transparent") return null;
  const match = source.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return null;
  const [r, g, b] = parts.slice(0, 3).map(Number);
  const a = parts[3] == null ? 1 : Number(parts[3]);
  if ([r, g, b, a].some(Number.isNaN)) return null;
  return { r, g, b, a };
}
function relativeLuminance({ r, g, b }) {
  const normalize2 = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const [rr, gg, bb] = [normalize2(r), normalize2(g), normalize2(b)];
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}
function nearestOpaqueBackground(node) {
  let current = node?.parentElement || node;
  while (current) {
    const color = parseColorToRgba(getComputedStyle(current).backgroundColor);
    if (color && color.a > 0) return color;
    current = current.parentElement;
  }
  return parseColorToRgba(getComputedStyle(document.body).backgroundColor) || parseColorToRgba(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
}
function wantsAutoContrast(node) {
  return node.dataset.cxAssetAuto === "contrast";
}
function selectContrastAwareLogo(assetId, node) {
  if (!wantsAutoContrast(node)) return assetId;
  const background = nearestOpaqueBackground(node);
  const darkSurface = relativeLuminance(background) < 0.24;
  if (darkSurface) return DARK_SURFACE_LOGO_MAP[assetId] || assetId;
  return LIGHT_SURFACE_LOGO_MAP[assetId] || assetId;
}
function resolveAssetIdentity(registry2, node, roleId, assetId) {
  if (roleId && assetId) throw new Error(`CX_ASSET_BINDING_AMBIGUOUS:${roleId}:${assetId}`);
  if (roleId) {
    const roleAsset = resolveCustomerAssetRoleFromRegistry(registry2, roleId);
    const finalAssetId = selectContrastAwareLogo(roleAsset.assetId, node);
    const finalAsset = finalAssetId === roleAsset.assetId ? roleAsset : Object.freeze({
      ...resolveCustomerAssetFromRegistry(registry2, finalAssetId),
      roleId,
      binding: roleAsset.binding
    });
    return finalAsset;
  }
  if (assetId) {
    return resolveCustomerAssetFromRegistry(registry2, selectContrastAwareLogo(assetId, node));
  }
  throw new Error("CX_ASSET_BINDING_MISSING");
}
async function resolveNodeAsset(node) {
  const registry2 = await customerAssetRegistry();
  return resolveAssetIdentity(registry2, node, node.dataset.cxAssetRole, node.dataset.cxAsset);
}
async function hydrateCustomerAssets(scope = document) {
  const nodes = [...scope.querySelectorAll("[data-cx-asset],[data-cx-asset-role]")];
  await Promise.all(nodes.map(async (node) => {
    const requested = node.dataset.cxAssetRole || node.dataset.cxAsset || "";
    const fallback = fallbackFor(node);
    fallback.hidden = true;
    try {
      const asset = await resolveNodeAsset(node);
      if (node instanceof HTMLImageElement) {
        await loadImage(node, asset);
        node.hidden = false;
      } else {
        node.style.setProperty("--cx-asset-url", `url("${asset.publicUrl}")`);
      }
      node.dataset.cxAssetState = "ready";
      node.dataset.cxAssetType = asset.type;
      node.dataset.cxAssetResolvedId = asset.assetId;
    } catch (error) {
      revealFallback(node, fallback, error);
      console.warn("[CX asset]", requested, error.message);
    }
  }));
}

// assets/customer-ui/js/seven-volume-assets.js
var URL = "/content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json";
var cache2 = null;
var registry = async () => {
  if (cache2) return cache2;
  const r = await fetch(URL, { cache: "force-cache", signal: AbortSignal.timeout(12e3) });
  if (!r.ok) throw new Error(`SEVEN_VOLUME_ASSET_REGISTRY_${r.status}`);
  cache2 = await r.json();
  return cache2;
};
async function resolveSevenVolumeCustomerAsset(id) {
  const r = await registry();
  const a = r.assets?.find((x) => x.assetId === id);
  if (!a?.available || !a?.publicUrl) throw new Error(`SEVEN_VOLUME_ASSET_UNAVAILABLE:${id}`);
  return a;
}
var bindings = /* @__PURE__ */ new WeakMap();
async function hydrateSevenVolumeAssets(scope = document) {
  await Promise.all([...scope.querySelectorAll("[data-cx-seven-volume-asset]")].map(async (node) => {
    bindings.get(node)?.();
    let disposed = false;
    let fallback = node.parentElement?.querySelector?.("[data-cx-asset-fallback]");
    if (!fallback) {
      fallback = document.createElement("span");
      fallback.dataset.cxAssetFallback = "";
      fallback.setAttribute("role", "status");
      node.after(fallback);
    }
    const zh = String(document.documentElement.lang).startsWith("zh");
    const cleanup = () => {
      node.removeEventListener("load", loaded);
      node.removeEventListener("error", failed);
    };
    const fail = (error) => {
      if (disposed) return;
      cleanup();
      node.hidden = true;
      node.dataset.cxAssetState = "unavailable";
      fallback.hidden = false;
      fallback.dataset.cxAssetError = error.message;
      fallback.textContent = zh ? "\u56FE\u7247\u6682\u65F6\u65E0\u6CD5\u663E\u793A\u3002" : "Visual unavailable. ";
      const button2 = document.createElement("button");
      button2.type = "button";
      button2.textContent = zh ? "\u91CD\u8BD5" : "Retry";
      button2.onclick = () => {
        cache2 = null;
        hydrateSevenVolumeAssets(node.parentElement);
      };
      fallback.append(button2);
    };
    const loaded = () => {
      if (disposed) return;
      if (!node.naturalWidth) {
        fail(new Error("SEVEN_VOLUME_IMAGE_EMPTY"));
        return;
      }
      cleanup();
      node.dataset.cxAssetState = "ready";
      fallback.hidden = true;
    };
    const failed = () => fail(new Error("SEVEN_VOLUME_IMAGE_LOAD_FAILED:" + node.dataset.cxSevenVolumeAsset));
    bindings.set(node, () => {
      disposed = true;
      cleanup();
    });
    node.dataset.cxAssetState = "loading";
    fallback.hidden = true;
    try {
      const a = await resolveSevenVolumeCustomerAsset(node.dataset.cxSevenVolumeAsset);
      if (disposed) return;
      if (!(node instanceof HTMLImageElement)) throw new Error("SEVEN_VOLUME_IMAGE_REQUIRED");
      node.loading = node.closest('[class*="hero"]') ? "eager" : node.loading || "lazy";
      node.decoding = "async";
      if (a.width) node.width = Number(a.width);
      if (a.height) node.height = Number(a.height);
      node.addEventListener("load", loaded);
      node.addEventListener("error", failed);
      node.hidden = false;
      node.src = a.publicUrl;
      if (node.complete && node.naturalWidth > 0) loaded();
    } catch (error) {
      fail(error);
    }
  }));
}

// assets/customer-ui/js/dialog.js
var installedScopes = /* @__PURE__ */ new WeakSet();
var openerByDialog = /* @__PURE__ */ new WeakMap();
var parentByDialog = /* @__PURE__ */ new WeakMap();
function resolveDialog(scope, id) {
  if (!id) return null;
  const dialog = scope.querySelector(`#${CSS.escape(id)}`);
  return dialog instanceof HTMLDialogElement ? dialog : null;
}
function syncExpanded(opener, open) {
  if (opener?.hasAttribute?.("aria-expanded")) opener.setAttribute("aria-expanded", String(open));
}
function openDialog(dialog, opener) {
  const parent = opener?.closest?.("dialog[open]");
  if (parent && parent !== dialog) {
    parentByDialog.set(dialog, parent);
    parent.close("switch");
  }
  openerByDialog.set(dialog, opener || null);
  syncExpanded(opener, true);
  queueMicrotask(() => {
    if (!dialog.open) dialog.showModal();
    document.documentElement.dataset.cxDialogOpen = dialog.id || "true";
    dialog.dispatchEvent(new CustomEvent("phios:dialogopen", { bubbles: true, detail: { id: dialog.id } }));
  });
}
function closeDialog(dialog, value = "close") {
  if (dialog?.open) dialog.close(value);
}
function installCustomerDialogs(scope = document) {
  if (installedScopes.has(scope)) return;
  installedScopes.add(scope);
  scope.addEventListener("click", (event) => {
    const opener = event.target.closest("button[data-cx-dialog-open],a[data-cx-dialog-open]");
    if (opener) {
      const dialog2 = resolveDialog(scope, opener.dataset.cxDialogOpen);
      if (dialog2) {
        event.preventDefault();
        openDialog(dialog2, opener);
      }
      return;
    }
    const close = event.target.closest("[data-cx-dialog-close]");
    if (close) {
      event.preventDefault();
      closeDialog(close.closest("dialog"));
      return;
    }
    const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
    if (dialog?.open) closeDialog(dialog, "backdrop");
  });
  scope.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      const opener = openerByDialog.get(dialog);
      syncExpanded(opener, false);
      openerByDialog.delete(dialog);
      if (!scope.querySelector("dialog[open]")) delete document.documentElement.dataset.cxDialogOpen;
      const parent = parentByDialog.get(dialog);
      parentByDialog.delete(dialog);
      if (parent?.isConnected && !parent.open && dialog.returnValue !== "navigate" && dialog.returnValue !== "switch") {
        parent.showModal();
        document.documentElement.dataset.cxDialogOpen = parent.id;
      }
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      dialog.dispatchEvent(new CustomEvent("phios:dialogclose", { bubbles: true, detail: { id: dialog.id, returnValue: dialog.returnValue } }));
    });
  });
}

// assets/customer-ui/js/figure-viewer.js
var lastTrigger = null;
var clamp = (n, min, max) => Math.min(max, Math.max(min, n));
function installExpandableFigures(scope = document) {
  const dialog = document.createElement("dialog");
  dialog.className = "cx-dialog cx-figure-dialog";
  dialog.innerHTML = '<div class="cx-figure-dialog__body"><div class="cx-figure-dialog__bar"><strong data-cx-figure-title></strong><button class="cx-button" type="button" data-cx-figure-close aria-label="Close">\xD7</button></div><div class="cx-figure-dialog__viewport"><img data-cx-figure-image alt=""></div><div class="cx-figure-dialog__tools"><button type="button" class="cx-button" data-cx-zoom-out>\u2212</button><output data-cx-zoom>100%</output><button type="button" class="cx-button" data-cx-zoom-in>+</button><button type="button" class="cx-button" data-cx-zoom-fit>Fit</button></div><p class="cx-meta" data-cx-figure-caption></p></div>';
  document.body.append(dialog);
  const img = dialog.querySelector("[data-cx-figure-image]"), out = dialog.querySelector("[data-cx-zoom]");
  let zoom = 1;
  const apply = () => {
    img.style.width = `${zoom * 100}%`;
    out.value = `${Math.round(zoom * 100)}%`;
  };
  const close = () => {
    dialog.close();
    lastTrigger?.focus();
  };
  const openFigure = (trigger) => {
    if (!trigger) return;
    lastTrigger = trigger;
    img.src = trigger.dataset.cxFigureSrc || trigger.querySelector("img")?.currentSrc || trigger.querySelector("img")?.src || "";
    img.alt = trigger.dataset.cxFigureAlt || trigger.querySelector("img")?.alt || "";
    dialog.querySelector("[data-cx-figure-title]").textContent = trigger.dataset.cxFigureTitle || "";
    dialog.querySelector("[data-cx-figure-caption]").textContent = trigger.dataset.cxFigureCaption || "";
    zoom = 1;
    apply();
    dialog.showModal();
  };
  scope.addEventListener("click", (e) => openFigure(e.target.closest("[data-cx-expandable-figure]")));
  scope.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-cx-expandable-figure]")) {
      e.preventDefault();
      openFigure(e.target.closest("[data-cx-expandable-figure]"));
    }
  });
  dialog.querySelector("[data-cx-figure-close]").addEventListener("click", close);
  dialog.querySelector("[data-cx-zoom-in]").addEventListener("click", () => {
    zoom = clamp(zoom + 0.25, 0.5, 4);
    apply();
  });
  dialog.querySelector("[data-cx-zoom-out]").addEventListener("click", () => {
    zoom = clamp(zoom - 0.25, 0.5, 4);
    apply();
  });
  dialog.querySelector("[data-cx-zoom-fit]").addEventListener("click", () => {
    zoom = 1;
    apply();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener("close", () => lastTrigger?.focus());
}

// assets/customer-ui/js/static-atmosphere.js
var REGISTRY_URL2 = "/content/product-visual-platform-r1/static-assets/pvp-r1-vis-w30-static-production-asset-registry-v1.json";
var EVIDENCE_URL = "/content/product-visual-platform-r1/static-assets/evidence/pvp-r1-vis-w31-remote-verification-v1.json";
var CSS_VAR_BY_ID = Object.freeze({
  "VIS-TEX-001": "--pvp-vis-tex-001",
  "VIS-TEX-002": "--pvp-vis-tex-002",
  "VIS-TEX-003": "--pvp-vis-tex-003",
  "VIS-TEX-004": "--pvp-vis-tex-004",
  "VIS-DEC-001": "--pvp-vis-dec-001",
  "VIS-DEC-002": "--pvp-vis-dec-002",
  "VIS-DEC-003": "--pvp-vis-dec-003",
  "VIS-DEC-004": "--pvp-vis-dec-004"
});
async function getJson(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`PVP_STATIC_ASSET_${response.status}:${url}`);
  return response.json();
}
function verifiedIds(evidence) {
  if (evidence?.status !== "REMOTE_VERIFIED_ALL_SELECTED") return /* @__PURE__ */ new Set();
  return new Set((evidence.results || []).filter((x) => x.ok === true && x.httpStatus === 200).map((x) => x.assetId));
}
async function installStaticAtmosphere(scope = document) {
  try {
    const [registry2, evidence] = await Promise.all([getJson(REGISTRY_URL2), getJson(EVIDENCE_URL)]);
    const verified = verifiedIds(evidence);
    let active = 0;
    for (const item of registry2?.backgroundBindings || []) {
      if (!verified.has(item.assetId)) continue;
      const cssVar = CSS_VAR_BY_ID[item.assetId];
      if (!cssVar || !item.publicUrl) continue;
      scope.documentElement?.style?.setProperty(cssVar, `url("${item.publicUrl}")`);
      active += 1;
    }
    if (active === 8) {
      scope.documentElement.dataset.pvpStaticAtmosphere = "remote-verified";
      scope.body?.setAttribute("data-pvp-static-atmosphere", "active");
    }
  } catch (error) {
    scope.documentElement.dataset.pvpStaticAtmosphere = "fail-closed";
    console.info("[PVP static atmosphere] inactive until W31 remote verification", error.message);
  }
}

// assets/js/branding/favicon-authority.js
var PHIOS_FAVICON_VERSION = "ptrc-w1-20260914";
var PHIOS_FAVICON_VERIFIED_FALLBACK_URL = `https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/branding/logo/PHIOS-FAVICON-v1.svg?v=${PHIOS_FAVICON_VERSION}`;
var PHIOS_WEB_MANIFEST_URL = `/site.webmanifest?v=${PHIOS_FAVICON_VERSION}`;
function ensureCanonicalPhiosFavicon(href = PHIOS_FAVICON_VERIFIED_FALLBACK_URL, { marker = "data-phios-branding" } = {}) {
  const head = document.head;
  if (!head) return null;
  const icons = [...head.querySelectorAll('link[rel~="icon"]')];
  let link = icons.find((item) => item.hasAttribute(marker)) || icons.find((item) => item.dataset.phiosBranding === "true" || item.dataset.phiosJourneyBranding === "true");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    head.append(link);
  }
  link.setAttribute(marker, "true");
  link.type = "image/svg+xml";
  link.href = href;
  icons.forEach((item) => {
    if (item !== link) item.remove();
  });
  return link;
}
function ensurePhiosWebManifest(href = PHIOS_WEB_MANIFEST_URL) {
  const head = document.head;
  if (!head) return null;
  let link = head.querySelector('link[rel="manifest"][data-phios-branding="true"]') || head.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    head.append(link);
  }
  link.dataset.phiosBranding = "true";
  link.href = href;
  return link;
}

// assets/customer-ui/js/shell.js
var ACCOUNT_PRESENTATION = Object.freeze({
  GUEST: Object.freeze({ en: "Guest", zh: "\u8BBF\u5BA2" }),
  AUTHENTICATED: Object.freeze({ en: "Authenticated", zh: "\u5DF2\u767B\u5F55" }),
  PROFESSIONAL: Object.freeze({ en: "Professional", zh: "\u4E13\u4E1A\u8D26\u6237" })
});
var t2 = (en, zh) => `data-cx-en="${en}" data-cx-zh="${zh}"`;
var aria = (en, zh) => `data-cx-en-aria-label="${en}" data-cx-zh-aria-label="${zh}" aria-label="${en}"`;
function presentedAccountState(scope = document) {
  const declared = scope?.body?.dataset?.cxAccountState || globalThis.__PHIOS_CUSTOMER_SHELL_CONTEXT__?.accountState || "GUEST";
  return Object.hasOwn(ACCOUNT_PRESENTATION, declared) ? declared : "GUEST";
}
function navLinks(active, extraClass = "") {
  return CX_NAVIGATION.primary.map((item) => `<a class="cx-nav-link ${extraClass}" href="${item.href}" data-cx-nav-link ${item.id === active ? 'aria-current="page"' : ""} ${t2(item.en, item.zh)}>${item.en}</a>`).join("");
}
function accountStateBadge(state) {
  const label = ACCOUNT_PRESENTATION[state] || ACCOUNT_PRESENTATION.GUEST;
  return `<span class="cx-account-state" data-cx-account-state="${state}" ${t2(label.en, label.zh)}>${label.en}</span>`;
}
function utilityControl(item, state, mobile = false) {
  const cls = mobile ? "cx-drawer-link" : "cx-utility-link";
  if (item.id === "ACCOUNT") {
    return `<a class="${cls} cx-account-link" href="${item.href}" data-cx-nav-link><span ${t2(item.en, item.zh)}>${item.en}</span>${accountStateBadge(state)}</a>`;
  }
  return `<button class="${cls}" type="button" data-cx-dialog-open="${item.dialogId}" ${aria(item.en, item.zh)}><span ${t2(item.en, item.zh)}>${item.en}</span></button>`;
}
function utilityControls(state, mobile = false) {
  return CX_NAVIGATION.utilities.map((item) => utilityControl(item, state, mobile)).join("");
}
function localeControl(compact = false) {
  return `<div class="cx-locale${compact ? " cx-locale--drawer" : ""}" ${aria("Language", "\u8BED\u8A00")}><button type="button" data-cx-locale="en">EN</button><button type="button" data-cx-locale="zh-Hans">\u4E2D\u6587</button></div>`;
}
function headerMarkup(active, state) {
  return `<header class="cx-shell-header" data-open="false" data-cx-shell-region="header">
    <div class="cx-container cx-shell-header__inner">
      <a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-009" data-cx-asset-auto="contrast" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a>
      <nav class="cx-primary-nav" aria-label="Primary">${navLinks(active)}</nav>
      <div class="cx-utilities">${utilityControls(state)}${localeControl()}</div>
      <button class="cx-menu-button" type="button" data-cx-menu data-cx-dialog-open="cx-shell-navigation" aria-controls="cx-shell-navigation" aria-expanded="false" ${aria("Open menu", "\u6253\u5F00\u83DC\u5355")}><span ${t2("Menu", "\u83DC\u5355")}>Menu</span></button>
    </div>
  </header>`;
}
function navigationDrawerMarkup(active, state) {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--navigation" id="cx-shell-navigation" aria-labelledby="cx-shell-navigation-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><strong id="cx-shell-navigation-title" ${t2("Navigate PHI OS", "\u6D4F\u89C8 PHI OS")}>Navigate PHI OS</strong><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria("Close menu", "\u5173\u95ED\u83DC\u5355")}>\xD7</button></div>
      <nav class="cx-drawer-nav" aria-label="Mobile primary">${navLinks(active, "cx-drawer-link")}</nav>
      <div class="cx-drawer-utilities">${utilityControls(state, true)}</div>
      ${localeControl(true)}
    </div>
  </dialog>`;
}
function searchDrawerMarkup() {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--utility" id="cx-shell-search" aria-labelledby="cx-shell-search-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><div><p class="cx-eyebrow" ${t2("SEARCH", "\u641C\u7D22")}>SEARCH</p><h2 class="cx-heading-2" id="cx-shell-search-title" ${t2("Find articles, books and figures.", "\u67E5\u627E\u6587\u7AE0\u3001\u4E66\u7C4D\u4E0E\u56FE\u793A\u3002")}>Find articles, books and figures.</h2></div><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria("Close search", "\u5173\u95ED\u641C\u7D22")}>\xD7</button></div>
      <p class="cx-body cx-muted" ${t2("Search PHI OS books, articles, figures and concepts. Open a result to read it, or carry that source into Ask.", "\u641C\u7D22 PHI OS \u7684\u4E66\u7C4D\u3001\u6587\u7AE0\u3001\u56FE\u793A\u4E0E\u6982\u5FF5\uFF1B\u6253\u5F00\u7ED3\u679C\u7EE7\u7EED\u9605\u8BFB\uFF0C\u4E5F\u53EF\u4EE5\u628A\u8FD9\u4E2A\u6765\u6E90\u5E26\u5165 Ask\u3002")}>Search PHI OS books, articles, figures and concepts. Open a result to read it, or carry that source into Ask.</p>
      <form class="cx-shell-utility-form" action="/search/" method="get" role="search">
        <label class="cx-field"><span ${t2("What are you looking for?", "\u4F60\u60F3\u67E5\u627E\u4EC0\u4E48\uFF1F")}>What are you looking for?</span><input class="cx-input" type="search" name="q" maxlength="300" autocomplete="off" ${aria("Search PHI OS knowledge", "\u641C\u7D22 PHI OS \u77E5\u8BC6")} data-cx-en-placeholder="Search books, articles and concepts\u2026" data-cx-zh-placeholder="\u641C\u7D22\u4E66\u7C4D\u3001\u6587\u7AE0\u4E0E\u6982\u5FF5\u2026\u2026" placeholder="Search books, articles and concepts\u2026"></label>
        <button class="cx-button cx-button--primary" type="submit" ${t2("Search", "\u641C\u7D22")}>Search</button>
      </form>
      <a class="cx-button cx-button--text" href="/search/" data-cx-nav-link ${t2("Open full search", "\u6253\u5F00\u5B8C\u6574\u641C\u7D22")}>Open full search</a>
    </div>
  </dialog>`;
}
function askDrawerMarkup() {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--utility" id="cx-shell-ask" aria-labelledby="cx-shell-ask-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><div><p class="cx-eyebrow">ASK PHI OS</p><h2 class="cx-heading-2" id="cx-shell-ask-title" ${t2("Start with one question.", "\u4ECE\u4E00\u4E2A\u95EE\u9898\u5F00\u59CB\u3002")}>Start with one question.</h2></div><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria("Close Ask PHI OS", "\u5173\u95ED Ask PHI OS")}>\xD7</button></div>
      <p class="cx-body cx-muted" ${t2("Ask one question, then choose which available knowledge or personal context may be used. You can review the selected context before sending.", "\u63D0\u51FA\u4E00\u4E2A\u95EE\u9898\uFF0C\u518D\u9009\u62E9\u672C\u6B21\u53EF\u4EE5\u4F7F\u7528\u54EA\u4E9B\u77E5\u8BC6\u6216\u4E2A\u4EBA\u60C5\u5883\uFF1B\u9001\u51FA\u524D\uFF0C\u4F60\u53EF\u4EE5\u5148\u786E\u8BA4\u6240\u9009\u60C5\u5883\u3002")}>Ask one question, then choose which available knowledge or personal context may be used. You can review the selected context before sending.</p>
      <form class="cx-shell-utility-form" action="/knowledge/ask/" method="get">
        <label class="cx-field"><span ${t2("What are you trying to understand?", "\u4F60\u6B63\u5728\u8BD5\u56FE\u7406\u89E3\u4EC0\u4E48\uFF1F")}>What are you trying to understand?</span><textarea class="cx-textarea" name="q" maxlength="500" required data-cx-en-placeholder="What feels uncertain, current, or important?" data-cx-zh-placeholder="\u73B0\u5728\u6709\u4EC0\u4E48\u4E0D\u786E\u5B9A\u3001\u6B63\u5728\u53D1\u751F\uFF0C\u6216\u5BF9\u4F60\u5F88\u91CD\u8981\uFF1F" placeholder="What feels uncertain, current, or important?"></textarea></label>
        <button class="cx-button cx-button--primary" type="submit">Ask PHI OS</button>
      </form>
      <a class="cx-button cx-button--text" href="/knowledge/ask/" data-cx-nav-link ${t2("Open Ask PHI OS", "\u6253\u5F00 Ask PHI OS")}>Open Ask PHI OS</a>
    </div>
  </dialog>`;
}
function installSearchDrawerNavigation(scope = document) {
  const form = scope.querySelector('#cx-shell-search form[action="/search/"]');
  if (!form || form.dataset.cxSearchNavigationInstalled === "true") return;
  form.dataset.cxSearchNavigationInstalled = "true";
  const input = form.querySelector('input[name="q"]');
  const openLink = scope.querySelector('#cx-shell-search a[href="/search/"]');
  const destination = (value) => {
    const q3 = String(value || "").trim();
    const navigation = knowledgeNavigationIntent(q3, document.documentElement.lang);
    if (navigation) return navigation.href;
    const params = new URLSearchParams();
    if (q3) params.set("q", q3);
    const suffix = params.toString();
    return `/search/${suffix ? `?${suffix}` : ""}`;
  };
  const syncOpenLink = () => {
    if (openLink) openLink.href = destination(input?.value);
  };
  input?.addEventListener("input", syncOpenLink);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const dialog = form.closest("dialog");
    if (dialog?.open) dialog.close("navigate");
    location.assign(destination(input?.value));
  });
  syncOpenLink();
}
function installAskDrawerNavigation(scope = document) {
  const form = scope.querySelector('#cx-shell-ask form[action="/knowledge/ask/"]');
  if (!form || form.dataset.cxAskNavigationInstalled === "true") return;
  form.dataset.cxAskNavigationInstalled = "true";
  const textarea = form.querySelector('textarea[name="q"]');
  const openLink = scope.querySelector('#cx-shell-ask a[href="/knowledge/ask/"]');
  const destination = (value) => {
    const q3 = String(value || "").trim();
    const params = new URLSearchParams();
    if (q3) params.set("q", q3);
    const suffix = params.toString();
    return `/knowledge/ask/${suffix ? `?${suffix}` : ""}`;
  };
  const syncOpenLink = () => {
    if (openLink) openLink.href = destination(textarea?.value);
  };
  textarea?.addEventListener("input", syncOpenLink);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q3 = String(textarea?.value || "").trim();
    if (!q3) {
      textarea?.focus();
      return;
    }
    const dialog = form.closest("dialog");
    if (dialog?.open) dialog.close("navigate");
    location.assign(destination(q3));
  });
  syncOpenLink();
}
function footerLink(href, en, zh) {
  return `<a href="${href}" ${t2(en, zh)}>${en}</a>`;
}
function footerMarkup() {
  return `<footer class="cx-shell-footer" data-cx-shell-region="footer"><div class="cx-container cx-shell-footer__grid">
    <div class="cx-stack"><a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-006" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a><p class="cx-meta" ${t2("Reality changes. Your understanding should be able to change with it.", "\u73B0\u5B9E\u4F1A\u7EE7\u7EED\u53D8\u5316\uFF0C\u4F60\u7684\u7406\u89E3\u4E5F\u5E94\u8BE5\u80FD\u591F\u968F\u4E4B\u66F4\u65B0\u3002")}>Reality changes. Your understanding should be able to change with it.</p></div>
    <div><p class="cx-eyebrow" ${t2("Navigate", "\u6D4F\u89C8")}>Navigate</p><p class="cx-meta">${footerLink("/explore/", "Explore", "\u63A2\u7D22")}<br>${footerLink("/reality/", "My Reality", "\u6211\u7684\u73B0\u5B9E")}<br>${footerLink("/perspectives/", "Perspectives", "\u89C6\u89D2")}</p></div>
    <div><p class="cx-eyebrow" ${t2("Knowledge", "\u77E5\u8BC6")}>Knowledge</p><p class="cx-meta">${footerLink("/knowledge/", "Knowledge home", "\u77E5\u8BC6\u4E3B\u9875")}<br>${footerLink("/search/", "Search", "\u641C\u7D22")}<br>${footerLink("/knowledge/ask/", "Ask PHI OS", "Ask PHI OS")}</p></div>
    <div><p class="cx-eyebrow" ${t2("Continue", "\u7EE7\u7EED")}>Continue</p><p class="cx-meta">${footerLink("/professional/", "Professional", "\u4E13\u4E1A")}<br>${footerLink("/account/", "Account", "\u8D26\u6237")}<br>${footerLink("/terms", "Terms", "\u6761\u6B3E")} \xB7 ${footerLink("/privacy", "Privacy", "\u9690\u79C1")}</p></div>
  </div></footer>`;
}
function shellChrome(active, state) {
  return `${headerMarkup(active, state)}${navigationDrawerMarkup(active, state)}${searchDrawerMarkup()}${askDrawerMarkup()}`;
}
async function initializeCustomerShell(scope = document) {
  const active = document.body.dataset.cxNav || "";
  const state = presentedAccountState(document);
  const head = scope.querySelector("[data-cx-header]");
  if (head) head.outerHTML = shellChrome(active, state);
  const foot = scope.querySelector("[data-cx-footer]");
  if (foot) foot.outerHTML = footerMarkup();
  ensureCanonicalPhiosFavicon();
  ensurePhiosWebManifest();
  installCustomerDialogs(scope);
  installNavigationToggle(scope.querySelector(".cx-shell-header"), scope);
  installLocaleControls(scope);
  installSearchDrawerNavigation(scope);
  installAskDrawerNavigation(scope);
  installExpandableFigures(scope);
  void hydrateCustomerAssets(scope).catch((error) => console.error("CX_ASSET_HYDRATION_FAILED", error));
  void hydrateSevenVolumeAssets(scope).catch((error) => console.error("CX_SEVEN_VOLUME_ASSET_HYDRATION_FAILED", error));
  await installStaticAtmosphere(scope);
  document.documentElement.dataset.cxShell = "ready";
  document.documentElement.dataset.cxAccountPresentation = state;
}
initializeCustomerShell().then(async () => {
  if (document.body.dataset.cxSurface === "SYMBOLIC_ICHING") {
    await Promise.resolve().then(() => (init_iching_customer_entry(), iching_customer_entry_exports));
  }
  if (document.body.dataset.cxSurface === "ICHING_FULL_PRODUCTION") {
    await Promise.resolve().then(() => (init_iching_run_cutover(), iching_run_cutover_exports));
    if (document.body.dataset.ichingRunCutover === "redirecting") return;
    return Promise.resolve().then(() => (init_iching_casting(), iching_casting_exports));
  }
}).catch((error) => console.error("CX_SHELL_INITIALIZATION_FAILED", error));
export {
  initializeCustomerShell,
  presentedAccountState
};
