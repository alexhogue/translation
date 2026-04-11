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

const textControls = document.querySelector('[data-role="convert-to-image"]');
const imageControls = document.querySelector('[data-role="convert-to-text"]');
const panel = document.getElementById('translation-panel');
const resizer = document.getElementById("resizer");
const sourceWrap = textControls.querySelector('[data-role="source-wrap"]');
const sourceEl = textControls.querySelector('[data-role="input-text"]');
const modeEl = document.querySelector('.mode-buttons');
const submitBtn = document.getElementById('submit-button');
const canvasContainerEl = document.getElementById('canvas-container');
const toggleBtns = document.querySelectorAll(".toggle-button");
const restartBtnCont = document.getElementById("restart-cont");
const generateBtns = document.querySelectorAll(".generate-text-btn")
const generateSentBtn = textControls.querySelector('[data-role="generate-sentences"]');
const generatePanBtn = textControls.querySelector('[data-role="generate-pangram"]');
const canvasArea = document.getElementById("canvas-area");
const canvas = document.querySelector("canvas");
const saveButton = document.getElementById("download-canvas-btn");
const compressBtn = document.getElementById("compress-carat");
const pageTitle = document.getElementById("page-title");

function field(root, role) {
  return root?.querySelector(`[data-role="${role}"]`);
}

resizer.addEventListener("mousedown", (e) => {
  document.addEventListener("mousemove", resize, false);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", resize, false);
    },
    false
  );

})
function resize(e) {
  const clamped = Math.max(300, e.clientX);
  panel.style.flexBasis = `${clamped}px`;

}

const backgroundColor = getComputedStyle(
  document.documentElement
).getPropertyValue("--lightmode-background");

let toggleLocked = false;
let toggleMode = "";
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
    saveButton.style.display = "none";
    resizer.style.pointerEvents = "none";
    // pageTitle.style.display = "none";
    panel.style.flexBasis = `${25}px`;
  } else {
    panelBody.style.display = "flex";
    compressBtn.style.transform = "rotate(0deg)";
    compressBtn.setAttribute("aria-expanded", "true");
    saveButton.style.display = "block";
    // pageTitle.style.display = "block";
    resizer.style.pointerEvents = "auto";
    panel.style.flexBasis = `${300}px`;

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
        panel.style.flexBasis = `${300}px`;
        updateIfText();
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
        panel.style.flexBasis = `${300}px`;
        updateIfText();
      } catch (err) {
        alert(err?.message || "Failed to generate text");
      }

    }
  });
})

toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (toggleLocked) return;

    const toggle = btn.getAttribute("toggle-mode");
    toggleMode = toggle;
    toggleBtns.forEach((btn) => {
      btn.removeAttribute("aria-pressed");
    });
    btn.setAttribute("aria-pressed", "true");

    if (toggleMode === "text") {
      textControls.style.display = "block";
      imageControls.style.display = "none";

    } else if (toggleMode === "visual") {
      imageControls.style.display = "block";
      textControls.style.display = "none";
    }

    restartBtnCont.style.display = "flex";

    toggleLocked = true;
    document.getElementById("mode-switch-cont").classList.add("toggle-locked");
    toggleBtns.forEach((b) => {
      b.setAttribute("aria-disabled", "true");
      b.setAttribute("tabindex", "-1");
    });
    
  });
});

restartBtnCont.querySelector("button").addEventListener("click", () => {
  const ok = window.confirm(
    "Start over? This will clear your translation chain, canvas, and all inputs. This cannot be undone."
  );

  if (!ok) return;

  toggleLocked = false;
  toggleMode = "";
  currentMode = "";
  downloadCount = 0;
  stages = [];
  stageSeq = 0;
  if (chainStagesEl) chainStagesEl.innerHTML = "";
  canvasContainerEl.innerHTML = "";
  sourceEl.value = "";
  window.currentImage = "";
  modeButtons.forEach((btn) => {
    btn.removeAttribute("aria-pressed");
  });
  saveButton.style.display = "none";

  document.getElementById("mode-switch-cont").classList.remove("toggle-locked");
  toggleBtns.forEach((btn) => {
    btn.removeAttribute("aria-pressed");
    textControls.style.display = "none";
    imageControls.style.display = "none";
    btn.removeAttribute("aria-disabled", "true");
    btn.removeAttribute("tabindex");
  });

  restartBtnCont.style.display = "none";

});

function updateIfText() {
  const hasText = (sourceEl.value || "").trim().length > 0;
  textControls.querySelector('[data-role="to-image-buttons"]').style.visibility =
    hasText ? "visible" : "hidden";
  textControls.querySelector('[data-role="to-image-buttons"]').style.pointerEvents =
    hasText ? "auto" : "none";
    // panel.style.pointerEvents = hasText ? "auto" : "none";

}

sourceEl.addEventListener("input", updateIfText);

let activeInputTextarea = sourceEl;
let activeImageArea = null;
let text = "";


