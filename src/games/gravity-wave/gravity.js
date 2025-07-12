
// --- Canvas and Context ---
const canvas = document.getElementById('gravityWaveCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Variables ---
let canvasWidth, canvasHeight;
let gameRunning = false;
let animationFrameId; // To store the requestAnimationFrame ID for stopping the loop

// --- Player Ship Properties ---
const SHIP_RADIUS = 8;
const THRUST_ACCELERATION = 0.0005; // How much acceleration per frame from thrust (adjusted for deltaTime)
const MAX_SPEED = 5; // Cap player speed to prevent going too fast
const DRAG_FACTOR = 0.995; // Reduces velocity slightly each frame (simulates space drag)
let player = {
    x: 0,
    y: 0,
    vx: 0, // velocity x
    vy: 0, // velocity y
    radius: SHIP_RADIUS,
    color: '#FFD700' // Gold color for the ship
};

// --- Celestial Body (Planet) Properties ---
const BASE_GRAVITY_CONSTANT = 0.5; // Base gravity strength
const PLANET_MIN_RADIUS = 20;
const PLANET_MAX_RADIUS = 60;
const PLANET_MASS_FACTOR = 1000; // Mass is radius * PLANET_MASS_FACTOR
let planets = [];

// --- Game Loop Control ---
let lastTime = 0;
const MAX_DELTA_TIME = 100; // Cap delta time to prevent physics glitches on lag spikes

// --- Keyboard Input ---
const keysPressed = {}; // Stores which keys are currently held down

// --- Level Progression ---
let level = 1;
let levelStartTime = 0;
const BASE_LEVEL_DURATION_SECONDS = 15; // Time to survive per level
let levelDurationSeconds = BASE_LEVEL_DURATION_SECONDS;
let levelCompleteMessageTime = 0; // Timestamp for displaying "Level Complete!"
const MESSAGE_DISPLAY_DURATION = 2000; // How long to show "Level Complete!" message (ms)

// --- Utility Functions ---

/**
 * Resizes the canvas to fit its container and updates game dimensions.
 * Ensures responsiveness.
 */
function resizeCanvas() {
    canvasWidth = canvas.offsetWidth;
    canvasHeight = canvas.offsetHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Re-initialize game elements if game is not running, to center them
    if (!gameRunning) {
        // Only draw initial state and message if game is not active
        initGame(); // Set player position etc. without starting loop
        drawGame(); // Draw initial state
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvasWidth / 2, canvasHeight / 2);
    }
}

/**
 * Generates a random starfield background.
 * @param {number} numStars - Number of stars to generate.
 */
function drawStarfield(numStars = 100) {
    for (let i = 0; i < numStars; i++) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        const radius = Math.random() * 1.5; // Small stars
        const opacity = Math.random();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
    }
}

/**
 * Draws the player ship.
 */
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#FFA500'; // Orange border
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Draws a celestial body (planet).
 * @param {object} planet - The planet object with x, y, radius, and color.
 */
