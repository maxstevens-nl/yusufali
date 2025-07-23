class ScoreKeeper {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.gameStarted = false;
        this.midGameControlsInitialized = false;
        this.nameShortcuts = {
            'max': 'Max',
            'koekje': 'Koekje',
            'timo': 'Slobbie',
            'hayo': 'Har',
            'daan-b': 'Daantje B',
            'daan-v': 'Daantje V',
            'jur': 'Jur',
            'wessel': 'Wessel',
            'luuk': 'Luuk',
            'joris': 'Joris'
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
        this.midGamePlayerNameInput = document.getElementById('mid-game-player-name');
        this.addMidGamePlayerBtn = document.getElementById('add-mid-game-player-btn');
        this.toggleAddPlayerBtn = document.getElementById('toggle-add-player-btn');
        this.midGamePlayerSection = document.getElementById('mid-game-player-section');
        this.backToMainBtn = document.getElementById('back-to-main-btn');

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
        this.backToMainBtn.addEventListener('click', () => this.backToMain());
        // Mid-game player controls will be initialized when game starts
        this.registerServiceWorker();

        // Load game state after DOM is ready
        // Load game state after DOM is ready
        console.log('About to load game state');
        console.log('localStorage content:', localStorage.getItem('yusufali-game-state'));
        this.loadGameState();
        console.log('Game state loaded, gameStarted:', this.gameStarted, 'players:', this.players.length);
    }

    saveGameState() {
        // Save current round inputs if game is active
        const currentRoundInputs = {};
        if (this.gameStarted) {
            this.players.forEach((player, index) => {
                const input = document.getElementById(`score-${index}`);
                if (input) {
                    currentRoundInputs[player.name] = input.value;
                }
            });
        }

        const gameState = {
            players: this.players,
            currentRound: this.currentRound,
            gameStarted: this.gameStarted,
            currentRoundInputs: currentRoundInputs
        };
        console.log('Saving game state:', gameState);
        localStorage.setItem('yusufali-game-state', JSON.stringify(gameState));
    }

    loadGameState() {
        const savedState = localStorage.getItem('yusufali-game-state');
        console.log('Loading saved state:', savedState);
        if (savedState) {
            try {
                const gameState = JSON.parse(savedState);
                console.log('Parsed game state:', gameState);
                this.players = gameState.players || [];
                this.currentRound = gameState.currentRound || 1;
                this.gameStarted = gameState.gameStarted || false;

                console.log('After loading: gameStarted =', this.gameStarted, 'players.length =', this.players.length);
                console.log('Condition check:', this.gameStarted && this.players.length > 0);

                if (this.gameStarted && this.players.length > 0) {
                    console.log('Restoring game screen');
                    this.setupScreen.classList.add('hidden');
                    this.gameScreen.classList.remove('hidden');
                    this.roundNumber.textContent = this.currentRound;

                    // Initialize mid-game player controls (only if not already initialized)
                    if (!this.midGameControlsInitialized) {
                        console.log('Initializing mid-game controls');
                        if (this.addMidGamePlayerBtn && this.midGamePlayerNameInput && this.toggleAddPlayerBtn) {
                            this.addMidGamePlayerBtn.addEventListener('click', () => this.addMidGamePlayer());
                            this.midGamePlayerNameInput.addEventListener('keypress', (e) => {
                                if (e.key === 'Enter') this.addMidGamePlayer();
                            });
                            this.toggleAddPlayerBtn.addEventListener('click', () => this.toggleAddPlayerSection());
                            this.midGameControlsInitialized = true;
                        } else {
                            console.error('Mid-game control elements not found');
                        }
                    }

                    this.createRoundInputs(false, gameState.currentRoundInputs);
                    this.createMidGameShortcutButtons();
                    this.updateScoreboard();
                } else {
                    this.updatePlayerList();
                    this.updateStartButton();
                }
            } catch (error) {
                console.error('Error loading game state:', error);
                // Clear corrupted state
                this.clearGameState();
            }
        } else {
            console.log('No saved game state found');
        }
    }

    clearGameState() {
        localStorage.removeItem('yusufali-game-state');
    }

    backToMain() {
        // Reset all game state
        this.players = [];
        this.currentRound = 1;
        this.gameStarted = false;
        this.midGameControlsInitialized = false;
        this.roundNumber.textContent = '1';

        // Hide game screen and show setup screen
        this.gameScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        
        // Reset UI
        this.updatePlayerList();
        this.updateStartButton();
        
        // Clear saved game state
        this.clearGameState();
        
        // Hide the add player section if it was open
        this.midGamePlayerSection.classList.add('hidden');
        this.toggleAddPlayerBtn.textContent = '+ Speler toevoegen';
    }

    addPlayer(nameOverride = null) {
        const inputName = nameOverride || this.playerNameInput.value.trim();
        if (!inputName) return;

        // Check for shortcuts
        const finalName = this.nameShortcuts[inputName.toLowerCase()] || inputName;

        if (this.players.find(p => p.name === finalName)) {
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
        this.saveGameState();
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

    toggleAddPlayerSection() {
        const isHidden = this.midGamePlayerSection.classList.contains('hidden');

        if (isHidden) {
            this.midGamePlayerSection.classList.remove('hidden');
            this.toggleAddPlayerBtn.textContent = '− Verberg';
        } else {
            this.midGamePlayerSection.classList.add('hidden');
            this.toggleAddPlayerBtn.textContent = '+ Speler toevoegen';
        }
    }

    createMidGameShortcutButtons() {
        const shortcutContainer = document.getElementById('mid-game-shortcut-buttons');
        shortcutContainer.innerHTML = '';

        Object.entries(this.nameShortcuts).forEach(([shortcut, fullName]) => {
            if (!this.players.find(p => p.name === fullName)) {
                const button = document.createElement('button');
                button.className = 'shortcut-btn';
                button.textContent = fullName;
                button.onclick = () => this.addMidGamePlayer(shortcut);
                shortcutContainer.appendChild(button);
            }
        });
    }

    removePlayer(index) {
        this.players.splice(index, 1);
        this.updatePlayerList();
        this.updateStartButton();
        this.saveGameState();
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

    addMidGamePlayer(nameOverride = null) {
        const inputName = nameOverride || this.midGamePlayerNameInput.value.trim();
        if (!inputName) return;

        const finalName = this.nameShortcuts[inputName.toLowerCase()] || inputName;

        if (this.players.find(p => p.name === finalName)) {
            return;
        }

        const player = {
            name: finalName,
            totalScore: 0,
            roundScores: []
        };

        for (let i = 1; i < this.currentRound; i++) {
            player.roundScores.push(0);
        }

        this.players.push(player);
        this.midGamePlayerNameInput.value = '';
        this.createRoundInputs(true);
        this.createMidGameShortcutButtons();
        this.updateScoreboard();

        // Hide the section after adding a player
        this.midGamePlayerSection.classList.add('hidden');
        this.toggleAddPlayerBtn.textContent = '+ Speler toevoegen';
        this.saveGameState();
    }

    startGame() {
        if (this.players.length < 2) return;

        console.log('Starting game with players:', this.players);
        this.gameStarted = true;
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        // Initialize mid-game player controls (only if not already initialized)
        if (!this.midGameControlsInitialized) {
            this.addMidGamePlayerBtn.addEventListener('click', () => this.addMidGamePlayer());
            this.midGamePlayerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addMidGamePlayer();
            });
            this.toggleAddPlayerBtn.addEventListener('click', () => this.toggleAddPlayerSection());
            this.midGameControlsInitialized = true;
        }

        this.createRoundInputs();
        this.createMidGameShortcutButtons();
        this.updateScoreboard();
        this.saveGameState();
    }

    createRoundInputs(preserveValues = false, savedInputs = null) {
        const existingValues = {};

        if (preserveValues) {
            this.players.forEach((player, index) => {
                const input = document.getElementById(`score-${index}`);
                if (input) {
                    existingValues[player.name] = input.value;
                }
            });
        } else if (savedInputs) {
            // Use saved inputs from localStorage
            Object.assign(existingValues, savedInputs);
        }

        this.scoreInputs.innerHTML = '';
        this.players.forEach((player, index) => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'score-input-row';
            inputDiv.innerHTML = `
                <label>${player.name}</label>
                <input type="number" id="score-${index}" placeholder="0" step="any" value="${existingValues[player.name] || ''}">
            `;
            this.scoreInputs.appendChild(inputDiv);

            // Add event listener to save state when input changes
            const input = document.getElementById(`score-${index}`);
            input.addEventListener('input', () => this.saveGameState());
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
        this.createMidGameShortcutButtons();
        this.updateScoreboard();
        this.saveGameState();
    }

    updateScoreboard() {
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);

        this.scoreboard.innerHTML = `
            <h3>Stand</h3>
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
        this.clearGameState();
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
