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


// Wire up the simple form UI

const form = document.getElementById('translation-form');
const sourceWrap = document.getElementById("source-wrap");
const sourceEl = document.getElementById('source');
const modeEl = document.getElementById('mode-buttons');
// const resultEl = document.getElementById('result');
const canvasContainerEl = document.getElementById('canvas-container');


if (sourceWrap) {
  sourceWrap.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    sourceWrap.classList.add("drag-over");
  });

  sourceWrap.addEventListener("dragleave", (e) => {
    e.preventDefault();
    sourceWrap.classList.remove("drag-over");
  });

  sourceWrap.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    sourceWrap.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    // Here: load image and run your text-picture logic, then draw on canvas
    

    window.handleImageForText(url);
    window.handleImageForTextPicture(url);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}

if (form && sourceEl && modeEl) {
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const mode = btn.getAttribute("data-mode");
      modeEl.value = mode;
      modeButtons.forEach((btn) => {
        btn.removeAttribute("aria-pressed");
      });
      btn.setAttribute("aria-pressed", "true");

      e.preventDefault();
      const text = sourceEl.value || "";

      if (!text.trim()) {
        // resultEl.textContent = '—';
        if (window.VisualMono) window.VisualMono.clear();
        if (window.VisualColor1) window.VisualColor1.clear();
        if (window.VisualColor2) window.VisualColor2.clear();
        if (window.SquareGridR) window.SquareGridR.clear();
        if (window.VisualColor3) window.VisualColor3.clear();
        if (window.ColorLine2) window.ColorLine2.clear();
        if (window.VisualText) window.VisualText.clear();
        if (window.ConcretePoem) window.ConcretePoem.clear();
        if (window.Neuron) window.Neuron.clear();
        if (window.Neuron2) window.Neuron2.clear();
        if (window.Neuron3) window.Neuron3.clear();
        return;
      }

      // visual modes draw to p5 canvases
      if (mode === "visual") {
        // resultEl.textContent = '';
        if (window.VisualMono) window.VisualMono.render(text);
        return;
      }

      if (mode === "visualColor1") {
        // resultEl.textContent = '';
        if (window.VisualColor1) window.VisualColor1.render(text);
        return;
      }

      if (mode === "visualColor2") {
        // resultEl.textContent = "";
        if (window.VisualColor2) window.VisualColor2.render(text);
        return;
      }

      if (mode === "gridRadius") {
        // resultEl.textContent = "";
        if (window.SquareGridR) window.SquareGridR.render(text);
        return;
      }

      if (mode === "visualColor3") {
        // resultEl.textContent = "";
        if (window.VisualColor3) window.VisualColor3.render(text);
        return;
      }

      if (mode === "colorLine2") {
        // resultEl.textContent = "";
        if (window.ColorLine2) window.ColorLine2.render(text);
        return;
      }

      if (mode === "concretePoem") {
        // resultEl.textContent = "";
        if (window.ConcretePoem) window.ConcretePoem.render(text);
        return;
      }

      if (mode === "neuron") {
        // resultEl.textContent = "";
        if (window.Neuron) window.Neuron.render(text);
        return;
      }

      if (mode === "neuron2") {
        // resultEl.textContent = "";
        if (window.Neuron2) window.Neuron2.render(text);
        return;
      }

      if (mode === "neuron3") {
        // resultEl.textContent = "";
        if (window.Neuron3) window.Neuron3.render(text);
        return;
      }

      if (window.VisualMono) window.VisualMono.clear();
      if (window.VisualColor1) window.VisualColor1.clear();
      if (window.VisualColor2) window.VisualColor2.clear();
      if (window.SquareGridR) window.SquareGridR.clear();
      if (window.VisualColor3) window.VisualColor3.clear();
      if (window.ColorLine2) window.ColorLine2.clear();
      if (window.VisualText) window.VisualText.clear();
      if (window.ConcretePoem) window.ConcretePoem.clear();
      if (window.Neuron) window.Neuron.clear();
      if (window.Neuron2) window.Neuron2.clear();
      if (window.Neuron3) window.Neuron3.clear();

      // else {
      //   const out = translateSync(text, mode);
      //   // resultEl.textContent = out || '—';
      // }

      if (mode === "french") {
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

      if (mode === "binary") {
        const out = translateSync(text, "binary");
        if (window.VisualText) window.VisualText.render(out || "—");
        return;
      }
      // if (mode === "poem") {
      //   const out = renderPoemSvg(text);
      //   if (window.VisualText) window.VisualText.render(out || "—");
      //   return;
      // }
    });
  })
  

}

