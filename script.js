import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove, off } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Configuration Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyCPJfiPuXV_jWD5hM_x7AB2X9gtsX6lBGE",
    authDomain: "average-game-448ac.firebaseapp.com",
    databaseURL: "https://average-game-448ac-default-rtdb.firebaseio.com",
    projectId: "average-game-448ac",
    storageBucket: "average-game-448ac.appspot.com",
    messagingSenderId: "184831556477",
    appId: "1:184831556477:web:1ee0cffc102a50677caa14"
};

// --- Variables globales ---
let app, db;
let playerName = '';
let playerScore = 0;
let isAlive = true;
let playerRef = null;
let playersListener = null;
let currentRound = 1;
let gameState = 'waiting'; // waiting, playing, results

// --- Initialisation ---
async function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        hideLoading();
        console.log("Firebase initialisé avec succès");
    } catch (error) {
        console.error("Erreur d'initialisation Firebase:", error);
        showToast("Erreur de connexion. Veuillez recharger la page.", "error");
        hideLoading();
    }
}

// --- Utilitaires UI ---
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function clearError(elementId) {
    document.getElementById(elementId).textContent = '';
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function validatePlayerName(name) {
    if (!name || name.trim().length === 0) {
        return "Le nom ne peut pas être vide";
    }
    if (name.trim().length > 20) {
        return "Le nom ne peut pas dépasser 20 caractères";
    }
    if (!/^[a-zA-Z0-9\s\-_àáâäçéèêëíìîïñóòôöúùûüÿ]+$/u.test(name.trim())) {
        return "Le nom contient des caractères non autorisés";
    }
    return null;
}

function validateGuess(guess) {
    if (isNaN(guess)) {
        return "Veuillez entrer un nombre valide";
    }
    if (guess < 0 || guess > 100) {
        return "Le nombre doit être entre 0 et 100";
    }
    return null;
}

// --- Fonctions principales ---
window.startGame = async function() {
    const input = document.getElementById('playerNameInput');
    const rawName = input.value;
    
    clearError('nameError');
    
    const nameError = validatePlayerName(rawName);
    if (nameError) {
        showError('nameError', nameError);
        return;
    }

    playerName = rawName.trim();
    showLoading();

    try {
        // Vérifier si le nom existe déjà
        const playersSnapshot = await new Promise((resolve, reject) => {
            const playersRef = ref(db, 'players');
            onValue(playersRef, resolve, reject, { onlyOnce: true });
        });

        const existingPlayers = playersSnapshot.val() || {};
        const nameExists = Object.values(existingPlayers).some(p => p.name === playerName);
        
        if (nameExists) {
            hideLoading();
            showError('nameError', 'Ce nom est déjà utilisé');
            return;
        }

        // Créer le joueur
        playerRef = push(ref(db, 'players'));
        await set(playerRef, {
            name: playerName,
            guess: null,
            score: playerScore,
            isAlive: true,
            joinedAt: Date.now()
        });

        // Changer de page
        document.getElementById('pageName').style.display = 'none';
        document.getElementById('pageGame').style.display = 'block';
        document.getElementById('playerNameDisplay').textContent = playerName;

        // Afficher les contrôles maître si nécessaire
        if (playerName === 'Im') {
            document.getElementById('masterControls').style.display = 'block';
        }

        // Commencer à écouter les joueurs
        listenToPlayers();
        hideLoading();
        showToast(`Bienvenue ${playerName} dans l'arène !`, 'success');

    } catch (error) {
        hideLoading();
        console.error("Erreur lors du démarrage:", error);
        showToast("Erreur lors de la connexion. Réessayez.", "error");
    }
}

window.submitGuess = async function() {
    const guessInput = document.getElementById('playerGuess');
    const guess = parseInt(guessInput.value);
    
    clearError('guessError');
    
    const guessError = validateGuess(guess);
    if (guessError) {
        showError('guessError', guessError);
        return;
    }

    if (!isAlive) {
        showError('guessError', 'Vous êtes éliminé et ne pouvez plus jouer');
        return;
    }

    try {
        await update(playerRef, { guess });
        guessInput.value = '';
        document.getElementById('submitFeedback').textContent = `Nombre choisi: ${guess}`;
        document.getElementById('submitFeedback').className = 'feedback-message success';
        showToast(`Choix enregistré: ${guess}`, 'success');
        
        // Désactiver le bouton temporairement
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistré ✓';
        
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Soumettre';
        }, 2000);

    } catch (error) {
        console.error("Erreur lors de la soumission:", error);
        showToast("Erreur lors de l'enregistrement", "error");
    }
}

function listenToPlayers() {
    if (playersListener) {
        off(ref(db, 'players'), 'value', playersListener);
    }

    playersListener = onValue(ref(db, 'players'), (snapshot) => {
        const data = snapshot.val() || {};
        updatePlayersDisplay(data);
    });
}

