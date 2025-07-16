// src/games/tic-tac-toe/tic-tac-toe.js - Tic-Tac-Toe Game with Minimax Bot

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
 * Checks if a given player has won on the current board state.
 * @param {Array<string>} currentBoard - The board array to check.
 * @param {string} player - The player ('X' or 'O') to check for a win.
 * @returns {boolean} - True if the player has won, false otherwise.
 */
function checkWin(currentBoard, player) {
    return winConditions.some(combination => {
        const [a, b, c] = combination;
        return currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player;
    });
}

/**
 * Checks if the game is a draw on the current board state.
 * @param {Array<string>} currentBoard - The board array to check.
 * @returns {boolean} - True if the board is full and no winner, false otherwise.
 */
function checkDraw(currentBoard) {
    return currentBoard.every(cell => cell !== '');
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
 * Handles a player's move (or bot's move).
 * @param {number} index - The index of the cell clicked/chosen.
 */
function handlePlayerMove(index) {
    if (!gameActive || board[index] !== '') {
        return; // Ignore if game not active or cell already taken
    }

    board[index] = currentPlayer;
    drawGame(); // Update canvas

    if (checkWin(board, currentPlayer)) {
        updateMessage(`${currentPlayer} Wins!`, currentPlayer === 'X' ? 'text-red-400' : 'text-blue-400');
        endGame();
        return;
    }

    if (checkDraw(board)) {
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
        // Hard bot: uses Minimax algorithm
        moveIndex = findBestMoveMinimax(board, 'O').index;
    }

    if (moveIndex !== -1) {
        handlePlayerMove(moveIndex);
    }
}

// --- Minimax Algorithm ---

/**
 * The Minimax function to determine the best move for the AI.
 * @param {Array<string>} currentBoard - The current state of the board.
 * @param {string} player - The current player for whom to find the best move ('X' or 'O').
 * @returns {object} An object containing the best score and the index of the best move.
 */
function minimax(currentBoard, player) {
    const emptyCells = currentBoard.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);

    // Base cases for recursion:
    // Check for win/loss/draw
    if (checkWin(currentBoard, 'X')) {
        return { score: -10 }; // X (human) wins, bad for O (bot)
    } else if (checkWin(currentBoard, 'O')) {
        return { score: 10 }; // O (bot) wins, good for O
    } else if (emptyCells.length === 0) {
        return { score: 0 }; // Draw
    }

    let moves = []; // To store possible moves and their scores

    // Loop through all empty cells
    for (let i = 0; i < emptyCells.length; i++) {
        const move = {};
        move.index = emptyCells[i]; // Store the original index of the cell

        // Make the move on the board
        currentBoard[emptyCells[i]] = player;

        // Recursively call minimax for the next player
        if (player === 'O') { // If current player is O (maximizer), simulate X's turn
            const result = minimax(currentBoard, 'X');
            move.score = result.score;
        } else { // If current player is X (minimizer), simulate O's turn
            const result = minimax(currentBoard, 'O');
            move.score = result.score;
        }

        // Undo the move
        currentBoard[emptyCells[i]] = '';

        // Push the move and its score to the moves array
        moves.push(move);
    }

    // Evaluate the best move based on the current player (maximizer or minimizer)
    let bestMove;
    if (player === 'O') { // O is the maximizer (wants highest score)
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else { // X is the minimizer (wants lowest score)
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove]; // Return the best move (index and score)
}

/**
 * Finds the best move for the bot using the Minimax algorithm.
 * This function initiates the Minimax process.
 * @param {Array<string>} currentBoard - The current state of the board.
 * @param {string} botPlayer - The player representing the bot ('O' in this case).
 * @returns {object} The best move found by Minimax.
 */
function findBestMoveMinimax(currentBoard, botPlayer) {
    return minimax(currentBoard, botPlayer);
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

    // If bot is 'X' and it's bot's turn, make initial move
    // In our setup, player is X, bot is O, so bot moves only after player's first move
    // If we wanted bot to go first, we'd add logic here to check if currentPlayer is 'O' and makeBotMove()
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
