class GameManager {
    static generateGameId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static generateGameName(players) {
        if (!players || players.length === 0) return 'New Game';
        const playerNames = players.map(p => p.name).slice(0, 3);
        if (players.length > 3) {
            return `${playerNames.join(', ')} +${players.length - 3} more`;
        }
        return playerNames.join(', ');
    }

    static createGame(players, customName = null) {
        const gameId = this.generateGameId();
        const gameName = customName || this.generateGameName(players);
        const now = Date.now();
        
        const gameData = {
            id: gameId,
            name: gameName,
            createdAt: now,
            lastModified: now,
            players: players || [],
            currentRound: 1,
            gameStarted: false,
            isCompleted: false,
            currentRoundInputs: {}
        };

        return gameData;
    }

    static saveGame(gameData) {
        try {
            gameData.lastModified = Date.now();
            const games = this.getAllGames();
            const existingIndex = games.findIndex(g => g.id === gameData.id);
            
            if (existingIndex >= 0) {
                games[existingIndex] = gameData;
            } else {
                games.push(gameData);
            }
            
            localStorage.setItem('yusufali-games', JSON.stringify(games));
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    static loadGame(gameId) {
        try {
            const games = this.getAllGames();
            return games.find(g => g.id === gameId) || null;
        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    }

    static getAllGames() {
        try {
            const gamesData = localStorage.getItem('yusufali-games');
            if (!gamesData) return [];
            
            const games = JSON.parse(gamesData);
            // Sort by lastModified timestamp, newest first
            return games.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Error getting all games:', error);
            return [];
        }
    }

    static deleteGame(gameId) {
        try {
            const games = this.getAllGames();
            const filteredGames = games.filter(g => g.id !== gameId);
            localStorage.setItem('yusufali-games', JSON.stringify(filteredGames));
            
            // If this was the current game, clear current game reference
            if (this.getCurrentGameId() === gameId) {
                localStorage.removeItem('yusufali-current-game-id');
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting game:', error);
            return false;
        }
    }

    static setCurrentGame(gameId) {
        localStorage.setItem('yusufali-current-game-id', gameId);
    }

    static getCurrentGameId() {
        return localStorage.getItem('yusufali-current-game-id');
    }

    static getCurrentGame() {
        const currentGameId = this.getCurrentGameId();
        if (!currentGameId) return null;
        return this.loadGame(currentGameId);
    }

    static migrateOldGameData() {
        try {
            // Check if old single-game data exists
            const oldGameData = localStorage.getItem('yusufali-game-state');
            if (!oldGameData) return false;

            const oldGame = JSON.parse(oldGameData);
            
            // Convert old format to new format
            const migratedGame = this.createGame(
                oldGame.players || [],
                'Migrated Game'
            );
            
            migratedGame.currentRound = oldGame.currentRound || 1;
            migratedGame.gameStarted = oldGame.gameStarted || false;
            migratedGame.currentRoundInputs = oldGame.currentRoundInputs || {};
            
            // Save the migrated game
            this.saveGame(migratedGame);
            this.setCurrentGame(migratedGame.id);
            
            // Remove old data
            localStorage.removeItem('yusufali-game-state');
            
            console.log('Successfully migrated old game data');
            return true;
        } catch (error) {
            console.error('Error migrating old game data:', error);
            return false;
        }
    }
}

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
        this.backToHomepageLink = document.getElementById('back-to-homepage-link');
        this.gameListScreen = document.getElementById('game-list-screen');
        this.gamesList = document.getElementById('games-list');
        this.noGamesMessage = document.getElementById('no-games-message');
        this.createNewGameBtn = document.getElementById('create-new-game-btn');

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
        this.backToHomepageLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.backToHomepage();
        });
        this.createNewGameBtn.addEventListener('click', () => this.showSetupScreen());
        // Mid-game player controls will be initialized when game starts
        this.registerServiceWorker();

        // Load game state after DOM is ready
        // Initialize the app
        this.initializeApp();
    }

