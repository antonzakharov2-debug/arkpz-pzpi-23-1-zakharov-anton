const API = "http://localhost:5000/api";

async function post(url, data) {
  const res = await fetch(API + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function get(url) {
  const res = await fetch(API + url);
  return res.json();
}