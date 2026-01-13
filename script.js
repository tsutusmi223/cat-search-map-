let model;
let map;

// モデルを読み込む関数
async function loadModel() {
  try {
    model = await tf.loadGraphModel('model/model.json');
    console.log("✅ モデル読み込み成功！");
  } catch (error) {
    console.error("❌ モデル読み込み失敗:", error);
  }
}

// マップを初期化する関数
function initMap() {
  map = L.map('map').setView([38.7, 139.8], 13); // 鶴岡市周辺

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// 画像を読み込んで予測し、マップにマーカーを追加する関数
function loadImageAndPredict(imageUrl, lat = 38.7, lng = 139.8) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = async () => {
    if (!model) {
      console.error("❌ モデルがまだ読み込まれていません！");
      return;
    }

    try {
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();

      const prediction = await model.predict(tensor).data();
      console.log("🔮 予測結果:", prediction);

      const maxIndex = prediction.indexOf(Math.max(...prediction));
      const label = `クラス ${maxIndex}`;

      // マップにマーカーを追加
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${label}</b><br><img src="${imageUrl}" width="100">`);

    } catch (error) {
      console.error("❌ 予測中にエラー:", error);
    }
  };

  img.onerror = () => {
    console.error("❌ 画像の読み込みに失敗:", imageUrl);
  };

  img.src = imageUrl;
}

// ページ読み込み時に初期化
window.addEventListener('load', async () => {
  initMap();
  await loadModel();

  // テスト用画像URL（GitHub Pagesにアップした画像など）
  const testImageUrl = 'images/sample.jpg'; // ← 実際の画像URLに変更！

  // 画像を読み込んで予測＆マップに表示
  loadImageAndPredict(testImageUrl, 38.7, 139.8);
});
