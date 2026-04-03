// Core translation logic, adapted from your React project `transforms.js`

const SYMBOLS = '◆●■▲▼★☆▪▫○◐◑◒◓☐☑☒⊕⊖⊗⊘'.split('');
const modeButtons = document.querySelectorAll(".mode-btn");

function getSymbolIndex(char) {
  const code = char.charCodeAt(0);
  return code % SYMBOLS.length;
}

function toSymbols(text) {
  return text
    .split('')
    .map((c) => (c === ' ' ? ' ' : c === '\n' ? '\n' : SYMBOLS[getSymbolIndex(c)]))
    .join('');
}

function toBinary(text) {
  return text
    .split('')
    .map((c) =>
      c === ' ' ? ' ' : c === '\n' ? '\n' : c.charCodeAt(0).toString(2).padStart(8, '0'),
    )
    .join(' ');
}

async function translateToFrench(text) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    trimmed,
  )}&langpair=en|fr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation request failed');
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (translated == null) throw new Error('Invalid response');
  return translated;
}

function translateSync(input, mode) {
  if (!input.trim()) return '';
  switch (mode) {
    case 'symbols': return toSymbols(input);
    case 'numbers': return toNumbers(input);
    case 'binary': return toBinary(input);
    case 'abstract': return toAbstract(input);
    case 'script': return toAnotherScript(input);
    case 'homoglyphs': return toHomoglyphs(input);
    default: return input;
  }
}


const panel = document.getElementById('translation-panel');
const sourceWrap = document.getElementById("source-wrap");
const sourceEl = document.getElementById('source');
const modeEl = document.getElementById('mode-buttons');
const submitBtn = document.getElementById('submit-button');
const canvasContainerEl = document.getElementById('canvas-container');
const toggleBtns = document.querySelectorAll(".toggle-button");
const textControls = document.getElementById("text-controls");
const imageControls = document.getElementById("image-controls");
const generateBtns = document.querySelectorAll(".generate-text-btn")
const generateSentBtn = document.getElementById("generate-sentences-btn");
const generatePanBtn = document.getElementById("generate-pangram-btn")
const canvasArea = document.getElementById("canvas-area");
const saveButton = document.getElementById("download-canvas-btn");
const compressBtn = document.getElementById("compress-carat")

const backgroundColor = getComputedStyle(
  document.documentElement
).getPropertyValue("--lightmode-background");


let toggleMode = "text";
let currentMode = "";
let downloadCount = 0;

saveButton.addEventListener("click", () => {
  const canvas = document.querySelector("#canvas-container canvas");
  if (!canvas) return;
  downloadCount += 1;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "translation_" + downloadCount + ".png";
  a.click();
})

compressBtn.addEventListener("click", () => {
  const panelBody = document.getElementById("translation-body");
  if (compressBtn.getAttribute("aria-expanded") == "true") {
    panelBody.style.display = "none";
    compressBtn.style.transform = "rotate(180deg)"
    compressBtn.setAttribute("aria-expanded", "false");
  } else {
    panelBody.style.display = "flex";
    compressBtn.style.transform = "rotate(0deg)";
    compressBtn.setAttribute("aria-expanded", "true");
  }

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
})


