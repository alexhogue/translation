(function () {
  const VIS_H = 800;
  const MARGIN = 40;
  const COLS = 80;
  // const density = " .:-=+*#%@";
  // const density = "@MWN#XGy%Ot?l!abovci-;:,.`  ";
  const density = "@WMB$%8&#aohkbdpwmZ0LCJYzcvnrjft(}?~*->i!lI;:\",`'..  ";

  function brightnessToChar(brightness) {
    const index = Math.floor((brightness / 255) * (density.length - 1));
    return density[Math.min(index, density.length - 1)];
  }

  function buildGridFromImage(img) {
    const rows = Math.floor(COLS * (img.height / img.width) * 0.5);
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
        const brightness = (r + g + b) / 3;
        row.push(brightnessToChar(brightness));
      }
      grid.push(row);
    }
    return { grid, COLS, rows };
  }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  let instance = null;
  let containerEl = null;

  let currentGrid = null

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
        p.createCanvas(w, VIS_H);
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
      instance.resizeCanvas(containerWidth(containerEl), VIS_H);
      instance.redraw();
    });

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

  window.handleImageForTextPicture = renderFromImage;
})();
