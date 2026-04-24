(function () {
  const VIS_H = 800;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    // const code = c.charCodeAt(0);
    const str = String(c);
    const cp = str.codePointAt(0);
    if (cp >= 97 && cp <= 122) return cp - 97;
    if (cp >= 48 && cp <= 57) {
      return Math.round(((cp - 48) / 9) * 10);
    } else return cp % 20;;
  }

  function visualSplitIntoWords(text) {
    return (text || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildCharDots(text, canvasW, canvasH) {
    const trimmed = (text || "").trim();
    if (!trimmed) return { dots: [], type: [] };

    const words = visualSplitIntoWords(trimmed);
    if (!words.length) return { dots: [], type: []};

    const marginX = 40;
    const marginY = 40;
    const dots = [];
    const letters = [];
    const chCode = [];

    for (let wIndex = 0; wIndex < words.length; wIndex++) {
      const word = words[wIndex];
      const wordLetters = word.split("").filter((ch) => ch !== "[" && ch !== "]");
      const length = wordLetters.length;
      if (!length) continue;

      for (let lIndex = 0; lIndex < wordLetters.length; lIndex++) {
        letters.push(wordLetters[lIndex]);
        
      }
    }

    for (let lIndex = 0; lIndex < letters.length; lIndex++) {
      const ch = letters[lIndex];
      const aIdx = alphabetIndex(ch);
      const clamped = Math.max(0, Math.min(25, aIdx));
      const t = clamped / 25;
      chCode.push(t);

      let letterOrder;

      if (letters.length === 1) {
        // Single word: place it in the middle
        letterOrder = 0.5;
      } else {
        // Many words: normalize index to range 0..1 (first → 0, last → 1)
        letterOrder = lIndex / letters.length;
      }

      const innerW = canvasW - 2 * marginX;
      let letterX = marginX + letterOrder * innerW;

      const innerH = canvasH - 2 * marginX;
      let letterY = marginY + innerH * t;

      letterX = Math.max(marginX, Math.min(canvasW - marginX, letterX));
      letterY = Math.max(marginY, Math.min(VIS_H - marginY, letterY));


      let chType = null;
      if (/^[a-zA-Z]$/.test(ch)) {
        chType = "letter";
      } else if (/^\d$/.test(ch)) {
        chType = "number";
      } else {
        chType = "symbol";
      }

      const isPeriod = /[.?!]/.test(ch);
      console.log(isPeriod)

      dots.push({
        cx: letterX,
        cy: letterY,
        type: chType,
        isPeriod: isPeriod,
      });
    }


    return { dots };
  }

  function containerWidth(container) {
    const w = container && container.clientWidth ? container.clientWidth : 900;
    return Math.max(320, Math.min(1200, w));
  }

  function containerHeight(container) {
    const h = container ? container.clientHeight : 900;
    return Math.max(0, Math.min(900, h));
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
        const h = containerEl.clientHeight;
        p.createCanvas(w, h);
        p.pixelDensity(2);
        p.noLoop();
        p.background(backgroundColor);
      };

      p.draw = () => {
        const availableWidth = containerEl.clientWidth;
        const availableHeight = containerEl.clientHeight;

        const { dots } = buildCharDots(currentText, p.width, p.height);
        if (!dots.length) return;
        p.resizeCanvas(availableWidth, availableHeight);
        p.background(backgroundColor);


        for (const d of dots) {
          if (d.isPeriod) {
            p.noStroke();
            p.fill(0, 0, 0, 10);
            p.rect(0, 0, d.cx, p.height);
            
            p.stroke(18, 0, 176);
            p.strokeWeight(1);
            p.line(d.cx, 0, d.cx, p.height);
          }
        }

        for (const d of dots) {
          p.noStroke();
          if (d.type === "letter") {
            p.fill(58, 140, 240, 127);
            p.circle(d.cx, d.cy, 16);
          } else if (d.type === "number") {
            p.fill(31, 148, 113, 127);
            p.circle(d.cx, d.cy, 12);
          } else {
            p.fill(18, 0, 176, 127);
            p.circle(d.cx, d.cy, 8);
          }
        }
        
      };
    }, containerEl);

    window.addEventListener("resize", () => {
      if (!instance || !containerEl) return;

      instance.resizeCanvas(containerWidth(containerEl), containerEl.clientHeight);
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

  window.charMap = { ensure, render, clear };
})();
