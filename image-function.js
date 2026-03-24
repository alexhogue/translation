const imageDrop = document.getElementById("drop-cont");
const fileInput = document.getElementById("file-input");
const imagePreview = document.getElementById("preview-img");
const instructionText = document.getElementById("instruction-text");

let currentImage = "";

imageDrop.addEventListener("click", () => {
    fileInput.click();
})

imageDrop.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    imageDrop.classList.add("drag-over");
})

imageDrop.addEventListener("dragleave", (e) => {
    e.preventDefault();
    imageDrop.classList.remove("drag-over");
})

imageDrop.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    previewImage(file);

    currentImage = URL.createObjectURL(file);


})

function previewImage(file) {
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();

        console.log("hello");

        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
            instructionText.textContent = "Upload new image here"
        }

        reader.readAsDataURL(file);
    }
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

    if (currentMode === "typeArt") {
        window.handleImageForTextPicture(currentImage);
        return;
    }
    if (currentMode === "rgb") {
      window.handleRGB(currentImage);
      return;
    }

})