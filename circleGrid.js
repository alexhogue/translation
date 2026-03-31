// Visual Color 1: one spot per word in a grid, layered circles per letter.
// Uses p5.js instance mode and exposes `window.VisualColor1`.

(function () {
  const VIS_H = 800;
  let button;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return code - 97;
    return null;
  }

  function splitWords(text) {
    return (text || "")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean);
  }

  function buildWordSpots(text, canvasW, canvasH) {
    const words = splitWords(text);
    if (!words.length) return [];

    const n = words.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);

    const marginX = 20;
    const marginY = 20;
    const innerW = Math.max(0, canvasW - 2 * marginX);
    const innerH = Math.max(0, canvasH - 2 * marginY);

    const cellW = cols ? innerW / cols : innerW;
    const cellH = rows ? innerH / rows : innerH;

    const spots = [];

    for (let i = 0; i < n; i++) {
      const word = words[i];
      const letters = word.split("").filter((ch) => alphabetIndex(ch) !== null);
      if (!letters.length) continue;

      const col = i % cols;
      const row = Math.floor(i / cols);

      const cx = marginX + (col + 0.25) * cellW;
      const cy = marginY + (row + 0.5) * cellH;

      spots.push({ cx, cy, letters });
    }

    return spots;
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
        const spots = buildWordSpots(currentText, p.width, p.height);
        if (!spots.length) return;

        p.colorMode(p.HSL, 360, 100, 100, 1);

        const minR = 6;
        const maxR = 36;

        for (const spot of spots) {
          const { cx, cy, letters } = spot;

          for (let i = 0; i < letters.length; i++) {
            const ch = letters[i];
            const idx = alphabetIndex(ch);
            if (idx === null) continue;

            const t = idx / 25; // 0..1
            const hue = t * 300; // spectrum
            const radius = minR + t * (maxR - minR);

            p.noStroke();
            p.fill(hue, 75, 50, 0.5); // 0.3 opacity
            p.circle(cx, cy, radius * 2);
          }
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

  window.VisualColor1 = { ensure, render, clear };
})();

