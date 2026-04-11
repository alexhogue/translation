import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1";
const imageControls = document.querySelector('[data-role="convert-to-text"]');
const imageDrop = imageControls.querySelector('[data-role="drop-file"]');
const fileInput = imageControls.querySelector('[data-role="input-file"]');
const imagePreview = imageControls.querySelector('[data-role="preview-img"]');
const instructionText = imageControls.querySelector('[data-role="instructions-text"]');
const generateImgBtn = imageControls.querySelector('[data-role="random-image"]');
const toTextButtons = imageControls.querySelector('[data-role="to-text-buttons"]');

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
  instructionText.textContent = "Upload new image here";

  currentImage = url;
  panel.style.flexBasis = `${300}px`;
  window.currentImage = currentImage;  
  
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  window.refreshActiveCanvasFromImage(window.currentImage);
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
  panel.style.flexBasis = `${300}px`;
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  window.refreshActiveCanvasFromImage(window.currentImage);
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
  panel.style.flexBasis = `${300}px`;
  toTextButtons.style.display = currentImage ? "block" : "none";
  toTextButtons.animate(
    [
      { opacity: 0, transform: "translateY(-12px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ],
    { duration: 300, easing: "ease-out" }
  );
  window.refreshActiveCanvasFromImage(window.currentImage);
});

function previewImage(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();

    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
      instructionText.textContent = "Upload new image here";
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
  // Only clear .mode-btn inside THIS stage (or same column type)
  stage
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.removeAttribute("aria-pressed"));
  btn.setAttribute("aria-pressed", "true");
  currentMode = btn.getAttribute("data-mode");
  window.currentMode = currentMode;
  // optional: stage.dataset.activeMode = currentMode for multi-stage
});


