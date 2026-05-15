const textControls = document.querySelector(
  '[data-role="convert-to-image-modes"]'
);
const textInput = document.querySelector(
  '[data-role="convert-to-image-input"]'
);
const imageInput = document.querySelector(
  '[data-role="convert-to-text-input"]'
);
const imageControls = document.querySelector(
  '[data-role="convert-to-text-modes"]'
);
const panel = document.getElementById("translation-panel");
const resizer = document.getElementById("resizer");
const sourceWrap = textInput.querySelector('[data-role="source-wrap"]');
const sourceEl = textInput.querySelector('[data-role="input-text"]');
const modeEl = document.querySelector(".mode-buttons");
const canvasContainerEl = document.getElementById("canvas-container");
const toggleBtns = document.querySelectorAll(".toggle-button");
const restartBtnCont = document.getElementById("restart-cont");
const generateBtns = document.querySelectorAll(".generate-text-btn");
const generateSentBtn = textInput.querySelector(
  '[data-role="generate-sentences"]'
);
const generatePanBtn = textInput.querySelector(
  '[data-role="generate-pangram"]'
);
const canvasArea = document.getElementById("canvas-area");
const canvas = document.querySelector("canvas");
// const saveButton = document.getElementById("download-canvas-btn");
const compressBtn = document.getElementById("compress-carat");
const pageTitle = document.getElementById("page-title");
const arrowChain = document.getElementById("arrow-section");
const arrowBtwn = document.querySelector(".between-arrows");
const darkModeBtn = document.getElementById("dark-mode-btn");
const originalImg = document.getElementById("original-img");
const initialDisplay = document.getElementById("initial-display");
const translationLoadingEl = document.getElementById("canvas-translation-loading");

function showCanvasTranslationLoading() {
  if (!translationLoadingEl) return;
  translationLoadingEl.hidden = false;
  translationLoadingEl.classList.add("is-visible");
  translationLoadingEl.setAttribute("aria-busy", "true");
}

function hideCanvasTranslationLoading() {
  if (!translationLoadingEl) return;
  translationLoadingEl.classList.remove("is-visible");
  translationLoadingEl.hidden = true;
  translationLoadingEl.setAttribute("aria-busy", "false");
}

let originalEmbedding = null;
let previousEmbedding = null;
let previousTextEmbedding = null;
let previousImgEmbedding = null;
const embeddingHistory = [];


// async function translateToFrench(text) {
//   const trimmed = text.trim();
//   if (!trimmed) return "";
//   const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
//     trimmed
//   )}&langpair=en|fr`;
//   const res = await fetch(url);
//   if (!res.ok) throw new Error("Translation request failed");
//   const data = await res.json();
//   const translated = data?.responseData?.translatedText;
//   if (translated == null) throw new Error("Invalid response");
//   return translated;
// }

darkModeBtn.addEventListener("click", () => {
  if (darkModeBtn.getAttribute("data-theme") == "light") {
    darkModeBtn.setAttribute("data-theme", "dark");
    originalImg.style.filter = "invert(1)";
    document.body.style.filter = "invert(1)";
    originalImg.style.filter = "invert(1)";
    darkModeBtn.children[0].style.display = "none";
    darkModeBtn.children[1].style.display = "flex";
  } else if (darkModeBtn.getAttribute("data-theme") == "dark") {
    darkModeBtn.setAttribute("data-theme", "light");
    originalImg.style.filter = "invert(0)";
    document.body.style.filter = "invert(0)";
    originalImg.style.filter = "invert(0)";
    darkModeBtn.children[0].style.display = "flex";
    darkModeBtn.children[1].style.display = "none";
  }
});

(function animateHeaderNoise() {
  const noiseEls = document.querySelectorAll("#top-banner .header-noise");

  function tick() {
    noiseEls.forEach((el) => {
      const digitCount = 8;
      numberArray = Array.from({ length: digitCount }, () =>
        Math.floor(Math.random() * 101)
      );
      el.textContent = `{b:${numberArray.join(",")}}`;
    });
  }

  tick();
  setInterval(tick, 300);
})();

// function addNewDesign() {
//   const sectionTitle = document.querySelectorAll(".section-title");

//   const barDesigns = document.querySelectorAll(".header-bars");
//   const newestElement = barDesigns[barDesigns.length - 1];

//   // // Create the new repeated element
//   // const newDiv = document.createElement("div");
//   // newDiv.className = "repeated-element";

//   const generateRandomList = (min, max, count) => {
//     return Array.from(
//       { length: count },
//       () => Math.floor(Math.random() * (max - min + 1)) + min
//     );
//   };

//   console.log(newestElement);
//   // Edit ONLY the new one's value before it's even visible
//   console.log(newestElement.textContent);
//   newestElement.textContent = `{b:${generateRandomList(5, 100, 8)}}`;

// Add it to the page
// container.appendChild(newDiv);
// }

function field(root, role) {
  return root?.querySelector(`[data-role="${role}"]`);
}

function setStageOutputForEl(stageEl, value, type) {
  const out = field(stageEl, "stage-output");
  if (!out) return;
  out.innerHTML = "";

  const row = out.closest('[data-role="stage-input-row"]');
  if (row) row.classList.remove("has-output");

  const outputLabel = field(stageEl, "stage-output-label");
  const otherActions = field(stageEl, "other-actions");

  if (type === "image") {
    const div = document.createElement("div");
    div.className = "stage-output-image-wrap";

    const img = document.createElement("img");
    img.alt = "output preview";
    img.src = String(value || "");
    img.className = "stage-output-image";
    // img.style.width = "100%";
    // img.style.height = "auto";

    div.appendChild(img);
    out.appendChild(div);
    
    if (row) row.classList.add("has-output");
    if (otherActions) otherActions.style.display = "flex";
    if (outputLabel) outputLabel.style.display = "block";
    showCompareOnPreviousStage(stageEl);
    return;
  }

  const ta = document.createElement("textarea");
  ta.readOnly = true;
  ta.value = String(value || "");
  ta.className = "stage-output-text";
  // ta.rows = Math.min(10, ta.value.split("\n").length + 2);
  out.appendChild(ta);
  if (outputLabel) outputLabel.style.display = "block";
  if (otherActions) otherActions.style.display = "flex";
  if (row) row.classList.add("has-output");
  showCompareOnPreviousStage(stageEl);
}

