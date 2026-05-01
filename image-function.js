import {
  pipeline
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1";
import {
  CLIPModel,
  AutoTokenizer,
  AutoProcessor,
  RawImage,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1";
const imageInput = document.querySelector('[data-role="convert-to-text-input"]');
const imageModes = document.querySelector(
  '[data-role="convert-to-text-modes"]'
);
const imageDrop = imageInput.querySelector('[data-role="drop-file"]');
const fileInput = imageInput.querySelector('[data-role="input-file"]');
const imagePreview = imageInput.querySelector('[data-role="preview-img"]');
const instructionText = imageInput.querySelector('[data-role="instructions-text"]');
const generateImgBtn = imageInput.querySelector('[data-role="random-image"]');
const toTextButtons = imageModes.querySelector('[data-role="to-text-buttons"]');

let currentImage = "";

let imageList = [
  "duck_rabbit.jpg",
  "leaf.jpg",
  "shadow.jpeg",
  "stars.jpeg",
  "triangles.jpeg",
  "pixels.jpg",
  "smudge.jpg",
  "mountain.jpg",
  "neuron.jpeg",
  "firework.png",
  "moth.png",
  "monet.jpg",
];

function scrollPanelToBottom() {
  const panelBody = document.getElementById("translation-body");
  if (!panelBody) return;
  const go = () => {
    panelBody.scrollTo({
      top: panelBody.scrollHeight,
      behavior: "smooth",
    });
  };
  // run after paint
  requestAnimationFrame(() => {
    go();
    // run again after image/layout settles
    setTimeout(go, 80);
    setTimeout(go, 220);
  });
}

generateImgBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const indexLength = imageList.length;

  const randomIndex = Math.floor(Math.random() * indexLength);

  const randomImage = imageList[randomIndex];

  const url = "./image_bank/" + randomImage;

  imagePreview.src = url;
  
  imagePreview.style.display = "block";
  imagePreview.animate(
    [
      { opacity: 0, transform: "scale(0.75)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  instructionText.textContent = "(Upload new image here)";

  currentImage = url;
  panel.style.flexBasis = `${420}px`;
  window.currentImage = currentImage;  
  
  imageControls.style.display = currentImage ? "block" : "none";
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );

  document.getElementById("image-icon").style.display = "none";
  
  scrollPanelToBottom();
  
  window.refreshActiveCanvasFromImage(window.currentImage, "root");
});

imageDrop.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  previewImage(file);
  currentImage = URL.createObjectURL(file);
  window.currentImage = currentImage;  
  panel.style.flexBasis = `${420}px`;
  imageControls.style.display = currentImage ? "block" : "none";
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  scrollPanelToBottom();
  window.refreshActiveCanvasFromImage(window.currentImage, "root");
});

imageDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  imageDrop.classList.add("drag-over");
});

imageDrop.addEventListener("dragleave", (e) => {
  e.preventDefault();
  imageDrop.classList.remove("drag-over");
});

imageDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  previewImage(file);

  currentImage = URL.createObjectURL(file);
  window.currentImage = currentImage;  
  panel.style.flexBasis = `${420}px`;
  imageControls.style.display = currentImage ? "block" : "none";
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  scrollPanelToBottom();
  window.refreshActiveCanvasFromImage(window.currentImage, "root");
});

function previewImage(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();

    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
      instructionText.textContent = "(Upload new image here)";
    };

    reader.readAsDataURL(file);
  }
}

let captioner = null;

async function getModel() {
  if (!captioner) {
    // document.getElementById("caption").innerText = "Loading model...";
    captioner = await pipeline("image-to-text");
  }
  return captioner;
}

async function createDescription(imageURL) {
    const model = await getModel();
    const result = await model(imageURL);

    const text = result[0].generated_text;

    return text;
}

window.createDescription = createDescription;


let featurePipe = null;

