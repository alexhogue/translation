(function () {
  // --- ConcretePoem / PoemTranslation port ---

  function tokenizePoem(text) {
    if (!text) return [];
    const lines = text.split(/\n/);
    const tokens = [];
    for (const line of lines) {
      const words = line.trim().split(/\s+/).filter(Boolean);
      for (const w of words) tokens.push({ raw: w });
      tokens.push({ raw: "\n", isLineBreak: true });
    }
    tokens.pop();
    return tokens;
  }

  function hashPoem(string, i) {
    let h = 0;
    for (let j = 0; j < string.length; j++) {
      h = h * 31 + string.charCodeAt(j);
    }
    return (h + i * 17) >>> 0;
  }

  const POEM_TYPES = ["text", "square", "repeat", "line", "symbol"];
  const WEIGHTS = [3, 2, 1, 1, 3];

  function pickWeightedType() {
    const weighted = [];
    for (let i = 0; i < POEM_TYPES.length; i++) {
      for (let j = 0; j < WEIGHTS[i]; j++) {
        weighted.push(POEM_TYPES[i]);
      }
    }
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function classifyPoem(tokens) {
    const classifiedResults = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.isLineBreak) {
        classifiedResults.push({
          raw: t.raw,
          isLineBreak: true,
          type: "lineBreak",
        });
        continue;
      }

    //   const index = (Math.floor(Math.random() * POEM_TYPES.length));
    //   const type = POEM_TYPES[index];

      const type = pickWeightedType();
      classifiedResults.push({
        raw: t.raw,
        isLineBreak: t.isLineBreak,
        type,
      });
    }
    return classifiedResults;
  }

  function containerWidth(container) {
    const w = container.clientWidth;
    return Math.max(320, Math.min(1200, w));
  }
//   const POEM_CONTENT_WIDTH = 840;
  const POEM_MARGIN = 40;
  const POEM_LINE_HEIGHT = 28;
  const POEM_SQUARE_SIZE = 24;
  const POEM_ELEMENT_GAP = 12;

  function buildPoemPattern(text) {
    const tokens = classifyPoem(tokenizePoem(text));
    const pageElements = [];
    const availableWidth = containerWidth(containerEl);

    let currentX = POEM_MARGIN;
    let currentY = POEM_MARGIN;
    let rowHeight = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.isLineBreak) {
        currentY += rowHeight + POEM_ELEMENT_GAP;
        currentX = POEM_MARGIN;
        rowHeight = 0;
        continue;
      }

      let width;
      let elementHeight = POEM_LINE_HEIGHT;
      if (t.type === "text") {
        width = t.raw.length * 10;
      } else if (t.type === "square") {
        width = t.raw.length + 3 * POEM_ELEMENT_GAP;
        elementHeight = POEM_SQUARE_SIZE;
      } else if (t.type === "repeat") {
        const count = Math.min(20, Math.max(4, t.raw.length * 2));
        width = count * 10;
      } else if (t.type === "line") {
        width = availableWidth;
        elementHeight = 8;
      } else if (t.type === "symbol") {
        width = 24;
      }

      if (t.type === "line") {
        const lineFraction = 0.25 + (hashPoem(t.raw, i) % 4) * 0.25;
        const lineWidth = Math.round(availableWidth * lineFraction);
        const fitsOnCurrentRow =
          currentX > POEM_MARGIN &&
          currentX + lineWidth + POEM_ELEMENT_GAP <=
            POEM_MARGIN + availableWidth;
        if (fitsOnCurrentRow) {
          pageElements.push({
            type: "line",
            x1: currentX,
            y1: currentY,
            x2: currentX + lineWidth,
            y2: currentY,
            dashed: hashPoem(t.raw, i) % 2 === 0,
          });
          currentX += lineWidth + POEM_ELEMENT_GAP;
          rowHeight = Math.max(rowHeight, 8);
        } else {
          currentY += 8 + POEM_ELEMENT_GAP;
          pageElements.push({
            type: "line",
            x1: currentX,
            y1: currentY,
            x2: currentX + availableWidth,
            y2: currentY,
            dashed: hashPoem(t.raw, i) % 2 === 0,
          });
          currentY += 8 + POEM_ELEMENT_GAP;
          currentX = POEM_MARGIN;
          rowHeight = 0;
        }
        continue;
      }

      if (currentX + width + POEM_ELEMENT_GAP > availableWidth) {
        currentY += rowHeight + POEM_ELEMENT_GAP;
        currentX = POEM_MARGIN;
        rowHeight = 0;
      }

      if (t.type === "text") {
        pageElements.push({
          type: "text",
          content: t.raw,
          x: currentX,
          y: currentY,
        });
      } else if (t.type === "square") {
        pageElements.push({
          type: "square",
          x: currentX,
          y: currentY,
          w: 4 * t.raw.length + POEM_ELEMENT_GAP,
          h: POEM_SQUARE_SIZE,
        });
      } else if (t.type === "repeat") {
        const count = Math.min(20, Math.max(4, t.raw.length * 2));
        const char = t.raw[t.raw.length - 1] || "·";
        pageElements.push({
          type: "repeat",
          char,
          count,
          x: currentX,
          y: currentY,
        });
      } else if (t.type === "symbol") {
        const syms = ["Δ", "∞", "§", "·", "—"];
        const idx =
          (i * 7 + t.raw.length * 11 + (t.raw.charCodeAt(0) || 0)) %
          syms.length;
        const char = syms[idx];
        pageElements.push({ type: "symbol", char, x: currentX, y: currentY });
      }

      currentX += width + POEM_ELEMENT_GAP;
      rowHeight = Math.max(rowHeight, elementHeight);
    }

    const totalHeight = currentY + rowHeight + POEM_MARGIN;
    return { pageElements, contentWidth: availableWidth, totalHeight };
  }


  let instance = null;
  let containerEl = null;
  let currentText = "";
  const VIS_H = 800;

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
    let isHovered = false;

    instance = new p5((p) => {
      p.setup = () => {
        const w = containerEl.clientWidth;
        p.createCanvas(w, VIS_H);
        p.pixelDensity(5);
        p.noLoop();
        p.background(backgroundColor);
        // p.mouseMoved = () => {
        //   p.redraw();
        // };
      };

      p.draw = () => {
        p.clear();
        const containerWidth = containerEl.clientWidth
        const { pageElements, contentWidth, totalHeight } = buildPoemPattern(currentText)

        const scale = containerWidth / contentWidth;

        const canvasW = contentWidth * scale;
        const canvasH = totalHeight * scale;

        if (!pageElements.length) return;
        p.resizeCanvas(canvasW, canvasH);
        p.background(backgroundColor);
        p.scale(scale);
        const fontSize = 16;



        for (const el of pageElements) {
            if (el.type === "text") {
                p.fill(0);
                p.textSize(fontSize);
                p.textFont("serif");
                p.text(el.content, el.x, el.y + fontSize);
            } else if (el.type === "symbol") {
                p.fill(0);
                p.text(el.char, el.x, el.y + fontSize);
            } else if (el.type === "square") {
                const d = p.dist(
                  p.mouseX,
                  p.mouseY,
                  el.x + el.size / 2,
                  el.y + el.size / 2
                );
                isHovered = d <= el.size / 2;
                
                if (!isHovered) {
                    p.fill(0);
                    p.rect(el.x, el.y, el.w, el.h);
                } else {
                    p.fill("red");
                    p.rect(el.x, el.y, el.size, el.size);
                }
                
            } else if (el.type === "repeat") {
                p.fill(0);
                p.text(el.char.repeat(el.count), el.x, el.y);
            } else if (el.type === "line") {
                p.noFill();
                p.stroke(0)
                p.strokeWeight(1);
                if (el.dashed) {
                  p.drawingContext.setLineDash([4, 4]);
                }
                p.line(el.x1, el.y1, el.x2, el.y2);
                p.drawingContext.setLineDash([]);

            }

        }



        

        // for (const el of pageElements) {
        //   if (el.type === "text") {
        //     p.fill(0);
        //     p.noStroke();
        //     p.textSize(fontSize);
        //     p.textAlign(p.LEFT, p.BASELINE);
        //     p.text(el.content, el.x, el.y + fontSize); // +fontSize so y matches SVG “top” of first line
        //   } else if (el.type === "square") {
        //     p.fill(0);
        //     p.noStroke();
        //     p.rect(el.x, el.y, el.size, el.size);
        //   } else if (el.type === "repeat") {
        //     p.fill(0);
        //     p.noStroke();
        //     p.textSize(fontSize);
        //     p.textAlign(p.LEFT, p.BASELINE);
        //     p.text(el.char.repeat(el.count), el.x, el.y + fontSize);
        //   } else if (el.type === "line") {
        //     p.noFill();
        //     p.stroke(0);
        //     p.strokeWeight(1);
        //     if (el.dashed) {
        //       p.drawingContext.setLineDash([4, 2]);
        //     }
        //     p.line(el.x1, el.y1, el.x2, el.y2);
        //     p.drawingContext.setLineDash([]);
        //   } else if (el.type === "symbol") {
        //     p.fill(0);
        //     p.noStroke();
        //     p.textSize(fontSize);
        //     p.textAlign(p.LEFT, p.BASELINE);
        //     p.text(el.char, el.x, el.y + fontSize);
        //   }
        // }
    
      };

      window.addEventListener("resize", () => {
        if (!instance || !containerEl) return;
        instance.resizeCanvas(containerWidth(containerEl), VIS_H);
        instance.redraw();
      });


    }, containerEl);

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

  window.ConcretePoem = { ensure, render, clear };
})();