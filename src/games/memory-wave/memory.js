
// --- Game State Variables ---
const canvas = document.getElementById('memoryWaveCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions (will be responsive)
let canvasWidth;
let canvasHeight;

// Colors for the four memory buttons/pads
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00']; // Red, Green, Blue, Yellow
const LIGHT_COLORS = ['#FF6666', '#66FF66', '#6666FF', '#FFFF66']; // Lighter versions for active state

// Array to store the sequence the game generates
let gameSequence = [];
// Array to store the player's input sequence
let playerSequence = [];
// Current round number
let round = 1;
// Index of the current step in the sequence being played/checked
let sequenceIndex = 0;
// Is the game currently playing the sequence to the player?
let isPlayingSequence = false;
// Is it the player's turn to input?
let isPlayerTurn = false;
// Timeout ID for sequence display to control timing
let sequenceTimeout;
// Time between each light-up in the sequence (milliseconds)
const SEQUENCE_SPEED_MS = 600;
// Time a light stays lit (milliseconds)
const LIGHT_DURATION_MS = 300;

// Button dimensions and positions (relative to canvas size)
// We'll use a grid of 2x2 for simplicity
const BUTTON_SIZE_FACTOR = 0.45; // Size relative to min(width, height)
let buttonPositions = []; // Will store {x, y, size, colorIndex} for each button

// --- Utility Functions ---

/**
 * Resizes the canvas to fit its container and updates game dimensions.
 * This ensures responsiveness.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Calculate button positions based on new canvas size
    const minDim = Math.min(canvasWidth, canvasHeight);
    const buttonSize = minDim * BUTTON_SIZE_FACTOR;
    const padding = (minDim - (buttonSize * 2)) / 3; // Space between buttons and edges

    buttonPositions = [
        { x: padding, y: padding, size: buttonSize, colorIndex: 0 }, // Top-left (Red)
        { x: padding * 2 + buttonSize, y: padding, size: buttonSize, colorIndex: 1 }, // Top-right (Green)
        { x: padding, y: padding * 2 + buttonSize, size: buttonSize, colorIndex: 2 }, // Bottom-left (Blue)
        { x: padding * 2 + buttonSize, y: padding * 2 + buttonSize, size: buttonSize, colorIndex: 3 } // Bottom-right (Yellow)
    ];

    drawGame(); // Redraw game elements after resize
}

/**
 * Draws a single memory button.
 * @param {number} x - X coordinate of the top-left corner.
 * @param {number} y - Y coordinate of the top-left corner.
 * @param {number} size - Side length of the square button.
 * @param {string} color - Fill color of the button.
 * @param {boolean} [isActive=false] - If true, draws with a lighter color and glow.
 */
function drawButton(x, y, size, color, isActive = false) {
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 15); // Rounded rectangle
    ctx.fillStyle = isActive ? LIGHT_COLORS[COLORS.indexOf(color)] : color;
    ctx.fill();
    ctx.strokeStyle = '#333'; // Border color
    ctx.lineWidth = 3;
    ctx.stroke();

    if (isActive) {
        ctx.shadowColor = isActive ? LIGHT_COLORS[COLORS.indexOf(color)] : 'transparent';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        ctx.shadowBlur = 0;
    }
}

/**
 * Draws all game elements (buttons, score, messages).
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas

    // Draw each button
    buttonPositions.forEach(button => {
        drawButton(button.x, button.y, button.size, COLORS[button.colorIndex]);
    });

    // Display round number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`Round: ${round}`, canvasWidth / 2, 40);

    // Display game messages
    if (isPlayingSequence) {
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Watch the sequence...', canvasWidth / 2, canvasHeight - 20);
    } else if (isPlayerTurn) {
        ctx.font = 'bold 18px Inter';
        ctx.fillText('Your turn!', canvasWidth / 2, canvasHeight - 20);
    }
}

// --- Game Logic Functions ---

/**
 * Generates a new random sequence for the current round.
 * Adds one new random color index to the existing sequence.
 */
function generateSequence() {
    gameSequence.push(Math.floor(Math.random() * COLORS.length));
}

/**
 * Plays the generated sequence to the player by lighting up buttons.
 */