function showCompareOnPreviousStage(stageEl) {
  const stageId = stageEl?.getAttribute("data-stage-id");
  if (!stageId) return;
  const i = stages.findIndex((s) => s.id === stageId);
  // ROOT: show source compare in convert-to-text-input generate-btn-cont
  if (stageId === "root") {
    const rootSourcePanel = document.querySelector(
      '[data-role="convert-to-text-input"][data-stage-id="root"]'
    );
    const sourceCompareBtn = rootSourcePanel?.querySelector(
      '.generate-btn-cont [data-role="compare-image"]'
    );
    if (sourceCompareBtn) sourceCompareBtn.style.display = "flex";
    return;
  }
  if (i < 0) return; // no previous stage in chain
  // First chain stage -> previous is root
  if (i === 0) {
    // choose visible root modes panel
    const rootPanel =
      (textControls &&
        getComputedStyle(textControls).display !== "none" &&
        textControls) ||
      (imageControls &&
        getComputedStyle(imageControls).display !== "none" &&
        imageControls) ||
      textControls ||
      imageControls;
    const rootCompareBtn = rootPanel?.querySelector(
      '[data-role="compare-image"]'
    );
    if (rootCompareBtn) rootCompareBtn.style.display = "flex";
    return;
  }

  const prevEl = stages[i - 1]?.el;
  if (!prevEl) return;
  const prevCompareBtn = prevEl.querySelector('[data-role="compare-image"]');
  if (prevCompareBtn) prevCompareBtn.style.display = "flex";
}

function setStageOutputPng(stageEl, pngDataUrl) {
  if (!stageEl || !pngDataUrl) return;
  const stageId = stageEl.getAttribute("data-stage-id");
  const rec =
    stageId ? stages.find((s) => s.id === stageId) : null;
  if (rec) rec.outputPng = pngDataUrl;
  stageEl.dataset.outputPng = pngDataUrl;
  const out = field(stageEl, "stage-output");
  if (out) out.dataset.overlayPng = pngDataUrl; // easiest for hover lookup
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
});
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
let createdImages = [];

// saveButton.addEventListener("click", () => {
//   const canvas = document.querySelector("#canvas-container canvas");
//   if (!canvas) return;

//   let href = "";
//   downloadCount += 1;

//   if (darkModeBtn.getAttribute("data-theme") === "dark") {
//     const tmp = document.createElement("canvas");
//     tmp.width = canvas.width;
//     tmp.height = canvas.height;
//     const ctx = tmp.getContext("2d");
//     ctx.filter = "invert(1)";
//     ctx.drawImage(canvas, 0, 0);

//     href = tmp.toDataURL("image/png");
//   } else {
//     href = canvas.toDataURL("image/png");
//   }

//   const a = document.createElement("a");
//   a.href = href;
//   a.download = "translation_" + downloadCount + ".png";
//   a.click();
// });

const controls = document.getElementById("controls-section");
const overlay = document.getElementById("stage-hover-overlay");
const overlayScore = document.getElementById("stage-hover-score");

async function captureCanvasPngAfterPaint() {
  // Wait two RAFs so any pending p5 setup/redraw is committed to the
  // canvas pixels before we read them. Capturing too early can return a
  // blank canvas (setup hasn't run) or stale pixels from a prior stage.
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  const canvas = document.querySelector("#canvas-container canvas");
  if (!canvas) return null;
  return canvas.toDataURL("image/png");
}

function resolveFirstTranslationAnchorPng(stageEl) {
  if (rootRecord?.kind === "image-to-text" && rootRecord.outputPng) {
    return rootRecord.outputPng;
  }
  if (firstTranslationPng) return firstTranslationPng;

  const rootTextModes = document.querySelector(
    '[data-role="convert-to-text-modes"][data-stage-id="root"]'
  );
  return (
    rootTextModes?.dataset.outputPng ||
    field(rootTextModes, "stage-output")?.dataset.overlayPng ||
    stageEl?.dataset.outputPng ||
    field(stageEl, "stage-output")?.dataset.overlayPng ||
    ""
  );
}

async function showCompareOverlayFromBtn(compareBtn) {
  const stageEl = compareBtn.closest("[data-stage-id]");
  const target = compareBtn.getAttribute("data-compare-target");

  let anchorPng = "";
  if (target === "source") anchorPng = sourceImagePng || "";
  else if (target === "first") anchorPng = resolveFirstTranslationAnchorPng(stageEl);
  else {
    const stageId = stageEl.getAttribute("data-stage-id");
    const rec =
      stageId && stageId !== "root"
        ? stages.find((s) => s.id === stageId)
        : rootRecord;
    anchorPng =
      rec?.outputPng ||
      stageEl.dataset.outputPng ||
      field(stageEl, "stage-output")?.dataset.overlayPng ||
      "";
  }
  if (!anchorPng) return;
  // show image overlay immediately on press
  if (stack) stack.classList.add("is-visible");

  overlay.src = anchorPng;
  overlay.style.display = "block";
  overlay.style.opacity = "0.5";
  overlay.style.objectFit = "fill"; // or contain, your choice
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none";
  // find most recent png
  let latestPng = "";
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i]?.outputPng) {
      latestPng = stages[i].outputPng;
      break;
    }
  }
  if (!latestPng) {
    const canvas = document.querySelector("#canvas-container canvas");
    if (canvas) latestPng = canvas.toDataURL("image/png");
  }
  if (!latestPng) return;
  const [
    { similarity: semSim, pct: semPct },
    { similarity: visSim, pct: visPct },
  ] = await Promise.all([
    window.getClipImageSimilarity(anchorPng, latestPng), // semantic = CLIP
    window.getPngSimilarity(anchorPng, latestPng),
  ]);
  if (semSim == null && visSim == null) return;
  if (overlayScore) {
    overlayScore.textContent = `Semantic ${semPct ?? "—"}% · Visual ${
      visPct ?? "—"
    }%`;
    overlayScore.style.display = "block";
  }
  showCompareMeter({ semanticPct: semPct, visualPct: visPct });
}


