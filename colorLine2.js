(function () {
  const VIS_H = 800;

  function alphabetIndex(ch) {
    const c = (ch || "").toLowerCase();
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return code - 97;
    return null;
  }

  function visualSplitIntoWords(text) {
    return (text || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function syl_count(word) {
    word = word.toLowerCase(); //word.downcase!
    if (word.length <= 3) {
      return 1;
    } //return 1 if word.length <= 3
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, ""); //word.sub!(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, ""); //word.sub!(/^y/, '')
    if (word.match(/[aeiouy]{1,2}/g).length == null) {
      return 1;
    } else {
      return word.match(/[aeiouy]{1,2}/g).length; //word.scan(/[aeiouy]{1,2}/).size
    }
  }

  function colorForWordLength(len) {
    if (len == 1) {
      // very short: bright blue
      return "rgb(155, 26, 17)";
    } else if (len <= 2) {
      // short/medium: green
      return "rgb(197, 119, 56)";
    } else if (len <= 3) {
      // medium/long: orange
      return "rgba(228, 177, 59, 1)";
    } else if (len <= 4) {
      // very long: red
      return "rgba(176, 189, 112, 1)";
    } else if (len <= 5) {
      // very long: red
      return "rgba(82, 127, 93, 1)";
    } else if (len <= 6) {
      return "rgba(169, 195, 191, 1)";
    } else {
      return "rgba(70, 152, 203, 1)";
    }
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

    const words = visualSplitIntoWords(trimmed);
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
      const marginX = 40;
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


      const centerY = VIS_H / 2;

      const innerW = canvasW - 2 * marginX;
      let wordCx = marginX + wordOrder * innerW;

      // Gentle jitter, but keep centers within margins.
      const jitterX = (wordHash % 40) - 20;
      const jitterY = ((wordHash * 7) % 40) - 20;
      wordCx = Math.max(marginX, Math.min(canvasW - marginX, wordCx));
      let wordCy = Math.max(marginY, Math.min(VIS_H/1.75 - 45 * syl_count(word), VIS_H - marginY));

      const endsWithPunctuation = /[.!?]$/.test(word);
      const startsSentence = nextStartsSentence;  

      centers.push({
        cx: wordCx,
        cy: wordCy,
        color: colorForWordLength(cleanLength),
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
        const cx = wordCx;
        const cy = wordCy;

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
        p.background(backgroundColor);
      };

      p.draw = () => {
        p.background(backgroundColor);
        const availableWidth = containerEl.clientWidth;

        const { blobs, centers } = buildVisualBlobs(currentText, p.width);
        if (!blobs.length && !centers.length) return;
        p.resizeCanvas(availableWidth, containerEl.clientHeight);

        if (buildLineSegments(centers).length >= 1) {
          p.noFill();
          p.stroke(0, 0, 0, 90);
          p.strokeWeight(1);
          segments = buildLineSegments(centers);
          for (const segment of segments) {
            p.beginShape();
            for (const c of segment) {
              p.vertex(c.cx, c.cy);
            }
            p.endShape();
          }
        }

        for (const c of centers) {
            p.noStroke();
            p.fill(c.color);
            if (c.start) {
                p.circle(c.cx, c.cy, 24);
            } else {
                p.circle(c.cx, c.cy, 12);
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
    p.background(backgroundColor);
  }

  window.ColorLine2 = { ensure, render, clear };
})();