generateBtns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const current = sourceEl.value || "";
    sourceEl.value = "Generating...";

    if (btn.getAttribute("text-type") == "sentences") {
      try {
        // Font Gauntlet internal API pattern (from their code)
        const res = await fetch("https://fontgauntlet.com/api/text/paragraph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exclude: current ? [current] : [],
            language: "Default", // or "English" (pick what you prefer)
            languageWikipedia: "en", // for English
          }),
        });

        const data = await res.json();
        if (!res.ok || data?.err) {
          throw new Error(data?.err || `Request failed (${res.status})`);
        }

        // Font Gauntlet code uses `a.text` for the generated paragraph
        const paragraph = data.text.match(/[^.!?]+[.!?]+/g).slice(0, 3).join(" ").trim();

        if (!paragraph) throw new Error("No paragraph text in response");

        // This is the key: keep manual typing AND make Generate fill the textarea
        sourceEl.value = paragraph;
      } catch (err) {
        alert(err?.message || "Failed to generate text");
      }
    } else if (btn.getAttribute("text-type") == "pangram") {
      try {
        // Font Gauntlet internal API pattern (from their code)
        const res = await fetch("https://fontgauntlet.com/api/text/pangram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exclude: current ? [current] : [],
            language: "Default", // or "English" (pick what you prefer)
            languageWikipedia: "en", // for English
          }),
        });

        const data = await res.json();
        if (!res.ok || data?.err) {
          throw new Error(data?.err || `Request failed (${res.status})`);
        }

        // Font Gauntlet code uses `a.text` for the generated paragraph
        const paragraph = data.text
          .concat(".")

        if (!paragraph) throw new Error("No paragraph text in response");

        // This is the key: keep manual typing AND make Generate fill the textarea
        sourceEl.value = paragraph;
      } catch (err) {
        alert(err?.message || "Failed to generate text");
      }

    }
  });
})

    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const toggle = btn.getAttribute("toggle-mode");
        toggleMode = toggle;
        toggleBtns.forEach((btn) => {
          btn.removeAttribute("aria-pressed");
        });
        btn.setAttribute("aria-pressed", "true");
        if (toggleMode === "text") {
          textControls.setAttribute("aria-visible", "true");
          imageControls.setAttribute("aria-visible", "false");

        } else if (toggleMode === "visual") {
          textControls.setAttribute("aria-visible", "false");
          imageControls.setAttribute("aria-visible", "true");
        }

      });
    });

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        currentMode = mode;
        modeButtons.forEach((btn) => {
          btn.removeAttribute("aria-pressed");
        });
        btn.setAttribute("aria-pressed", "true");

      });
    });

    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const text = sourceEl.value || "";

      if (toggleMode === "text") {
        if (!text.trim()) {
          // resultEl.textContent = '—';
          if (window.VisualMono) window.VisualMono.clear();
          if (window.VisualColor1) window.VisualColor1.clear();
          if (window.VisualColor2) window.VisualColor2.clear();
          if (window.SquareGridR) window.SquareGridR.clear();
          if (window.VisualColor3) window.VisualColor3.clear();
          if (window.ColorLine2) window.ColorLine2.clear();
          if (window.ColorLine3) window.ColorLine3.clear();
          if (window.VisualText) window.VisualText.clear();
          if (window.ConcretePoem) window.ConcretePoem.clear();
          if (window.Neuron) window.Neuron.clear();
          if (window.Neuron2) window.Neuron2.clear();
          if (window.Neuron3) window.Neuron3.clear();
          if (window.Neuron4) window.Neuron4.clear();
          return;
        }

        // visual modes draw to p5 canvases
        if (currentMode === "visual") {
          // resultEl.textContent = '';
          canvasArea.scrollTop = 0;
          if (window.VisualMono) window.VisualMono.render(text);
          return;
        }

        if (currentMode === "visualColor1") {
          // resultEl.textContent = '';
          canvasArea.scrollTop = 0;
          if (window.VisualColor1) window.VisualColor1.render(text);
          return;
        }

        if (currentMode === "visualColor2") {
          // resultEl.textContent = "";
          if (window.VisualColor2) window.VisualColor2.render(text);
          return;
        }

        if (currentMode === "gridRadius") {
          // resultEl.textContent = "";
          if (window.SquareGridR) window.SquareGridR.render(text);
          return;
        }

        if (currentMode === "visualColor3") {
          // resultEl.textContent = "";
          if (window.VisualColor3) window.VisualColor3.render(text);
          return;
        }

        if (currentMode === "colorLine2") {
          // resultEl.textContent = "";
          if (window.ColorLine2) window.ColorLine2.render(text);
          return;
        }

        if (currentMode === "colorLine3") {
          // resultEl.textContent = "";
          if (window.ColorLine3) window.ColorLine3.render(text);
          return;
        }

        if (currentMode === "concretePoem") {
          // resultEl.textContent = "";
          if (window.ConcretePoem) window.ConcretePoem.render(text);
          return;
        }

        if (currentMode === "neuron") {
          // resultEl.textContent = "";
          if (window.Neuron) window.Neuron.render(text);
          return;
        }

        if (currentMode === "neuron2") {
          // resultEl.textContent = "";
          if (window.Neuron2) window.Neuron2.render(text);
          return;
        }

        if (currentMode === "neuron3") {
          // resultEl.textContent = "";
          if (window.Neuron3) window.Neuron3.render(text);
          return;
        }

        if (currentMode === "neuron4") {
          // resultEl.textContent = "";
          if (window.Neuron4) window.Neuron4.render(text);
          return;
        }

        if (window.VisualMono) window.VisualMono.clear();
        if (window.VisualColor1) window.VisualColor1.clear();
        if (window.VisualColor2) window.VisualColor2.clear();
        if (window.SquareGridR) window.SquareGridR.clear();
        if (window.VisualColor3) window.VisualColor3.clear();
        if (window.ColorLine2) window.ColorLine2.clear();
        if (window.ColorLine3) window.ColorLine3.clear();
        if (window.VisualText) window.VisualText.clear();
        if (window.ConcretePoem) window.ConcretePoem.clear();
        if (window.Neuron) window.Neuron.clear();
        if (window.Neuron2) window.Neuron2.clear();
        if (window.Neuron3) window.Neuron3.clear();
        if (window.Neuron4) window.Neuron4.clear();

        // else {
        //   const out = translateSync(text, mode);
        //   // resultEl.textContent = out || '—';
        // }

        if (currentMode === "french") {
          try {
            const out = await translateToFrench(text);
            if (window.VisualText) window.VisualText.render(out || "—");
          } catch (err) {
            if (window.VisualText)
              window.VisualText.render(
                err && err.message ? err.message : "Translation failed"
              );
          }
          return;
        }

        if (currentMode === "binary") {
          const out = translateSync(text, "binary");
          if (window.VisualText) window.VisualText.render(out || "—");
          return;
        }
      }
    });
    
      
      // if (mode === "poem") {
      //   const out = renderPoemSvg(text);
      //   if (window.VisualText) window.VisualText.render(out || "—");
      //   return;
      // }

  
  



