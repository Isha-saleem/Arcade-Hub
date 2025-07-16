// src/games/gravity-wave/gravity.js - Gravity Run Game with Wave Visuals

// --- Canvas and Context ---
const canvas = document.getElementById('gravityWaveCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Variables ---
let canvasWidth, canvasHeight;
let gameRunning = false;
let animationFrameId; // For requestAnimationFrame
let lastTime = 0; // For delta time calculation

// --- Game Settings ---
let currentDifficulty = 'easy'; // Default
const DIFFICULTY_SETTINGS = {
    'easy': {
        gameSpeed: 1.5, // Slower
        gravityStrength: 0.2,
        obstacleGapMin: 120,
        obstacleGapMax: 250,
        stuckDuration: 1500, // Longer stuck time
        waveAmplitude: 10, // Smaller waves
        waveFrequency: 0.02 // Less frequent waves
    },
    'hard': {
        gameSpeed: 2.5, // Faster
        gravityStrength: 0.3,
        obstacleGapMin: 80,
        obstacleGapMax: 180,
        stuckDuration: 1000,
        waveAmplitude: 15, // Medium waves
        waveFrequency: 0.03 // More frequent waves
    },
    'difficult': {
        gameSpeed: 3.5, // Even faster
        gravityStrength: 0.4,
        obstacleGapMin: 60,
        obstacleGapMax: 120,
        stuckDuration: 500,
        waveAmplitude: 20, // Larger waves
        waveFrequency: 0.04 // Very frequent waves
    }
};

let GAME_SPEED; // Pixels per frame the world moves left
let GRAVITY_STRENGTH; // How fast player falls when gravity is active
let OBSTACLE_GAP_MIN; // Minimum horizontal space between obstacles
let OBSTACLE_GAP_MAX; // Maximum horizontal space between obstacles
let STUCK_DURATION; // How long player is stuck in a box
let WAVE_AMPLITUDE; // Height of the waves
let WAVE_FREQUENCY; // How many waves per screen

const JUMP_VELOCITY = -8; // Initial vertical speed when gravity flips
const LAND_HEIGHT_PERCENT = 0.2; // Percentage of canvas height for land areas
const PLAYER_SIZE = 20;
const OBSTACLE_WIDTH = 40; // Width of boxes/pillars
const COIN_SIZE = 15;

// --- Player Object ---
let player = {
    x: 100, // Fixed horizontal position
    y: 0,   // Vertical position, depends on current land
    vy: 0,  // Vertical velocity
    onGround: true,
    currentGravity: 'down', // 'down' or 'up'
    color: '#FFD700', // Gold
    isStuck: false, // For 'box' obstacle
    stuckTimer: 0
};

// --- Game Elements (Obstacles & Coins) ---
let obstacles = []; // Stores {x, y, width, height, type: 'space'|'box'|'coin', side: 'top'|'bottom'}
let coinsCollected = 0;
let score = 0; // Based on distance run

// --- Wave Animation ---
let waveOffset = 0; // Horizontal offset for wave animation

// --- Keyboard Input ---
const keysPressed = {}; // To track spacebar/click for gravity flip

// --- Utility Functions ---

/**
 * Resizes the canvas to fit its container and updates game dimensions.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Adjust player's initial Y based on new canvas height
    if (player.currentGravity === 'down') {
        player.y = canvasHeight * (1 - LAND_HEIGHT_PERCENT) - PLAYER_SIZE / 2; // On bottom land
    } else {
        player.y = canvasHeight * LAND_HEIGHT_PERCENT + PLAYER_SIZE / 2; // On top land (after flip)
    }

    if (!gameRunning) {
        drawGame(); // Draw initial "Click or Space to Start" state
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Space to Start', canvasWidth / 2, canvasHeight / 2);
    }
}

/**
 * Draws the land areas at the top and bottom with a wavy pattern.
 */
function drawLand() {
    const landHeight = canvasHeight * LAND_HEIGHT_PERCENT;
    const waveLength = canvasWidth / 2; // Roughly 2 waves across the screen

    // Bottom Land
    ctx.fillStyle = '#228B22'; // Forest Green
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight - landHeight);
    for (let i = 0; i <= canvasWidth; i++) {
        const yOffset = Math.sin((i + waveOffset) * WAVE_FREQUENCY) * WAVE_AMPLITUDE;
        ctx.lineTo(i, canvasHeight - landHeight + yOffset);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Land
    ctx.beginPath();
    ctx.moveTo(0, landHeight);
    for (let i = 0; i <= canvasWidth; i++) {
        const yOffset = Math.sin((i + waveOffset) * WAVE_FREQUENCY) * WAVE_AMPLITUDE;
        ctx.lineTo(i, landHeight - yOffset); // Subtract for top wave
    }
    ctx.lineTo(canvasWidth, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Draws the player character.
 */
function drawPlayer() {
    ctx.beginPath();
    // Draw player as a square for now, can be a simple shape or emoji later
    const playerDrawX = player.x - PLAYER_SIZE / 2;
    const playerDrawY = player.y - PLAYER_SIZE / 2;
    ctx.roundRect(playerDrawX, playerDrawY, PLAYER_SIZE, PLAYER_SIZE, 5); // Rounded square
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // If stuck, make it invisible (or semi-transparent)
    if (player.isStuck) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Faint outline
        ctx.fill();
    }
}

/**
 * Draws an obstacle (box, space indicator, or coin).
 * @param {object} obstacle - The obstacle object.
 */
function drawObstacle(obstacle) {
    ctx.beginPath();
    if (obstacle.type === 'box') {
        ctx.fillStyle = '#8B4513'; // Saddle Brown
        ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5);
        ctx.fill();
        ctx.strokeStyle = '#5A2C0A';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else if (obstacle.type === 'space') {
        // Spaces are gaps, not drawn directly.
        // We can draw a subtle indicator if needed for debugging/clarity
        // ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        // ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else if (obstacle.type === 'coin') {
        ctx.arc(obstacle.x + COIN_SIZE / 2, obstacle.y + COIN_SIZE / 2, COIN_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Draw a "$" symbol
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', obstacle.x + COIN_SIZE / 2, obstacle.y + COIN_SIZE / 2);
    }
}

/**
 * Draws all game elements.
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas
    drawLand();

    obstacles.forEach(drawObstacle);
    drawPlayer();

    // Display Score and Coins
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
    ctx.fillText(`Coins: ${coinsCollected}`, 20, 60);
    ctx.textAlign = 'right';
    ctx.fillText(`Difficulty: ${currentDifficulty.toUpperCase()}`, canvasWidth - 20, 30);


    // Game Over message
    if (!gameRunning && player.x === -1) { // Sentinel for Game Over
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click or Space to Restart', canvasWidth / 2, canvasHeight / 2 + 30);
    }
}

// --- Game Logic Functions ---

/**
 * Initializes the game state based on current difficulty.
 */
function initGame() {
    // Apply difficulty settings
    GAME_SPEED = DIFFICULTY_SETTINGS[currentDifficulty].gameSpeed;
    GRAVITY_STRENGTH = DIFFICULTY_SETTINGS[currentDifficulty].gravityStrength;
    OBSTACLE_GAP_MIN = DIFFICULTY_SETTINGS[currentDifficulty].obstacleGapMin;
    OBSTACLE_GAP_MAX = DIFFICULTY_SETTINGS[currentDifficulty].obstacleGapMax;
    STUCK_DURATION = DIFFICULTY_SETTINGS[currentDifficulty].stuckDuration;
    WAVE_AMPLITUDE = DIFFICULTY_SETTINGS[currentDifficulty].waveAmplitude;
    WAVE_FREQUENCY = DIFFICULTY_SETTINGS[currentDifficulty].waveFrequency;


    player.x = 100;
    player.y = canvasHeight * (1 - LAND_HEIGHT_PERCENT) - PLAYER_SIZE / 2; // Start on bottom land
    player.vy = 0;
    player.onGround = true;
    player.currentGravity = 'down';
    player.isStuck = false;
    player.stuckTimer = 0;

    obstacles = [];
    coinsCollected = 0;
    score = 0;
    waveOffset = 0; // Reset wave offset

    // Generate initial obstacles to fill screen
    let currentX = canvasWidth + 50; // Start off-screen
    while (currentX < canvasWidth * 2) { // Generate enough to fill two screens
        generateNextObstacle(currentX);
        currentX = obstacles[obstacles.length - 1].x + obstacles[obstacles.length - 1].width +
                    (OBSTACLE_GAP_MIN + Math.random() * (OBSTACLE_GAP_MAX - OBSTACLE_GAP_MIN));
    }
}

/**
 * Generates the next obstacle in the sequence.
 * @param {number} startX - The X position where the new obstacle should start.
 */
function generateNextObstacle(startX) {
    const landHeight = canvasHeight * LAND_HEIGHT_PERCENT;
    const gameAreaHeight = canvasHeight - (2 * landHeight); // Space between lands

    // Randomly pick top or bottom land for the obstacle
    const obstacleSide = Math.random() < 0.5 ? 'top' : 'bottom';

    // Randomly pick obstacle type
    const obstacleType = ['space', 'box', 'coin'][Math.floor(Math.random() * 3)];
    let obstacleY, obstacleHeight;

    if (obstacleType === 'space') {
        obstacleHeight = PLAYER_SIZE * 2; // Just a visual height for the gap area
        if (obstacleSide === 'bottom') {
            obstacleY = canvasHeight - landHeight - obstacleHeight;
        } else { // top
            obstacleY = landHeight;
        }
    } else if (obstacleType === 'box') {
        obstacleHeight = PLAYER_SIZE; // Box is player's height
        if (obstacleSide === 'bottom') {
            obstacleY = canvasHeight - landHeight - obstacleHeight;
        } else { // top
            obstacleY = landHeight;
        }
    } else if (obstacleType === 'coin') {
        obstacleHeight = COIN_SIZE;
        // Coins can be placed in the middle area or near land edges
        if (Math.random() < 0.5) { // Near current land
            if (obstacleSide === 'bottom') {
                obstacleY = canvasHeight - landHeight - obstacleHeight - (Math.random() * 50);
            } else { // top
                obstacleY = landHeight + (Math.random() * 50);
            }
        } else { // In the middle of the screen (requires gravity flip to reach)
            obstacleY = landHeight + (gameAreaHeight / 2) - (COIN_SIZE / 2) + (Math.random() * 50 - 25); // Randomize slightly
        }
    }

    obstacles.push({
        x: startX,
        y: obstacleY,
        width: OBSTACLE_WIDTH,
        height: obstacleHeight,
        type: obstacleType,
        side: obstacleSide // Which land it's associated with
    });
}

/**
 * Handles the gravity flip (jump) action.
 */
function flipGravity() {
    if (!gameRunning || player.isStuck) return;

    player.onGround = false; // Player is now in the air
    player.vy = (player.currentGravity === 'down') ? JUMP_VELOCITY : -JUMP_VELOCITY; // Apply opposite jump velocity
    player.currentGravity = (player.currentGravity === 'down') ? 'up' : 'down'; // Flip gravity direction
}

/**
 * Updates the game state (player movement, obstacle movement, collisions).
 * @param {number} deltaTime - Time elapsed since last update in milliseconds.
 */
function updateGame(deltaTime) {
    if (!gameRunning) return;

    // Update stuck timer
    if (player.isStuck) {
        player.stuckTimer += deltaTime;
        if (player.stuckTimer >= STUCK_DURATION) {
            player.isStuck = false;
            player.stuckTimer = 0;
        }
        // If stuck, player doesn't move horizontally or vertically
        player.vy = 0;
        return; // Skip other updates if stuck
    }

    // Apply gravity to player
    if (!player.onGround) {
        player.vy += (player.currentGravity === 'down' ? GRAVITY_STRENGTH : -GRAVITY_STRENGTH);
    }

    // Update player vertical position
    player.y += player.vy;

    // Check for landing on ground
    const landHeight = canvasHeight * LAND_HEIGHT_PERCENT;
    if (player.currentGravity === 'down') {
        // Check bottom land, considering wave offset
        const groundY = canvasHeight - landHeight + Math.sin((player.x + waveOffset) * WAVE_FREQUENCY) * WAVE_AMPLITUDE;
        if (player.y + PLAYER_SIZE / 2 >= groundY) {
            player.y = groundY - PLAYER_SIZE / 2;
            player.vy = 0;
            player.onGround = true;
        }
    } else { // currentGravity === 'up'
        // Check top land, considering wave offset
        const ceilingY = landHeight - Math.sin((player.x + waveOffset) * WAVE_FREQUENCY) * WAVE_AMPLITUDE;
        if (player.y - PLAYER_SIZE / 2 <= ceilingY) {
            player.y = ceilingY + PLAYER_SIZE / 2;
            player.vy = 0;
            player.onGround = true;
        }
    }

    // Move obstacles to the left
    obstacles.forEach(obstacle => {
        obstacle.x -= GAME_SPEED;
    });

    // Update wave offset for continuous animation
    waveOffset -= GAME_SPEED;


    // Remove off-screen obstacles and generate new ones
    if (obstacles.length > 0 && obstacles[0].x + obstacles[0].width < 0) {
        obstacles.shift(); // Remove the first obstacle
    }
    // Generate new obstacle when the last one is far enough
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvasWidth - OBSTACLE_GAP_MAX) {
        const lastObstacleX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x + obstacles[obstacles.length - 1].width : canvasWidth;
        generateNextObstacle(lastObstacleX + OBSTACLE_GAP_MIN + Math.random() * (OBSTACLE_GAP_MAX - OBSTACLE_GAP_MIN));
    }

    // --- Collision Detection with Obstacles ---
    obstacles.forEach(obstacle => {
        // Player bounding box for collision
        const playerLeft = player.x - PLAYER_SIZE / 2;
        const playerRight = player.x + PLAYER_SIZE / 2;
        const playerTop = player.y - PLAYER_SIZE / 2;
        const playerBottom = player.y + PLAYER_SIZE / 2;

        // Obstacle bounding box
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + obstacle.height;

        // Check for overlap
        if (playerRight > obstacleLeft && playerLeft < obstacleRight &&
            playerBottom > obstacleTop && playerTop < obstacleBottom) {

            // Collision detected!
            if (obstacle.type === 'space') {
                // If player is in a 'space' obstacle and not on the correct land, it's game over
                const onBottomLand = player.y + PLAYER_SIZE / 2 >= canvasHeight * (1 - LAND_HEIGHT_PERCENT) - 5; // Small buffer
                const onTopLand = player.y - PLAYER_SIZE / 2 <= canvasHeight * LAND_HEIGHT_PERCENT + 5; // Small buffer

                // Check if player is *actually* on the land it should be on
                const playerOnExpectedLand = (obstacle.side === 'bottom' && onBottomLand) || (obstacle.side === 'top' && onTopLand);

                if (!playerOnExpectedLand) {
                     endGame('Fell into a space!');
                }
                // If player is on the correct land, they successfully avoided the space
            } else if (obstacle.type === 'box') {
                // Hit a box, get stuck
                if (!player.isStuck) { // Only apply stuck effect once per box
                    player.isStuck = true;
                    player.stuckTimer = 0;
                    // Move player slightly back to show they hit it
                    player.x -= GAME_SPEED * 5; // Push back a bit
                }
            } else if (obstacle.type === 'coin') {
                coinsCollected++;
                // Remove collected coin
                obstacles = obstacles.filter(o => o !== obstacle);
            }
        }
    });

    score += GAME_SPEED / 60; // Increase score based on distance run (per second)
}

/**
 * The main game loop.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    updateGame(deltaTime);
    drawGame();

    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Starts the game.
 */
function startGame() {
    if (gameRunning) return; // Prevent starting multiple loops

    // Remove the click listener once game starts
    canvas.removeEventListener('click', handleCanvasClick);

    initGame();
    gameRunning = true;
    lastTime = performance.now(); // Initialize lastTime for accurate delta
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Ends the game and displays a message.
 * @param {string} message - The message to display at game over.
 */
function endGame(message) {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId); // Stop the game loop
    player.x = -1; // Sentinel for Game Over state for drawing
    drawGame(); // Draw final state with game over message
    console.log(message);
    // Re-enable click to start for next game
    canvas.addEventListener('click', handleCanvasClick);
    window.removeEventListener('keydown', handleSpacebar); // Remove spacebar listener
}

/**
 * Handles the initial click/spacebar to start the game or flip gravity.
 */
function handleCanvasClick() {
    if (!gameRunning) {
        startGame();
    } else {
        flipGravity();
    }
}

/**
 * Handles spacebar keydown for gravity flip.
 */
function handleSpacebar(event) {
    if (event.key === ' ' || event.key === 'Spacebar') {
        if (!gameRunning) {
            startGame();
        } else {
            flipGravity();
        }
        event.preventDefault(); // Prevent default browser scrolling
    }
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
    // Settings will be applied in initGame()
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize

// Initial setup based on URL parameters
initializeGameFromURL();

// Add initial click listener to start the game (and subsequent gravity flips)
canvas.addEventListener('click', handleCanvasClick);

// Keyboard input listener for spacebar
window.addEventListener('keydown', handleSpacebar);

// Initial call to set up canvas size and draw initial "Click or Space to Start" state
resizeCanvas();