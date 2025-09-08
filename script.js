// --- Ambil elemen DOM ---
const videoTitleInput = document.getElementById("videoTitle");
const userImageInput = document.getElementById("userImage");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const canvas = document.getElementById("thumbnailCanvas");
const ctx = canvas.getContext("2d");
const loader = document.getElementById("loader");
const placeholder = document.getElementById("placeholder");

// --- Kontrol Kustomisasi ---
const fontStyleSelect = document.getElementById("fontStyle");
const fontSizeSlider = document.getElementById("fontSize");
const textColorInput = document.getElementById("textColor");
const strokeColorInput = document.getElementById("strokeColor");

// --- Event Listener Utama ---
generateBtn.addEventListener("click", generateThumbnail);

async function generateThumbnail() {
  const title = videoTitleInput.value.trim();
  const userImageFile = userImageInput.files[0];

  if (!title) {
    alert("Judul video tidak boleh kosong!");
    return;
  }

  // --- Tampilkan status loading ---
  loader.classList.remove("hidden");
  canvas.classList.add("hidden");
  downloadBtn.classList.add("hidden");
  placeholder.classList.add("hidden");
  generateBtn.disabled = true;

  try {
    let backgroundImage = null;
    let userImage = null;

    // --- Logika Gambar ---
    if (userImageFile) {
      // Jika ada foto user, buat background yang lebih simpel tapi serasi
      const backgroundPrompt = `A vibrant, high-energy, abstract background for a YouTube thumbnail about "${title}". Bright colors like red, yellow, and blue, with dynamic shapes and gradients. No text.`;
      backgroundImage = await generateImageWithGemini(backgroundPrompt);

      // Muat gambar pengguna
      // PENTING: Di implementasi nyata, di sinilah Anda akan memanggil API background removal.
      // Untuk demo ini, kita akan menggunakan gambar aslinya.
      userImage = await loadImage(URL.createObjectURL(userImageFile));
    } else {
      // Jika tidak ada foto, buat background yang lebih deskriptif sesuai judul
      const backgroundPrompt = `A dramatic and clickbait YouTube thumbnail background for a video titled "${title}". Include relevant visuals, bright contrasting colors, and a sense of excitement. No text. Cinematic and hyper-realistic.`;
      backgroundImage = await generateImageWithGemini(backgroundPrompt);
    }

    // --- Mulai menggambar di canvas ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar background
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback jika API gagal
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Gambar foto user (jika ada)
    let textMaxWidth = canvas.width * 0.9;
    let textStartX = canvas.width * 0.05;

    if (userImage) {
      // Atur posisi dan ukuran foto user
      const scale = Math.min(
        canvas.width / 2 / userImage.width,
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

    // 3. Gambar Teks
    drawText(title, textStartX, textMaxWidth);

    // --- Tampilkan hasil ---
    canvas.classList.remove("hidden");
    downloadBtn.classList.remove("hidden");
    downloadBtn.href = canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    alert("Terjadi kesalahan saat membuat thumbnail. Coba lagi.");
    placeholder.classList.remove("hidden");
  } finally {
    // --- Sembunyikan status loading ---
    loader.classList.add("hidden");
    generateBtn.disabled = false;
  }
}

// Fungsi untuk menggambar teks ke canvas
function drawText(text, startX, maxWidth) {
  const baseFontSize = parseInt(fontSizeSlider.value);
  ctx.font = `900 ${baseFontSize}px ${fontStyleSelect.value}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = textColorInput.value;
  ctx.strokeStyle = strokeColorInput.value;
  ctx.lineWidth = baseFontSize / 10; // Outline dinamis berdasarkan ukuran font

  // Efek bayangan untuk "drama"
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

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

  // Reset bayangan
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Fungsi untuk memuat gambar
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// --- Logika API Gemini untuk Image Generation ---
async function generateImageWithGemini(prompt, retries = 3, delay = 1000) {
  const apiKey = ""; // Dikosongkan, akan diisi otomatis oleh environment
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

  const payload = {
    instances: [{ prompt: prompt }],
    parameters: { sampleCount: 1 },
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (
        result.predictions &&
        result.predictions.length > 0 &&
        result.predictions[0].bytesBase64Encoded
      ) {
        const base64Data = result.predictions[0].bytesBase64Encoded;
        const imageUrl = `data:image/png;base64,${base64Data}`;
        return await loadImage(imageUrl);
      } else {
        throw new Error("No image data in API response.");
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error; // Lemparkan error setelah percobaan terakhir
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, i))); // Exponential backoff
    }
  }
}