function playSequence() {
    isPlayingSequence = true;
    isPlayerTurn = false;
    sequenceIndex = 0;
    playerSequence = []; // Clear player's input for new round
    clearTimeout(sequenceTimeout); // Clear any existing timeouts

    function showNextInSequence() {
        if (sequenceIndex < gameSequence.length) {
            const colorIndex = gameSequence[sequenceIndex];
            // Redraw all buttons, but highlight the current one
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            buttonPositions.forEach(button => {
                drawButton(button.x, button.y, button.size, COLORS[button.colorIndex], button.colorIndex === colorIndex);
            });
            drawGame(); // Redraw text overlays

            // Turn off the light after a short duration
            sequenceTimeout = setTimeout(() => {
                drawGame(); // Redraw to turn off light
                sequenceIndex++;
                sequenceTimeout = setTimeout(showNextInSequence, SEQUENCE_SPEED_MS - LIGHT_DURATION_MS); // Pause before next light
            }, LIGHT_DURATION_MS);
        } else {
            // Sequence finished playing
            isPlayingSequence = false;
            isPlayerTurn = true;
            drawGame(); // Update message to "Your turn!"
        }
    }
    showNextInSequence();
}

/**
 * Handles player clicks on the canvas.
 * @param {MouseEvent} event - The click event.
 */
function handleCanvasClick(event) {
    if (!isPlayerTurn) return; // Only allow clicks during player's turn

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check which button was clicked
    buttonPositions.forEach((button, index) => {
        if (x >= button.x && x <= button.x + button.size &&
            y >= button.y && y <= button.y + button.size) {
            
            // Player clicked this button
            playerSequence.push(button.colorIndex);
            
            // Briefly light up the clicked button
            drawButton(button.x, button.y, button.size, COLORS[button.colorIndex], true);
            setTimeout(() => {
                drawGame(); // Turn off light
            }, LIGHT_DURATION_MS / 2); // Shorter flash for player input

            checkPlayerInput();
        }
    });
}

/**
 * Checks the player's input against the game sequence.
 */
function checkPlayerInput() {
    const currentInputIndex = playerSequence.length - 1;
    if (playerSequence[currentInputIndex] !== gameSequence[currentInputIndex]) {
        // Incorrect input
        endGame('Game Over! You pressed the wrong button.');
        return;
    }

    if (playerSequence.length === gameSequence.length) {
        // Player completed the sequence for the round
        isPlayerTurn = false;
        round++;
        setTimeout(startRound, 1000); // Start next round after a short delay
    }
}

/**
 * Starts a new round of the game.
 */
function startRound() {
    generateSequence();
    playSequence();
}

/**
 * Ends the game and displays a message.
 * @param {string} message - The message to display at game over.
 */
function endGame(message) {
    isPlayerTurn = false;
    isPlayingSequence = false;
    clearTimeout(sequenceTimeout); // Stop any pending sequence displays

    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear everything
    ctx.fillStyle = '#FF4444'; // Red color for game over
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvasWidth / 2, canvasHeight / 2 - 20);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter';
    ctx.fillText(`You reached Round ${round}`, canvasWidth / 2, canvasHeight / 2 + 30);

    // Reset game state after a delay or offer restart button
    setTimeout(() => {
        // For now, just reset. Could add a "Play Again" button later.
        gameSequence = [];
        playerSequence = [];
        round = 1;
        drawGame(); // Draw initial state
        // Optionally, add a start button here
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click to Start', canvasWidth / 2, canvasHeight / 2 + 80);
        canvas.onclick = startGame; // Re-enable click to start
    }, 3000);
}

/**
 * Initializes and starts the game.
 */
function startGame() {
    canvas.onclick = handleCanvasClick; // Change click handler to game logic
    gameSequence = [];
    playerSequence = [];
    round = 1;
    startRound();
}


// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize

// Initial call to set up canvas size and draw initial state
resizeCanvas();

// Add initial click listener to start the game
canvas.onclick = startGame;

// Draw a "Click to Start" message initially
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 24px Inter';
ctx.textAlign = 'center';
ctx.fillText('Click to Start', canvasWidth / 2, canvasHeight / 2);
