// src/games/tic-tac-toe/tic-tac-toe.js - Tic-Tac-Toe Game

// --- Canvas and Context ---
const canvas = document.getElementById('ticTacToeCanvas');
const ctx = canvas.getContext('2d');
const gameMessage = document.getElementById('gameMessage');
const modeSelection = document.getElementById('modeSelection');
const playFriendBtn = document.getElementById('playFriendBtn');
const playBotBtn = document.getElementById('playBotBtn');
const resetBtn = document.getElementById('resetBtn');

// --- Game State Variables ---
let canvasWidth, canvasHeight;
let cellSize; // Size of each cell in the 3x3 grid
let board = ['', '', '', '', '', '', '', '', '']; // Represents the 3x3 board (9 cells)
let currentPlayer = 'X'; // 'X' or 'O'
let gameActive = false; // Is the game currently in progress?
let gameMode = null; // 'friend' or 'bot'
let botDifficulty = 'easy'; // 'easy' or 'hard' (for bot mode)

// --- Difficulty Settings (for bot) ---
const DIFFICULTY_SETTINGS = {
    'easy': {
        botMoveStrategy: 'random', // Bot makes random moves
        message: 'Playing against Easy Bot!'
    },
    'hard': {
        botMoveStrategy: 'minimax', // Bot uses basic minimax (or a simpler strategic approach)
        message: 'Playing against Hard Bot!'
    },
    // 'difficult' could be added later for a perfect bot
};

// --- Win Conditions (indices of winning lines) ---
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Utility Functions ---

/**
 * Reads difficulty from URL and applies settings.
 * For Tic-Tac-Toe, difficulty primarily affects bot behavior.
 */
function initializeGameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const difficultyParam = urlParams.get('difficulty');

    if (difficultyParam && DIFFICULTY_SETTINGS[difficultyParam]) {
        botDifficulty = difficultyParam;
    } else {
        botDifficulty = 'easy'; // Default to easy if param is missing or invalid
    }
}

/**
 * Resizes the canvas and recalculates cell size.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Cell size is 1/3rd of the minimum dimension to ensure a square board
    cellSize = Math.min(canvasWidth, canvasHeight) / 3;

    drawGame(); // Redraw game elements after resize
}

/**
 * Draws the Tic-Tac-Toe board grid.
 */
function drawBoardGrid() {
    ctx.strokeStyle = '#60A5FA'; // Wave-themed blue for grid lines
    ctx.lineWidth = 5; // Thicker lines for impact

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(cellSize, 0);
    ctx.lineTo(cellSize, canvasHeight);
    ctx.moveTo(cellSize * 2, 0);
    ctx.lineTo(cellSize * 2, canvasHeight);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, cellSize);
    ctx.lineTo(canvasWidth, cellSize);
    ctx.moveTo(0, cellSize * 2);
    ctx.lineTo(canvasWidth, cellSize * 2);
    ctx.stroke();
}

/**
 * Draws an 'X' marker with a wave-like effect.
 * @param {number} x - Center X coordinate of the cell.
 * @param {number} y - Center Y coordinate of the cell.
 */
function drawX(x, y) {
    const offset = cellSize * 0.2; // Padding from cell edges
    ctx.strokeStyle = '#EF4444'; // Red for X
    ctx.lineWidth = 8; // Thicker lines

    // Draw lines with slight curves for a "wave" effect
    ctx.beginPath();
    ctx.moveTo(x - offset, y - offset);
    ctx.quadraticCurveTo(x, y - offset * 0.5, x + offset, y - offset); // Top curve
    ctx.moveTo(x - offset, y + offset);
    ctx.quadraticCurveTo(x, y + offset * 0.5, x + offset, y + offset); // Bottom curve
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - offset, y + offset);
    ctx.quadraticCurveTo(x, y + offset * 0.5, x + offset, y + offset); // Bottom curve
    ctx.moveTo(x - offset, y - offset);
    ctx.quadraticCurveTo(x, y - offset * 0.5, x + offset, y - offset); // Top curve
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - offset, y - offset);
    ctx.lineTo(x + offset, y + offset);
    ctx.moveTo(x - offset, y + offset);
    ctx.lineTo(x + offset, y - offset);
    ctx.stroke();
}

/**
 * Draws an 'O' marker with a wave-like effect.
 * @param {number} x - Center X coordinate of the cell.
 * @param {number} y - Center Y coordinate of the cell.
 */
