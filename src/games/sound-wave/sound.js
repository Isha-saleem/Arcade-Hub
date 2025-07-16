// src/games/sound-wave/sound.js - Sound Wave Game (Under Construction)

const canvas = document.getElementById('soundWaveCanvas');
const ctx = canvas.getContext('2d');

let canvasWidth, canvasHeight;
let currentDifficulty = 'easy'; // Default

// --- Difficulty Settings (Placeholder) ---
const DIFFICULTY_SETTINGS = {
    'easy': { message: 'Easy Mode: Game Under Construction!' },
    'hard': { message: 'Hard Mode: Game Under Construction!' },
    'difficult': { message: 'Difficult Mode: Game Under Construction!' }
};

/**
 * Reads difficulty from URL and applies settings.
 */
function initializeGameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const difficultyParam = urlParams.get('difficulty');

    if (difficultyParam && DIFFICULTY_SETTINGS[difficultyParam]) {
        currentDifficulty = difficultyParam;
    } else {
        currentDifficulty = 'easy'; // Default to easy if param is missing or invalid
    }
}

/**
 * Resizes the canvas and redraws the placeholder message.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    drawGame();
}

/**
 * Draws the placeholder message.
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sound Wave', canvasWidth / 2, canvasHeight / 2 - 40);
    ctx.font = 'bold 18px Inter';
    ctx.fillText(DIFFICULTY_SETTINGS[currentDifficulty].message, canvasWidth / 2, canvasHeight / 2);
    ctx.font = '14px Inter';
    ctx.fillText('Check back later for full gameplay!', canvasWidth / 2, canvasHeight / 2 + 40);
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas);

initializeGameFromURL(); // Read difficulty first
resizeCanvas(); // Set initial size and draw
