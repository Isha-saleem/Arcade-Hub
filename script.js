// script.js - Main Hub Logic for WaveCore (Simplified)

document.addEventListener('DOMContentLoaded', () => {
    // Get all play buttons
    const playButtons = document.querySelectorAll('.play-button');

    playButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Check if the button is disabled (for games not yet implemented)
            if (event.currentTarget.disabled || event.currentTarget.classList.contains('cursor-not-allowed')) {
                console.log("Game not yet enabled.");
                return; // Do nothing if disabled
            }

            const gamePath = event.currentTarget.dataset.gamePath; // Get the path from data-game-path

            // Open the game in a new tab/window without any difficulty parameter
            window.open(gamePath, '_blank'); // _blank opens in a new tab
        });
    });
});

