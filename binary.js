(function () {

    function toBinary(text) {
        return text
            .split("")
            .map((c) =>
            c === " "
                ? " "
                : c === "\n"
                ? "\n"
                : c.charCodeAt(0).toString(2).padStart(8, "0")
            )
            .join(" ");
    }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  let instance = null;
  let containerEl = null;
  let currentText = "";
  let resizeObs = null;
  const SQUARE_SIZE = 40;
  const GAP = 0;
  let squareWidth = 25;

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
        const availableWidth = containerEl.clientWidth;
        // p.resizeCanvas(availableWidth, containerEl.clientHeight);

        const binaryText = toBinary(currentText);
        const binaryEntry = binaryText
          .split(" ")
          .filter((entry) => entry !== "");
        console.log(binaryEntry);

        const cols = Math.max(
          1,
          Math.floor((availableWidth + GAP) / (squareWidth + GAP))
        );
        const rows = Math.ceil(binaryEntry.length / cols) || 1;
        const width = cols * (squareWidth + GAP) - GAP;
        const height = rows * (SQUARE_SIZE + GAP) - GAP;
        p.resizeCanvas(width, height);
        p.noStroke();
        p.colorMode(p.HSL, 360, 100, 100, 1);

        binaryEntry.forEach((entry, i) => {

          const col = i % cols;
          const row = Math.floor(i / cols);
          let x = col * (squareWidth + GAP);
          let y = row * (SQUARE_SIZE + GAP);

          chs = entry.split("");

          console.log("characters " + chs);
          let oneCount = 0;
          let zeroCount = 0;

          chs.forEach((ch, i) => {
            console.log("ch " + ch);
            if (ch === "1") {
                oneCount = oneCount + 1;
            } else if (ch === "0") {
                zeroCount = zeroCount + 1;
            }
          })
          
          const dominant = Math.max(oneCount, zeroCount);
          let rectW = 25;
          if (dominant >= 8) rectW = 80;
          else if (dominant === 7) rectW = 68;
          else if (dominant === 6) rectW = 56;
          else if (dominant === 5) rectW = 44;
          
          let hue = 0;
          let trans = 0;
          console.log(oneCount + " " + zeroCount);

          if (oneCount > zeroCount) {
            hue = 150;
            trans = 1;
          } else if (oneCount < zeroCount) {
            hue = 290;
            trans = 1;
          } else {
            hue = 150;
            trans = 0;
            squareWidth = 20;
          }

          console.log(hue);

          p.fill(hue, 75, 45, trans);
          p.rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
        });
    }

      
    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;
      instance.resizeCanvas(
        containerWidth(containerEl),
        containerEl.clientHeight
      );
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

  window.Binary = { ensure, render, clear };
})();
