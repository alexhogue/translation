(function () {
  const VIS_H = 800;
  const COLS = 80;
  // const density = " .:-=+*#%@";
  // const density = "@MWN#XGy%Ot?l!abovci-;:,.`  ";
  // const density = "@WMB$%8&#aohkbdpwmZ0LCJYzcvnrjft(}?~*->i!lI;:\",`'..  ";
  const density = "WMB8G&Aaohkbdpwm0Z7LCJYzcvnrjft?*->i!lI;:/,`' .  " + "    ";

  function brightnessToChar(brightness) {
    const index = Math.floor((brightness / 255) * (density.length - 1));
    return density[Math.min(index, density.length - 1)];
  }

  function colorToChar(r, g, b) {
    const rScaled = r / 255;
    const gScaled = g / 255;
    const bScaled = b / 255;
    const brightness = (r + g + b) / 3;

    const max = Math.max(rScaled, gScaled, bScaled);
    const min = Math.min(rScaled, gScaled, bScaled);
    const delta = max - min;
    let hue;

    if (delta === 0) {
      return brightnessToChar(brightness);
    }

    switch (max) {
      case rScaled:
        hue = (gScaled - bScaled) / delta;
        break;
      case gScaled:
        hue = (bScaled - rScaled) / delta + 2;
        break;
      case bScaled:
        hue = (rScaled - gScaled) / delta + 4;
        break;
    }
    hue = Math.round(hue * 60); // Convert to degrees
    if (hue < 0) hue += 360;

    const index = Math.floor((hue / 360) * (density.length - 1));
    return density[Math.min(index, density.length - 1)];

  }

  function buildGridFromImage(img) {
    const rows = Math.floor(COLS * (img.height / img.width) * 1.5);
    const cellW = img.width / COLS;
    const cellH = img.height / rows;
    const grid = [];
    img.loadPixels();

    for (let j = 0; j < rows; j++) {
      const row = [];
      for (let i = 0; i < COLS; i++) {
        const px = Math.floor((i + 0.5) * cellW);
        const py = Math.floor((j + 0.5) * cellH);
        const idx = (py * img.width + px) * 4;

        const r = img.pixels[idx];
        const g = img.pixels[idx + 1];
        const b = img.pixels[idx + 2];

        const hue = colorToChar(r, g, b);

        row.push(hue);
      }
      grid.push(row);
    }
    console.log({ grid, COLS, rows });
    return { grid, COLS, rows };
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
         const hue = colorToChar(r, g, b);
         line += hue;
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
  let currentGrid = null;
  let resizeObs = null;

  function ensure() {
    containerEl = document.getElementById("canvas-container");
    if (!containerEl) return null;

    containerEl.innerHTML = "";

    if (instance) {
      if (!containerEl.contains(instance.canvas)) {
        instance = null;
      } else {
        return instance;
      }
    }

    instance = new p5((p) => {
      p.setup = () => {
        p.redraw();
        p.clear();
        const w = containerEl.clientWidth;
        p.createCanvas(w, containerEl.clientHeight);
        p.pixelDensity(2);
        p.noLoop();
        p.background(backgroundColor);
      };

      p.draw = () => {
        p.clear();
        p.background(backgroundColor);
        const availableWidth = containerEl.clientWidth;
        if (!currentGrid) return; 
        const { grid, COLS, rows } = currentGrid;
        const w = p.width;
        const h = p.height;
        const cellW = w / COLS;
        const cellH = h / rows;
        p.fill(0);
        p.noStroke();

        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < COLS; i++) {
            p.text(grid[j][i], i * cellW, (j + 1) * cellH);
          }
        }


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

  function renderFromImage(url) {
    const p = ensure();
    if (!p) return;
    p.loadImage(url, (img) => {
      currentGrid = buildGridFromImage(img);
      p.redraw();
    });
  }

  function getText(url, activeTextArea) {
    const p = ensure();
    const ta = activeTextArea ?? window.activeInputTextarea;
    if (!p) return;
    p.loadImage(url, (img) => {
      ta.value = buildTextFromImage(img);
      p.redraw();
    });
  }

  function returnTextAsync(url) {
    const p = ensure();
    let textValue = "";
    return new Promise((resolve) => {
      p.loadImage(url, (img) => {
        resolve(buildTextFromImage(img));
      });
    });
  }

  window.asyncColorText = returnTextAsync;
  window.colorTextForBox = getText;
  window.handleImageForTextColor = renderFromImage;
})();
