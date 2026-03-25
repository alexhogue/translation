import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1";
const imageDrop = document.getElementById("drop-cont");
const fileInput = document.getElementById("file-input");
const imagePreview = document.getElementById("preview-img");
const instructionText = document.getElementById("instruction-text");
const generateImgBtn = document.getElementById("generate-image-btn");

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
  "neuron.jpeg"
];

generateImgBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const indexLength = imageList.length;

  const randomIndex = Math.floor(Math.random() * indexLength);

  const randomImage = imageList[randomIndex];

  const url = "./image_bank/" + randomImage;

  imagePreview.src = url;
  imagePreview.style.display = "block";
  instructionText.textContent = "Upload new image here";

  currentImage = url;
});

imageDrop.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  previewImage(file);
  currentImage = URL.createObjectURL(file);
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
  const image = currentImage;

  if (currentMode === "typeArt") {
    window.handleImageForTextPicture(currentImage);
    return;
  }
  if (currentMode === "rgb") {
    window.handleRGB(currentImage);
    return;
  }

  if (currentMode === "description") {
    const out = await createDescription(image);
    window.VisualText.render(out || "—");
    return;
  }

//   if (window.VisualText) window.VisualText.clear();
});