async function getFeaturePipe() {
  if (!featurePipe) {
    featurePipe = await pipeline(
      "image-feature-extraction",
      "Xenova/vit-base-patch16-224"
    );
  }
  return featurePipe;
}

function meanPool2D(arr2d) {
  const n = arr2d.length;
  const d = arr2d[0].length;
  const out = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    const row = arr2d[i];
    for (let j = 0; j < d; j++) out[j] += row[j];
  }
  for (let j = 0; j < d; j++) out[j] /= n;
  return out;
}

async function createFeatureText(imageURL) {
  const model = await getFeaturePipe();
  const output = await model(imageURL);

  const nested = output.tolist ? output.tolist() : output;
  const tokensByDim = Array.isArray(nested?.[0]?.[0]) ? nested[0] : nested; // [tokens, dim]
  if (!tokensByDim?.length) return "No features extracted.";

  const pooled = meanPool2D(tokensByDim);

  // readable compact text
  const topN = 100;
  const lines = [];
  for (let i = 0; i < Math.min(topN, pooled.length); i++) {
    lines.push(`f[${i+1}] = ${Number(pooled[i]).toFixed(4)}`);
  }
  return lines.join("\n");
}

window.createFeatureText = createFeatureText;

//////// CLIP //////////

let _clip = null;
async function getClip() {
  if (_clip) return _clip;
  const modelId = "Xenova/clip-vit-base-patch32";
  const [model, tokenizer, processor] = await Promise.all([
    CLIPModel.from_pretrained(modelId),
    AutoTokenizer.from_pretrained(modelId),
    AutoProcessor.from_pretrained(modelId),
  ]);
  _clip = { model, tokenizer, processor, modelId };
  return _clip;
}

function tensorTo2D(t) {
  // Handles Tensor -> JS nested arrays
  const v = t?.tolist ? t.tolist() : [];
  return Array.isArray(v) ? v : [];
}

export async function getClipStageScores(text, imageUrl) {
  const { model, tokenizer, processor, modelId } = await getClip();

  const textInputs = await tokenizer(String(text || ""), {
    padding: true,
    truncation: true,
  });

  const image = await RawImage.fromURL(String(imageUrl || ""));
  const imageInputs = await processor(image);
  const out = await model({
    ...textInputs,
    ...imageInputs,
  });

  const logitsImage = tensorTo2D(out.logits_per_image); // [img_batch, text_batch]
  const logitsText = tensorTo2D(out.logits_per_text); // [text_batch, img_batch]
  const textEmbeds = tensorTo2D(out.text_embeds); // [text_batch, dim]
  const imageEmbeds = tensorTo2D(out.image_embeds); // [img_batch, dim]

  return {
    text_embedding: textEmbeds?.[0] ?? null,
    image_embedding: imageEmbeds?.[0] ?? null,
    logit_image_to_text: logitsImage?.[0]?.[0] ?? null,
    logit_text_to_image: logitsText?.[0]?.[0] ?? null,
    model_id: modelId,
  };
}

window.getClipStageScores = getClipStageScores;





/////////////

let poemFeaturePipe = null;

async function getPoemFeaturePipe() {
  if (!poemFeaturePipe) {
    poemFeaturePipe = await pipeline(
      "image-feature-extraction",
      "Xenova/vit-base-patch16-224"
    );
  }
  return poemFeaturePipe;
}
function vectorStats(vec) {
  const n = vec.length;
  let mean = 0;
  let absMean = 0;
  let pos = 0;

  for (const x of vec) {
    mean += x;
    absMean += Math.abs(x);
    if (x > 0) pos++;
  }
  mean /= n;
  absMean /= n;

  let varSum = 0;
  for (const x of vec) varSum += (x - mean) * (x - mean);
  const std = Math.sqrt(varSum / n);

  return {
    mean,
    absMean,
    std,
    posRatio: pos / n,
  };
}

function topKIndices(vec, k = 12) {
  return [...vec.keys()]
    .sort((a, b) => Math.abs(vec[b]) - Math.abs(vec[a]))
    .slice(0, k);
}