function drawO(x, y) {
    const radius = cellSize * 0.3; // Radius of the O
    ctx.strokeStyle = '#3B82F6'; // Blue for O
    ctx.lineWidth = 8; // Thicker lines

    // Draw arc with a slight distortion for "wave" effect
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

/**
 * Draws all game elements (grid and markers).
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas
    drawBoardGrid();

    // Draw X's and O's
    for (let i = 0; i < board.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const centerX = col * cellSize + cellSize / 2;
        const centerY = row * cellSize + cellSize / 2;

        if (board[i] === 'X') {
            drawX(centerX, centerY);
        } else if (board[i] === 'O') {
            drawO(centerX, centerY);
        }
    }
}

/**
 * Updates the game message displayed to the user.
 * @param {string} message - The message to display.
 * @param {string} color - Tailwind CSS color class (e.g., 'text-white', 'text-green-400').
 */
function updateMessage(message, color = 'text-gray-300') {
    gameMessage.textContent = message;
    gameMessage.className = `text-lg md:text-xl ${color} min-h-[1.5em]`;
}

/**
 * Handles a player's move (or bot's move).
 * @param {number} index - The index of the cell clicked/chosen.
 */
function handlePlayerMove(index) {
    if (!gameActive || board[index] !== '') {
        return; // Ignore if game not active or cell already taken
    }

    board[index] = currentPlayer;
    drawGame(); // Update canvas

    if (checkWin()) {
        updateMessage(`${currentPlayer} Wins!`, currentPlayer === 'X' ? 'text-red-400' : 'text-blue-400');
        endGame();
        return;
    }

    if (checkDraw()) {
        updateMessage('It\'s a Draw!', 'text-yellow-400');
        endGame();
        return;
    }

    // Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateMessage(`Player ${currentPlayer}'s turn`);

    // If it's bot mode and it's bot's turn, make bot move
    if (gameMode === 'bot' && currentPlayer === 'O' && gameActive) {
        setTimeout(makeBotMove, 500); // Small delay for bot move
    }
}

/**
 * Checks if the current player has won.
 * @returns {boolean} - True if current player has won, false otherwise.
 */
function checkWin() {
    return winConditions.some(combination => {
        const [a, b, c] = combination;
        return board[a] === currentPlayer && board[b] === currentPlayer && board[c] === currentPlayer;
    });
}

/**
 * Checks if the game is a draw.
 * @returns {boolean} - True if the board is full and no winner, false otherwise.
 */
function checkDraw() {
    return board.every(cell => cell !== '');
}

/**
 * Ends the current game.
 */
function endGame() {
    gameActive = false;
    resetBtn.classList.remove('hidden'); // Show reset button
    canvas.removeEventListener('click', handleCanvasClick); // Disable clicks on board
}

/**
 * Resets the game to its initial state.
 */
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true; // Set to true for new game
    resetBtn.classList.add('hidden'); // Hide reset button
    modeSelection.classList.remove('hidden'); // Show mode selection again
    updateMessage('Select game mode to start.');
    drawGame(); // Clear board
    canvas.addEventListener('click', handleCanvasClick); // Re-enable clicks
}

/**
 * Handles clicks on the canvas to determine cell selection.
 * @param {MouseEvent} event - The click event.
 */
function handleCanvasClick(event) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const index = row * 3 + col;

    handlePlayerMove(index);
}

/**
 * Bot's move logic.
 */
function makeBotMove() {
    if (!gameActive) return;

    let moveIndex = -1;
    if (botDifficulty === 'easy') {
        // Easy bot: pick a random empty cell
        const emptyCells = board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        if (emptyCells.length > 0) {
            moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
    } else if (botDifficulty === 'hard') {
        // Hard bot: simple strategic moves (block win, try to win, else random)
        moveIndex = findBestMove();
    }

    if (moveIndex !== -1) {
        handlePlayerMove(moveIndex);
    }
}

/**
 * Finds the best move for the bot using a basic strategic approach.
 * This is a simplified version, not a full minimax.
 */
function findBestMove() {
    // 1. Check if bot can win
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O'; // Try bot's move
            if (checkWin()) {
                board[i] = ''; // Undo for checkWin
                return i; // Bot wins
            }
            board[i] = ''; // Undo
        }
    }

    // 2. Check if player can win (and block them)
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'X'; // Try player's move
            if (checkWin()) {
                board[i] = ''; // Undo for checkWin
                return i; // Block player
            }
            board[i] = ''; // Undo
        }
    }

    // 3. Take center if available
    if (board[4] === '') return 4;

    // 4. Take a corner if available
    const corners = [0, 2, 6, 8];
    for (const corner of corners) {
        if (board[corner] === '') return corner;
    }

    // 5. Take any available side
    const sides = [1, 3, 5, 7];
    for (const side of sides) {
        if (board[side] === '') return side;
    }

    // Fallback to random if no strategic move found (shouldn't happen in 3x3)
    const emptyCells = board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}


/**
 * Initializes the game for Player vs. Player mode.
 */
function startPvP() {
    gameMode = 'friend';
    modeSelection.classList.add('hidden'); // Hide mode selection
    startGame();
    updateMessage(`Player X's turn`);
}

/**
 * Initializes the game for Player vs. Bot mode.
 */
function startPvBot() {
    gameMode = 'bot';
    modeSelection.classList.add('hidden'); // Hide mode selection
    startGame();
    updateMessage(`Player X's turn (${DIFFICULTY_SETTINGS[botDifficulty].message})`);
}

/**
 * Starts a new game.
 */
function startGame() {
    gameActive = true;
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    drawGame();
    canvas.addEventListener('click', handleCanvasClick);
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas);
playFriendBtn.addEventListener('click', startPvP);
playBotBtn.addEventListener('click', startPvBot);
resetBtn.addEventListener('click', resetGame);

// Initial setup to read difficulty (for bot mode)
initializeGameFromURL();
resizeCanvas(); // Set initial canvas size and draw empty board