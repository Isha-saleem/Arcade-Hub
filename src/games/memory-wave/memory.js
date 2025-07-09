
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('memoryWaveCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions based on its container, ensuring responsiveness
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawPlaceholder(); // Redraw content after resize
    }

    // Draw a simple placeholder for now
    function drawPlaceholder() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4A5568'; // Tailwind gray-600
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#CBD5E0'; // Tailwind gray-300
        ctx.font = '24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Memory Wave Game Area', canvas.width / 2, canvas.height / 2);
    }

    // Initial resize and draw
    resizeCanvas();

    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);

    console.log('Memory Wave game loaded!');

    // Game variables (to be implemented)
    let currentSequence = [];
    let playerSequence = [];
    let round = 1;
    let sequenceLength = 3;

    // Function to generate a new sequence
    function generateSequence() {
        currentSequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            currentSequence.push(Math.floor(Math.random() * 4)); // Example: 4 possible elements
        }
        playerSequence = [];
        console.log('New sequence:', currentSequence);
        // displaySequence(currentSequence); // Show sequence to player
    }

    // Function to check player's input against the sequence
    function checkSequence() {
        if (playerSequence.length !== currentSequence.length) {
            return false; // Not yet complete
        }
        for (let i = 0; i < currentSequence.length; i++) {
            if (playerSequence[i] !== currentSequence[i]) {
                return false; // Mismatch
            }
        }
        return true; // Match
    }

    // AI logic for confusing or shifting sequences (to be implemented)
    function aiConfuseSequence() {
        // Example: Occasionally add a wrong element or reorder
        if (Math.random() < 0.2) { // 20% chance to confuse
            const randomIndex = Math.floor(Math.random() * currentSequence.length);
            const originalValue = currentSequence[randomIndex];
            let newValue = Math.floor(Math.random() * 4);
            while (newValue === originalValue) {
                newValue = Math.floor(Math.random() * 4);
            }
            currentSequence[randomIndex] = newValue;
            console.log('AI confused the sequence!');
        }
    }

    // Example game flow (to be integrated into proper game loop)
    // function startRound() {
    //     generateSequence();
    //     aiConfuseSequence(); // AI might confuse it after generation
    //     // Wait for player input
    // }

    // function playerInput(value) {
    //     playerSequence.push(value);
    //     if (playerSequence.length === currentSequence.length) {
    //         if (checkSequence()) {
    //             console.log('Correct! Next round.');
    //             round++;
    //             sequenceLength++;
    //             startRound();
    //         } else {
    //             console.log('Incorrect! Game Over.');
    //             // endGame();
    //         }
    //     }
    // }

    // startRound(); // Initial round
});
