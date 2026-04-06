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

    setTimeout(() => {
      searchInput.focus();
    }, 100);
  } else {
    alert('Incorrect access key');
  }
});

// 🔹 Elements
const searchInput = document.getElementById('search');
const resultDiv = document.getElementById('result');
const autocompleteList = document.getElementById('autocomplete-list');

// 🎨 Agency Colors
const agencyColors = {
  "Boise Fire": "#f97316",
  "Meridian Fire": "#ec4899",
  "Eagle Fire": "#eab308",
  "MidStar": "#a855f7",
  "Kuna Fire": "#14b8a6"
};

// 🔹 Data
let data = [];

// 🔹 Load JSON
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json.map(item => ({
      ...item,
      determinant: String(item.determinant).trim(),
      description: item.description ? String(item.description).trim() : "",
      level: item.level ? String(item.level).trim() : ""
    }));
  });

// 🔹 Normalize
function normalizeDeterminant(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(\d+)/g, num => String(Number(num)));
}

// 🔍 SEARCH FUNCTION
function performSearch(queryOverride = null) {
  const rawQuery = queryOverride || searchInput.value;

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

  let agencyHTML = '';

  for (const agency in match.agencies) {
    const color = agencyColors[agency] || "#60a5fa";

    agencyHTML += `
      <div style="margin-bottom:10px; padding:10px; border-radius:8px; background: rgba(255,255,255,0.04);">
        <strong style="color:${color};">${agency}:</strong>
        <div style="margin-top:4px;">${match.agencies[agency]}</div>
      </div>
    `;
  }

  resultDiv.innerHTML = `
    <div class="result-card">
      <h2>${match.determinant} - ${match.description}</h2>
      <p class="level-${match.level.toLowerCase()}"><strong>${match.level}</strong></p>
      ${agencyHTML}
      ${match.notes ? `<div style="margin-top:10px;"><strong>Notes:</strong> ${match.notes}</div>` : ''}
    </div>
  `;
}

// 🔮 AUTOCOMPLETE
searchInput.addEventListener('input', () => {
  const input = searchInput.value;
  autocompleteList.innerHTML = '';

  if (!input) return;

  const normalizedInput = normalizeDeterminant(input);

  const matches = data
    .filter(item =>
      normalizeDeterminant(item.determinant).startsWith(normalizedInput)
    )
    .slice(0, 10); // limit results

  matches.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('autocomplete-item');

    div.innerHTML = `
      <strong>${item.determinant}</strong> - ${item.description}
    `;

    div.addEventListener('click', () => {
      searchInput.value = item.determinant;
      autocompleteList.innerHTML = '';
      performSearch(item.determinant);
    });

    autocompleteList.appendChild(div);
  });

  performSearch();
});

// 🔹 Close autocomplete if clicking outside
document.addEventListener('click', (e) => {
  if (e.target !== searchInput) {
    autocompleteList.innerHTML = '';
  }
});

// 🔹 Enter key
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    autocompleteList.innerHTML = '';
    performSearch();
  }
});
