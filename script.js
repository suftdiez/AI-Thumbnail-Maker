// --- Menjalankan semua script setelah DOM sepenuhnya dimuat ---
document.addEventListener("DOMContentLoaded", () => {
  // --- THEME SWITCHER LOGIC ---
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = document.getElementById("sun-icon");
  const moonIcon = document.getElementById("moon-icon");
  const htmlEl = document.documentElement;

  const setTheme = (theme) => {
    if (theme === "dark") {
      htmlEl.classList.add("dark");
      themeToggle.checked = true;
      sunIcon.style.opacity = "0";
      moonIcon.style.opacity = "1";
    } else {
      htmlEl.classList.remove("dark");
      themeToggle.checked = false;
      sunIcon.style.opacity = "1";
      moonIcon.style.opacity = "0";
    }
  };

  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  setTheme(savedTheme);

  themeToggle.addEventListener("change", () => {
    const newTheme = themeToggle.checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // --- THUMBNAIL GENERATOR LOGIC ---
  const videoTitleInput = document.getElementById("videoTitle");
  const userImageInput = document.getElementById("userImage");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const canvas = document.getElementById("thumbnailCanvas");
  const canvasContainer = document.getElementById("canvas-container");
  const ctx = canvas.getContext("2d");
  const loader = document.getElementById("loader");
  const placeholder = document.getElementById("placeholder");
  const fontStyleSelect = document.getElementById("fontStyle");
  const fontSizeSlider = document.getElementById("fontSize");
  const textColorInput = document.getElementById("textColor");
  const strokeColorInput = document.getElementById("strokeColor");

  generateBtn.addEventListener("click", generateThumbnail);

  async function generateThumbnail() {
    const title = videoTitleInput.value.trim();
    const userImageFile = userImageInput.files[0];

    if (!title) {
      alert("Judul video tidak boleh kosong!");
      return;
    }

    // Tampilkan loading
    loader.classList.remove("hidden");
    loader.classList.add("flex");
    canvasContainer.classList.add("hidden");
    downloadBtn.classList.add("hidden");
    placeholder.classList.add("hidden");
    placeholder.classList.remove("flex"); // Pastikan placeholder juga disembunyikan
    generateBtn.disabled = true;

    try {
      await document.fonts.ready; // Pastikan font sudah siap

      let userImage = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, "#4f46e5");
      gradient.addColorStop(1, "#a78bfa");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (userImageFile) {
        userImage = await loadImage(URL.createObjectURL(userImageFile));
      }

      let textMaxWidth = canvas.width * 0.9;
      let textStartX = canvas.width * 0.05;

      if (userImage) {
        const scale = Math.min(
          canvas.width / 2.2 / userImage.width,
          (canvas.height * 0.9) / userImage.height
        );
        const imgWidth = userImage.width * scale;
        const imgHeight = userImage.height * scale;
        const imgX = canvas.width - imgWidth - 30;
        const imgY = (canvas.height - imgHeight) / 2;

        ctx.drawImage(userImage, imgX, imgY, imgWidth, imgHeight);

        textMaxWidth = canvas.width - imgWidth - 60;
        textStartX = 30;
      }

      drawText(title, textStartX, textMaxWidth);

      // Tampilkan hasil
      canvasContainer.classList.remove("hidden");
      downloadBtn.classList.remove("hidden");
      downloadBtn.href = canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error saat membuat thumbnail:", error);
      alert("Terjadi kesalahan saat membuat thumbnail. Coba lagi.");
      placeholder.classList.remove("hidden");
      placeholder.classList.add("flex"); // Tampilkan placeholder jika error
    } finally {
      // Sembunyikan loading
      loader.classList.add("hidden");
      loader.classList.remove("flex");
      generateBtn.disabled = false;
    }
  }

  function drawText(text, startX, maxWidth) {
    const baseFontSize = parseInt(fontSizeSlider.value);
    const selectedFont = fontStyleSelect.value;

    ctx.font = `900 ${baseFontSize}px "${selectedFont}", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = textColorInput.value;
    ctx.strokeStyle = strokeColorInput.value;
    ctx.lineWidth = baseFontSize / 12;

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    const words = text.toUpperCase().split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = baseFontSize * 1.1;
    const totalTextHeight = lines.length * lineHeight;
    let startY = (canvas.height - totalTextHeight) / 2 + baseFontSize / 2;

    lines.forEach((line, index) => {
      const x = startX + maxWidth / 2;
      const y = startY + index * lineHeight;
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
    });

    ctx.shadowColor = "transparent";
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }
});