function drawPlanet(planet) {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();
    ctx.strokeStyle = '#555'; // Dark border
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optional: Draw a subtle gravity influence circle
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius * 2, 0, Math.PI * 2); // Larger radius for influence
    ctx.strokeStyle = `rgba(0, 200, 200, 0.2)`; // Teal/Cyan translucent
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * Draws all game elements.
 */
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas
    drawStarfield(100); // Redraw stars every frame (can optimize by drawing once to offscreen canvas)

    planets.forEach(drawPlanet);
    drawPlayer();

    // Display Level and Time
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${level}`, 20, 30);

    if (gameRunning) {
        const timeLeft = Math.max(0, levelDurationSeconds - Math.floor((performance.now() - levelStartTime) / 1000));
        ctx.textAlign = 'right';
        ctx.fillText(`Time: ${timeLeft}s`, canvasWidth - 20, 30);
    }

    // Display Game Over or Level Complete messages
    if (!gameRunning) {
        ctx.fillStyle = '#FF4444'; // Red for game over
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click to Restart', canvasWidth / 2, canvasHeight / 2 + 30);
    } else if (levelCompleteMessageTime > 0 && performance.now() - levelCompleteMessageTime < MESSAGE_DISPLAY_DURATION) {
        ctx.fillStyle = '#00FF00'; // Green for level complete
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvasWidth / 2, canvasHeight / 2);
    }
}

// --- Game Logic Functions ---

/**
 * Initializes or resets the game state for a new level.
 * @param {number} currentLevel - The level to initialize.
 */
function startLevel(currentLevel) {
    level = currentLevel;
    levelStartTime = performance.now();
    levelCompleteMessageTime = 0; // Reset message display

    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
    player.vx = 0;
    player.vy = 0;

    planets = [];
    const numPlanets = Math.min(10, 3 + level); // More planets for higher levels, max 10
    const gravityConstant = BASE_GRAVITY_CONSTANT * (1 + (level - 1) * 0.1); // Stronger gravity
    levelDurationSeconds = BASE_LEVEL_DURATION_SECONDS + (level - 1) * 5; // Longer survival time

    for (let i = 0; i < numPlanets; i++) {
        const radius = PLANET_MIN_RADIUS + Math.random() * (PLANET_MAX_RADIUS - PLANET_MIN_RADIUS);
        const mass = radius * PLANET_MASS_FACTOR; // Mass proportional to radius
        let newPlanetX, newPlanetY;
        let collisionDetected;

        // Ensure new planet doesn't overlap with player or existing planets
        do {
            collisionDetected = false;
            newPlanetX = Math.random() * (canvasWidth - 2 * radius) + radius;
            newPlanetY = Math.random() * (canvasHeight - 2 * radius) + radius;

            // Check against player start position
            const dxPlayer = newPlanetX - player.x;
            const dyPlayer = newPlanetY - player.y;
            const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);
            if (distPlayer < player.radius + radius + 50) { // Keep a good distance from player start
                collisionDetected = true;
                continue;
            }

            // Check against existing planets
            for (const existingPlanet of planets) {
                const dx = newPlanetX - existingPlanet.x;
                const dy = newPlanetY - existingPlanet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < radius + existingPlanet.radius + 10) { // Add buffer
                    collisionDetected = true;
                    break;
                }
            }
        } while (collisionDetected);

        planets.push({
            x: newPlanetX,
            y: newPlanetY,
            radius: radius,
            mass: mass,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random vibrant color
            gravityConstant: gravityConstant // Each planet uses the level's gravity constant
        });
    }
}

/**
 * Applies gravitational forces to the player ship from all planets.
 * @param {number} deltaTime - Time elapsed since last update in milliseconds.
 */
function applyGravity(deltaTime) {
    planets.forEach(planet => {
        const dx = planet.x - player.x;
        const dy = planet.y - player.y;
        const distanceSq = dx * dx + dy * dy; // Distance squared
        const distance = Math.sqrt(distanceSq);

        // Prevent division by zero or extremely large forces when very close
        if (distance < player.radius + planet.radius) {
            // Collision handled elsewhere, but prevent extreme force here
            return;
        }

        // Calculate gravitational force magnitude
        const forceMagnitude = planet.gravityConstant * (planet.mass / distanceSq);

        // Calculate force components
        const forceX = forceMagnitude * (dx / distance);
        const forceY = forceMagnitude * (dy / distance);

        // Apply force as acceleration (F = ma, so a = F/m_player, assuming m_player = 1 for simplicity)
        player.vx += forceX * (deltaTime / 1000); // Convert force to acceleration over time
        player.vy += forceY * (deltaTime / 1000);
    });
}

/**
 * Updates the game state (physics, collisions).
 * @param {number} deltaTime - Time elapsed since last update in milliseconds.
 * @param {DOMHighResTimeStamp} currentTime - The current time for level duration check.
 */
function updateGame(deltaTime, currentTime) {
    if (!gameRunning) return;

    // Apply thrust based on arrow keys
    if (keysPressed['ArrowUp']) {
        player.vy -= THRUST_ACCELERATION * deltaTime;
    }
    if (keysPressed['ArrowDown']) {
        player.vy += THRUST_ACCELERATION * deltaTime;
    }
    if (keysPressed['ArrowLeft']) {
        player.vx -= THRUST_ACCELERATION * deltaTime;
    }
    if (keysPressed['ArrowRight']) {
        player.vx += THRUST_ACCELERATION * deltaTime;
    }

    // Apply drag
    player.vx *= DRAG_FACTOR;
    player.vy *= DRAG_FACTOR;

    applyGravity(deltaTime);

    // Cap velocity
    const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (currentSpeed > MAX_SPEED) {
        player.vx = (player.vx / currentSpeed) * MAX_SPEED;
        player.vy = (player.vy / currentSpeed) * MAX_SPEED;
    }

    // Update player position based on velocity
    player.x += player.vx;
    player.y += player.vy;

    // --- Boundary Checks / Wrap-around ---
    // If player goes off screen, wrap around to the other side
    if (player.x < 0) player.x = canvasWidth;
    if (player.x > canvasWidth) player.x = 0;
    if (player.y < 0) player.y = canvasHeight;
    if (player.y > canvasHeight) player.y = 0;

    // --- Collision Detection ---
    for (const planet of planets) {
        const dx = player.x - planet.x;
        const dy = player.y - planet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + planet.radius) {
            endGame('Crashed into a celestial body!');
            return; // Exit update loop if game over
        }
    }

    // --- Level Completion Check ---
    const elapsedTime = (currentTime - levelStartTime) / 1000; // in seconds
    if (elapsedTime >= levelDurationSeconds) {
        levelCompleteMessageTime = currentTime; // Set timestamp for message display
        gameRunning = false; // Pause game for message
        cancelAnimationFrame(animationFrameId); // Stop current loop
        setTimeout(() => {
            level++;
            startGame(); // Start next level
        }, MESSAGE_DISPLAY_DURATION); // Wait for message to clear
    }
}

/**
 * The main game loop.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
    if (!gameRunning) return; // Ensure game is still running

    const deltaTime = Math.min(currentTime - lastTime, MAX_DELTA_TIME); // Cap delta time
    lastTime = currentTime;

    updateGame(deltaTime, currentTime); // Pass currentTime for level check
    drawGame();

    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Starts the game (or next level).
 */
function startGame() {
    if (gameRunning) return; // Prevent starting multiple loops

    startLevel(level); // Initialize for the current level
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
    // Reset level for next game
    level = 1;
    // player.x = -1; // No longer needed as initGame will reset position
    drawGame(); // Draw final state with game over message
    console.log(message);
    // Re-enable click to start for next game
    canvas.addEventListener('click', handleCanvasClick);
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize

// Initial click listener to start the game
canvas.addEventListener('click', handleCanvasClick); // This will call startGame()

// Keyboard input listeners
window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        keysPressed[event.key] = true;
        event.preventDefault(); // Prevent default browser scrolling
    }
});

window.addEventListener('keyup', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        keysPressed[event.key] = false;
    }
});

// Initial call to set up canvas size and draw initial "Click to Start" state
resizeCanvas();