document.getElementById("controls-section").addEventListener("click", async (e) => {
  const btn = e.target.closest(".mode-btn");
  if (!btn) return;
  const stage = btn.closest(
    "[data-stage-id], [data-role='convert-to-text'], [data-role='convert-to-image']"
  );
  if (!stage) return;

  stage
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.removeAttribute("aria-pressed"));
  btn.setAttribute("aria-pressed", "true");
  currentMode = btn.getAttribute("data-mode");


  e.preventDefault();
  const textEl = field(stage, "input-text");
  text = (textEl ? textEl.value : sourceEl.value) || "";

  removeStages(stage, stages);
  

  const isRoot = stage.getAttribute("data-stage-id") === "root";
  const latestTemp = stages[stages.length - 1];
  const isMostRecentTemplate =
    (isRoot && stages.length === 0) ||
    (latestTemp?.el != null && stage === latestTemp.el);
  

  saveButton.style.display = "block";

  if (toggleMode === "text") {
    if (!text.trim()) {
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

      toggleMode = "visual";

      const canvas = document.querySelector("#canvas-container canvas");
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      appendStage("image-to-text", { input: dataUrl });

      return;
    }

    if (currentMode === "visualColor1") {
      // resultEl.textContent = '';
      canvasArea.scrollTop = 0;
      if (window.VisualColor1) window.VisualColor1.render(text);
      console.log(isMostRecentTemplate);
      if (isMostRecentTemplate) {
        toggleMode = "visual";

        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        appendStage("image-to-text", { input: dataUrl });
      }

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

  if (toggleMode === "visual") {
    if (currentMode === "typeArt") {
      window.handleImageForTextPicture(window.currentImage);
      toggleMode = "text";

      const canvas = document.querySelector("#canvas-container canvas");
      if (!canvas) return;

      text = await window.returnBrightnessText(window.currentImage);
      const record = appendStage("text-to-image", {
        input: text,
      });
      const textArea = field(record.el, "input-text");
      window.getBrightnessText(window.currentImage, textArea);
      return;
    }

    if (currentMode === "rgb") {
      window.handleRGB(window.currentImage);
      toggleMode = "text";

      const canvas = document.querySelector("#canvas-container canvas");
      if (!canvas) return;

      text = await window.returnRGBText(window.currentImage);
      const record = appendStage("text-to-image", {
        input: text,
      });
      const textArea = field(record.el, "input-text");
      window.getRGBText(window.currentImage, textArea);
      return;
    }

    if (currentMode === "description") {
      const out = await window.createDescription(window.currentImage);
      window.VisualText.render(out || "—");
      return;
    }
  }

});
    
      
/** @type {Array<{ id: string, kind: 'text-to-image' | 'image-to-text', input: string, output: string | null, mode: string | null, el: HTMLElement | null }>} */
let stages = [];
let stageSeq = 0;

const chainStagesEl = document.getElementById("chain-stages");
const tplTextToImage = document.getElementById("tpl-text-to-image");
const tplImageToText = document.getElementById("tpl-image-to-text");

/**
* @param {'text-to-image' | 'image-to-text'} kind
* @param {{ input?: string }} [opts]  input: text for text→image, or image URL/data URL for image→text
*/
function appendStage(kind, opts = {}) {
  const input = opts.input ?? "";
  const id = String(++stageSeq);
  const record = {
    id,
    kind,
    input,
    output: null,
    mode: null,
    el: null,
  };

  const tpl = kind === "text-to-image" ? tplTextToImage : tplImageToText;
  if (!tpl || !chainStagesEl) {
    console.error("Missing template or #chain-stages");
    return null;
  }

  const el = tpl.content.firstElementChild.cloneNode(true);
  if (!el) return null;

  el.setAttribute("data-stage-id", id);

  const label = field(el, "stage-label");

  if (label) {
    label.textContent =
      kind === "text-to-image"
        ? `Chain ${id}: Text → image`
        : `Chain ${id}: Image → text`;
  }

  if (kind === "text-to-image") {
    el.style.display = "flex";
    const textArea = field(el, "input-text");
    textArea.value = input;
    text = textArea.value;;
    const panel = field(el, "to-image-buttons");
    panel.style.display = "block";
  }

  if (kind === "image-to-text") {
    el.style.display = "flex";
    const img = field(el, "preview-img");
    if (img && input) {
      img.src = input;
      img.style.display = "block";
    }
    window.currentImage = input;
    const toText = field(el, "to-text-buttons");
    if (toText) toText.style.display = input ? "block" : "none";
  }

  chainStagesEl.appendChild(el);
  // el.scrollIntoView({ behavior: "smooth", block: "end" });
  const panelBody = document.getElementById("translation-body");
  panelBody.scrollTo({
    top: el.offsetTop - panelBody.offsetTop, // or just panelBody.scrollHeight
    behavior: "smooth",
  });
  record.el = el;
  stages.push(record);
  return record;

}

function removeStages(currentStage, allStages) {
  const currentStageIDString = currentStage.getAttribute("data-stage-id");
  if (!currentStageIDString) return;
  let currentStageID;
  if (currentStageIDString === "root") {
    currentStageID = 0;
  } else {
    currentStageID = Number(currentStageIDString);
  }

  for (let i = allStages.length - 1; i >= 0; i--) {
    const stage = allStages[i];
    const stageID = Number(stage.id);
    if (!stageID || stageID === "root") continue;
    
    if (stageID > currentStageID) {
      stage.el.remove();
      allStages.splice(i, 1);
      if (stage.kind === "text-to-image") {
        text = stage.input;
        toggleMode = "visual";
      } else {
        window.currentImage = stage.input;
        toggleMode = "text";
      }

      stageSeq = currentStageID;
    }

  }


}
  