function hideCompareOverlay() {
  if (overlay) {
    overlay.style.display = "none";
    overlay.removeAttribute("src");
  }
  if (overlayScore) {
    overlayScore.style.display = "none";
    overlayScore.textContent = "";
  }
  hideCompareMeter();

  if (activeCompareBtn) {
    setCompareBtnLabel(activeCompareBtn, "compare");
    activeCompareBtn = null;
  }
}

const stack = document.getElementById("compare-overlay-stack");

const semanticRow = document.querySelector(
  '#compare-sim-column .compare-sim-row[data-kind="semantic"]'
);
const visualRow = document.querySelector(
  '#compare-sim-column .compare-sim-row[data-kind="visual"]'
);

const semFillEl = semanticRow?.querySelector(".compare-sim-fill");
const semBadgeEl = semanticRow?.querySelector(".compare-sim-badge");
const visFillEl = visualRow?.querySelector(".compare-sim-fill");
const visBadgeEl = visualRow?.querySelector(".compare-sim-badge");

let activeCompareBtn = null;
function setCompareBtnLabel(btn, mode) {
  const label = btn?.querySelector("p");
  if (!label) return;
  label.textContent = mode === "hide" ? "Hide" : "Compare";
}

function setMeterBar(fillEl, badgeEl, pct) {
  if (pct == null) {
    if (fillEl) fillEl.style.width = "0%";
    if (badgeEl) {
      badgeEl.textContent = "";
      badgeEl.style.left = "0%";
    }
    return;
  }
  const target = Math.max(0, Math.min(100, pct));
  if (fillEl) fillEl.style.width = `${target}%`;
  if (badgeEl) {
    badgeEl.style.left = "0%";
    badgeEl.textContent = `${Math.round(target)}%`;
    badgeEl.style.transform = "translate(-50%, -50%)";
  }
  if (fillEl) void fillEl.offsetWidth; // force reflow so transition fires
  requestAnimationFrame(() => {
    if (fillEl) fillEl.style.width = `${target}%`;
    if (badgeEl) badgeEl.style.left = `${target}%`;
  });
}

function showCompareMeter(scores) {
  if (stack) stack.classList.add("is-visible");
  setMeterBar(semFillEl, semBadgeEl, scores?.semanticPct);
  setMeterBar(visFillEl, visBadgeEl, scores?.visualPct);
}

function hideCompareMeter() {
  if (stack) stack.classList.remove("is-visible");
  setMeterBar(semFillEl, semBadgeEl, null);
  setMeterBar(visFillEl, visBadgeEl, null);
}



document
  .getElementById("controls-section")
  .addEventListener("click", async (e) => {
    const compareBtn = e.target.closest('[data-role="compare-image"]');

    const dlBtn = e.target.closest('[data-role="download-image"]');
    if (!dlBtn) return;

    const stage = dlBtn.closest("[data-stage-id]");
    if (!stage) return;

    const stageId = stage.getAttribute("data-stage-id");
    const rec =
      stageId && stageId !== "root"
        ? stages.find((s) => s.id === stageId)
        : rootRecord;

    // prefer record, fallback to DOM datasets
    const href =
      rec?.outputPng ||
      stage.dataset.outputPng ||
      field(stage, "stage-output")?.dataset.overlayPng ||
      "";

    if (!href) {
      alert("No saved PNG for this stage yet.");
      return;
    }

    downloadCount += 1;
    const a = document.createElement("a");
    a.href = href;
    a.download = `translation_stage-${stageId || "root"}_${downloadCount}.png`;
    a.click();
  });

  controls.addEventListener("click", async (e) => {
    const compareBtn = e.target.closest('[data-role="compare-image"]');
    if (compareBtn) {
      e.preventDefault();

      const isOpen =
        activeCompareBtn === compareBtn &&
        stack?.classList.contains("is-visible");

      if (isOpen) {
        hideCompareOverlay();
        return;
      }

      hideCompareOverlay(); // close any prior overlay + reset prior button label
      activeCompareBtn = compareBtn;
      setCompareBtnLabel(compareBtn, "hide");
      await showCompareOverlayFromBtn(compareBtn);
      return;
    }

    // existing download / mode handlers...
  });

