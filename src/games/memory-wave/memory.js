// src/games/memory-wave/memory.js - Card Matching Game

// --- Canvas and Context ---
const canvas = document.getElementById('memoryWaveCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Variables ---
let canvasWidth, canvasHeight;
let gameRunning = false;
let animationFrameId; // For requestAnimationFrame

// --- Game Settings ---
let currentDifficulty = 'easy'; // Default
const DIFFICULTY_SETTINGS = {
    'easy': {
        gridSize: 4, // 4x4 grid (8 pairs)
        flipDelay: 1000, // How long cards stay flipped (ms)
        maxWrongAttempts: Infinity // No limit for easy
    },
    'hard': {
        gridSize: 6, // 6x6 grid (18 pairs)
        flipDelay: 800,
        maxWrongAttempts: 10 // 10 wrong attempts
    },
    'difficult': {
        gridSize: 8, // 8x8 grid (32 pairs)
        flipDelay: 600,
        maxWrongAttempts: 5 // 5 wrong attempts
    }
};

let gridSize = 4; // e.g., 4x4, 6x6, 8x8
let cardSize; // Calculated dynamically
let padding; // Calculated dynamically

let cards = []; // Array of card objects: {id, image, isFlipped, isMatched, x, y, size}
let flippedCards = []; // Stores up to 2 currently flipped cards
let matchedPairs = 0;
let totalPairs; // Calculated based on gridSize

let wrongAttempts = 0;
let maxWrongAttempts = Infinity; // Set by difficulty

// --- Game Assets (Emojis for card faces) ---
const CARD_EMOJIS = [
    '🍎', '🍌', '🍇', '🍓', '🍍', '🍊', '🍋', '🍉',
    '🍒', '🍑', '🥝', '🥭', '🍐', '🥥', '🥑', '🍆',
    '🥕', '🥔', '🌽', '🌶️', '🥦', '🍄', '🌰', '🥜',
    '🍞', '🥐', '🥖', '🥨', '🧀', '🥚', '🍳', '🥓'
];
let cardFaces = []; // The actual emojis used for the current game

// --- Utility Functions ---

/**
 * Resizes the canvas to fit its container and updates game dimensions.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Recalculate card size and positions
    calculateCardLayout();
    drawGame(); // Redraw game elements after resize
}

/**
 * Calculates card size and positions based on current canvas and grid size.
 */
function calculateCardLayout() {
    const minDim = Math.min(canvasWidth, canvasHeight);
    // Adjust padding and card size dynamically
    padding = minDim * 0.02; // 2% of min dimension
    cardSize = (minDim - (padding * (gridSize + 1))) / gridSize;

    cards.forEach(card => {
        card.x = padding + (card.col * (cardSize + padding));
        card.y = padding + (card.row * (cardSize + padding));
        card.size = cardSize;
    });
}

/**
 * Draws a single card.
 * @param {object} card - The card object to draw.
 */
function drawCard(card) {
    ctx.beginPath();
    ctx.roundRect(card.x, card.y, card.size, card.size, 10); // Rounded corners

    if (card.isFlipped || card.isMatched) {
        // Draw the card face
        ctx.fillStyle = '#ADD8E6'; // Light blue background for flipped/matched
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000'; // Emoji color
        ctx.font = `${card.size * 0.7}px Arial`; // Large font for emoji
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.image, card.x + card.size / 2, card.y + card.size / 2);
    } else {
        // Draw the card back
        ctx.fillStyle = '#4A90E2'; // Blue back
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Optional: Draw a simple pattern on the back
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = `${card.size * 0.4}px Arial`;
        ctx.fillText('?', card.x + card.size / 2, card.y + card.size / 2);
    }
}

/**
 * Draws all game elements.
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas

    cards.forEach(drawCard);

    // Display score/status
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Pairs: ${matchedPairs}/${totalPairs}`, 20, 30);
    ctx.fillText(`Wrong: ${wrongAttempts}/${maxWrongAttempts === Infinity ? '∞' : maxWrongAttempts}`, 20, 60);
    ctx.textAlign = 'right';
    ctx.fillText(`Difficulty: ${currentDifficulty.toUpperCase()}`, canvasWidth - 20, 30);

    // Game Over / Win messages
    if (!gameRunning) {
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click to Restart', canvasWidth / 2, canvasHeight / 2 + 30);
    } else if (matchedPairs === totalPairs) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click to Play Again', canvasWidth / 2, canvasHeight / 2 + 30);
    }
}

// --- Game Logic Functions ---

/**
 * Initializes the game state based on current difficulty.
 */