    saveGameState() {
        const currentGameId = GameManager.getCurrentGameId();
        if (!currentGameId) return;

        const currentGame = GameManager.loadGame(currentGameId);
        if (!currentGame) return;

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

        // Update the game data
        currentGame.players = this.players;
        currentGame.currentRound = this.currentRound;
        currentGame.gameStarted = this.gameStarted;
        currentGame.currentRoundInputs = currentRoundInputs;

        console.log('Saving game state:', currentGame);
        GameManager.saveGame(currentGame);
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

    backToHomepage() {
        // Save current game state before leaving
        this.saveGameState();
        
        // Hide the add player section if it was open
        this.midGamePlayerSection.classList.add('hidden');
        this.toggleAddPlayerBtn.textContent = '+ Speler toevoegen';
        
        // Show game list screen (keep current game reference for resuming)
        this.showGameListScreen();
    }

    initializeApp() {
        // Try to migrate old data first
        GameManager.migrateOldGameData();
        
        // Check if there's a current game to resume
        const currentGame = GameManager.getCurrentGame();
        if (currentGame && currentGame.gameStarted) {
            this.loadGameFromData(currentGame);
        } else {
            this.showGameListScreen();
        }
    }

    showGameListScreen() {
        this.hideAllScreens();
        this.gameListScreen.classList.remove('hidden');
        this.renderGamesList();
    }

    showSetupScreen() {
        this.hideAllScreens();
        this.setupScreen.classList.remove('hidden');
        // Reset setup screen state
        this.players = [];
        this.updatePlayerList();
        this.updateStartButton();
    }

    showGameScreen() {
        this.hideAllScreens();
        this.gameScreen.classList.remove('hidden');
    }

    hideAllScreens() {
        this.gameListScreen.classList.add('hidden');
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
    }

    renderGamesList() {
        const games = GameManager.getAllGames();
        
        if (games.length === 0) {
            this.gamesList.innerHTML = '';
            this.noGamesMessage.classList.remove('hidden');
            return;
        }

        this.noGamesMessage.classList.add('hidden');
        
        this.gamesList.innerHTML = games.map(game => this.createGameCard(game)).join('');
        
        // Add event listeners to game cards
        games.forEach(game => {
            const gameCard = document.querySelector(`[data-game-id="${game.id}"]`);
            if (gameCard) {
                gameCard.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-game-btn')) {
                        this.continueGame(game.id);
                    }
                });
                
                const deleteBtn = gameCard.querySelector('.delete-game-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteGame(game.id);
                    });
                }
            }
        });
    }

    createGameCard(game) {
        const createdDate = new Date(game.createdAt).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const playerCount = game.players.length;
        const playerNames = game.players.map(p => p.name).join(', ');
        const status = game.isCompleted ? 'completed' : 'active';
        const statusText = game.isCompleted ? 'Voltooid' : 'Actief';

        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-card-main">
                    <div class="game-card-info">
                        <h3 class="game-name">${game.name}</h3>
                        <div class="game-meta">
                            <div class="game-meta-item">
                                <span class="game-meta-label">Spelers:</span>
                                <span class="game-meta-value">${playerCount}</span>
                            </div>
                            <div class="game-meta-item">
                                <span class="game-meta-label">Ronde:</span>
                                <span class="game-meta-value">${game.currentRound}</span>
                            </div>
                        </div>
                        <div class="game-players">${playerNames}</div>
                    </div>
                </div>
                
                <div class="game-card-right">
                    <span class="game-status ${status}">${statusText}</span>
                    <div class="game-date">${createdDate}</div>
                    <div class="game-actions">
                        <button class="delete-game-btn" title="Verwijder spel">×</button>
                    </div>
                </div>
            </div>
        `;
    }

    continueGame(gameId) {
        const game = GameManager.loadGame(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        GameManager.setCurrentGame(gameId);
        this.loadGameFromData(game);
    }

    loadGameFromData(gameData) {
        this.players = gameData.players || [];
        this.currentRound = gameData.currentRound || 1;
        this.gameStarted = gameData.gameStarted || false;
        this.roundNumber.textContent = this.currentRound;

        if (this.gameStarted && this.players.length > 0) {
            this.showGameScreen();
            
            // Initialize mid-game player controls
            if (!this.midGameControlsInitialized) {
                if (this.addMidGamePlayerBtn && this.midGamePlayerNameInput && this.toggleAddPlayerBtn) {
                    this.addMidGamePlayerBtn.addEventListener('click', () => this.addMidGamePlayer());
                    this.midGamePlayerNameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') this.addMidGamePlayer();
                    });
                    this.toggleAddPlayerBtn.addEventListener('click', () => this.toggleAddPlayerSection());
                    this.midGameControlsInitialized = true;
                }
            }
            
            this.createRoundInputs(false, gameData.currentRoundInputs);
            this.createMidGameShortcutButtons();
            this.updateScoreboard();
        } else {
            this.showSetupScreen();
            this.updatePlayerList();
            this.updateStartButton();
        }
    }

    deleteGame(gameId) {
        if (confirm('Weet je zeker dat je dit spel wilt verwijderen?')) {
            GameManager.deleteGame(gameId);
            this.renderGamesList();
        }
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

        // Create new game using GameManager
        const gameData = GameManager.createGame(this.players, null);
        gameData.gameStarted = true;
        
        // Save the game and set as current
        GameManager.saveGame(gameData);
        GameManager.setCurrentGame(gameData.id);
        
        console.log('Starting new game:', gameData);
        this.gameStarted = true;
        this.showGameScreen();

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
