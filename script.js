let score = 0;
let numbers = [];
let average = 0;

function generateNumbers() {
    numbers = [];
    for (let i = 0; i < 5; i++) {
        numbers.push(Math.floor(Math.random() * 20) + 1);
    }
    average = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    document.getElementById("numbers").textContent = "Nombres : " + numbers.join(", ");
    document.getElementById("result").textContent = "";
    document.getElementById("guess").value = "";
}

document.getElementById("start-game").addEventListener("click", () => {
    const name = document.getElementById("player-name").value.trim();
    if (name) {
        document.getElementById("display-name").textContent = name;
        document.getElementById("name-screen").style.display = "none";
        document.getElementById("game-screen").style.display = "block";
        generateNumbers();
    }
});

document.getElementById("submit").addEventListener("click", () => {
    const guess = parseFloat(document.getElementById("guess").value);
    if (isNaN(guess)) return;

    if (guess === average) {
        document.getElementById("result").textContent = "✅ Correct !";
    } else {
        score--;
        if (score < -10) score = -10;
        document.getElementById("result").textContent = `❌ Faux ! La moyenne était ${average.toFixed(2)}`;
    }
    document.getElementById("score").textContent = "Score : " + score;
});

document.getElementById("new-round").addEventListener("click", () => {
    generateNumbers();
});

document.getElementById("new-game").addEventListener("click", () => {
    score = 0;
    document.getElementById("score").textContent = "Score : " + score;
    generateNumbers();
});