// Mono visual translation using p5.js (instance mode)
// Exposes a small API on `window.VisualMono`.

(function () {
  const VIS_H = 800;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return code - 97;
    return 13;
  }

  function visualSplitIntoWords(text) {
    return (text || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildVisualBlobs(text, canvasW, canvasH) {
    const trimmed = (text || "").trim();
    if (!trimmed) return { blobs: [], centers: [] };

    const words = visualSplitIntoWords(trimmed);
    if (!words.length) return { blobs: [], centers: [] };

    const blobs = [];
    const centers = [];

    const total = words.length;

    for (let wIndex = 0; wIndex < words.length; wIndex++) {
      const word = words[wIndex];
      const letters = word.split("");
      const length = letters.length;
      const lettersOnly = letters.filter((ch) => /[a-zA-Z]/.test(ch));
      const cleanLength = lettersOnly.length;
      if (!length || !cleanLength) continue;

      const wordHash =
        letters.reduce((s, ch, i) => s + ch.charCodeAt(0) * (i + 7), 0) + wIndex * 41;
      const avgAlpha =
        letters.reduce((sum, ch) => sum + alphabetIndex(ch), 0) / length; // 0..25

      // Map alphabet position (a..z) to left→right, and word index to top→bottom,
      // inside a safe inner box so nothing is cut off.
      const marginX = 40;
      const marginY = 40;
      const innerW = Math.max(0, canvasW - 2 * marginX);
      const innerH = Math.max(0, canvasH - 2 * marginY);

      const alphaNorm = avgAlpha / 25; // 0..1
      const rowNorm =
        words.length === 1 ? 0.5 : wIndex / (words.length - 1); // 0..1

      let wordCx = marginX + alphaNorm * innerW;
      let wordCy = marginY + rowNorm * innerH;

      // Gentle jitter, but keep centers within margins.
      const jitterX = ((wordHash % 40) - 20);
      const jitterY = (((wordHash * 7) % 40) - 20);
      wordCx = Math.max(marginX, Math.min(canvasW - 2 * marginX, wordCx + jitterX));
      wordCy = Math.max(marginY, Math.min(canvasH - 2 * marginY, wordCy + jitterY));

      centers.push({
        cx: wordCx,
        cy: wordCy,
        start: wIndex === 0,
        break: /[.!?]$/.test(word),
      });

      const spread = 12 + length * 2;

      for (let li = 0; li < letters.length; li++) {
        const ch = letters[li];
        const code = ch.charCodeAt(0);
        if (code < 65 || (code > 90 && code < 97) || code > 122) continue;

        const aIdx = alphabetIndex(ch);
        const wordSeed = letters.reduce(
          (s, ch, i) => s + ch.charCodeAt(0) * (i + 3),
          0
        );
        const hash = wordSeed + aIdx * 31 + li * 17;
        const a = ((hash % 360) * Math.PI) / 180;
        const dist = ((hash % 100) / 100) * spread;
        const cx = wordCx + Math.cos(a) * dist;
        const cy = wordCy + Math.sin(a) * dist * 0.8;

        const r = 8 + (aIdx / 25) * 45;
        const fillOpacity = 0.1 + (aIdx / 25) * 0.05;

        blobs.push({
          cx,
          cy,
          r,
          fillOpacity,
        });
      }
    }

    return { blobs, centers };
  }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  let instance = null;
  let containerEl = null;
  let currentText = "";

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
        p.background(backgroundColor);
        const { blobs, centers } = buildVisualBlobs(currentText, p.width, p.height);
        if (!blobs.length && !centers.length) return;

        // connecting line
        if (centers.length > 1) {
          p.noFill();
          p.stroke(0, 0, 0, 90);
          p.strokeWeight(1);
          p.beginShape();
          for (const c of centers) p.vertex(c.cx, c.cy);
          p.endShape();
        }

        // blobs
        p.noStroke();
        for (const b of blobs) {
          p.fill(0, 0, 0, Math.round(255 * b.fillOpacity));
          p.circle(b.cx, b.cy, b.r * 2);
        }
      };
    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;
      instance.resizeCanvas(containerWidth(containerEl), containerEl.clientHeight);
      instance.redraw();
    });

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

  window.VisualMono = { ensure, render, clear };
})();

