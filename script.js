const players = [
  { name: "Joueur 1", score: 0, guess: null },
  { name: "Joueur 2", score: 0, guess: null },
  { name: "Joueur 3", score: 0, guess: null },
  { name: "Joueur 4", score: 0, guess: null }
];

const inputsContainer = document.getElementById("players-inputs");
const gridContainer = document.getElementById("players-grid");
const submitBtn = document.getElementById("submit-guess");
const newRoundBtn = document.getElementById("new-round");
const resultMessage = document.getElementById("result-message");

function createPlayerInputs() {
  inputsContainer.innerHTML = "";
  players.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("number-input");
    div.innerHTML = `<input type="number" min="0" max="100" placeholder="${p.name}" id="input-${i}" class="neon-input">`;
    inputsContainer.appendChild(div);
  });
}

function createPlayerCircles() {
  gridContainer.innerHTML = "";
  players.forEach((p, i) => {
    const circle = document.createElement("div");
    circle.classList.add("player-circle");
    circle.id = `circle-${i}`;
    circle.innerHTML = `
      <div class="player-name">${p.name}</div>
      <div class="player-score">Score: ${p.score}</div>
      <div class="player-guess">${p.guess !== null ? p.guess : "-"}</div>
    `;
    gridContainer.appendChild(circle);
  });
}

function calculateWinner() {
  const guesses = players.map((p, i) => {
    const val = parseFloat(document.getElementById(`input-${i}`).value);
    p.guess = isNaN(val) ? 0 : val;
    return p.guess;
  });
  const avg = guesses.reduce((a,b)=>a+b,0)/guesses.length * 0.8;
  let closest = players[0];
  players.forEach(p => {
    if(Math.abs(p.guess - avg) < Math.abs(closest.guess - avg)) closest = p;
  });
  players.forEach(p => {
    if(p === closest) p.score += 1;
    else p.score -= 1;
  });
  resultMessage.textContent = `Average ×0.8 = ${avg.toFixed(2)}. Gagnant: ${closest.name}`;
  updatePlayerCircles();
}

function updatePlayerCircles() {
  players.forEach((p, i) => {
    const circle = document.getElementById(`circle-${i}`);
    circle.querySelector(".player-score").textContent = `Score: ${p.score}`;
    circle.querySelector(".player-guess").textContent = p.guess;
    circle.classList.remove("winner", "loser");
    if(p.score <= -10) circle.classList.add("eliminated");
  });
  const winner = players.reduce((acc, p) => p.guess !== null && Math.abs(p.guess - (players.reduce((a,b)=>a+b.guess,0)/players.length*0.8)) < Math.abs(acc.guess - (players.reduce((a,b)=>a+b.guess,0)/players.length*0.8)) ? p : acc, players[0]);
  const winnerIndex = players.indexOf(winner);
  document.getElementById(`circle-${winnerIndex}`).classList.add("winner");
}

submitBtn.addEventListener("click", calculateWinner);
newRoundBtn.addEventListener("click", () => {
  createPlayerInputs();
  players.forEach(p => p.guess = null);
  resultMessage.textContent = "";
  updatePlayerCircles();
});

createPlayerInputs();
createPlayerCircles();