function updatePlayersDisplay(playersData) {
    const container = document.getElementById('numbersContainer');
    
    if (gameState === 'results') {
        return; // Ne pas mettre à jour pendant l'affichage des résultats
    }
    
    container.innerHTML = '';
    
    const players = Object.entries(playersData)
        .filter(([key, player]) => player.name)
        .map(([key, player]) => ({ key, ...player }));

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-circle';
        
        const hasGuess = player.guess !== null;
        if (hasGuess) {
            div.classList.add('has-guess');
        }
        
        if (!player.isAlive) {
            div.classList.add('eliminated');
        }

        div.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-score">Score: ${player.score}</div>
            <div class="player-status">${hasGuess ? '✓' : '⏳'}</div>
        `;
        
        container.appendChild(div);
    });

    // Mettre à jour le statut du joueur actuel
    const currentPlayer = players.find(p => p.name === playerName);
    if (currentPlayer) {
        document.getElementById('score').textContent = `Score: ${currentPlayer.score}`;
        document.getElementById('status').textContent = 
            currentPlayer.isAlive ? 'Survie: Oui' : 'Survie: Éliminé';
        
        if (currentPlayer.score !== playerScore) {
            playerScore = currentPlayer.score;
            isAlive = currentPlayer.isAlive;
        }
    }
}

window.endRound = async function() {
    if (playerName !== 'Im') return;
    
    gameState = 'results';
    showLoading();

    try {
        const snapshot = await new Promise((resolve, reject) => {
            onValue(ref(db, 'players'), resolve, reject, { onlyOnce: true });
        });

        const data = snapshot.val() || {};
        const validPlayers = Object.entries(data)
            .filter(([key, player]) => player.guess !== null && player.name && player.isAlive)
            .map(([key, player]) => ({ key, ...player }));

        if (validPlayers.length === 0) {
            hideLoading();
            showToast("Aucun joueur valide pour cette manche", "warning");
            gameState = 'waiting';
            return;
        }

        // Calculer la moyenne et le gagnant
        const sum = validPlayers.reduce((acc, p) => acc + p.guess, 0);
        const average = sum / validPlayers.length;
        const target = average * 0.8;

        let minDiff = Infinity;
        let winner = null;
        
        validPlayers.forEach(player => {
            const diff = Math.abs(player.guess - target);
            if (diff < minDiff) {
                minDiff = diff;
                winner = player;
            }
        });

        // Mettre à jour les scores
        const updates = {};
        validPlayers.forEach(player => {
            let newScore = player.score;
            if (player.key !== winner.key) {
                newScore -= 1;
            }
            
            const newIsAlive = newScore > -10;
            updates[`players/${player.key}/score`] = newScore;
            updates[`players/${player.key}/isAlive`] = newIsAlive;
        });

        await update(ref(db), updates);

        // Afficher les résultats
        displayResults(validPlayers, winner, { sum, average, target });
        
        hideLoading();
        document.getElementById('newRoundBtn').style.display = 'inline-block';
        document.getElementById('newGameBtn').style.display = 'inline-block';

    } catch (error) {
        hideLoading();
        console.error("Erreur lors de la fin de manche:", error);
        showToast("Erreur lors du calcul des résultats", "error");
        gameState = 'waiting';
    }
}

function displayResults(players, winner, stats) {
    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-circle result';
        
        if (player.key === winner.key) {
            div.classList.add('winner');
        } else {
            div.classList.add('loser');
        }
        
        if (!player.isAlive) {
            div.classList.add('eliminated');
        }

        div.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-guess">${player.guess}</div>
            <div class="player-score">Score: ${player.score}</div>
        `;
        
        container.appendChild(div);
    });

    document.getElementById('message').innerHTML = `
        <strong>Résultats Manche ${currentRound}</strong><br>
        Gagnant: ${winner.name}<br>
        Cible: ${stats.target.toFixed(2)}
    `;
    
    document.getElementById('roundInfo').innerHTML = `
        Somme: ${stats.sum} | Moyenne: ${stats.average.toFixed(2)} | Cible (×0.8): ${stats.target.toFixed(2)}
    `;

    currentRound++;
}

window.newRound = async function() {
    if (playerName !== 'Im') return;
    
    gameState = 'waiting';
    
    try {
        const snapshot = await new Promise((resolve, reject) => {
            onValue(ref(db, 'players'), resolve, reject, { onlyOnce: true });
        });

        const data = snapshot.val() || {};
        const updates = {};
        
        for (const key in data) {
            updates[`players/${key}/guess`] = null;
        }
        
        await update(ref(db), updates);
        
        // Nettoyer l'affichage
        document.getElementById('message').textContent = '';
        document.getElementById('roundInfo').textContent = '';
        document.getElementById('newRoundBtn').style.display = 'none';
        document.getElementById('newGameBtn').style.display = 'none';
        document.getElementById('submitFeedback').textContent = '';
        
        showToast("Nouvelle manche commencée !", "success");
        
    } catch (error) {
        console.error("Erreur lors de la nouvelle manche:", error);
        showToast("Erreur lors de la création de la nouvelle manche", "error");
    }
}

window.newGame = async function() {
    if (playerName !== 'Im') return;
    
    try {
        await remove(ref(db, 'players'));
        currentRound = 1;
        gameState = 'waiting';
        
        document.getElementById('numbersContainer').innerHTML = '';
        document.getElementById('message').textContent = '';
        document.getElementById('roundInfo').textContent = '';
        document.getElementById('newRoundBtn').style.display = 'none';
        document.getElementById('newGameBtn').style.display = 'none';
        
        showToast("Nouvelle partie créée ! Tous les joueurs doivent rejoindre.", "success");
        
    } catch (error) {
        console.error("Erreur lors de la nouvelle partie:", error);
        showToast("Erreur lors de la création de la nouvelle partie", "error");
    }
}

window.goBack = function() {
    if (playerRef) {
        remove(playerRef);
    }
    
    if (playersListener) {
        off(ref(db, 'players'), 'value', playersListener);
    }
    
    document.getElementById('pageGame').style.display = 'none';
    document.getElementById('pageName').style.display = 'block';
    document.getElementById('playerNameInput').value = '';
    
    // Reset variables
    playerName = '';
    playerScore = 0;
    isAlive = true;
    playerRef = null;
    gameState = 'waiting';
}

// --- Gestion des événements ---
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    
    // Enter pour soumettre le nom
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    // Enter pour soumettre le nombre
    document.getElementById('playerGuess').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });
});

// Nettoyage à la fermeture
window.addEventListener('beforeunload', () => {
    if (playerRef) {
        remove(playerRef);
    }
});
