const API = "http://localhost:5000/api";

function logout() {
  localStorage.removeItem("user");
  location.href = "index.html";
}

function showTab(tab) {
  if (tab === "users") return loadUsers();
  if (tab === "animals") return loadAnimals();
  if (tab === "farms") return loadFarms();
  if (tab === "notifications") return loadNotifications();
}

// USERS
async function loadUsers() {
  const container = document.getElementById("admin-users");
  const farmsRes = await fetch(API + "/farms");
  const farms = await farmsRes.json();
  try {
    const res = await fetch(API + "/users");
    const users = await res.json();
    container.innerHTML = `
      <div class="admin-title"><b>Add User</b></div>
      <form id="addUserForm" class="admin-form-row">
        <input name="email" placeholder="Email" required>
        <input name="password" placeholder="Password" required type="password">
        <input name="firstName" placeholder="First name" required>
        <input name="lastName" placeholder="Last name" required>
        <input name="phone" placeholder="Phone" required>
        <input name="birthDate" type="date" required>
        <select name="role">
          <option value="farmer">farmer</option>
          <option value="worker">worker</option>
          <option value="admin">admin</option>
        </select>
        <select name="farmId">
          <option value="">— No farm —</option>
          ${farms.map(f => `<option value="${f._id}">${f.name}</option>`).join("")}
        </select>
        <button class="btn btn-primary" type="submit">Add user</button>
      </form>
      <form id="searchUserForm" class="admin-form-row" style="background:#f4f7fb;padding:8px 0 0 0;">
        <input name="q" placeholder="Search by email, name, phone">
        <button class="btn btn-ghost" type="submit">Search</button>
        <button class="btn btn-ghost" type="button" id="resetUserSearch">Reset</button>
      </form>
      <div class="admin-title"><b>All Users</b></div>
      <div style="overflow-x:auto">
      <table class="animals-table"><thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
          <th>Phone</th>
          <th>Birth</th>
          <th>Farms</th>
          <th>Actions</th>
        </tr>
      </thead><tbody id="usersTableBody">
        ${users.map(u => userRow(u, farms)).join("")}
      </tbody></table>
      </div>`;
    document.getElementById("addUserForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      if (!payload.farmId) delete payload.farmId;
      const res = await fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        alert("User added");
        loadUsers();
      } else {
        alert(result.message || "Error");
      }
    };
    document.getElementById("searchUserForm").onsubmit = function(e) {
      e.preventDefault();
      const q = this.q.value.trim().toLowerCase();
      const filtered = users.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
      document.getElementById("usersTableBody").innerHTML = filtered.map(u => userRow(u, farms)).join("");
    };
    document.getElementById("resetUserSearch").onclick = function() {
      document.getElementById("searchUserForm").q.value = "";
      document.getElementById("usersTableBody").innerHTML = users.map(u => userRow(u, farms)).join("");
    };
  } catch (e) {
    container.innerHTML = "<p style='color:red'>Error loading users</p>";
  }
}
function userRow(u, farms) {
  return `<tr>
    <td>${u.email}</td>
    <td>${u.firstName} ${u.lastName}</td>
    <td>${u.role}</td>
    <td>${u.phone}</td>
    <td>${new Date(u.birthDate).toLocaleDateString()}</td>
    <td>${
      Array.isArray(u.farms) && u.farms.length
        ? u.farms.map(farmId => {
            const farm = farms.find(f => String(f._id) === String(farmId) || (farmId && farmId._id && String(farm._id) === String(farmId._id)));
            return farm ? farm.name : (farmId && farmId.name ? farmId.name : "-");
          }).join(", ")
        : "-"
    }</td>
    <td>
      <button onclick="deleteUser('${u._id}')" class="btn btn-ghost">Delete</button>
    </td>
  </tr>`;
}