function hashVector(vec) {
  // deterministic quantized hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < vec.length; i++) {
    const q = Math.round((vec[i] + 8) * 1024);
    h ^= q & 0xff;
    h = Math.imul(h, 16777619);
    h ^= (q >>> 8) & 0xff;
    h = Math.imul(h, 16777619);
    h ^= (q >>> 16) & 0xff;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function chunkEnergies(vec, chunks = 8) {
  const out = new Array(chunks).fill(0);
  const n = vec.length;
  for (let i = 0; i < n; i++) {
    const c = Math.min(chunks - 1, Math.floor((i / n) * chunks));
    out[c] += Math.abs(vec[i]);
  }
  return out.map((x) => x / (n / chunks));
}

function poemFromFeatures(vec) {
  const s = vectorStats(vec);
  const peaks = topKIndices(vec, 12);
  const energies = chunkEnergies(vec, 8);

  const seed = hashVector(vec);
  const rng = mulberry32(seed);

  // banks
  const moodsCalm = ["hushed", "distant", "faint", "muted", "slow"];
  const moodsCharged = [
    "electric",
    "fractured",
    "urgent",
    "volatile",
    "bright",
  ];
  const motionsSoft = ["drifts", "settles", "floats", "folds", "thins", "waits"];
  const motionsSharp = ["splinters", "surges", "cuts", "shifts", "flares"];
  const textures = [
    "glass",
    "ash",
    "thread",
    "cement",
    "fog",
    "grain",
    "dirt",
    "ink",
    "wire",
    "dust",
    "salt",
    "stone",
    "silk",
  ];
  const lightWords = ["pale", "silver", "glowing", "thin", "cold", "white", "dim"];
  const darkWords = [
    "like charcoal",
    "like midnight",
    "heavy",
    "black",
    "deep",
    "shadowed",
  ];
  const tones = [
    "pale",
    "silver",
    "glowing",
    "thin",
    "cold",
    "white",
    "dim",
    "like charcoal",
    "midnight",
    "heavy",
    "black",
    "deep",
    "shadowed",
  ];
  const verbs = ["shake", "fight", "blow", "wander", "float"];
  const goodAdjs = ["lovely", "magificent", "elegant", "sweet", "joyous", "just"];
  const badAdjs = ["harsh", "cold", "dark", "brutal", "tragic"];
  const adjsMixed = ["lovely", "magificent", "elegant", "sweet", "joyous","perfect", "just", "harsh", "cold", "dark", "brutal", "tragic"];


  // derive controls from stats + peaks
  const intensityHigh = s.absMean > 0.52;
  const contrastHigh = s.std > 0.72;
  const warmTilt = s.mean > 0;
  console.log(s.mean);
  const lineCount = 3 + (peaks[0] % 3); // 3..5 deterministic
  const punctuation = contrastHigh ? ";" : ",";

  const mood = intensityHigh ? pick(moodsCharged, rng) : pick(moodsCalm, rng);
  const anyMood = pick(moodsCharged + moodsCalm, rng);
  const motion = contrastHigh
    ? pick(motionsSharp, rng)
    : pick(motionsSoft, rng);
  const textureA = textures[peaks[1] % textures.length];
  const textureB = textures[peaks[4] % textures.length];
  const toneWord = warmTilt ? pick(lightWords, rng) : pick(darkWords, rng);

  const anyTone = pick(tones, rng);
  const randomAdj = intensityHigh ? pick(goodAdjs, rng) : pick(badAdjs, rng);
  const darkWord = pick(darkWords, rng);
  const goodAdj = pick(goodAdjs, rng);
  const adj = pick(adjsMixed, rng);
  const verb = pick(verbs, rng);

  // template family from hash
  const templateType = seed % 1;

  const lines = [];

  if (templateType === 0) {
    lines.push(`The mood was ${mood} on the ${peaks[0]}th day.`);
    lines.push(`It hit us like ${textureA}${punctuation}`);
    lines.push(`The air felt ${anyTone} before the sun ${motion}.`);
    lines.push(`Could it ${verb} thy ${adj} symmetry?`);
  } 
  // else if (templateType === 1) {
  //   lines.push(`I ${verb} ${mood} as a cloud`);
  //   lines.push(`That ${motion} on high o'er vales and hills,`);
  //   lines.push(`When all at once I saw a crowd,`);
  //   lines.push(`A host, of ${randomAdj} daffodils`);
  // } else if (templateType === 2) {
  //   lines.push(`Tyger Tyger, burning ${toneWord},`);
  //   lines.push(`In the forests of the night;`);
  //   lines.push(`What immortal hand or eye,`);
  //   lines.push(`Could ${verb} thy ${randomAdj} symmetry?`);
  // } else if (templateType === 3) {
  //   lines.push(
  //     `Once upon a ${toneWord} dreary, while I pondered, ${randomAdj} and weary,`
  //   );
  //   lines.push(
  //     `Over many a ${randomAdj} and curious volume of forgotten lore—`
  //   );
  //   lines.push(
  //     `While I nodded, nearly napping, suddenly there came a tapping,`
  //   );
  //   lines.push(
  //     `As of some one gently ${motion}, ${motion} at my chamber door.`
  //   );
  // } 

  const poem = lines.join("\n");
  console.log(poem)
  return poem;
}

async function createFeaturePoem(imageURL) {
  const model = await getPoemFeaturePipe();
  const output = await model(imageURL);
  const nested = output.tolist ? output.tolist() : output;
  const tokensByDim = Array.isArray(nested?.[0]?.[0]) ? nested[0] : nested;
  if (!tokensByDim?.length) return "No features extracted.";
  const pooled = meanPool2D(tokensByDim);
  return poemFromFeatures(pooled);
}
window.createFeaturePoem = createFeaturePoem;


////////////

function rgbToColorName(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (lum < 35) return "black";
  if (lum > 220 && sat < 20) return "white";
  if (sat < 25) return "gray";

  if (r > g + 25 && r > b + 25) return "redish";
  if (g > r + 25 && g > b + 25) return "greenish";
  if (b > r + 25 && b > g + 25) return "blueish";
  if (r > 180 && g > 150 && b < 120) return "yellowish";
  if (r > 170 && b > 150) return "magenta";
  if (g > 150 && b > 150) return "cyan";

  return "";
}

function classifyShape(w, h, area, radialCV) {
  const aspect = w > h ? w / Math.max(1, h) : h / Math.max(1, w);
  const fill = area / Math.max(1, w * h);
  const nearCircle = Math.abs(w - h) / Math.max(w, h) < 0.2;
  const nearSquare = Math.abs(w - h) / Math.max(w, h) < 0.2;
  const perimApprox = 2 * (w + h);
  // if (nearSquare && fill > 0.2 && radialCV < 0.38) return "circle";

  if (aspect > 5) return "line";
  if (nearCircle && fill < 0.85 && radialCV > 0.48) return "circle";
  if (fill > 0.7) return "square";
  if (fill > 0.4) return "rectangle";
  return "area";
}

async function extractLiteralVisualTokens(imageURL) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageURL;
  });

  // simple downscale
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const W = Math.max(20, Math.round(img.width * scale));
  const H = Math.max(20, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, W, H);

  const { data } = ctx.getImageData(0, 0, W, H);

  // grayscale + single threshold
  const gray = new Uint8Array(W * H);
  let mean = 0;
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const g = (data[p] + data[p + 1] + data[p + 2]) / 3;
    gray[i] = g;
    mean += g;
  }
  mean /= gray.length;
  const threshold = mean * 0.9;

  const mask = new Uint8Array(W * H);
  for (let i = 0; i < mask.length; i++) mask[i] = gray[i] < threshold ? 1 : 0;

  // connected components (4-neighbor)
  const visited = new Uint8Array(W * H);
  const labels = [];
  const qx = [];
  const qy = [];
  const idx = (x, y) => y * W + x;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const start = idx(x, y);
      if (!mask[start] || visited[start]) continue;

      let sumR = 0,
        sumG = 0,
        sumB = 0;

      qx.length = 0;
      qy.length = 0;
      qx.push(x);
      qy.push(y);
      visited[start] = 1;

      let head = 0;
      let minX = x,
        minY = y,
        maxX = x,
        maxY = y,
        area = 0,
        perimeter = 0;
      const pixels = [];

      while (head < qx.length) {
        const cx = qx[head];
        const cy = qy[head];
        head++;
        area++;
        pixels.push([cx, cy]);

        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;

        const p = (cy * W + cx) * 4;
        sumR += data[p];
        sumG += data[p + 1];
        sumB += data[p + 2];

        const n = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
          [cx + 1, cy + 1],
          [cx + 1, cy - 1],
          [cx - 1, cy + 1],
          [cx - 1, cy - 1],
        ];
        for (const [nx, ny] of n) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = idx(nx, ny);
          if (!mask[ni] || visited[ni]) continue;
          visited[ni] = 1;
          qx.push(nx);
          qy.push(ny);
        }
        let isBoundary = false;
        for (const [nx, ny] of n) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
            isBoundary = true;
            continue;
          }
          const ni = idx(nx, ny);
          if (!mask[ni]) isBoundary = true;
        }
        if (isBoundary) perimeter++;
      }

      if (area < 20) continue; // ignore tiny noise

      const w = maxX - minX + 1;
      const h = maxY - minY + 1;

      // center from component pixels
      let cxSum = 0,
        cySum = 0;
      for (const [px, py] of pixels) {
        cxSum += px;
        cySum += py;
      }
      const cx = cxSum / pixels.length;
      const cy = cySum / pixels.length;

      // mean radius
      let rMean = 0;
      for (const [px, py] of pixels) {
        rMean += Math.hypot(px - cx, py - cy);
      }
      rMean /= pixels.length;

      // radius variance
      let rVar = 0;
      for (const [px, py] of pixels) {
        const dr = Math.hypot(px - cx, py - cy) - rMean;
        rVar += dr * dr;
      }
      const rStd = Math.sqrt(rVar / pixels.length);
      const radialCV = rStd / Math.max(1e-6, rMean);
      
      const shape = classifyShape(w, h, area, perimeter);
      const avgR = Math.round(sumR / area);
      const avgG = Math.round(sumG / area);
      const avgB = Math.round(sumB / area);
      const color = rgbToColorName(avgR, avgG, avgB);
      labels.push(`${color} ${shape}`);
    }
  }

  if (!labels.length) return "No clear shapes detected.";

  // count + output
  const counts = new Map();
  for (const s of labels) counts.set(s, (counts.get(s) || 0) + 1);

  const parts = [];
  for (const [shape, n] of counts) {
    parts.push(n === 1 ? shape : `${n} ${shape}s`);
  }

  return parts.join(", ");
}

window.extractLiteralVisualTokens = extractLiteralVisualTokens;

///////////


document.getElementById("controls-section").addEventListener("click", (e) => {
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
  window.currentMode = currentMode;

  refreshActiveCanvasFromText(text);
  
//   const stageId = stage.getAttribute("data-stage-id");
//   let url = "";

//   if (stageId === "root") {
//     const img = field(imageControls, "preview-img");
//     console.log(img);
//     url = img.src && img.src !== "#" ? img.src : "";
//   } else {
//     const rec = window.stages.find((s) => s.id === stageId);
//     if (rec?.kind === "image-to-text" && rec.input) {
//       url = rec.input;
//     } else {
//       const img = field(stage, "preview-img");
//       url = img?.src && img.src !== "#" ? img.src : "";
//     }
//   }
  
//   window.currentImage = url;
  
//   window.refreshActiveCanvasFromImage(url, stageId);

});


