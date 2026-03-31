(function () {
  const VIS_H = 800;
  const MARGIN = 40;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return code - 97;
    return 13;
  }

  function splitIntoWords(sentence) {
    return sentence
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function splitIntoSentences(text) {
    // Split on ., ?, ! but keep them attached to the sentence
    return text
      .split(/(?<=[.!?])\s+/) // “Lookbehind”: split after punctuation + spaces
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickSentenceCenter(w, h) {
    return {
      cx: randomInRange(MARGIN, w - MARGIN),
      cy: randomInRange(MARGIN, h - MARGIN),
    };
  }

  function layoutSentences(text, w, h) {
    const sentences = splitIntoSentences(text);
    const sentenceDots = [];

    sentences.forEach((sentence, i) => {
      const words = splitIntoWords(sentence);
      const wordDots = [];

      const center = pickSentenceCenter(w, h);
      const centerCx = center.cx;
      const centerCy = center.cy;

      const jitter = 130;
      const baseRadius = 45;
      const angleStep = (2 * Math.PI) / Math.max(words.length, 1);

      words.forEach((word, i) => {
        const angle = i * angleStep;
        const radius = baseRadius + Math.random() * jitter;

        let wordCx = centerCx + Math.cos(angle) * radius;
        let wordCy = centerCy + Math.sin(angle) * radius;
        
        wordCx = Math.max(MARGIN, Math.min(w - MARGIN, wordCx));
        wordCy = Math.max(MARGIN, Math.min(h - MARGIN, wordCy));

        wordDots.push({
          cx: wordCx,
          cy: wordCy,
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


  function buildLineSegments(centers) {
    const segments = [];
    let current = [];

    centers.forEach((c, idx) => {
      current.push(c);

      // If this center is marked as a break, or it’s the last one,
      // we finish the current segment and start a new one.
      if (c.break && current.length > 1) {
        segments.push(current);
        current = [];
      }
    });

    // If there’s a tail segment with at least two points, keep it
    if (current.length > 1) segments.push(current);

    return segments;
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
        const availableWidth = containerEl.clientWidth;

        p.resizeCanvas(availableWidth, containerEl.clientHeight);
        const { sentenceDots } = layoutSentences(currentText, availableWidth, p.height);

        // if (buildLineSegments(centers).length > 1) {
        //   p.noFill();
        //   p.stroke(0, 0, 0, 90);
        //   p.strokeWeight(1);
        //   segments = buildLineSegments(centers);
        //   for (const segment of segments) {
        //     p.beginShape();
        //     for (const c of segment) {
        //       p.vertex(c.cx, c.cy);
        //     }
        //     p.endShape();
        //   }
        // }

        for (const s of sentenceDots) {
          p.noStroke();
          p.fill(0);
          p.circle(s.cx, s.cy, 24);

          if (s.words) {
            for (const w of s.words) {
              p.circle(w.cx, w.cy, 14);
            }
          }
        }

        for (const s of sentenceDots) {
          p.stroke(0);
          p.fill(0);


          if (s.words) {
            for (const w of s.words) {
              p.line(s.cx, s.cy, w.cx, w.cy);
            }
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

  window.Neuron = { ensure, render, clear };
})();