// ANIMALS
async function loadAnimals() {
  const container = document.getElementById("admin-animals");
  const farmsRes = await fetch(API + "/farms");
  const farms = await farmsRes.json();
  const res = await fetch(API + "/animals");
  const animals = await res.json();
  container.innerHTML = `
    <div class="admin-title"><b>Add Animal</b></div>
    <form id="addAnimalForm" class="admin-form-row">
      <input name="animalNumber" type="number" placeholder="Number" required>
      <select name="species">
        <option value="Cow">Cow</option>
        <option value="Chicken">Chicken</option>
        <option value="Pig">Pig</option>
        <option value="Sheep">Sheep</option>
        <option value="Goat">Goat</option>
      </select>
      <select name="gender">
        <option value="Female">Female</option>
        <option value="Male">Male</option>
      </select>
      <input name="age" type="number" placeholder="Age (years)" min="0">
      <select name="farmId" required>
        ${farms.map(f => `<option value="${f._id}">${f.name}</option>`).join("")}
      </select>
      <button class="btn btn-primary" type="submit">Add animal</button>
    </form>
    <form id="searchAnimalForm" class="admin-form-row" style="background:#f4f7fb;padding:8px 0 0 0;">
      <input name="q" placeholder="Search by number, species, state, activity">
      <button class="btn btn-ghost" type="submit">Search</button>
      <button class="btn btn-ghost" type="button" id="resetAnimalSearch">Reset</button>
    </form>
    <div class="admin-title"><b>All Animals</b></div>
    <div style="overflow-x:auto">
    <table class="animals-table"><thead>
      <tr>
        <th>#</th>
        <th>Species</th>
        <th>Gender</th>
        <th>Age</th>
        <th>Status</th>
        <th>Activity</th>
        <th>Farm</th>
        <th>Actions</th>
      </tr>
    </thead><tbody id="animalsTableBody">
      ${animals.map(a => animalRow(a, farms)).join("")}
    </tbody></table>
    </div>`;
  document.getElementById("addAnimalForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (payload.age) payload.age = Number(payload.age);
    payload.animalNumber = Number(payload.animalNumber);
    // не передаємо state та activity — будуть дефолтні
    const res = await fetch(API + "/animals/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Animal added");
      loadAnimals();
    } else {
      alert(result.message || "Error");
    }
  };
  document.getElementById("searchAnimalForm").onsubmit = function(e) {
    e.preventDefault();
    const q = this.q.value.trim().toLowerCase();
    const filtered = animals.filter(a =>
      String(a.animalNumber).includes(q) ||
      (a.species && a.species.toLowerCase().includes(q)) ||
      (a.state && a.state.toLowerCase().includes(q)) ||
      (a.activity && a.activity.toLowerCase().includes(q))
    );
    document.getElementById("animalsTableBody").innerHTML = filtered.map(a => animalRow(a, farms)).join("");
  };
  document.getElementById("resetAnimalSearch").onclick = function() {
    document.getElementById("searchAnimalForm").q.value = "";
    document.getElementById("animalsTableBody").innerHTML = animals.map(a => animalRow(a, farms)).join("");
  };
}
function animalRow(a, farms) {
  const farm = farms.find(f => String(f._id) === String(a.farm?._id || a.farm));
  return `<tr>
    <td>${a.animalNumber}</td>
    <td>${a.species}</td>
    <td>${a.gender}</td>
    <td>${a.age || 0}</td>
    <td>${a.state || "-"}</td>
    <td>${a.activity || "-"}</td>
    <td>${farm ? farm.name : (a.farm && a.farm.name ? a.farm.name : "-")}</td>
    <td>
      <button onclick="deleteAnimal('${a._id}')" class="btn btn-ghost">Delete</button>
    </td>
  </tr>`;
}

// FARMS
async function loadFarms() {
  const container = document.getElementById("admin-farms");
  const res = await fetch(API + "/farms");
  const farms = await res.json();
  container.innerHTML = `
    <div class="admin-title"><b>Add Farm</b></div>
    <form id="addFarmForm" class="admin-form-row">
      <input name="name" placeholder="Farm name" required>
      <input name="location" placeholder="Location">
      <button class="btn btn-primary" type="submit">Add farm</button>
    </form>
    <form id="searchFarmForm" class="admin-form-row" style="background:#f4f7fb;padding:8px 0 0 0;">
      <input name="q" placeholder="Search by name or location">
      <button class="btn btn-ghost" type="submit">Search</button>
      <button class="btn btn-ghost" type="button" id="resetFarmSearch">Reset</button>
    </form>
    <div class="admin-title"><b>All Farms</b></div>
    <div style="overflow-x:auto">
    <table class="animals-table"><thead>
      <tr><th>Name</th><th>Location</th><th>Animals</th><th>Actions</th></tr>
    </thead><tbody id="farmsTableBody">
      ${farms.map(f => farmRow(f)).join("")}
    </tbody></table>
    </div>`;
  document.getElementById("addFarmForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch(API + "/farms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Farm added");
      loadFarms();
    } else {
      alert(result.message || "Error");
    }
  };
  document.getElementById("searchFarmForm").onsubmit = function(e) {
    e.preventDefault();
    const q = this.q.value.trim().toLowerCase();
    const filtered = farms.filter(f =>
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.location && f.location.toLowerCase().includes(q))
    );
    document.getElementById("farmsTableBody").innerHTML = filtered.map(f => farmRow(f)).join("");
  };
  document.getElementById("resetFarmSearch").onclick = function() {
    document.getElementById("searchFarmForm").q.value = "";
    document.getElementById("farmsTableBody").innerHTML = farms.map(f => farmRow(f)).join("");
  };
}
function farmRow(f) {
  return `<tr>
    <td>${f.name}</td>
    <td>${f.location || ""}</td>
    <td>${f.animalsCount || 0}</td>
    <td>
      <button onclick="deleteFarm('${f._id}')" class="btn btn-ghost">Delete</button>
    </td>
  </tr>`;
}