compressBtn.addEventListener("click", () => {
  const panelBody = document.getElementById("translation-body");
  if (compressBtn.getAttribute("aria-expanded") == "true") {
    panelBody.style.display = "none";
    compressBtn.style.transform = "rotate(180deg)";
    compressBtn.setAttribute("aria-expanded", "false");
    panel.animate(
      [
        { opacity: 0, transform: "translateX(24px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      { duration: 300, easing: "ease-in" }
    );
    resizer.animate(
      [
        { opacity: 0, transform: "translateX(24px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      { duration: 300, easing: "ease-in" }
    );
    resizer.style.pointerEvents = "none";
    // pageTitle.style.display = "none";
    panel.style.flexBasis = `${25}px`;
  } else {
    panelBody.style.display = "flex";
    panel.animate(
      [
        { opacity: 0, transform: "translateX(-24px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      { duration: 300, easing: "ease-in" }
    );
    resizer.animate(
      [
        { opacity: 0, transform: "translateX(-24px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      { duration: 300, easing: "ease-in" }
    );
    compressBtn.style.transform = "rotate(0deg)";
    compressBtn.setAttribute("aria-expanded", "true");
    // pageTitle.style.display = "block";
    resizer.style.pointerEvents = "auto";
    panel.style.flexBasis = `${420}px`;
  }

  requestAnimationFrame(() => {
    window.dispatchEvent(new Event("resize"));
  });
});

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
        const paragraph = data.text
          .match(/[^.!?]+[.!?]+/g)
          .slice(0, 3)
          .join(" ")
          .trim();

        if (!paragraph) throw new Error("No paragraph text in response");

        // This is the key: keep manual typing AND make Generate fill the textarea
        sourceEl.value = paragraph;
        refreshActiveCanvasFromText(sourceEl.value);
        panel.style.flexBasis = `${420}px`;
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
        const paragraph = data.text.concat(".");

        if (!paragraph) throw new Error("No paragraph text in response");

        // This is the key: keep manual typing AND make Generate fill the textarea
        sourceEl.value = paragraph;
        refreshActiveCanvasFromText(sourceEl.value);
        panel.style.flexBasis = `${420}px`;
        updateIfText();
      } catch (err) {
        alert(err?.message || "Failed to generate text");
      }
    }
  });
});

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
      textInput.style.display = "block";
      imageInput.style.display = "none";
      textInput.animate(
        [
          { opacity: 0, transform: "scale(0.75)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" }
      );
    } else if (toggleMode === "visual") {
      imageInput.style.display = "block";
      textInput.style.display = "none";
      imageInput.animate(
        [
          { opacity: 0, transform: "scale(0.75)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" }
      );
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

  window.location.reload();
});

function updateIfText() {
  const hasText = (sourceEl.value || "").trim().length > 0;
  const imageButtons = textControls.querySelector(
    '[data-role="to-image-buttons"]'
  );
  if (imageButtons.style.display === "none") {
    textControls.style.display = hasText ? "block" : "none";
    imageButtons.style.display = hasText ? "block" : "none";
    imageButtons.animate(
      [
        { opacity: 0, transform: "translateY(-12px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ],
      { duration: 300, easing: "ease-out" }
    );
    imageButtons.style.pointerEvents = hasText ? "auto" : "none";
  }
  if (chainStagesEl) chainStagesEl.innerHTML = "";
  // panel.style.pointerEvents = hasText ? "auto" : "none";
}
function refreshActiveCanvasFromText(rawText) {
  if (toggleMode !== "text") return;
  const t = (rawText ?? "").trim();
  const renderers = {
    visual: () => window.VisualMono,
    visualColor1: () => window.VisualColor1,
    visualColor2: () => window.VisualColor2,
    gridRadius: () => window.SquareGridR,
    visualColor3: () => window.VisualColor3,
    colorLine2: () => window.ColorLine2,
    colorLine3: () => window.ColorLine3,
    concretePoem: () => window.ConcretePoem,
    neuron: () => window.Neuron,
    neuron2: () => window.Neuron2,
    neuron3: () => window.Neuron3,
    neuron4: () => window.Neuron4,
    watercolor: () => window.Watercolor,
    french: () => window.French,
    binary: () => window.Binary,
  };
  const updater = renderers[currentMode]?.();
  if (!updater) return;
  if (!t) updater.clear?.();
  else updater.render?.(t);
}

function clearRootOutputPreviews() {
  const rootOutputs = document.querySelectorAll(
    '[data-role="convert-to-image-modes"] [data-role="stage-output"], ' +
      '[data-role="convert-to-text-modes"] [data-role="stage-output"]'
  );
  rootOutputs.forEach((out) => {
    out.innerHTML = "";
    const row = out.closest('[data-role="stage-input-row"]');
    if (row) row.classList.remove("has-output");
  });
  const rootLabels = document.querySelectorAll(
    '[data-role="convert-to-image-modes"] [data-role="stage-output-label"], ' +
      '[data-role="convert-to-text-modes"] [data-role="stage-output-label"]'
  );
  rootLabels.forEach((label) => {
    label.style.display = "none";
  });
}

async function refreshActiveCanvasFromImage(url, stageID) {
  const imageUrl = String(url || "");
  if (!imageUrl) return;

  // Always treat a new image as a fresh root flow.
  if (stageID === "root") {
    // Reset chain state
    stages = [];
    stageSeq = 0;
    if (chainStagesEl) chainStagesEl.innerHTML = "";


    clearRootOutputPreviews();

    // Reset pressed states
    document
      .querySelectorAll(
        '[data-role="convert-to-text-modes"] .mode-btn, [data-role="convert-to-image-modes"] .mode-btn'
      )
      .forEach((b) => b.removeAttribute("aria-pressed"));

    // Reset mode + source
    toggleMode = "visual"; // image -> text branch
    currentMode = "";
    window.currentImage = imageUrl;
    resetAnchors(); // new root image = new session
    setSourceAnchor(imageUrl);

    // Show root image controls, hide text controls
    imageInput.style.display = "block";
    imageControls.style.display = "block";
    textInput.style.display = "none";
    textControls.style.display = "none";

    // Reset arrow/canvas state
    // if (arrowChain) arrowChain.style.display = "none";
    if (arrowBtwn) arrowBtwn.style.display = "none";
    initialDisplay.style.display = "block";
    // canvasContainerEl.style.display = "flex";

    // Clear previous renderer outputs
    window.VisualText?.clear?.();
    window.VisualMono?.clear?.();
    window.VisualColor1?.clear?.();
    window.VisualColor2?.clear?.();
    window.SquareGridR?.clear?.();
    window.VisualColor3?.clear?.();
    window.ColorLine2?.clear?.();
    window.ColorLine3?.clear?.();
    window.ConcretePoem?.clear?.();
    window.Neuron?.clear?.();
    window.Neuron2?.clear?.();
    window.Neuron3?.clear?.();
    window.Neuron4?.clear?.();
    window.charMap?.clear?.();
    window.Watercolor?.clear?.();
    window.French?.clear?.();
    window.Binary?.clear?.();

    return;
  }

  // Non-root stage refresh path (keep if you still use it)
  if (toggleMode !== "visual") return;

  window.currentImage = imageUrl;

  if (currentMode === "rgb") {
    window.handleRGB?.(imageUrl);
  } else if (currentMode === "hex") {
    window.handleHex?.(imageUrl);
  } else if (currentMode === "typeArt") {
    window.handleImageForTextPicture?.(imageUrl);
  } else if (currentMode === "typeArtColor") {
    window.handleImageForTextColor?.(imageUrl);
  } else if (currentMode === "description") {
    // optional immediate preview refresh
    const t = await window.createDescription?.(imageUrl);
    if (t != null) window.VisualText?.render?.(t || "—");
  }
}

sourceEl.addEventListener("input", () => {
  updateIfText();
  refreshActiveCanvasFromText(sourceEl.value);
});

function cancelBetweenArrowAnimations(root = document) {
  root.querySelectorAll(".between-arrows .arrow").forEach((el) => {
    el.getAnimations().forEach((a) => a.cancel());
  });
}

function addAfterChain(currentStage) {
  // currentStage.append(arrowBtwn);
  // arrowBtwn.style.display = "flex";
  // const arrowList = arrowBtwn.children;

  const between = currentStage.querySelector(
    '[data-role="stage-input-row"] .between-arrows'
  );
  if (!between) return;

  between.style.display = "flex";

  between.querySelectorAll(".arrow").forEach((arrow, index) => {
    arrow.animate(
      [
        { opacity: 0.5, transform: "translateX(-24px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      {
        duration: 500,
        fill: "forwards",
        delay: index * 100, // Staggers each element by 100ms
      }
    );
  });
}


function handleTextImageSwitch() {
  toggleMode = "visual";

  const canvas = document.querySelector("#canvas-container canvas");
  if (!canvas) return;
  canvas.animate(
    [
      { opacity: 0.5, transform: "translateX(-24px)" },
      { opacity: 1, transform: "translateX(0px)" },
    ],
    { duration: 300, easing: "ease-in" }
  );
  const dataUrl = canvas.toDataURL("image/png");
  // NOTE: Output preview is shown next to the buttons that produced it.
  // The next stage only shows the next set of mode buttons.
  appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
}

let activeInputTextarea = sourceEl;
let activeImageArea = null;
let lastRootImageMode = "";
let text = "";

document
  .getElementById("controls-section")
  .addEventListener("click", async (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    const stage = btn.closest(
      "[data-stage-id], [data-role='convert-to-text'], [data-role='convert-to-image']"
    );
    if (!stage) return;
    console.log(createdImages);

    const isTextToImageClick = !!btn.closest('[data-role="to-image-buttons"]');
    const isImageToTextClick = !!btn.closest('[data-role="to-text-buttons"]');
    if (!isTextToImageClick && !isImageToTextClick) return;

    hideCompareOverlay();

    stage
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.removeAttribute("aria-pressed"));
    btn.setAttribute("aria-pressed", "true");
    currentMode = btn.getAttribute("data-mode");

    e.preventDefault();
    const stageId = stage.getAttribute("data-stage-id");
    const rec =
      stageId && stageId !== "root"
        ? stages.find((s) => s.id === stageId)
        : null;
    const textEl = field(stage, "input-text");
    text = (textEl ? textEl.value : rec?.input ?? sourceEl.value) || "";

    const isRoot = stage.getAttribute("data-stage-id") === "root";
    if (isRoot) {
      initialDisplay.style.display = "none";
      initialDisplay.setAttribute("status", "closed");
      canvasContainerEl.style.display = "flex";
    }
    if (isRoot && isImageToTextClick) {
      lastRootImageMode = currentMode;
    }
    const latestTemp = stages[stages.length - 1];

    const isMostRecentTemplate =
      (isRoot && stages.length === 0) ||
      (latestTemp?.el != null && stage === latestTemp.el);

    if (isTextToImageClick && !text.trim()) {
      toggleMode = "text";
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
      if (window.charMap) window.charMap.clear();
      if (window.Watercolor) window.Watercolor.clear();
      if (window.French) window.French.clear();
      if (window.Binary) window.Binary.clear();
      return;
    }

    showCanvasTranslationLoading();
    try {
    refreshActiveCanvasFromText(text);

    removeStages(stage, stages);

    // if (stage) addAfterChain(stage);
    // arrowChain.children.forEach((arrow, index) => {
    //   arrow.animate(
    //     [{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }],
    //     {
    //       duration: 500,
    //       iterations: Infinity,
    //       direction: "alternate",
    //       easing: "ease-out",
    //       delay: index * 100,
    //     }
    //   );
    // });

    cancelBetweenArrowAnimations();

    const between = stage.querySelector(
      '[data-role="stage-input-row"] .between-arrows'
    );

    if (between) {
      if (stage) addAfterChain(stage);
      between.children.forEach((arrow, index) => {
        arrow.animate(
          [{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }],
          {
            duration: 500,
            iterations: Infinity,
            direction: "alternate",
            easing: "ease-out",
            delay: index * 100,
          }
        );
      });
    }

    // saveButton.style.display = "block";

    if (isTextToImageClick) {
      toggleMode = "text";

      // visual modes draw to p5 canvases
      if (currentMode === "visual") {
        // resultEl.textContent = '';
        if (window.VisualMono) window.VisualMono.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const stageId = stage.getAttribute("data-stage-id");
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        console.log(rec);
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        
        appendStage("image-to-text", {
          input: dataUrl,
          outputPng: dataUrl,
        });
        positionActiveChainMarker();
  
        return;
      }

      if (currentMode === "visualColor1") {
        // resultEl.textContent = '';
        if (window.VisualColor1) window.VisualColor1.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });

        return;
      }

      if (currentMode === "visualColor2") {
        // resultEl.textContent = "";
        if (window.VisualColor2) window.VisualColor2.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        record = setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(stageId, dataUrl, "text-to-image", text); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });

        return;
      }

      if (currentMode === "gridRadius") {
        // resultEl.textContent = "";
        if (window.SquareGridR) window.SquareGridR.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "visualColor3") {
        // resultEl.textContent = "";
        if (window.VisualColor3) window.VisualColor3.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "colorLine2") {
        // resultEl.textContent = "";
        if (window.ColorLine2) window.ColorLine2.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "colorLine3") {
        // resultEl.textContent = "";
        if (window.ColorLine3) window.ColorLine3.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "concretePoem") {
        // resultEl.textContent = "";
        if (window.ConcretePoem) window.ConcretePoem.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "neuron") {
        // resultEl.textContent = "";
        if (window.Neuron) window.Neuron.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        let href = canvas.toDataURL("image/png");
        createdImages.push(href);
        return;
      }

      if (currentMode === "neuron2") {
        // resultEl.textContent = "";
        if (window.Neuron2) window.Neuron2.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "neuron3") {
        // resultEl.textContent = "";
        if (window.Neuron3) window.Neuron3.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "neuron4") {
        // resultEl.textContent = "";
        if (window.Neuron4) window.Neuron4.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "charMap") {
        // resultEl.textContent = "";
        if (window.charMap) window.charMap.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "watercolor") {
        // resultEl.textContent = "";
        if (window.Watercolor) window.Watercolor.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }


      if (currentMode === "binary") {
        // const out = translateSync(text, "binary");
        // if (window.VisualText) window.VisualText.render(out || "—");
        // handleTextImageSwitch();
        if (window.Binary) window.Binary.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
        return;
      }

      if (currentMode === "french") {
        // const out = translateSync(text, "binary");
        // if (window.VisualText) window.VisualText.render(out || "—");
        // handleTextImageSwitch();
        if (window.French) window.French.render(text);
        const canvas = document.querySelector("#canvas-container canvas");
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        setStageOutputForEl(stage, dataUrl, "image");
        setStageOutputPng(stage, dataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          dataUrl,
          "text-to-image",
          text,
          dataUrl
        ); // output of text->image
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);
        appendStage("image-to-text", { input: dataUrl, outputPng: dataUrl });
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
      if (window.charMap) window.charMap.clear();
      if (window.Watercolor) window.Watercolor.clear();
      if (window.French) window.French.clear();
      if (window.Binary) window.Binary.clear();


      // if (currentMode === "french") {
      //   try {
      //     const out = await translateToFrench(text);
      //     if (window.VisualText) window.VisualText.render(out || "—");
      //   } catch (err) {
      //     if (window.VisualText)
      //       window.VisualText.render(
      //         err && err.message ? err.message : "Translation failed"
      //       );
      //   }
      //   return;
      // }
    }

    if (isImageToTextClick) {
      toggleMode = "visual";
      const stageId = stage.getAttribute("data-stage-id");
      let url = "";

      if (stageId === "root") {
        const img = field(imageInput, "preview-img");
        console.log(img);
        url = img.src && img.src !== "#" ? img.src : "";
      } else {
        const rec = window.stages.find((s) => s.id === stageId);
        if (rec?.kind === "image-to-text" && rec.input) {
          url = rec.input;
        } else {
          const img = field(stage, "preview-img");
          url = img?.src && img.src !== "#" ? img.src : "";
        }
      }

      window.currentImage = url;

      if (currentMode === "typeArt") {
        await window.handleImageForTextPictureAsync(window.currentImage);
        toggleMode = "text";

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        text = await window.returnBrightnessText(window.currentImage);
        setStageOutputForEl(stage, text, "text");

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        console.log(rec)
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
        });
        const textArea = field(record.el, "input-text");
        window.getBrightnessText(window.currentImage, textArea);
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "rgb") {
        await window.handleRGBAsync(window.currentImage);
        toggleMode = "text";

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        text = await window.returnRGBText(window.currentImage);
        setStageOutputForEl(stage, text, "text");

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");

        window.getRGBText(window.currentImage, textArea);
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "hex") {
        await window.handleHexAsync(window.currentImage);
        toggleMode = "text";

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        text = await window.returnHexText(window.currentImage);
        setStageOutputForEl(stage, text, "text");

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");

        window.getHexText(window.currentImage, textArea);
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "feature") {
        toggleMode = "text";
        text = await window.createFeatureText(window.currentImage);
        window.VisualText.render(text || "—");
        setStageOutputForEl(stage, text, "text");

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", { input: text, outputPng: pngDataUrl, });
        const textArea = field(record.el, "input-text");
        if (textArea) textArea.value = text;
        setStageOutputPng(stage, pngDataUrl);
        return;
      }
      if (currentMode === "featurePoem") {
        toggleMode = "text";
        text = await window.createFeaturePoem(window.currentImage);
        window.VisualText.render(text || "—");
        setStageOutputForEl(stage, text, "text");

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");
        if (textArea) textArea.value = text;
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "literal") {
        toggleMode = "text";
        text = await window.extractLiteralVisualTokens(window.currentImage);
        window.VisualText.render(text || "—");
        setStageOutputForEl(stage, text, "text");

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");
        if (textArea) textArea.value = text;
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "description") {
        toggleMode = "text";
        text = await window.createDescription(window.currentImage);
        window.VisualText.render(text || "—");
        setStageOutputForEl(stage, text, "text");

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");
        textArea.value = text;
        setStageOutputPng(stage, pngDataUrl);
        return;
      }

      if (currentMode === "typeArtColor") {
        await window.handleImageForTextColorAsync(window.currentImage);
        toggleMode = "text";

        const pngDataUrl = await captureCanvasPngAfterPaint();
        if (!pngDataUrl) return;

        text = await window.asyncColorText(window.currentImage);
        setStageOutputForEl(stage, text, "text");

        const stageId = stage.getAttribute("data-stage-id");
        maybeSetFirstTranslationAnchor(pngDataUrl);
        const rec = setStageRecordOutputById(
          stageId,
          text,
          "image-to-text",
          window.currentImage,
          pngDataUrl,
        ); // output of image->text
        if (rec) {
          const i = stages.indexOf(rec);
          const prev = i > 0 ? stages[i - 1] : null;
          await computeAndAttachClip(rec, prev);
        }
        const { clip } = rec;
        const {
          logit_image_to_text,
          logit_text_to_image,
          text_embedding,
          image_embedding,
        } = clip || {};
        let metrics = computeMetrics(text_embedding, image_embedding, rec);

        const record = appendStage("text-to-image", {
          input: text,
          outputPng: pngDataUrl,
        });
        const textArea = field(record.el, "input-text");

        window.colorTextForBox(window.currentImage, textArea);
        setStageOutputPng(stage, pngDataUrl);
        return;
      }
    }
    } finally {
      hideCanvasTranslationLoading();
    }
  });

  function cosineSimilarity(a, b) {
    if (!a || !b) return null;

    let dot = 0,
      magA = 0,
      magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
  }

  function computeMetrics(text_embedding, image_embedding, record) {
    let drift = null;
    let stability = null;


    if (record.kind === "text-to-image") {
      if (!originalEmbedding) {
        originalEmbedding = text_embedding;
      }

      if (previousImgEmbedding) {
        stability = cosineSimilarity(previousImgEmbedding, image_embedding);
      }

      if (rootRecord.kind === "image-to-text") {
        if (originalEmbedding) {
          drift = cosineSimilarity(originalEmbedding, image_embedding);
        }
      }

      previousImgEmbedding = image_embedding;

    }

    if (record.kind === "image-to-text") {
      if (!originalEmbedding) {
        originalEmbedding = image_embedding;
      }

      if (previousTextEmbedding) {
        stability = cosineSimilarity(previousTextEmbedding, text_embedding);
      }

      if (rootRecord.kind === "text-to-image") {
        if (originalEmbedding) {
          drift = cosineSimilarity(originalEmbedding, text_embedding);
        }
      }

      previousTextEmbedding = text_embedding;
    }

    embeddingHistory.push({
      drift,
      stability,
    });

    console.log(embeddingHistory);

    return {
      drift, // similarity to first step
      stability, // similarity to previous step
    };
  }

