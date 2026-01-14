let map;

// UI要素の取得
const selectImageBtn = document.getElementById('selectImageBtn');
const fileInput = document.getElementById('fileInput');

// 一時保存用
let tempLatLng = null;
const markerList = [];
const STORAGE_KEY = 'savedMarkers';

// 保存データの読み書き
function createPopupContent(data, index) {
  const { image, lat, lng, datetime } = data;

  return `
    <b>日時:</b> ${datetime || '未設定'}<br>
    <img src="${image}" style="max-width: 150px; display: block;" alt="画像が読み込めません"><br>
    <small>緯度: ${lat}<br>経度: ${lng}</small><br>
    <button class="delete-btn" onclick="deleteMarkerAt(${index})">🗑️ 削除</button>
  `;
}

function addMarker(data, index) {
  const { lat, lng } = data;
  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(createPopupContent(data, index));
  marker.data = data;
  markerList[index] = marker;
}

function saveMarkersToStorage(markers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
}

function addMarkerToStorage(data) {
  const saved = localStorage.getItem(STORAGE_KEY);
  const markers = saved ? JSON.parse(saved) : [];
  markers.push(data);
  saveMarkersToStorage(markers);
}

function loadMarkersFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const markers = JSON.parse(saved);
    markers.forEach((data, index) => {
      if (data.image && data.image.startsWith("data:image")) {
        addMarker(data, index);
      }
    });
  } catch (e) {
    console.error("保存データの読み込みに失敗しました:", e);
  }
}

// Firestoreから読み込み
function loadMarkersFromFirestore() {
  ...
}

// ✅ この下に追加！
function loadMarkersFromCSV() {
  fetch('result.csv')
    .then(response => response.text())
    .then(data => {
      const labelMap = {
        kuro: "黒猫", mike: "三毛猫", tora: "トラ猫",
        buti: "ブチ猫", siro: "白猫", sabi: "サビ猫"
      };
      const rows = Papa.parse(data, { header: true }).data;
      rows.forEach(row => {
        const confidence = parseFloat(row.confidence);
        const label = row.label.trim().toLowerCase();
        const validLabels = Object.keys(labelMap);
        if (confidence > 0.5 && validLabels.includes(label)) {
          const lat = parseFloat(row.lat);
          const lng = parseFloat(row.lng);
          const labelName = labelMap[label] || label;
          const popupContent = `
            <div>
              <strong>この猫は「${labelName}」です</strong><br>
              信頼度：${(confidence * 100).toFixed(1)}%
            </div>
          `;
          L.marker([lat, lng]).addTo(map).bindPopup(popupContent);
        }
      });
    })
    .catch(error => {
      console.error("CSVの読み込みに失敗しました:", error);
    });
}

function deleteMarker(marker, index) {
  const data = marker.data;
  if (!data || !data.id) {
    console.warn("削除対象のデータが見つかりませんでした");
    return;
  }

  map.removeLayer(marker);
  markerList.splice(index, 1);

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const savedIndex = saved.findIndex(item => item.id === data.id);
  if (savedIndex !== -1) {
    saved.splice(savedIndex, 1);
    saveMarkersToStorage(saved);
  }

  db.collection("posts").doc(data.id).delete().then(() => {
    console.log("Firestoreからも削除しました: ", data.id);
    loadMarkersFromFirestore();
  }).catch((error) => {
    console.error("Firestore削除エラー:", error.message);
  });
}

window.deleteMarkerAt = function (index) {
  const marker = markerList[index];
  if (!marker) return;
  if (confirm("このピンを削除しますか？")) {
    deleteMarker(marker, index);
  }
};

// Firestoreから読み込み
function loadMarkersFromFirestore() {
  db.collection("posts").orderBy("timestamp", "desc").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const markerData = {
        lat: data.lat,
        lng: data.lng,
        datetime: data.datetime,
        image: data.image,
        id: id,
        fromFirestore: true
      };
      const index = markerList.length;
      addMarker(markerData, index);
    });
    console.log("Firestoreから投稿を読み込みました！");
  }).catch((error) => {
    console.error("Firestore読み込みエラー:", error.message);
  });
}

// ファイル選択処理（モデルなし）
selectImageBtn.onclick = () => {
  fileInput.click();
};

fileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (!file || !tempLatLng) return;
  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでください。");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const imageData = event.target.result;
    if (!imageData) {
      alert("画像の読み込みに失敗しました。");
      return;
    }

    const datetime = getCurrentDateTime();
    const lat = parseFloat(tempLatLng.lat.toFixed(6));
    const lng = parseFloat(tempLatLng.lng.toFixed(6));
    const id = Date.now().toString();

    const newData = {
      lat,
      lng,
      image: imageData,
      datetime,
      id
    };

    const index = markerList.length;
    addMarkerToStorage(newData);
    addMarker(newData, index);
    db.collection("posts").doc(id).set({
      ...newData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    fileInput.value = '';
    tempLatLng = null;
  };
  reader.readAsDataURL(file);
});

function getCurrentDateTime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// OKボタンでモーダルを閉じてマップを初期化
window.closeIntro = function () {
  document.getElementById("introModal").style.display = "none";
  setTimeout(() => {
    document.getElementById("map").style.display = "block";

    // マップ初期化
    map = L.map('map').setView([38.725213, 139.827071], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).setZIndex(0).addTo(map);

    map.invalidateSize();

    // 地図クリックイベント
    map.on('click', function (e) {
      tempLatLng = e.latlng;
      selectImageBtn.style.display = 'block';
    });

    // マーカー読み込み
    loadMarkersFromStorage();
    loadMarkersFromFirestore();
    loadMarkersFromCSV();
  }, 100);
};