// NOTIFICATIONS
async function loadNotifications() {
  const container = document.getElementById("admin-notifications");
  const farmsRes = await fetch(API + "/farms");
  const farms = await farmsRes.json();
  const animalsRes = await fetch(API + "/animals");
  const animals = await animalsRes.json();
  const usersRes = await fetch(API + "/users");
  const users = await usersRes.json();
  const res = await fetch(API + "/notifications");
  const notifs = await res.json();
  container.innerHTML = `
    <div class="admin-title"><b>Add Notification</b></div>
    <form id="addNotifForm" class="admin-form-row">
      <input name="message" placeholder="Message" required>
      <select name="farm">
        <option value="">Farm (optional)</option>
        ${farms.map(f => `<option value="${f._id}">${f.name}</option>`).join("")}
      </select>
      <select name="animal">
        <option value="">Animal (optional)</option>
        ${animals.map(a => `<option value="${a._id}">#${a.animalNumber} (${a.species})</option>`).join("")}
      </select>
      <input name="recommendation" placeholder="Recommendation">
      <select name="recipients" multiple size="2">
        ${users.map(u => `<option value="${u._id}">${u.email}</option>`).join("")}
      </select>
      <button class="btn btn-primary" type="submit">Add notification</button>
    </form>
    <form id="searchNotifForm" class="admin-form-row" style="background:#f4f7fb;padding:8px 0 0 0;">
      <input name="q" placeholder="Search by message, farm, animal">
      <button class="btn btn-ghost" type="submit">Search</button>
      <button class="btn btn-ghost" type="button" id="resetNotifSearch">Reset</button>
    </form>
    <div class="admin-title"><b>All Notifications</b></div>
    <div style="overflow-x:auto">
    <table class="animals-table"><thead>
      <tr><th>Message</th><th>Farm</th><th>Animal</th><th>Recipients</th><th>Actions</th></tr>
    </thead><tbody id="notifsTableBody">
      ${notifs.map(n => notifRow(n, farms, animals)).join("")}
    </tbody></table>
    </div>`;
  document.getElementById("addNotifForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    if (payload.recipients) {
      if (Array.isArray(payload.recipients)) {
        payload.recipients = payload.recipients;
      } else {
        payload.recipients = [payload.recipients];
      }
    } else {
      payload.recipients = [];
    }
    if (!payload.message) {
      alert("Message required");
      return;
    }
    const res = await fetch(API + "/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Notification added");
      loadNotifications();
    } else {
      alert(result.message || "Error");
    }
  };
  document.getElementById("searchNotifForm").onsubmit = function(e) {
    e.preventDefault();
    const q = this.q.value.trim().toLowerCase();
    const filtered = notifs.filter(n =>
      (n.message && n.message.toLowerCase().includes(q)) ||
      (n.farm && n.farm.name && n.farm.name.toLowerCase().includes(q)) ||
      (n.animal && n.animal.animalNumber && String(n.animal.animalNumber).includes(q))
    );
    document.getElementById("notifsTableBody").innerHTML = filtered.map(n => notifRow(n, farms, animals)).join("");
  };
  document.getElementById("resetNotifSearch").onclick = function() {
    document.getElementById("searchNotifForm").q.value = "";
    document.getElementById("notifsTableBody").innerHTML = notifs.map(n => notifRow(n, farms, animals)).join("");
  };
}
function notifRow(n, farms, animals) {
  const farm = farms.find(f => String(f._id) === String(n.farm?._id || n.farm));
  const animal = animals.find(a => String(a._id) === String(n.animal?._id || n.animal));
  return `<tr>
    <td>${n.message}</td>
    <td>${farm ? farm.name : (n.farm && n.farm.name ? n.farm.name : "-")}</td>
    <td>${animal ? animal.animalNumber : (n.animal && n.animal.animalNumber ? n.animal.animalNumber : "-")}</td>
    <td>${(n.recipients || []).length}</td>
    <td>
      <button onclick="deleteNotif('${n._id}')" class="btn btn-ghost">Delete</button>
    </td>
  </tr>`;
}

// ДОДАТИ ФУНКЦІЇ ДЛЯ ВИДАЛЕННЯ
window.deleteUser = async function(id) {
  if (!confirm("Delete this user?")) return;
  const res = await fetch(API + "/auth/" + id, { method: "DELETE" });
  const result = await res.json();
  if (res.ok) {
    alert("User deleted");
    loadUsers();
  } else {
    alert(result.message || "Error");
  }
};

window.deleteAnimal = async function(id) {
  if (!confirm("Delete this animal?")) return;
  const res = await fetch(API + "/animals/" + id, { method: "DELETE" });
  const result = await res.json();
  if (res.ok) {
    alert("Animal deleted");
    loadAnimals();
  } else {
    alert(result.message || "Error");
  }
};

window.deleteFarm = async function(id) {
  if (!confirm("Delete this farm?")) return;
  const res = await fetch(API + "/farms/" + id, { method: "DELETE" });
  const result = await res.json();
  if (res.ok) {
    alert("Farm deleted");
    loadFarms();
  } else {
    alert(result.message || "Error");
  }
};

window.deleteNotif = async function(id) {
  if (!confirm("Delete this notification?")) return;
  const res = await fetch(API + "/notifications/" + id, { method: "DELETE" });
  const result = await res.json();
  if (res.ok) {
    alert("Notification deleted");
    loadNotifications();
  } else {
    alert(result.message || "Error");
  }
};

// За замовчуванням показати користувачів
showTab('users');