function buildClipPair(record) {
  // text -> image stage: input is text, output is image data URL
  if (record.kind === "text-to-image") {
    const text = String(record.input || "").trim();
    const imageUrl = String(record.output || "").trim();
    console.log("image: " + imageUrl);
    if (!text || !imageUrl) return null;
    return { text, imageUrl };
  }

  // image -> text stage: input is image URL, output is generated text
  if (record.kind === "image-to-text") {
    const text = String(record.outputPng || "").trim();
    const imageUrl = String(record.input || "").trim();
    if (!text || !imageUrl) return null;
    return { text, imageUrl };
  }

  return null;
}

let rootRecord = null;
function getOrCreateRootRecord(kind, input = "") {
  if (rootRecord) return rootRecord;
  const safeKind = kind === "text-to-image" ? "text-to-image" : "image-to-text";
  const safeInput = String(input || "");

  rootRecord = {
    id: "root",
    kind: safeKind, // or "text-to-image" depending flow
    input: safeInput,
    output: null,
    mode: null,
    el: null,
    clip: {
      text_embedding: null,
      image_embedding: null,
      logit_image_to_text: null,
      logit_text_to_image: null,
      pair_from_stage_id: null,
    },
  };
  return rootRecord;
}

function setStageRecordOutputById(stageId, output, rootKind, rootInput, outputPng = null) {
  if (stageId === "root") {
    const rec = getOrCreateRootRecord(rootKind, rootInput);
    rec.output = output;
    rec.outputPng = outputPng;
    if (rootKind === "image-to-text" && outputPng) {
      firstTranslationPng = outputPng;
    }
    return rec;
  }
  if (!stageId) return null;
  const rec = stages.find((s) => s.id === stageId);
  if (!rec) return null;
  rec.output = output;
  if (outputPng != null) rec.outputPng = outputPng;
  return rec;
}

