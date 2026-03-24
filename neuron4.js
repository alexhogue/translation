(function () {
  const VIS_H = 800;
  const MARGIN = 25;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return code - 97;
    return 13;
  }

  function splitIntoSentences(text) {
    // Split on ., ?, ! but keep them attached to the sentence
    return text
      .split(/(?<=[.!?])\s+/) // “Lookbehind”: split after punctuation + spaces
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function splitIntoWords(sentence) {
    return sentence
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function layoutSentences(text, w, h) {
    const sentences = splitIntoSentences(text);
    const sentenceDots = [];

    const cols = Math.ceil(Math.sqrt(sentences.length));
    const rows = Math.ceil(sentences.length / cols);

    const marginX = 40;
    const marginY = 40;
    
    const cellW = cols ? w / cols : w;
    const cellH = rows ? h / rows : h;

    sentences.forEach((sentence, i) => {
      const words = splitIntoWords(sentence);
      const wordDots = [];

      const col = i % cols;
      const row = Math.floor(i / cols);

      const centerCx = marginX + (col + 0.25) * cellW;
      const centerCy = marginY + (row + 0.5) * cellH;

      const jitter = 130;
      const baseRadius = 80;
      const angleStep = (2 * Math.PI) / Math.max(words.length, 1);

      words.forEach((word, i) => {
        const angle = i * angleStep;
        const radius = baseRadius;

        let wordCx = centerCx + Math.cos(angle) * radius;
        let wordCy = centerCy + Math.sin(angle) * radius;
        
        wordCx = Math.max(MARGIN, Math.min(w - MARGIN, wordCx));
        wordCy = Math.max(MARGIN, Math.min(h - MARGIN, wordCy));

        wordDots.push({
          cx: wordCx,
          cy: wordCy,
          label: word,
        });
      });

      sentenceDots.push({
        index: i,
        cx: centerCx,
        cy: centerCy,
        words: wordDots,
      });
    });

    return { sentenceDots };
  }

  function drawLabel(p, sentenceDots) {
    for (const s of sentenceDots) {
      if (p.dist(p.mouseX, p.mouseY, s.cx, s.cy) <= 14) {
        p.fill(137, 184, 226);
        p.circle(s.cx, s.cy, 28);

        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(s.index, s.cx, s.cy);
        return;
      }
      for (const w of s.words) {
        if (p.dist(p.mouseX, p.mouseY, w.cx, w.cy) <= 60) {
          p.fill(137, 184, 226);
          p.circle(s.cx, s.cy, 28);
        }
        if (p.dist(p.mouseX, p.mouseY, w.cx, w.cy) <= 12) {

          p.fill(238, 149, 117);
          p.circle(w.cx, w.cy, 18);
          
          p.fill(0);
          p.textSize(18);
          
          p.text(w.label, w.cx + 10, w.cy + 10);

          return;
        }
      }
    }
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
        p.createCanvas(w, VIS_H);
        p.pixelDensity(2);
        p.background(255, 255, 255, 0);
        p.mouseMoved = () => {
          p.redraw();
        };
      };

      p.draw = () => {
        p.background(255, 255, 255, 0);
        const availableWidth = containerEl.clientWidth;

        p.resizeCanvas(availableWidth, VIS_H);
        const { sentenceDots } = layoutSentences(currentText, availableWidth, p.height);

        for (const s of sentenceDots) {
          p.stroke(125, 125, 125);

          if (s.words) {
            for (const w of s.words) {
              p.line(s.cx, s.cy, w.cx, w.cy);
            }
          }
        }

        for (const s of sentenceDots) {
          p.noStroke();
          p.fill(175, 175, 175);
          p.circle(s.cx, s.cy, 24);

          if (s.words) {
            for (const w of s.words) {
              p.circle(w.cx, w.cy, 14);

            }
          }
        }

        p.fill(0);
        drawLabel(p, sentenceDots);

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


  window.Neuron4 = { ensure, render, clear };
})();
