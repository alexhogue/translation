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
      return "rgba(82, 127, 93, 1)";
    } else if (len <= 6) {
      return "rgb(17, 89, 78)";
    } else if (len <= 7) {
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

  function buildVisualBlobs(text, canvasW, canvasH) {
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
      const marginY = 40;

      const rowNorm = words.length === 1 ? 0.5 : wIndex / (words.length - 1); // 0..1

       let wordOrder;

       if (words.length === 1) {
         // Single word: place it in the middle
         wordOrder = 0.5;
       } else {
         // Many words: normalize index to range 0..1 (first → 0, last → 1)
         wordOrder = wIndex / (words.length - 1);
       }

       const ch = letters[0];
       const aIdx = alphabetIndex(ch);
       const clamped = Math.max(0, Math.min(25, aIdx));
       const t = clamped / 25;
      //  console.log(ch + " " + aIdx);

       const jitter = (wordHash % 40) - 20; // small random push

      const innerW = canvasW - 2 * marginX;
      let wordCx = marginX + wordOrder * innerW;

      const innerH = canvasH - 2 * marginX
      let wordCy = marginY + innerH * t;
      console.log(ch + " " + wordCy)

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
        color: colorForWordLength(cleanLength),
        start: startsSentence,
        break: /[.!?]$/.test(word),
      });

      nextStartsSentence = endsWithPunctuation;

    }

    return { centers };
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
        p.createCanvas(w, VIS_H);
        p.pixelDensity(2);
        p.noLoop();
        p.background(backgroundColor);
      };

      p.draw = () => {
        p.background(backgroundColor);
        const availableWidth = containerEl.clientWidth;
        const availableHeight = containerEl.clientHeight;

        const { centers } = buildVisualBlobs(currentText, p.width, availableHeight);
        if (!centers.length) return;
        p.resizeCanvas(availableWidth, availableHeight);

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

  window.ColorLine3 = { ensure, render, clear };
})();
