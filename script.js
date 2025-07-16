
document.addEventListener('DOMContentLoaded', () => {
    // Get all play buttons
    const playButtons = document.querySelectorAll('.play-button');

    playButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Check if the button is disabled
            if (event.currentTarget.disabled || event.currentTarget.classList.contains('cursor-not-allowed')) {
                console.log("Game not yet enabled.");
                return; // Do nothing if disabled
            }

            const gamePath = event.currentTarget.dataset.gamePath; // Get the path from data-game-path
            let difficulty = 'easy'; // Default difficulty

            // Determine the name of the radio button group for this game
            // Example: data-game-path="src/games/memory-wave/index.html" -> name="memoryWaveDifficulty"
            const gameName = gamePath.split('/')[2]; // Extracts 'memory-wave' or 'gravity-wave'
            const difficultyRadioName = `${gameName.replace(/-/g, '')}Difficulty`; // Converts 'memory-wave' to 'memoryWaveDifficulty'

            // Find the selected difficulty for this specific game
            const selectedDifficultyRadio = document.querySelector(`input[name="${difficultyRadioName}"]:checked`);
            if (selectedDifficultyRadio) {
                difficulty = selectedDifficultyRadio.value;
            }

            // Construct the URL with the difficulty parameter
            const gameUrl = `${gamePath}?difficulty=${difficulty}`;

            // Open the game in a new tab/window
            window.open(gameUrl, '_blank'); // _blank opens in a new tab
        });
    });
});
