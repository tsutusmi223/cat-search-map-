// 地図の初期化（変数名を myMap に変更してエラー回避）
const myMap = L.map('map').setView([38.725213, 139.827071], 15);

// タイルレイヤーの追加（OpenStreetMap）
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).setZIndex(0).addTo(myMap);

// ラベルを日本語に変換する辞書
const labelMap = {
  kuro: "黒猫",
  mike: "三毛猫",
  tora: "トラ猫",
  buti: "ブチ猫",
  siro: "白猫",
  sabi: "サビ猫"
};

// CSVを読み込んでマーカーを追加
fetch('result.csv')
  .then(response => response.text())
  .then(data => {
    const rows = Papa.parse(data, { header: true }).data;

    rows.forEach(row => {
      const confidence = parseFloat(row.confidence);
      const label = row.label.trim().toLowerCase(); // ← 修正済み！

      // 表示する猫の種類と信頼度の条件
      const validLabels = Object.keys(labelMap);
      if (confidence > 0.5 && validLabels.includes(label)) {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        const imgPath = `${row.filename}`; // 画像が index.html と同じ場所にある前提

        const labelName = labelMap[label] || label;

        const popupContent = `
          <div>
            <strong>この猫は「${labelName}」です</strong><br>
            <img src="${imgPath}" width="150"><br>
            信頼度：${(confidence * 100).toFixed(1)}%
          </div>
        `;

        L.marker([lat, lng]).addTo(myMap).bindPopup(popupContent);
      }
    });
  });