async function computeAndAttachClip(record, prevRecord) {
  const pair = buildClipPair(record);
  if (!pair) return;

   try {
     const clip = await window.getClipStageScores(pair.text, pair.imageUrl);
     record.clip = {
       ...clip,
       pair_from_stage_id: prevRecord?.id ?? null,
     };
     console.log(clip);
   } catch (err) {
     record.clip = {
       text_embedding: null,
       image_embedding: null,
       logit_image_to_text: null,
       logit_text_to_image: null,
       pair_from_stage_id: prevRecord?.id ?? null,
       error: err?.message || String(err),
     };
   }

}

function refreshChainNumberTextStyles() {
  const latestEl = stages.length > 0 ? stages[stages.length - 1].el : null;
  if (chainStagesEl) {
    chainStagesEl
      .querySelectorAll(":scope > [data-stage-id]")
      .forEach((stageEl) => {
        const id = stageEl.getAttribute("data-stage-id");
        if (!id || id === "root") return;
        const invert = latestEl != null && stageEl !== latestEl;
        stageEl.querySelectorAll(".circle-outline").forEach((el) => {
          el.style.color = invert ? "#f2f2ef" : "#161616";
          el.style.backgroundColor = invert ? "#161616" : "#f2f2ef";
        });
        requestAnimationFrame(() => {
          positionActiveChainMarker();
          requestAnimationFrame(positionActiveChainMarker);
        });
        setTimeout(positionActiveChainMarker, 350);
      });
  }
  document.querySelectorAll('[data-stage-id="root"]').forEach((rootEl) => {
    const invert = stages.length > 0;
    rootEl.querySelectorAll(".circle-outline").forEach((el) => {
      el.style.color = invert ? "#f2f2ef" : "#161616";
      el.style.backgroundColor = invert ? "#161616" : "#f2f2ef";
      if (invert) {
        requestAnimationFrame(() => {
          positionActiveChainMarker();
          requestAnimationFrame(positionActiveChainMarker);
        });
        setTimeout(positionActiveChainMarker, 350);
      }
    });
  });
}

