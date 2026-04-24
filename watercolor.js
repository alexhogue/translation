(function () {
  const VIS_H = 800;
  const MARGIN = 20;

  function hueFromWord(word) {
    let h = 2166136261;
    const s = String(word || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h) % 360;
  }

  function splitIntoSentences(text) {
    const t = (text || "").trim();
    if (!t) return [];
    return t
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function splitIntoWords(text) {
    const sentences = splitIntoSentences(text);
    const chunks =
      sentences.length > 0 ? sentences : [(text || "").trim()].filter(Boolean);
    const out = [];
    chunks.forEach((sentence, sentenceIndex) => {
      sentence
        .split(/\s+/)
        .map((w) => w.replace(/[[\]]/g, "").trim())
        .filter(Boolean)
        .forEach((word) => {
          out.push({ word, sentenceIndex });
        });
    });
    return out;
  }

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  /** Bucket sentences into overlapping coils */
  const POOL_COUNT = 3;
  function buildBlobs(text, canvasW, canvasH) {
    const items = splitIntoWords(text);
    if (!items.length) return [];
    const margin = 36;
    const innerW = Math.max(1, canvasW - 2 * margin);
    const innerH = Math.max(1, canvasH - 2 * margin);
    const K = POOL_COUNT;
    const nPerPool = new Array(K).fill(0);
    items.forEach((item) => {
      nPerPool[item.sentenceIndex % K]++;
    });
    const centerX = margin + innerW * 0.5;
    const centerY = margin + innerH * 0.5;
    const rx = innerW * 0.46;
    const ry = innerH * 0.46;
    let rotation = 0;
    const raw = text || "";
    for (let j = 0; j < raw.length; j++) {
      rotation = (rotation * 31 + raw.charCodeAt(j)) >>> 0;
    }
    rotation = (rotation % 360) * (Math.PI / 180);
    /** ~18–22% shift from canvas center — pools sit on a ring */
    const shiftAmt = 0.2;
    const poolMeta = [];
    for (let p = 0; p < K; p++) {
      const a = (2 * Math.PI * p) / K + rotation * 0.65;
      poolMeta.push({
        cx: centerX + Math.cos(a) * innerW * shiftAmt,
        cy: centerY + Math.sin(a) * innerH * shiftAmt,
        rot: rotation + p * 0.72,
        sx: 0.87 + (p % 3) * 0.11,
        sy: 1.08 - (p % 3) * 0.09,
      });
    }
    const idxInPool = new Array(K).fill(0);
    const rMin = Math.min(canvasW, canvasH) * 0.038;
    const rMax = Math.min(canvasW, canvasH) * 0.13;
    const blobs = [];
    items.forEach((item, i) => {
      const pool = item.sentenceIndex % K;
      const pm = poolMeta[pool];
      const iLocal = idxInPool[pool]++;
      const nLocal = Math.max(1, nPerPool[pool]);
      const len = Math.max(1, item.word.length);
      let hash = 0;
      for (let k = 0; k < item.word.length; k++) {
        hash =
          (hash * 31 + item.word.charCodeAt(k) + item.sentenceIndex * 19) >>> 0;
      }
      hash ^= i * 1315423911;
      const angle = iLocal * GOLDEN_ANGLE + pm.rot;
      const radial01 = Math.sqrt((iLocal + 0.65) / (nLocal + 0.3));
      let cx = pm.cx + Math.cos(angle) * radial01 * rx * pm.sx;
      let cy = pm.cy + Math.sin(angle) * radial01 * ry * pm.sy;
      const warpAmp = Math.min(rx, ry) * 0.12;
      cx += Math.sin(iLocal * 0.11 + pm.rot) * warpAmp;
      cy += Math.cos(iLocal * 0.08 + pm.rot * 1.2) * warpAmp * 0.88;
      cx += Math.sin(angle * 0.42 + pool * 0.5) * warpAmp * 0.4;
      cy += Math.cos(angle * 0.35 + pool * 0.4) * warpAmp * 0.35;
      cx += ((hash % 9) - 4) * 0.25;
      cy += (((hash >> 4) % 9) - 4) * 0.25;
      const pad = margin + Math.min(canvasW, canvasH) * 0.06;
      cx = Math.max(pad, Math.min(canvasW - pad, cx));
      cy = Math.max(pad, Math.min(canvasH - pad, cy));
      const hue = hueFromWord(item.word);
      const radius = rMin + (Math.min(len, 14) / 14) * (rMax - rMin);
      const ink = 0.1 + (Math.min(len, 18) / 18) * 0.38;
      const sat = 54 + (hue % 28);
      blobs.push({
        cx,
        cy,
        radius,
        hue,
        sat,
        ink,
        sentenceIndex: item.sentenceIndex,
      });
    });
    return blobs;
  }

  function drawRadialWash(ctx, blot) {
    const { cx, cy, radius, hue, sat, ink } = blot;
    const light = 51 + ((hue + cy * 0.01) % 12);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${ink})`);
    g.addColorStop(0.42, `hsla(${hue}, ${sat}%, ${light}%, ${ink * 0.45})`);
    g.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function sentenceCirclesFromBlobs(blobs) {
    const bySent = new Map();
    for (const b of blobs) {
      const si = b.sentenceIndex;
      if (!bySent.has(si)) bySent.set(si, []);
      bySent.get(si).push(b);
    }
    const circles = [];
    const keys = [...bySent.keys()].sort((a, b) => a - b);
    for (const si of keys) {
      const group = bySent.get(si);
      if (!group.length) continue;
      let sx = 0;
      let sy = 0;
      for (const b of group) {
        sx += b.cx;
        sy += b.cy;
      }
      sx /= group.length;
      sy /= group.length;
      let maxR = 0;
      for (const b of group) {
        const d = Math.hypot(b.cx - sx, b.cy - sy) + b.radius;
        if (d > maxR) maxR = d;
      }
      maxR += Math.max(10, maxR * 0.04);
      circles.push({ cx: sx, cy: sy, r: maxR });
    }
    return circles;
  }
  function drawSentenceRings(ctx, circles) {
    if (!circles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(45, 45, 45, 0.3)";
    ctx.lineWidth = 1;
    for (const c of circles) {
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  let instance = null;
  let containerEl = null;
  let currentText = "";
  let resizeObs = null;

  function ensure() {
    containerEl = document.getElementById("canvas-container");
    if (!containerEl) return null;

    if (instance) {
      if (!containerEl.contains(instance.canvas)) {
        instance = null;
      } else {
        return instance;
      }
    }

    containerEl.innerHTML = "";

    instance = new p5((p) => {
      p.setup = () => {
        const w = containerEl.clientWidth;
        p.createCanvas(w, containerEl.clientHeight);
        p.pixelDensity(2);
        p.noLoop();
        p.background(backgroundColor);
      };

      p.draw = () => {
        const availableWidth = containerEl.clientWidth;

        p.resizeCanvas(availableWidth, containerEl.clientHeight);
        p.background(backgroundColor);

         const blots = buildBlobs(currentText, p.width, p.height);
         if (!blots.length) return;
         const ctx = p.drawingContext;
         ctx.save();
         ctx.globalCompositeOperation = "multiply";
         for (const b of blots) drawRadialWash(ctx, b);
         ctx.restore();
         const rings = sentenceCirclesFromBlobs(blots);
         drawSentenceRings(ctx, rings);
      };
    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;
      instance.resizeCanvas(
        containerWidth(containerEl),
        containerEl.clientHeight
      );
      instance.redraw();
    });

    if (!resizeObs) {
      resizeObs = new ResizeObserver(() => {
        const w = containerWidth(containerEl);
        const h = containerEl.clientHeight || VIS_H;
        instance.resizeCanvas(w, h);
        instance.redraw();
      });
    }
    resizeObs.observe(containerEl);

    return instance;
  }

  function render(text) {
    currentText = text || "";
    const p = ensure();
    if (!p) return;
    p.redraw();
  }

  function clear() {
    currentText = "";
    const p = ensure();
    if (!p) return;
    p.background(backgroundColor);
  }

  window.Watercolor = { ensure, render, clear };
})();
