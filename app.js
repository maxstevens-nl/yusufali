class ScoreKeeper {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.gameStarted = false;
        this.nameShortcuts = {
            'max': 'Max'
            // Add more shortcuts here in the future
            // 'shortcut': 'Full Name'
        };

        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.playerNameInput = document.getElementById('player-name');
        this.addPlayerBtn = document.getElementById('add-player-btn');
        this.playerList = document.getElementById('player-list');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.roundNumber = document.getElementById('round-number');
        this.scoreInputs = document.getElementById('score-inputs');
        this.submitRoundBtn = document.getElementById('submit-round-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.scoreboard = document.getElementById('scoreboard');

        this.init();
    }

    init() {
        this.addPlayerBtn.addEventListener('click', () => this.addPlayer());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });
        this.createShortcutButtons();
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.submitRoundBtn.addEventListener('click', () => this.submitRound());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.registerServiceWorker();
    }

    addPlayer(nameOverride = null) {
        const inputName = nameOverride || this.playerNameInput.value.trim();
        if (!inputName) return;

        // Check for shortcuts
        const finalName = this.nameShortcuts[inputName.toLowerCase()] || inputName;

        if (this.players.find(p => p.name === finalName)) {
            alert('Player name already exists!');
            return;
        }

        const player = {
            name: finalName,
            totalScore: 0,
            roundScores: []
        };

        this.players.push(player);
        this.playerNameInput.value = '';
        this.updatePlayerList();
        this.updateStartButton();
    }

    createShortcutButtons() {
        const shortcutContainer = document.getElementById('shortcut-buttons');
        shortcutContainer.innerHTML = '';

        Object.entries(this.nameShortcuts).forEach(([shortcut, fullName]) => {
            const button = document.createElement('button');
            button.className = 'shortcut-btn';
            button.textContent = fullName;
            button.onclick = () => this.addPlayer(shortcut);
            shortcutContainer.appendChild(button);
        });
    }

    removePlayer(index) {
        this.players.splice(index, 1);
        this.updatePlayerList();
        this.updateStartButton();
    }

    updatePlayerList() {
        this.playerList.innerHTML = '';
        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.name}</span>
                <button onclick="game.removePlayer(${index})" class="remove-btn">×</button>
            `;
            this.playerList.appendChild(playerDiv);
        });
    }

    updateStartButton() {
        this.startGameBtn.disabled = this.players.length < 2;
    }

    startGame() {
        if (this.players.length < 2) return;

        this.gameStarted = true;
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.createRoundInputs();
        this.updateScoreboard();
    }

    createRoundInputs() {
        this.scoreInputs.innerHTML = '';
        this.players.forEach((player, index) => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'score-input-row';
            inputDiv.innerHTML = `
                <label>${player.name}</label>
                <input type="number" id="score-${index}" placeholder="0" step="any">
            `;
            this.scoreInputs.appendChild(inputDiv);
        });
    }

    submitRound() {
        const roundScores = [];
        let hasValidInput = false;

        this.players.forEach((player, index) => {
            const input = document.getElementById(`score-${index}`);
            const score = parseFloat(input.value) || 0;
            roundScores.push(score);
            if (input.value.trim() !== '') hasValidInput = true;
        });

        if (!hasValidInput) {
            alert('Please enter at least one score!');
            return;
        }

        this.players.forEach((player, index) => {
            const roundScore = roundScores[index];
            player.roundScores.push(roundScore);
            player.totalScore += roundScore;
        });

        this.currentRound++;
        this.roundNumber.textContent = this.currentRound;
        this.createRoundInputs();
        this.updateScoreboard();
    }

    updateScoreboard() {
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);

        this.scoreboard.innerHTML = `
            <h3>Scoreboard</h3>
            <div class="scoreboard-table">
                ${sortedPlayers.map((player, index) => `
                    <div class="scoreboard-row ${index === 0 ? 'leader' : ''}">
                        <span class="rank">#${index + 1}</span>
                        <span class="name">${player.name}</span>
                        <span class="score">${player.totalScore}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    newGame() {
        this.players = [];
        this.currentRound = 1;
        this.gameStarted = false;
        this.roundNumber.textContent = '1';

        this.gameScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        this.updatePlayerList();
        this.updateStartButton();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new ScoreKeeper();
});
