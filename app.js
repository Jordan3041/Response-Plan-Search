// 🔐 ACCESS MAP
const accessMap = {
  "911": { file: "data.json", name: "Default" },
  "ada911": { file: "ada_data.json", name: "Ada County" },
  "canyon911": { file: "canyon_data.json", name: "Canyon County" }
};

const adminKey = "admin911";

let data = [];
let isAdmin = false;
let currentFocus = -1;

// ELEMENTS
const accessInput = document.getElementById('access-key');
const accessSection = document.getElementById('access-section');
const mainApp = document.getElementById('main-app');
const accessButton = document.getElementById('access-submit');

const searchInput = document.getElementById('search');
const resultDiv = document.getElementById('result');
const autocompleteList = document.getElementById('autocomplete-list');
const agencyBanner = document.getElementById('agency-banner');

// COLORS
const agencyColors = {
  "Boise Fire": "#f97316",
  "Meridian Fire": "#ec4899",
  "Eagle Fire": "#eab308",
  "MidStar": "#a855f7",
  "Nampa Fire": "#f80202",
  "Caldwell Fire": "#f80202",
  "Kuna Fire": "#14b8a6"
};

// ACCESS LOGIN
accessButton.addEventListener('click', () => {
  const key = accessInput.value.trim();

  if (key === adminKey) {
    isAdmin = true;
    loadData("data.json", "ADMIN MODE");
    return;
  }

  const config = accessMap[key];

  if (!config) {
    alert("Invalid key");
    return;
  }

  loadData(config.file, config.name);
});

// LOAD DATA
function loadData(file, name) {
  fetch(file)
    .then(res => res.json())
    .then(json => {
      data = json;

      accessSection.style.display = 'none';
      mainApp.style.display = 'block';

      agencyBanner.innerText = name.toUpperCase();

      if (isAdmin) {
        document.getElementById('admin-panel').style.display = 'block';
      }

      searchInput.focus();
    })
    .catch(() => alert("Error loading file"));
}

// NORMALIZE
function normalizeDeterminant(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(\d+)/g, num => String(Number(num)));
}

// SEARCH
function performSearch(queryOverride = null) {
  const raw = queryOverride || searchInput.value;

  if (!raw) return;

  const query = normalizeDeterminant(raw);

  const match = data.find(d =>
    normalizeDeterminant(d.determinant) === query
  );

  if (!match) {
    resultDiv.innerHTML = "No match";
    return;
  }

  if (isAdmin) loadIntoEditor(match);

  let html = "";

  for (const agency in match.agencies) {
    const color = agencyColors[agency] || "#60a5fa";

    html += `
      <div style="margin:10px;padding:10px;border-radius:8px;background:#111;">
        <strong style="color:${color}">${agency}</strong>
        <div>${match.agencies[agency]}</div>
      </div>
    `;
  }

  resultDiv.innerHTML = `
    <div class="result-card">
      <h2>${match.determinant}</h2>
      <p>${match.level}</p>
      ${html}
      ${match.notes || ""}
    </div>
  `;
}

// AUTOCOMPLETE
searchInput.addEventListener('input', () => {
  const val = searchInput.value;
  autocompleteList.innerHTML = '';
  currentFocus = -1;

  if (!val) return;

  const matches = data.filter(d =>
    normalizeDeterminant(d.determinant).startsWith(normalizeDeterminant(val))
  ).slice(0, 10);

  matches.forEach(item => {
    const div = document.createElement('div');
    div.classList.add('autocomplete-item');
    div.innerHTML = `${item.determinant}`;

    div.onclick = () => {
      searchInput.value = item.determinant;
      performSearch(item.determinant);
      autocompleteList.innerHTML = '';
    };

    autocompleteList.appendChild(div);
  });

  performSearch();
});

// KEYBOARD NAV
searchInput.addEventListener('keydown', (e) => {
  const items = autocompleteList.children;

  if (e.key === 'ArrowDown') currentFocus++;
  if (e.key === 'ArrowUp') currentFocus--;

  if (e.key === 'Enter') {
    e.preventDefault();
    if (items[currentFocus]) items[currentFocus].click();
  }

  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('autocomplete-active');
  }

  if (items[currentFocus]) {
    items[currentFocus].classList.add('autocomplete-active');
  }
});

// ADMIN FUNCTIONS
function loadIntoEditor(d) {
  document.getElementById('edit-determinant').value = d.determinant;
  document.getElementById('edit-description').value = d.description;
  document.getElementById('edit-level').value = d.level;

  document.getElementById('edit-boise').value = d.agencies["Boise Fire"] || "";
  document.getElementById('edit-meridian').value = d.agencies["Meridian Fire"] || "";
  document.getElementById('edit-eagle').value = d.agencies["Eagle Fire"] || "";
  document.getElementById('edit-kuna').value = d.agencies["Kuna Fire"] || "";
  document.getElementById('edit-midstar').value = d.agencies["MidStar"] || "";

  document.getElementById('edit-notes').value = d.notes || "";
}

function saveEntry() {
  const det = document.getElementById('edit-determinant').value;

  const newEntry = {
    determinant: det,
    description: document.getElementById('edit-description').value,
    level: document.getElementById('edit-level').value,
    agencies: {
      "Boise Fire": document.getElementById('edit-boise').value,
      "Meridian Fire": document.getElementById('edit-meridian').value,
      "Eagle Fire": document.getElementById('edit-eagle').value,
      "Kuna Fire": document.getElementById('edit-kuna').value,
      "MidStar": document.getElementById('edit-midstar').value
    },
    notes: document.getElementById('edit-notes').value
  };

  const i = data.findIndex(d =>
    normalizeDeterminant(d.determinant) === normalizeDeterminant(det)
  );

  if (i > -1) data[i] = newEntry;
  else data.push(newEntry);

  alert("Saved (export to keep)");
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.json";
  a.click();
}

function importJSON() {
  const file = document.getElementById('import-file').files[0];
  if (!file) return alert("Select file");

  const reader = new FileReader();
  reader.onload = e => {
    data = JSON.parse(e.target.result);
    alert("Imported!");
  };
  reader.readAsText(file);
}
