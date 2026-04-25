import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1";
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
  document.getElementById("image-icon").style.display = "none";


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


