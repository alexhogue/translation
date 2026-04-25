(function () {

  function splitIntoSentences(text) {
    const t = (text || "").trim();
    if (!t) return [];
    return t
      .split(/(?<=[.!?,])\s+|\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  

  function wordToBinaryString(word) {
    const bytes = new TextEncoder().encode(word);
    return [...bytes].map((b) => b.toString(2).padStart(8, "0")).join(""); // full bitstring for the whole word
  }
  function sentencesToBinaryDigits(text) {
    return splitIntoSentences(text).map((sentence) =>
      sentence.trim().split(/\s+/).filter(Boolean).map(wordToBinaryString)
    );
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
  let margin = 25;

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
        const availableWidth = containerEl.clientWidth;
        // p.resizeCanvas(availableWidth, containerEl.clientHeight);

        const binarySentences = sentencesToBinaryDigits(currentText);
        console.log(availableWidth);

        const cols = binarySentences.length;
        const innerW = containerEl.clientWidth - margin;
        const innerH = containerEl.clientHeight - margin;
        // const rows = Math.ceil(binaryEntry.length / cols) || 1;

        p.resizeCanvas(availableWidth, containerEl.clientHeight);
        p.background(backgroundColor);
  

        p.colorMode(p.HSL, 360, 100, 100, 1);


        let prevX = 0;
        let totalX = 0;


          binarySentences.forEach((sentence, sIndex) => {
            // const row = i % rows;

            let band = innerW / Math.max(cols, 1);
            let x = margin + sIndex * band + band / 2;

            let difference = 0;
            let oneCount = 0;
            let zeroCount = 0;

            sentence.forEach((word, wIndex) => {
              chs = word.split("");

              chs.forEach((ch, i) => {
                if (ch === "1") {
                  oneCount = oneCount + 1;
                } else if (ch === "0") {
                  zeroCount = zeroCount + 1;
                }
              });
              const total = oneCount + zeroCount;
              difference = Math.abs(oneCount - zeroCount);
            });
            console.log(x);

            if (oneCount >= zeroCount) {
              let hue = (difference * 47) % 150;
              p.noStroke();
              p.fill(hue, 65, 65, 1);
              p.rect(prevX, 0, x - prevX, p.height);
            } else {
              let hue = 300 - ((difference * 47) % 150);
              p.noStroke();
              p.fill(hue, 65, 65, 1);
              p.rect(prevX, 0, x - prevX, p.height);
            }
            prevX = x;
            p.stroke(360, 100, 0, 1);
            p.line(x, 0, x, p.height);
          });
        


        binarySentences.forEach((sentence, sIndex) => {
          // const row = i % rows;

          let band = innerW / Math.max(cols, 1);
          let x = margin + sIndex * band + band / 2;


          sentence.forEach((word, wIndex) => {
            const sentLength = sentence.length;
            const yDivs = innerH / sentLength;
            const y = margin + wIndex * yDivs;

            let oneCount = 0;
            let zeroCount = 0;

            chs = word.split("");


            chs.forEach((ch, i) => {
              if (ch === "1") {
                oneCount = oneCount + 1;
              } else if (ch === "0") {
                zeroCount = zeroCount + 1;
              }
            });
            const total = oneCount + zeroCount;


            if (oneCount >= zeroCount) {
              p.fill(360, 100, 100, 1);
              p.stroke(360, 100, 0, 1);
              p.circle(x, y, 12);
            } else {
              p.fill(360, 100, 0, 1);
              p.stroke(360, 100, 100, 1);
              p.circle(x, y, 10);
            }

  

          });


        

      


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
