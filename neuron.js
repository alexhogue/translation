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

  function buildVisualBlobs(text, canvasW) {
    const trimmed = (text || "").trim();
    if (!trimmed) return { blobs: [], centers: [] };

    const words = splitIntoWords(trimmed);
    if (!words.length) return { blobs: [], centers: [] };

    const blobs = [];
    const centers = [];

    const total = words.length;

    let nextStartsSentence = true;

    for (let wIndex = 0; wIndex < words.length; wIndex++) {
      const word = words[wIndex];
      const letters = word.split("");
      const length = letters.length;
      const lettersOnly = letters.filter((ch) => /[a-zA-Z]/.test(ch));
      const cleanLength = lettersOnly.length;
      if (!length || !cleanLength) continue;

      const wordHash =
        letters.reduce((s, ch, i) => s + ch.charCodeAt(0) * (i + 7), 0) +
        wIndex * 41;

      // Map alphabet position (a..z) to left→right, and word index to top→bottom,
      // inside a safe inner box so nothing is cut off.
      const marginX = 80;
      const marginY = 80;

      const rowNorm = words.length === 1 ? 0.5 : wIndex / (words.length - 1); // 0..1

      let wordOrder;

      if (words.length === 1) {
        // Single word: place it in the middle
        wordOrder = 0.5;
      } else {
        // Many words: normalize index to range 0..1 (first → 0, last → 1)
        wordOrder = wIndex / (words.length - 1);
      }

      const lengthBand = Math.min(3, Math.floor(length / 4)); // 0–3
      const baseRadius = 60 + lengthBand * 80; // 4 radial bands

      const jitter = (wordHash % 40) - 20; // small random push
      const radius = 110 + baseRadius + jitter;
      const angle = (wordHash % 360) * (Math.PI / 180);

      const centerY = VIS_H / 2;
      const radialY = centerY + Math.sin(angle) * radius;

      const innerW = canvasW - 2 * marginX;
      let wordCx = marginX + wordOrder * innerW;

      let wordCy = radialY;

      // Gentle jitter, but keep centers within margins.
      const jitterX = (wordHash % 40) - 20;
      const jitterY = ((wordHash * 7) % 40) - 20;
      wordCx = Math.max(marginX, Math.min(canvasW - marginX, wordCx));
      wordCy = Math.max(marginY, Math.min(VIS_H - marginY, wordCy));

      const endsWithPunctuation = /[.!?]$/.test(word);
      const startsSentence = nextStartsSentence;

      centers.push({
        cx: wordCx,
        cy: wordCy,
        start: startsSentence,
        break: /[.!?]$/.test(word),
      });

      nextStartsSentence = endsWithPunctuation;

      const spread = 12 + length * 2;

      for (let li = 0; li < letters.length; li++) {
        const ch = letters[li];
        const code = ch.charCodeAt(0);
        if (code < 65 || (code > 90 && code < 97) || code > 122) continue;

        const aIdx = alphabetIndex(ch);
        const wordSeed = letters.reduce(
          (s, ch, i) => s + ch.charCodeAt(0) * (i + 3),
          0
        );
        const hash = wordSeed + aIdx * 31 + li * 17;
        const a = ((hash % 360) * Math.PI) / 180;
        const dist = ((hash % 100) / 100) * spread;
        const cx = wordCx + Math.cos(a) * dist;
        const cy = wordCy + Math.sin(a) * dist * 0.8;

        const r = 8 + (aIdx / 25) * 50;
        const fillOpacity = 0.1 + (aIdx / 25) * 0.2;

        blobs.push({
          cx,
          cy,
          r,
          fillOpacity,
        });
      }
    }

    return { blobs, centers };
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
        p.noLoop();
        p.background(255, 255, 255, 0);
      };

      p.draw = () => {
        p.background(255, 255, 255, 0);
        const availableWidth = containerEl.clientWidth;

        const { blobs, centers } = buildVisualBlobs(currentText, p.width);
        if (!blobs.length && !centers.length) return;
        p.resizeCanvas(availableWidth, VIS_H);
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

  window.Neuron = { ensure, render, clear };
})();
