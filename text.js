(function () {
    let instance = null;
    let containerEl = null;
    let currentText = "";

    const VIS_H = 800;

    function containerWidth(container) {
      const w =
        container && container.clientWidth ? container.clientWidth : 900;
      return Math.max(320, Math.min(1200, w));
    }

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
            p.background(backgroundColor);
          };

          p.draw = () => {
            p.background(backgroundColor);
            const words = currentText.split(/\s+/);
            const margin = 24;
            const lineHeight = 22;
            const fontSize = 16;
            const maxW = p.width - 2 * margin;
            p.textSize(fontSize);
            p.textAlign(p.LEFT, p.TOP);
            p.fill(0);
            let line = "";
            let y = margin;

            for (let i = 0; i < words.length; i++) {
                const testLine = line ? line + " " + words[i] : words[i];
                const tw = p.textWidth(testLine);
                if (tw > maxW && line) {
                    p.text(line, margin, y);
                    line = words[i];
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            if (line) p.text(line, margin, y);

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
      p.background(backgroundColor);
    }

    window.VisualText = { ensure, render, clear };
    
})();