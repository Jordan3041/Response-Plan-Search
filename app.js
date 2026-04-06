// app.js

// 🔐 Access Key → Data File Mapping
const accessMap = {
  "911": { file: "data.json", name: "Default Agency" },
  "ada911": { file: "ada_data.json", name: "Ada County" },
  "canyon911": { file: "canyon_data.json", name: "Canyon County" }
};

let data = [];
let currentFocus = -1;

// 🔹 Elements
const accessInput = document.getElementById('access-key');
const accessSection = document.getElementById('access-section');
const mainApp = document.getElementById('main-app');
const accessButton = document.getElementById('access-submit');

const searchInput = document.getElementById('search');
const resultDiv = document.getElementById('result');
const autocompleteList = document.getElementById('autocomplete-list');
const agencyBanner = document.getElementById('agency-banner'); // optional

// 🎨 Agency Colors
const agencyColors = {
  "Boise Fire": "#f97316",
  "Caldwell Fire": "#f80202",
  "Meridian Fire": "#ec4899",
  "Eagle Fire": "#eab308",
  "MidStar": "#a855f7",
  "Nampa Fire": "#f80202",
  "Kuna Fire": "#14b8a6"
};

// 🔐 Handle Access
accessButton.addEventListener('click', () => {
  const key = accessInput.value.trim();
  const config = accessMap[key];

  if (!config) {
    alert("Invalid access key");
    return;
  }

  // Load correct dataset
  fetch(config.file)
    .then(res => res.json())
    .then(json => {
      data = json.map(item => ({
        ...item,
        determinant: String(item.determinant).trim(),
        description: item.description || "",
        level: item.level || ""
      }));

      // Show app
      accessSection.style.display = 'none';
      mainApp.style.display = 'block';

      // Optional agency banner
      if (agencyBanner) {
        agencyBanner.innerText = config.name.toUpperCase();
      }

      setTimeout(() => searchInput.focus(), 100);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading data file");
    });
});

// 🔹 Normalize Determinant
function normalizeDeterminant(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(\d+)/g, num => String(Number(num)));
}

// 🔍 Search Function
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
        <div>${match.agencies[agency]}</div>
      </div>
    `;
  }

  resultDiv.innerHTML = `
    <div class="result-card">
      <h2>${match.determinant} - ${match.description}</h2>
      <p class="level-${(match.level || "").toLowerCase()}"><strong>${match.level}</strong></p>
      ${agencyHTML}
      ${match.notes ? `<div><strong>Notes:</strong> ${match.notes}</div>` : ''}
    </div>
  `;
}

// 🔮 Autocomplete (with keyboard nav)
searchInput.addEventListener('input', () => {
  const input = searchInput.value;
  autocompleteList.innerHTML = '';
  currentFocus = -1;

  if (!input) return;

  const normalizedInput = normalizeDeterminant(input);

  const matches = data
    .filter(item =>
      normalizeDeterminant(item.determinant).startsWith(normalizedInput)
    )
    .slice(0, 10);

  matches.forEach((item) => {
    const div = document.createElement('div');
    div.classList.add('autocomplete-item');

    div.innerHTML = `<strong>${item.determinant}</strong> - ${item.description}`;

    div.addEventListener('click', () => {
      searchInput.value = item.determinant;
      autocompleteList.innerHTML = '';
      performSearch(item.determinant);
    });

    autocompleteList.appendChild(div);
  });

  performSearch();
});

// ⬆️⬇️ Keyboard Navigation
searchInput.addEventListener('keydown', (e) => {
  const items = autocompleteList.getElementsByClassName('autocomplete-item');

  if (e.key === 'ArrowDown') {
    currentFocus++;
    addActive(items);
  } 
  else if (e.key === 'ArrowUp') {
    currentFocus--;
    addActive(items);
  } 
  else if (e.key === 'Enter') {
    e.preventDefault();

    if (currentFocus > -1 && items[currentFocus]) {
      items[currentFocus].click();
    } else {
      performSearch();
    }
  }
});

// 🔹 Highlight active
function addActive(items) {
  if (!items) return;

  removeActive(items);

  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;

  items[currentFocus].classList.add('autocomplete-active');
}

// 🔹 Remove highlight
function removeActive(items) {
  for (let item of items) {
    item.classList.remove('autocomplete-active');
  }
}

// 🔹 Close autocomplete
document.addEventListener('click', (e) => {
  if (e.target !== searchInput) {
    autocompleteList.innerHTML = '';
  }
});
