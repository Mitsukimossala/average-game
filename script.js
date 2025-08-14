// Génère un ID unique pour chaque joueur
let playerId = 'player_' + Math.floor(Math.random() * 100000);
let lives = 10;
let score = 0;

const playersRef = db.ref('players');
const guessesRef = db.ref('guesses');

// Ajouter ce joueur dans la DB
playersRef.child(playerId).set({ score, lives, lastGuess: null });

// Affichage des vies
function updateLivesDisplay() {
  const livesContainer = document.getElementById('lives');
  livesContainer.innerHTML = '';
  for(let i=0;i<lives;i++){
    const heart = document.createElement('span');
    heart.textContent = '❤️';
    heart.classList.add('life-heart');
    livesContainer.appendChild(heart);
  }
}

// Écoute les changements de guesses pour la moyenne
guessesRef.on('value', snapshot => {
  const allGuesses = snapshot.val() ? Object.values(snapshot.val()) : [];
  if(allGuesses.length === 0) return;
  const average = allGuesses.reduce((a,b)=>a.guess+a,0)/allGuesses.length;
  document.getElementById('average').textContent = average.toFixed(2);
});

// Écoute le leaderboard et derniers choix
playersRef.on('value', snapshot => {
  const players = snapshot.val() || {};
  const sorted = Object.entries(players).sort((a,b)=>b[1].score - a[1].score);
  const leaderboard = document.getElementById('leaderboard');
  leaderboard.innerHTML = '';
  sorted.forEach(([id, data]) => {
    const li = document.createElement('li');
    const guessText = data.lastGuess !== null ? ` | Dernier choix: ${data.lastGuess}` : '';
    li.textContent = `${id}: Score ${data.score}, Vies ${data.lives}${guessText}`;
    leaderboard.appendChild(li);
  });
  updateLivesDisplay();
});

// Soumettre un nombre
function submitGuess() {
  const input = document.getElementById('playerInput');
  const playerGuess = parseInt(input.value);
  if(isNaN(playerGuess) || playerGuess < 1 || playerGuess > 100) {
    alert('Veuillez entrer un nombre entre 1 et 100.');
    return;
  }

  // Ajoute le guess dans la DB
  const newGuessRef = guessesRef.push();
  newGuessRef.set({ playerId, guess: playerGuess });

  // Calculer la moyenne actuelle
  guessesRef.once('value', snapshot => {
    const allGuesses = snapshot.val() ? Object.values(snapshot.val()) : [];
    const average = allGuesses.reduce((a,b)=>a.guess+a,0)/allGuesses.length;

    // Trouver le plus proche
    const closest = allGuesses.reduce((prev, curr) => 
      Math.abs(curr.guess - average) < Math.abs(prev.guess - average) ? curr : prev
    );

    if(closest.playerId === playerId){
      score++;
      document.getElementById('result').textContent = `🎉 Bravo! Vous êtes proche de la moyenne: ${average.toFixed(2)}.`;
    } else {
      lives--;
      document.getElementById('result').textContent = `💥 La moyenne est: ${average.toFixed(2)}. Vous perdez une vie.`;
    }

    playersRef.child(playerId).set({ score, lives, lastGuess: playerGuess });

    if(lives <= 0){
      alert(`Game Over! Votre score final: ${score}`);
      score = 0;
      lives = 10;
      playersRef.child(playerId).set({ score, lives, lastGuess: null });
    }

    input.value = '';
  });
}

updateLivesDisplay();
