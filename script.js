let map;

// イントロ画面を閉じる関数（index.htmlのOKボタンと連携）
function closeIntro() {
  const intro = document.getElementById('intro');
  if (intro) {
    intro.style.display = 'none';
  }
}

// マップを初期化する関数
function initMap() {
  map = L.map('map').setView([38.7, 139.8], 13); // 鶴岡市周辺

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// 画像を読み込んでマップにマーカーを追加する関数（予測なし）
function loadImageAndDisplay(imageUrl, lat = 38.7, lng = 139.8) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<b>画像</b><br><img src="${imageUrl}" width="100">`);
  };

  img.onerror = () => {
    console.error("❌ 画像の読み込みに失敗:", imageUrl);
  };

  img.src = imageUrl;
}

// ページ読み込み時に初期化
window.addEventListener('load', () => {
  initMap();

  // 表示したい画像のURL（GitHub Pagesにアップした画像など）
  const testImageUrl = 'images/sample.jpg'; // ← 実際の画像ファイル名に合わせて変更！

  // 画像をマップに表示
  loadImageAndDisplay(testImageUrl, 38.7, 139.8);
});
