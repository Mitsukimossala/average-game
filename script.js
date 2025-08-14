import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// 🔹 Config Firebase
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  databaseURL: "https://TON_PROJET.firebaseio.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let monNom = "";

// 🔹 Page nom → Page jeu
document.getElementById("validerNom").addEventListener("click", () => {
  monNom = document.getElementById("nomInput").value.trim();
  if (!monNom) return alert("Entre un nom !");
  
  set(ref(db, "players/" + monNom), { nombre: null, score: 0 });
  
  document.getElementById("nomJoueur").textContent = monNom;
  document.getElementById("page-nom").classList.add("hidden");
  document.getElementById("page-jeu").classList.remove("hidden");
});

// 🔹 Valider nombre
document.getElementById("validerNombre").addEventListener("click", () => {
  let val = Number(document.getElementById("nombreInput").value);
  if (isNaN(val) || val < 0 || val > 100) return alert("Nombre entre 0 et 100 !");
  update(ref(db, "players/" + monNom), { nombre: val });
});

// 🔹 Afficher joueurs en temps réel
onValue(ref(db, "players"), snap => {
  const data = snap.val() || {};
  let html = "<h3>Joueurs</h3>";
  for (let p in data) {
    html += `<div>${p} : ${data[p].nombre ?? "?"} | Score: ${data[p].score}</div>`;
  }
  document.getElementById("joueurs").innerHTML = html;
});

// 🔹 Terminer manche
document.getElementById("terminerManche").addEventListener("click", async () => {
  const snap = await get(ref(db, "players"));
  if (!snap.exists()) return;
  const players = snap.val();
  const nombres = Object.values(players).map(p => p.nombre).filter(v => v !== null);

  if (nombres.length < 2) return alert("Il faut au moins 2 joueurs !");
  
  const moyenne = (nombres.reduce((a,b)=>a+b,0) / nombres.length) * 0.8;
  
  let diffMin = Infinity;
  let gagnants = [];

  for (let p in players) {
    let diff = Math.abs(players[p].nombre - moyenne);
    if (diff < diffMin) {
      diffMin = diff;
      gagnants = [p];
    } else if (diff === diffMin) {
      gagnants.push(p);
    }
  }

  // 🔹 Mise à jour des scores
  for (let p in players) {
    let score = players[p].score ?? 0;
    if (gagnants.includes(p)) {
      // Gagnant : pas de points gagnés
    } else {
      score -= 1; // Perdants : -1 point
    }
    if (score > 0) score = 0;      // Max = 0
    if (score < -10) score = -10;  // Min = -10
    await update(ref(db, "players/" + p), { score });
  }

  document.getElementById("resultat").textContent =
    `Moyenne ×0.8 = ${moyenne.toFixed(2)} | Gagnant(s) : ${gagnants.join(", ")}`;
});

// 🔹 Nouvelle Manche
document.getElementById("nouvelleManche").addEventListener("click", async () => {
  const snap = await get(ref(db, "players"));
  if (!snap.exists()) return;
  const players = snap.val();
  for (let p in players) {
    await update(ref(db, "players/" + p), { nombre: null });
  }
  document.getElementById("resultat").textContent = "";
});

// 🔹 Nouvelle Partie
document.getElementById("nouvellePartie").addEventListener("click", () => {
  remove(ref(db, "players"));
  document.getElementById("resultat").textContent = "";
});