function initGame() {
    // Reset game state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    wrongAttempts = 0;
    gameRunning = true;

    // Apply difficulty settings
    gridSize = DIFFICULTY_SETTINGS[currentDifficulty].gridSize;
    totalPairs = (gridSize * gridSize) / 2;
    maxWrongAttempts = DIFFICULTY_SETTINGS[currentDifficulty].maxWrongAttempts;

    // Select emojis for this game
    cardFaces = [];
    const availableEmojis = [...CARD_EMOJIS]; // Copy to avoid modifying original
    for (let i = 0; i < totalPairs; i++) {
        const randomIndex = Math.floor(Math.random() * availableEmojis.length);
        cardFaces.push(availableEmojis[randomIndex]);
        availableEmojis.splice(randomIndex, 1); // Remove used emoji
    }

    // Create card pairs and shuffle
    let cardValues = [];
    cardFaces.forEach(face => {
        cardValues.push(face, face); // Each emoji appears twice
    });

    // Shuffle the card values using Fisher-Yates algorithm
    for (let i = cardValues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
    }

    // Populate cards array with positions
    let cardId = 0;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            cards.push({
                id: cardId++,
                image: cardValues.pop(), // Assign a shuffled emoji
                isFlipped: false,
                isMatched: false,
                row: row,
                col: col,
                x: 0, y: 0, size: 0 // Will be calculated by resizeCanvas
            });
        }
    }

    calculateCardLayout(); // Set initial positions and sizes
}

/**
 * Handles clicks on the canvas to flip cards.
 * @param {MouseEvent} event - The click event.
 */
function handleCanvasClick(event) {
    if (!gameRunning || flippedCards.length === 2) return; // Ignore clicks if game over or 2 cards already flipped

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        // Check if click is within card bounds and card is not already flipped/matched
        if (mouseX >= card.x && mouseX <= card.x + card.size &&
            mouseY >= card.y && mouseY <= card.y + card.size &&
            !card.isFlipped && !card.isMatched) {

            card.isFlipped = true;
            flippedCards.push(card);
            drawGame(); // Redraw immediately to show flip

            if (flippedCards.length === 2) {
                // Two cards flipped, check for match after a delay
                setTimeout(checkForMatch, DIFFICULTY_SETTINGS[currentDifficulty].flipDelay);
            }
            return; // Only process one click at a time
        }
    }
}

/**
 * Checks if the two flipped cards are a match.
 */
function checkForMatch() {
    const [card1, card2] = flippedCards;

    if (card1.image === card2.image) {
        // Match!
        card1.isMatched = true;
        card2.isMatched = true;
        matchedPairs++;
    } else {
        // No match, flip them back
        card1.isFlipped = false;
        card2.isFlipped = false;
        wrongAttempts++;
    }

    flippedCards = []; // Clear flipped cards array
    drawGame(); // Redraw to show match/unmatch

    // Check for game end conditions
    if (matchedPairs === totalPairs) {
        gameRunning = false; // Game won
    } else if (maxWrongAttempts !== Infinity && wrongAttempts >= maxWrongAttempts) {
        gameRunning = false; // Game lost due to too many wrong attempts
    }
}

/**
 * The main game loop (not strictly needed for turn-based, but good for continuous updates like timers).
 * For this game, drawing is primarily event-driven.
 */
function gameLoop() {
    // No continuous animation needed for this turn-based game,
    // but keeping the structure for consistency if we add timers later.
    if (gameRunning && matchedPairs !== totalPairs && (maxWrongAttempts === Infinity || wrongAttempts < maxWrongAttempts)) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Starts the game.
 */
function startGame() {
    // Remove the previous click listener if it was for starting the game
    canvas.removeEventListener('click', startGame);

    initGame(); // Initialize game state
    drawGame(); // Draw initial game board
    gameLoop(); // Start the (mostly event-driven) game loop
    canvas.addEventListener('click', handleCanvasClick); // Add click listener for game play
}

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
    // Apply initial settings (gridSize, maxWrongAttempts etc. will be set in initGame)
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize

// Initial setup based on URL parameters
initializeGameFromURL();

// Add initial click listener to start the game
canvas.addEventListener('click', startGame);

// Draw a "Click to Start" message initially
// This needs to be called after canvasWidth/Height are set by resizeCanvas
resizeCanvas(); // Call once to set initial dimensions and draw "Click to Start"
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 24px Inter';
ctx.textAlign = 'center';
ctx.fillText('Click to Start', canvasWidth / 2, canvasHeight / 2);