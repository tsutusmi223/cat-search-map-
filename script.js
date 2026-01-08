const map = L.map('map').setView([38.725213, 139.827071], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('data/result.csv')
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      complete: function(results) {
        results.data.forEach((row) => {
          const label = row.label;
          const confidence = parseFloat(row.confidence);
          if (["kuro", "mike", "tora", "buti", "siro", "abi", "sabi"].includes(label) && confidence > 0.5) {
            const lat = parseFloat(row.lat);
            const lng = parseFloat(row.lng);
            const imgPath = `images/${row.filename}`;
            const popupContent = `
              <strong>${label} (${confidence})</strong><br>
              <img src="${imgPath}" class="popup-img" />
            `;
            L.marker([lat, lng]).addTo(map).bindPopup(popupContent);
          }
        });
      }
    });
  });
