(function () {
  const VIS_H = 800;

  function lettersToIndices(text) {
    return text
      .split("")
      .map((c) => {
        if (c === " " || c === "\n") return null;
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 65;
        if (code >= 97 && code <= 122) return code - 97;
        return null;
      })
      .filter((n) => n !== null);
  }

  const SQUARE_SIZE = 40;
  const GAP = 8;

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
          p.createCanvas(w, VIS_H);
          p.pixelDensity(2);
          p.noLoop();
          p.background(255, 255, 255, 0);
        };

        p.draw = () => {
            p.background(255, 255, 255, 0);
            const indices = lettersToIndices(currentText);
            const availableWidth = containerEl.clientWidth;
            
            const cols = Math.max(
              1,
              Math.floor((availableWidth + GAP) / (SQUARE_SIZE + GAP))
            );
            const rows = Math.ceil(indices.length / cols) || 1;
            const width = cols * (SQUARE_SIZE + GAP) - GAP;
            const height = rows * (SQUARE_SIZE + GAP) - GAP;
            p.resizeCanvas(width, height);

            p.colorMode(p.HSL, 360, 100, 100, 1);
            p.noStroke();

            indices.forEach((idx, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * (SQUARE_SIZE + GAP);
                const y = row * (SQUARE_SIZE + GAP);

                const hue = (idx / 25) * 300;
                p.fill(hue, 75, 45, 1);
                p.rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
            });

        };

    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;
      instance.resizeCanvas(containerWidth(containerEl), VIS_H);
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
    p.background(255, 255, 255, 0);
  }

  window.VisualColor2 = { ensure, render, clear };

})();