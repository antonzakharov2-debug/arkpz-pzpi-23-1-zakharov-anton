const API = "http://localhost:5000/api";

const farmSelect = document.getElementById("farmSelect");
const searchFarm = document.getElementById("searchFarm");
const form = document.getElementById("animalForm");
const results = document.getElementById("results");

const animalsList = document.createElement("div");
animalsList.id = "animalsList";
form.parentNode.insertBefore(animalsList, form.nextSibling);

// fetch farms
fetch(API + "/farms")
  .then(res => res.json())
  .then(farms => {
    farms.forEach(farm => {
      const option = document.createElement("option");
      option.value = farm._id;
      option.textContent = farm.name;
      farmSelect.appendChild(option);

      const sOpt = document.createElement("option");
      sOpt.value = farm._id;
      sOpt.textContent = farm.name;
      searchFarm.appendChild(sOpt);
    });
  });

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    animalNumber: Number(document.getElementById("animalNumber").value),
    species: document.getElementById("species").value,
    gender: document.getElementById("gender").value,
    farmId: farmSelect.value,
    age: document.getElementById("age").value ? Number(document.getElementById("age").value) : undefined
  };

  const res = await fetch(API + "/animals/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);

  if (res.ok && result.animal) {
    const a = result.animal;
    animalsList.innerHTML = `<div>
      <strong>Added animal:</strong>
      <p>#${a.animalNumber} — ${a.species} — ${a.gender} — age: ${a.age || 0} — state: ${a.state || ""} — activity: ${a.activity || ""}</p>
    </div>`;
  } else {
    animalsList.innerHTML = "";
  }
});

// Search handler
document.getElementById("btnSearch").addEventListener("click", async (e) => {
  e.preventDefault();
  const qs = new URLSearchParams();

  const num = document.getElementById("searchNumber").value;
  const species = document.getElementById("searchSpecies").value;
  const state = document.getElementById("searchState").value;
  const activity = document.getElementById("searchActivity").value;
  const age = document.getElementById("searchAge") ? document.getElementById("searchAge").value : "";

  const farmId = document.getElementById("searchFarm").value;

  if (num) qs.append("animalNumber", num);
  if (species) qs.append("species", species);
  if (state) qs.append("state", state);
  if (activity) qs.append("activity", activity);
  if (age) qs.append("age", age);
  if (farmId) qs.append("farm", farmId);

  const res = await fetch(`${API}/animals?${qs.toString()}`);
  const animals = await res.json();

  if (!Array.isArray(animals)) {
    results.innerText = "Server error";
    return;
  }

  if (animals.length === 0) {
    results.innerHTML = "<p>No results found</p>";
    return;
  }

  results.innerHTML = `<ul>${animals.map(a =>
    `<li>#${a.animalNumber} — ${a.species} — ${a.gender} — age: ${a.age || 0} — ${a.state} — ${a.activity} (farm: ${a.farm && a.farm.name ? a.farm.name : "-"})</li>`
  ).join("")}</ul>`;
});