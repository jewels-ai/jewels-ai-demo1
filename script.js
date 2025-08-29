let earringImg = null, necklaceImg = null, smoothedLandmarks = null, currentType = '';
function loadImage(src) { return new Promise((resolve) => { const img = new Image(); img.src = src; img.onload = () => resolve(img); img.onerror = () => resolve(null); }); }
function changeEarring(src) { loadImage(src).then(img => { if (img) earringImg = img; }); }
function changeNecklace(src) { loadImage(src).then(img => { if (img) necklaceImg = img; }); }
function toggleCategory(category) {
  document.getElementById('subcategory-buttons').style.display = 'flex';
  const subButtons = document.querySelectorAll('#subcategory-buttons button');
  subButtons.forEach(btn => { btn.style.display = btn.innerText.toLowerCase().includes(category) ? 'inline-block' : 'none'; });
  document.getElementById('jewelry-options').style.display = 'none';
}
function selectJewelryType(type) {
  currentType = type;
  document.getElementById('subcategory-buttons').style.display = 'none';
  const options = document.getElementById('jewelry-options'); options.style.display = 'flex';
  earringImg = null; necklaceImg = null;
  let start = 1, end = 15; switch (type) {
    case 'gold_earrings': end = 16; break;
    case 'gold_necklaces': end = 19; break;
    case 'diamond_earrings': end = 9; break;
    case 'diamond_necklaces': end = 6; break;
  }
  insertJewelryOptions(type, 'jewelry-options', start, end);
}
function insertJewelryOptions(type, containerId, startIndex, endIndex) {
  const container = document.getElementById(containerId); container.innerHTML = '';
  const backBtn = document.createElement('button'); backBtn.textContent = '⬅ Back';
  backBtn.onclick = () => { container.style.display = 'none'; document.getElementById('subcategory-buttons').style.display = 'flex'; };
  container.appendChild(backBtn);
  for (let i = startIndex; i <= endIndex; i++) {
    const filename = `${type}${i}.png`; const btn = document.createElement('button'); const img = document.createElement('img'); img.src = `${type}/${filename}`;
    btn.appendChild(img); btn.onclick = () => { if (type.includes('earrings')) changeEarring(`${type}/${filename}`); else changeNecklace(`${type}/${filename}`); };
    container.appendChild(btn);
  }
}
