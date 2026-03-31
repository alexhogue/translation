(function () {
  const VIS_H = 800;
  const MARGIN = 40;
  const COLS = 80;
  const density = "MWNX@#Gy%Ot?l!abovci-;:,.`  ";

  function brightnessToChar(brightness) {
    const index = Math.floor((brightness / 255) * (density.length - 1));
    return density[index];
  }

  function buildTextFromImage(img) {
    const rows = Math.floor(COLS * (img.height / img.width) * 0.5);
    const cellW = img.width / COLS;
    const cellH = img.height / rows;
    img.loadPixels();

    const textLines = [];
    for (let j = 0; j < rows; j++) {
      let line = "";
      for (let i = 0; i < COLS; i++) {
        const px = Math.floor((i + 0.5) * cellW);
        const py = Math.floor((j + 0.5) * cellH);
        const idx = (py * img.width + px) * 4;
        const r = img.pixels[idx];
        const g = img.pixels[idx + 1];
        const b = img.pixels[idx + 2];
        const brightness = (r + g + b) / 3;
        line += brightnessToChar(brightness);
      }
      textLines.push(line);
    }
    return textLines.join("\n");
  }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  let instance = null;
  let containerEl = null;
  let imgText = "";

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

    // containerEl.innerHTML = "";

    instance = new p5((p) => {
      p.setup = () => {
        
      };

      p.draw = () => {
    
      };
    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;
      instance.resizeCanvas(containerWidth(containerEl), VIS_H);
    //   instance.redraw();
    });

    return instance;
  }

  function renderFromImage(url) {
    const p = ensure();
    const someTextArea = document.getElementById("source");
    if (!p) return;
    p.loadImage(url, (img) => {
      someTextArea.value = buildTextFromImage(img);
    //   p.redraw();
    });
  }

//   function render(text) {
//     currentText = text || "";
//     const p = ensure();
//     if (!p) return;
//     p.redraw();
//   }

//   function clear() {
//     currentText = "";
//     const p = ensure();
//     if (!p) return;
//     p.background(255, 255, 255, 0);
//   }

//   window.ImageText = { ensure, render, clear };
  window.handleImageForText = renderFromImage;
})();