function headerAreaWithin(stageOrPanelEl) {
  if (!stageOrPanelEl) return null;
  return stageOrPanelEl.querySelector(".header-area") || stageOrPanelEl;
}

function getActiveStageAnchorEl() {
  if (stages.length > 0) {
    const last = stages[stages.length - 2];
    if (last?.el) return headerAreaWithin(last.el);
  }
  if (textControls && getComputedStyle(textControls).display !== "none") {
    return headerAreaWithin(textControls);
  }
  if (imageControls && getComputedStyle(imageControls).display !== "none") {
    return headerAreaWithin(imageControls);
  }
  return headerAreaWithin(textControls) || headerAreaWithin(imageControls);
}

function positionActiveChainMarker() {
  const marker = document.getElementById("active-chain-marker");
  const canvasAreaEl = document.getElementById("canvas-area");
  if (!marker || !canvasAreaEl) return;

  const anchorEl = getActiveStageAnchorEl();
  if (!anchorEl) {
    marker.style.display = "none";
    return;
  }

  const rowRect = anchorEl.getBoundingClientRect();
  const canvasRect = canvasAreaEl.getBoundingClientRect();
  const centerY = rowRect.top + rowRect.height / 2 - canvasRect.top;

  marker.style.top = `${Math.max(0, centerY)}px`;
  marker.style.transform = "translateY(-100%)";
  marker.style.display = "block";
}

