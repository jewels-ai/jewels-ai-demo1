const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');

const snapshotModal = document.getElementById('snapshot-modal');
const snapshotPreview = document.getElementById('snapshot-preview');
const infoModal = document.getElementById('info-modal');
const subcategoryButtons = document.getElementById('subcategory-buttons');
const jewelryOptions = document.getElementById('jewelry-options');

let earringImg = null;
let necklaceImg = null;
let lastSnapshotDataURL = '';
let currentType = '';
let smoothedLandmarks = null;

// Utility function to load images with a Promise
async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

async function changeJewelry(type, src) {
  const img = await loadImage(src);
  if (!img) return;

  if (type.includes('earrings')) {
    earringImg = img;
    necklaceImg = null; // Clear necklace when earrings are selected
  } else if (type.includes('necklaces')) {
    necklaceImg = img;
    earringImg = null; // Clear earrings when necklace is selected
  }
}

function toggleCategory(category) {
  // Hide the jewelry options if they are visible
  jewelryOptions.style.display = 'none';
  // Show the subcategory buttons
  subcategoryButtons.style.display = 'flex';

  const subButtons = subcategoryButtons.querySelectorAll('button');
  subButtons.forEach(btn => {
    btn.style.display = btn.innerText.toLowerCase().includes(category) ? 'inline-block' : 'none';
  });
  earringImg = null;
  necklaceImg = null;
}

function selectJewelryType(type) {
  currentType = type;

  // Hide the subcategory buttons and show the jewelry products
  subcategoryButtons.style.display = 'none';
  jewelryOptions.style.display = 'flex';

  earringImg = null;
  necklaceImg = null;

  let start = 1, end;
  const jewelryCounts = {
    gold_earrings: 16,
    gold_necklaces: 19,
    diamond_earrings: 9,
    diamond_necklaces: 6,
  };

  end = jewelryCounts[type] || 15;
  insertJewelryOptions(type, 'jewelry-options', start, end);
}

function insertJewelryOptions(type, containerId, startIndex, endIndex) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = startIndex; i <= endIndex; i++) {
    const filename = `${type}${i}.png`;
    const btn = document.createElement('button');
    const img = document.createElement('img');
    img.src = `${type}/${filename}`;
    img.alt = `${type.replace('_', ' ')} ${i}`;
    btn.appendChild(img);
    btn.onclick = () => changeJewelry(type, `${type}/${filename}`);
    container.appendChild(btn);
  }
}

// MediaPipe Setup
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

faceMesh.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const newLandmarks = results.multiFaceLandmarks[0];
    if (!smoothedLandmarks) {
      smoothedLandmarks = newLandmarks;
    } else {
      // Apply exponential moving average for smoothing
      const smoothingFactor = 0.2;
      smoothedLandmarks = smoothedLandmarks.map((prev, i) => ({
        x: prev.x * (1 - smoothingFactor) + newLandmarks[i].x * smoothingFactor,
        y: prev.y * (1 - smoothingFactor) + newLandmarks[i].y * smoothingFactor,
        z: prev.z * (1 - smoothingFactor) + newLandmarks[i].z * smoothingFactor,
      }));
    }
    drawJewelry(smoothedLandmarks, canvasCtx);
  } else {
    smoothedLandmarks = null; // Clear landmarks if no face is detected
  }
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 1280,
  height: 720
});

videoElement.addEventListener('loadedmetadata', () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
});

camera.start();

// Drawing Functions
function drawJewelry(landmarks, ctx) {
  const earringScale = 0.07;
  const necklaceScale = 0.18;

  const leftEarLandmark = landmarks[132];
  const rightEarLandmark = landmarks[361];
  const neckLandmark = landmarks[152];

  const leftEarPos = {
    x: leftEarLandmark.x * canvasElement.width - 6,
    y: leftEarLandmark.y * canvasElement.height - 16,
  };
  const rightEarPos = {
    x: rightEarLandmark.x * canvasElement.width + 6,
    y: rightEarLandmark.y * canvasElement.height - 16,
  };
  const neckPos = {
    x: neckLandmark.x * canvasElement.width - 8,
    y: neckLandmark.y * canvasElement.height + 10,
  };

  if (earringImg) {
    const width = earringImg.width * earringScale;
    const height = earringImg.height * earringScale;
    ctx.drawImage(earringImg, leftEarPos.x - width / 2, leftEarPos.y, width, height);
    ctx.drawImage(earringImg, rightEarPos.x - width / 2, rightEarPos.y, width, height);
  }

  if (necklaceImg) {
    const width = necklaceImg.width * necklaceScale;
    const height = necklaceImg.height * necklaceScale;
    ctx.drawImage(necklaceImg, neckPos.x - width / 2, neckPos.y, width, height);
  }
}

// Snapshot & Modal Functions
function takeSnapshot() {
  if (!smoothedLandmarks) {
    alert("Face not detected. Please try again.");
    return;
  }

  const snapshotCanvas = document.createElement('canvas');
  const ctx = snapshotCanvas.getContext('2d');
  snapshotCanvas.width = videoElement.videoWidth;
  snapshotCanvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
  drawJewelry(smoothedLandmarks, ctx);
  lastSnapshotDataURL = snapshotCanvas.toDataURL('image/png');
  snapshotPreview.src = lastSnapshotDataURL;
  snapshotModal.showModal(); // Use the showModal() method for <dialog>
}

function saveSnapshot() {
  const link = document.createElement('a');
  link.href = lastSnapshotDataURL;
  link.download = `jewelry-tryon-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function shareSnapshot() {
  // Sharing logic remains the same
  if (navigator.share) {
    fetch(lastSnapshotDataURL)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'jewelry-tryon.png', { type: 'image/png' });
        navigator.share({
          title: 'Jewelry Try-On',
          text: 'Check out my look!',
          files: [file]
        });
      })
      .catch(console.error);
  } else {
    alert('Sharing not supported on this browser.');
  }
}

function closeSnapshotModal() {
  snapshotModal.close(); // Use the close() method for <dialog>
}

function toggleInfoModal() {
  if (infoModal.open) {
    infoModal.close();
  } else {
    infoModal.showModal();
  }
}