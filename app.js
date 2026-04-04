// app.js

// 🔐 Access Key
const accessKey = "911";

const accessInput = document.getElementById('access-key');
const accessSection = document.getElementById('access-section');
const mainApp = document.getElementById('main-app');
const accessButton = document.getElementById('access-submit');

// 🔓 Handle Access
accessButton.addEventListener('click', () => {
  if (accessInput.value === accessKey) {
    accessSection.style.display = 'none';
    mainApp.style.display = 'block';

    // Auto-focus search (great for mobile + dispatch)
    setTimeout(() => {
      document.getElementById('search').focus();
    }, 100);
  } else {
    alert('Incorrect access key');
  }
});

// 🔹 Elements
const searchInput = document.getElementById('search');
const resultDiv = document.getElementById('result');

// 🎨 Agency Colors
const agencyColors = {
  "Boise Fire": "#f97316",     // Orange
  "Meridian Fire": "#ec4899",  // Pink
  "Eagle Fire": "#eab308",     // Yellow
  "MidStar": "#a855f7",        // Purple
  "Kuna Fire": "#14b8a6"       // Teal
};

// 🔹 Load JSON Data
let data = [];
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
  })
  .catch(err => {
    console.error(err);
    resultDiv.innerHTML = `<p>Error loading data</p>`;
  });

// 🔹 Normalize Determinant (ignore dashes, spaces, leading zeros)
function normalizeDeterminant(str) {
  if (!str) return '';

  return str
    .toUpperCase()
    .split(/[^A-Z0-9]/g)
    .filter(Boolean)
    .map(part => /^\d+$/.test(part) ? String(Number(part)) : part)
    .join('');
}

// 🔍 Perform Search
function performSearch() {
  const rawQuery = searchInput.value;

  if (!rawQuery) {
    resultDiv.innerHTML = '';
    return;
  }

  const query = normalizeDeterminant(rawQuery);

  const match = data.find(item =>
    normalizeDeterminant(item.determinant) === query
  );

  if (!match) {
    resultDiv.innerHTML = `<p>No match found</p>`;
    return;
  }

  // 🚒 Build Agency List
  let agencyHTML = '';

  for (const agency in match.agencies) {
    const color = agencyColors[agency] || "#60a5fa"; // fallback color

    agencyHTML += `
      <div style="
        margin-bottom:10px;
        padding:10px;
        border-radius:8px;
        background: rgba(255,255,255,0.04);
      ">
        <strong style="
          color:${color};
          font-size:16px;
        ">
          ${agency}:
        </strong>
        <div style="margin-top:4px; font-size:15px;">
          ${match.agencies[agency]}
        </div>
      </div>
    `;
  }

  // 🚨 Render Result
  resultDiv.innerHTML = `
    <div class="result-card">
      <h2>${match.determinant} - ${match.description || ''}</h2>

      <p class="level-${match.level.toLowerCase()}" style="font-size:18px;">
        <strong>${match.level}</strong>
      </p>

      <div style="margin-top:10px;">
        ${agencyHTML}
      </div>

      ${
        match.notes
          ? `<div style="
              margin-top:12px;
              padding:10px;
              background:rgba(59,130,246,0.1);
              border-left:4px solid #3b82f6;
              border-radius:6px;
              font-size:15px;
            ">
              <strong>Notes:</strong> ${match.notes}
            </div>`
          : ''
      }
    </div>
  `;
}

// 🔹 Event Listeners
searchInput.addEventListener('input', performSearch);

// 🔹 Support Enter key (mobile keyboard search button)
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});