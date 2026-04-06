(() => {
  "use strict";

  // ACCESS MAP
  const accessMap = {
    "911": { file: "data.json", name: "Default" },
    "ada911": { file: "ada_data.json", name: "Ada County" },
    "canyon911": { file: "canyon_data.json", name: "Canyon County" }
  };

  const adminKey = "admin911";

  let data = [];
  let isAdmin = false;
  let currentFocus = -1;
  let isLoading = false;

  // ELEMENTS
  const accessInput = document.getElementById("access-key");
  const accessSection = document.getElementById("access-section");
  const mainApp = document.getElementById("main-app");
  const accessButton = document.getElementById("access-submit");

  const searchInput = document.getElementById("search");
  const resultDiv = document.getElementById("result");
  const autocompleteList = document.getElementById("autocomplete-list");
  const agencyBanner = document.getElementById("agency-banner");
  const adminPanel = document.getElementById("admin-panel");
  const agencySelect = document.getElementById("agency-select");
  const importFileInput = document.getElementById("import-file");

  // COLORS
  const agencyColors = {
    "Boise Fire": "#f97316",
    "Caldwell Fire": "#f80202",
    "Meridian Fire": "#ec4899",
    "Eagle Fire": "#eab308",
    "MidStar": "#a855f7",
    "Nampa Fire": "#f80202",
    "Kuna Fire": "#14b8a6"
  };

  console.log("app.js loaded:", new Date().toISOString());

  // ---------- HELPERS ----------
  function clearAutocomplete() {
    if (autocompleteList) {
      autocompleteList.innerHTML = "";
    }
    currentFocus = -1;
  }

  function showApp(name) {
    if (accessSection) accessSection.style.display = "none";
    if (mainApp) mainApp.style.display = "block";
    if (agencyBanner) agencyBanner.innerText = String(name || "").toUpperCase();
    if (searchInput) searchInput.focus();
  }

  function showAdminPanel() {
    if (adminPanel) {
      adminPanel.style.display = "block";
    }
  }

  function normalizeDeterminant(str) {
    return String(str || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/(\d+)/g, (num) => String(Number(num)));
  }

  function getSafeJsonErrorMessage(file, error) {
    const message = error && error.message ? error.message : "Unknown error";
    return `Error loading data file: ${file}\n${message}`;
  }

  async function fetchJsonFile(file) {
    console.log("Attempting fetch:", file);

    const res = await fetch(file, {
      method: "GET",
      cache: "no-store"
    });

    console.log("Fetch response:", file, res.status, res.ok, res.url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${res.statusText})`);
    }

    const text = await res.text();

    if (!text.trim()) {
      throw new Error("Response was empty");
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("JSON parse failed for", file, text.slice(0, 300));
      throw new Error("Invalid JSON format");
    }
  }

  // ---------- LOAD DATA ----------
  async function loadData(file, name) {
    if (isLoading) {
      console.warn("loadData ignored because a request is already in progress");
      return;
    }

    isLoading = true;
    if (accessButton) accessButton.disabled = true;

    try {
      const json = await fetchJsonFile(file);

      if (!Array.isArray(json)) {
        throw new Error("JSON root must be an array");
      }

      data = json;
      console.log("Loaded entries:", data.length, "from", file);

      showApp(name);

      if (isAdmin) {
        showAdminPanel();
      }

      performSearch();
    } catch (error) {
      console.error("Load failed:", file, error);
      alert(getSafeJsonErrorMessage(file, error));
    } finally {
      isLoading = false;
      if (accessButton) accessButton.disabled = false;
    }
  }

  // ---------- LOGIN ----------
  function handleAccessSubmit() {
    if (!accessInput) return;

    const key = accessInput.value.trim();
    console.log("Access submit:", key);

    if (!key) {
      alert("Enter an access key");
      return;
    }

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

    isAdmin = false;
    loadData(config.file, config.name);
  }

  if (accessButton) {
    accessButton.addEventListener("click", handleAccessSubmit, { once: false });
  }

  if (accessInput) {
    accessInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAccessSubmit();
      }
    });
  }

  // ---------- SEARCH ----------
  function performSearch(queryOverride = null) {
    if (!searchInput || !resultDiv) return;
    if (!Array.isArray(data) || data.length === 0) return;

    const raw = queryOverride !== null ? queryOverride : searchInput.value;

    if (!raw) {
      resultDiv.innerHTML = "";
      return;
    }

    const query = normalizeDeterminant(raw);

    const match = data.find((d) => {
      return normalizeDeterminant(d.determinant) === query;
    });

    if (!match) {
      resultDiv.innerHTML = "<p>No match found</p>";
      return;
    }

    if (isAdmin) {
      loadIntoEditor(match);
    }

    let html = "";

    const agencies = match.agencies || {};
    for (const agency in agencies) {
      const color = agencyColors[agency] || "#60a5fa";

      html += `
        <div style="margin:10px 0;padding:10px;border-radius:8px;background:#111;">
          <strong style="color:${color}">${escapeHtml(agency)}</strong>
          <div>${escapeHtml(agencies[agency])}</div>
        </div>
      `;
    }

    resultDiv.innerHTML = `
      <div class="result-card">
        <h2>${escapeHtml(match.determinant || "")} - ${escapeHtml(match.description || "")}</h2>
        <p>${escapeHtml(match.level || "")}</p>
        ${html}
        ${match.notes ? `<div><strong>Notes:</strong> ${escapeHtml(match.notes)}</div>` : ""}
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- AUTOCOMPLETE ----------
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const val = searchInput.value;
      clearAutocomplete();

      if (!val || !Array.isArray(data) || data.length === 0) {
        if (resultDiv && !val) resultDiv.innerHTML = "";
        return;
      }

      const normalizedVal = normalizeDeterminant(val);

      const matches = data
        .filter((d) => normalizeDeterminant(d.determinant).startsWith(normalizedVal))
        .slice(0, 10);

      matches.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("autocomplete-item");
        div.innerHTML = `<strong>${escapeHtml(item.determinant)}</strong>`;

        div.addEventListener("click", () => {
          searchInput.value = item.determinant;
          performSearch(item.determinant);
          clearAutocomplete();
        });

        if (autocompleteList) {
          autocompleteList.appendChild(div);
        }
      });

      performSearch();
    });

    searchInput.addEventListener("keydown", (e) => {
      if (!autocompleteList) return;

      const items = autocompleteList.children;
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        currentFocus++;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        currentFocus--;
      }

      if (currentFocus >= items.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = items.length - 1;

      if (e.key === "Enter") {
        e.preventDefault();
        if (items[currentFocus]) items[currentFocus].click();
      }

      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("autocomplete-active");
      }

      if (items[currentFocus]) {
        items[currentFocus].classList.add("autocomplete-active");
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (
      e.target !== searchInput &&
      e.target !== autocompleteList &&
      autocompleteList &&
      !autocompleteList.contains(e.target)
    ) {
      clearAutocomplete();
    }
  });

  // ---------- ADMIN LOAD ----------
  function loadIntoEditor(d) {
    const determinantInput = document.getElementById("edit-determinant");
    const descriptionInput = document.getElementById("edit-description");
    const levelInput = document.getElementById("edit-level");
    const notesInput = document.getElementById("edit-notes");
    const agencyResponseInput = document.getElementById("edit-agency-response");

    if (determinantInput) determinantInput.value = d.determinant || "";
    if (descriptionInput) descriptionInput.value = d.description || "";
    if (levelInput) levelInput.value = d.level || "";
    if (notesInput) notesInput.value = d.notes || "";

    const agency = agencySelect ? agencySelect.value : "";
    if (agencyResponseInput) {
      agencyResponseInput.value = (d.agencies && d.agencies[agency]) || "";
    }
  }

  // ---------- SWITCH AGENCY ----------
  if (agencySelect) {
    agencySelect.addEventListener("change", () => {
      performSearch();
    });
  }

  // ---------- SAVE ----------
  window.saveEntry = function saveEntry() {
    const determinantInput = document.getElementById("edit-determinant");
    const descriptionInput = document.getElementById("edit-description");
    const levelInput = document.getElementById("edit-level");
    const notesInput = document.getElementById("edit-notes");
    const agencyResponseInput = document.getElementById("edit-agency-response");

    const det = determinantInput ? determinantInput.value.trim() : "";
    const agency = agencySelect ? agencySelect.value : "";
    const response = agencyResponseInput ? agencyResponseInput.value : "";

    if (!det) {
      alert("Determinant is required");
      return;
    }

    if (!agency) {
      alert("Agency is required");
      return;
    }

    const i = data.findIndex(
      (d) => normalizeDeterminant(d.determinant) === normalizeDeterminant(det)
    );

    if (i > -1) {
      if (!data[i].agencies) data[i].agencies = {};
      data[i].agencies[agency] = response;
      data[i].description = descriptionInput ? descriptionInput.value : data[i].description;
      data[i].level = levelInput ? levelInput.value : data[i].level;
      data[i].notes = notesInput ? notesInput.value : data[i].notes;
    } else {
      data.push({
        determinant: det,
        description: descriptionInput ? descriptionInput.value : "",
        level: levelInput ? levelInput.value : "",
        agencies: { [agency]: response },
        notes: notesInput ? notesInput.value : ""
      });
    }

    alert("Saved locally. Use Export JSON to keep changes.");
    performSearch(det);
  };

  // ---------- EXPORT ----------
  window.exportJSON = function exportJSON() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed");
    }
  };

  // ---------- IMPORT ----------
  window.importJSON = function importJSON() {
    if (!importFileInput || !importFileInput.files || !importFileInput.files[0]) {
      alert("Select file");
      return;
    }

    const file = importFileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        if (!Array.isArray(parsed)) {
          throw new Error("Imported JSON must be an array");
        }

        data = parsed;
        alert("Imported!");
        performSearch();
      } catch (error) {
        console.error("Import failed:", error);
        alert("Import failed: invalid JSON");
      }
    };

    reader.onerror = () => {
      alert("Could not read file");
    };

    reader.readAsText(file);
  };

  // ---------- EXIT ADMIN ----------
  window.exitAdmin = function exitAdmin() {
    window.location.reload();
  };
})();
