// src/games/gravity-wave/gravity.js

// --- Canvas and Context ---
const canvas = document.getElementById('gravityWaveCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Variables ---
let canvasWidth, canvasHeight;
let gameRunning = false;
let animationFrameId; // To store the requestAnimationFrame ID for stopping the loop

// --- Player Ship Properties ---
const SHIP_RADIUS = 8;
const THRUST_FORCE = 0.05; // How much acceleration per thrust
const MAX_SPEED = 5; // Cap player speed to prevent going too fast
let player = {
    x: 0,
    y: 0,
    vx: 0, // velocity x
    vy: 0, // velocity y
    radius: SHIP_RADIUS,
    color: '#FFD700' // Gold color for the ship
};

// --- Celestial Body (Planet) Properties ---
const GRAVITY_CONSTANT = 0.5; // Adjust this for stronger/weaker gravity
const PLANET_MIN_RADIUS = 20;
const PLANET_MAX_RADIUS = 60;
const PLANET_MASS_FACTOR = 1000; // Mass is radius * PLANET_MASS_FACTOR
let planets = [];

// --- Game Loop Control ---
let lastTime = 0;
const MAX_DELTA_TIME = 100; // Cap delta time to prevent physics glitches on lag spikes

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
        initGame();
        drawGame(); // Draw initial state
        // Display "Click to Start" message
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

    // Display messages (e.g., Game Over)
    if (!gameRunning && player.x === -1) { // -1 as a sentinel for game over state
        ctx.fillStyle = '#FF4444'; // Red for game over
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Inter';
        ctx.fillText('Click to Restart', canvasWidth / 2, canvasHeight / 2 + 30);
    }
}

// --- Game Logic Functions ---

/**
 * Initializes or resets the game state.
 */
function initGame() {
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
    player.vx = 0;
    player.vy = 0;

    planets = [];
    // Generate a few random planets
    for (let i = 0; i < 3; i++) { // 3 planets for now
        const radius = PLANET_MIN_RADIUS + Math.random() * (PLANET_MAX_RADIUS - PLANET_MIN_RADIUS);
        const mass = radius * PLANET_MASS_FACTOR; // Mass proportional to radius
        planets.push({
            x: Math.random() * (canvasWidth - 2 * radius) + radius,
            y: Math.random() * (canvasHeight - 2 * radius) + radius,
            radius: radius,
            mass: mass,
            color: `hsl(${Math.random() * 360}, 70%, 50%)` // Random vibrant color
        });
    }

    // Ensure player doesn't start on a planet
    let playerCollides;
    do {
        playerCollides = false;
        for (const planet of planets) {
            const dx = player.x - planet.x;
            const dy = player.y - planet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < player.radius + planet.radius + 10) { // Add a small buffer
                player.x = Math.random() * canvasWidth;
                player.y = Math.random() * canvasHeight;
                playerCollides = true;
                break;
            }
        }
    } while (playerCollides);
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
        const forceMagnitude = GRAVITY_CONSTANT * (planet.mass / distanceSq);

        // Calculate force components
        const forceX = forceMagnitude * (dx / distance);
        const forceY = forceMagnitude * (dy / distance);

        // Apply force as acceleration (F = ma, so a = F/m_player, assuming m_player = 1 for simplicity)
        player.vx += forceX * (deltaTime / 1000); // Convert force to acceleration over time
        player.vy += forceY * (deltaTime / 1000);
    });
}

/**
 * Handles player thrust input.
 * @param {MouseEvent} event - The click event.
 */
function handleCanvasClick(event) {
    if (!gameRunning) {
        startGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Calculate direction vector from player to click point
    const dx = clickX - player.x;
    const dy = clickY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return; // Avoid division by zero if clicked exactly on player

    // Normalize the direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Apply thrust in the opposite direction of the click (pushing away from click)
    // Or, apply thrust towards the click point (pulling towards click)
    // Let's go with pushing away from the click point for a "repulsor" feel.
    player.vx -= dirX * THRUST_FORCE;
    player.vy -= dirY * THRUST_FORCE;

    // Cap velocity
    const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (currentSpeed > MAX_SPEED) {
        player.vx = (player.vx / currentSpeed) * MAX_SPEED;
        player.vy = (player.vy / currentSpeed) * MAX_SPEED;
    }
}


/**
 * Updates the game state (physics, collisions).
 * @param {number} deltaTime - Time elapsed since last update in milliseconds.
 */
function updateGame(deltaTime) {
    if (!gameRunning) return;

    applyGravity(deltaTime);

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
}

/**
 * The main game loop.
 * @param {DOMHighResTimeStamp} currentTime - The current time provided by requestAnimationFrame.
 */
function gameLoop(currentTime) {
    if (!gameRunning) return;

    const deltaTime = Math.min(currentTime - lastTime, MAX_DELTA_TIME); // Cap delta time
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
    player.x = -1; // Sentinel value to indicate game over state for drawing
    drawGame(); // Draw final state with game over message
    console.log(message);
}

// --- Event Listeners and Initial Setup ---
window.addEventListener('resize', resizeCanvas); // Adjust canvas on window resize
canvas.addEventListener('click', handleCanvasClick); // Listen for clicks on the canvas

// Initial call to set up canvas size and draw initial "Click to Start" state
resizeCanvas();
