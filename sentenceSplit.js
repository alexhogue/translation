(function () {
  const VIS_H = 800;

    async function translateToFrench(text) {
        const trimmed = text.trim();
        if (!trimmed) return "";
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            trimmed
        )}&langpair=en|fr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Translation request failed");
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated == null) throw new Error("Invalid response");
        return translated;
    }

    function charPos(ch) {
      const c = String(ch || "");
      if (!c) return 13;
      const cp = c.codePointAt(0);
      const lower = c.toLowerCase().codePointAt(0);
      // a-z => 0..25
      if (lower >= 97 && lower <= 122) return lower - 97;
      // 0-9 => 0..26
      if (cp >= 48 && cp <= 57) return Math.round(((cp - 48) / 9) * 26);
      // symbols/unicode => deterministic 0..26 bucket
      return cp % 27;
    }

    function wordPos(word) {
      const chars = [...String(word)].filter((ch) => !/\s/.test(ch));
      if (!chars.length) return 13;
      const sum = chars.reduce((s, ch) => s + charPos(ch), 0);
      return sum / chars.length; // 0..26-ish
    }

    function splitIntoSentences(text) {
      const t = (text || "").trim();
      if (!t) return [];
      return t
        .split(/(?<=[.!?,])\s+|\r?\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    function splitIntoWords(text) {
      const sentences = splitIntoSentences(text);
      const chunks =
        sentences.length > 0
          ? sentences
          : [(text || "").trim()].filter(Boolean);
      const out = [];
      chunks.forEach((sentence, sentenceIndex) => {
        sentence
          .split(/\s+/)
          .map((w) => w.replace(/[[\]]/g, "").trim())
          .filter(Boolean)
          .forEach((word) => {
            out.push({ word, sentenceIndex });
          });
      });
      return out;
    }


    function splitFrench(text) {
        const sentences = splitIntoSentences(text);
     
        return sentences.map((s) =>
          s
            .split(/\s+/)
            .map((w) => w.replace(/[[\]]/g, "").trim())
            .filter(Boolean)
        );
        // try {
        //     const french = await translateToFrench(text);
        //     const sentences = splitIntoSentences(french);
        //     // IMPORTANT: return plain strings, grouped by sentence
        //     // (not {word, sentenceIndex} objects)
        //     return sentences.map((s) =>
        //     s
        //         .split(/\s+/)
        //         .map((w) => w.replace(/[[\]]/g, "").trim())
        //         .filter(Boolean)
        //     );
        // } catch (err) {
        //     return [["Could not translate text"]];
        // }
      
    }

    function buildSentencePaths(wordsBySentence, w, h) {
      const marginX = 25;
      const marginY = 25;
      const innerW = w - marginX * 2;
      const innerH = h - marginY * 2;
      return wordsBySentence.map((words, sIdx) => {
        const n = Math.max(words.length, 1);
        return words.map((word, i) => {
          const avg = wordPos(word); // 0..26
          const xBase = marginX + (avg / 26) * innerW;
          // small deterministic jitter so strands overlap organically
          let hash = 0;
          for (const ch of word) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
          hash ^= sIdx * 131 + i * 17;
          const jitterX = ((hash % 13) - 6) * 1.2;
          const y =
            n === 1 ? marginY + innerH * 0.5 : marginY + (i / (n - 1)) * innerH;
          const wordLength = String(word)
            .split("")
            .filter((ch) => ch !== "[" && ch !== "]").length;
          return { x: xBase + jitterX, y, word, wordLength };
        });
      });
    }

    
    let instance = null;
    let containerEl = null;
    let currentText = "";
    let resizeObs = null;
    let wordsBySentence = [];

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
        wordsBySentence = splitFrench(currentText);
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
            p.background(backgroundColor);
            const paths = buildSentencePaths(
              wordsBySentence,
              p.width,
              p.height
            );
            p.colorMode(p.HSL, 360, 100, 100, 255);
            paths.forEach((pts, sIdx) => {
              // stable hue per sentence
              const hue = (sIdx * 67) % 360;
              const lineAlpha = 225;
              const dotAlpha = 225;
              // sentence line
              p.noFill();
              p.beginShape();
              p.curveVertex(pts[0].x, pts[0].y);
              for (const pt of pts) {
                p.stroke(hue, 35, 62, lineAlpha);
                p.strokeWeight(2);
                p.curveVertex(pt.x, pt.y);
              }
              // duplicate last point for curve end
              const last = pts[pts.length - 1];
              p.curveVertex(last.x, last.y);
              p.endShape();

              // sentence circles
              p.fill(hue, 45, 55, 95);
              p.stroke(hue, 35, 62, dotAlpha);
              for (const pt of pts) {
                p.rectMode(p.CENTER);
                p.rect(pt.x, pt.y, 3 * pt.wordLength, 3 * pt.wordLength);
              }
            });
          };
        }, containerEl);

        window.addEventListener("resize", () => {
          if (!instance || !containerEl) return;

          instance.resizeCanvas(
            containerEl.clientWidth,
            containerEl.clientHeight
          );
          instance.redraw();
        });

        if (!resizeObs) {
          resizeObs = new ResizeObserver(() => {
            const w = containerEl.clientWidth;
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
        wordsBySentence = splitFrench(currentText);
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

  window.French = { ensure, render, clear };

  
})();