const translationBodyForMarker = document.getElementById("translation-body");
if (translationBodyForMarker) {
  let markerScrollRaf = false;
  translationBodyForMarker.addEventListener(
    "scroll",
    () => {
      if (markerScrollRaf) return;
      markerScrollRaf = true;
      requestAnimationFrame(() => {
        markerScrollRaf = false;
        positionActiveChainMarker();
      });
    },
    { passive: true }
  );
}
window.addEventListener("resize", positionActiveChainMarker);

let sourceImagePng = null;
let firstTranslationPng = null;

function resetAnchors() {
  sourceImagePng = null;
  firstTranslationPng = null;
}

function setSourceAnchor(url) {
  sourceImagePng = String(url || "");
}

function maybeSetFirstTranslationAnchor(pngUrl) {
  if (!firstTranslationPng && pngUrl) firstTranslationPng = pngUrl;
}

/** @type {Array<{ id: string, kind: 'text-to-image' | 'image-to-text', input: string, output: string | null, outputPng: string | null, mode: string | null, el: HTMLElement | null }>} */
let stages = [];
Object.defineProperty(window, "stages", {
  get() {
    return stages;
  },
});
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
  const outputPng = opts.outputPng ?? null;
  const id = String(++stageSeq);
  const record = {
    id,
    kind,
    input,
    output: null,
    outputPng,
    mode: null,
    el: null,
    clip: {
      text_embedding: null,
      image_embedding: null,
      logit_image_to_text: null,
      logit_text_to_image: null,
      pair_from_stage_id: null,
    },
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

  const chainIndex = stages.length + 1; // this new stage's position after root
  const layerNumber = chainIndex === 1 ? 1 : Math.floor((chainIndex + 2) / 2);
  const numberString = String(layerNumber);

  if (label) {
    label.textContent =
      kind === "text-to-image" ? `${chainIndex + 1}` : `${chainIndex + 1}`;
  }

  if (kind === "text-to-image") {
    el.style.display = "flex";
    const textArea = field(el, "input-text");
    if (textArea) {
      textArea.value = input;
      text = textArea.value;
    }
    const panel = field(el, "to-image-buttons");
    if (panel) panel.style.display = "block";
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
  el.animate(
    [
      { opacity: 0, transform: "scale(0.75)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  // el.scrollIntoView({ behavior: "smooth", block: "end" });
  const panelBody = document.getElementById("translation-body");
  panelBody.scrollTo({
    top: el.offsetTop - panelBody.offsetTop, // or just panelBody.scrollHeight
    behavior: "smooth",
  });
  record.el = el;
  stages.push(record);
  refreshChainNumberTextStyles();
  
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
  refreshChainNumberTextStyles();
  positionActiveChainMarker();
}
