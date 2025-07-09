WaveCore: The Six Forces
A collection of AI-powered mini-games inspired by the essence of waves.

About WaveCore
WaveCore is a unique project featuring a suite of mini-games, each designed around a different "wave" concept (like time, sound, heat, memory, emotion, and gravity). The goal is to explore how AI can influence or interact within these wave-based mechanics, offering engaging and thought-provoking gameplay experiences.

This project is built with simple HTML, CSS (using Tailwind CSS for utility-first styling), and JavaScript, making it easy to understand and extend.

Features
Six Unique Mini-Games:

Time Wave: Manipulate the flow of time to conquer challenges.

Sound Wave: Master rhythm and react to sonic patterns.

Heat Wave: Survive rising temperatures and find refuge.

Memory Wave: Recall sequences and navigate memory mazes.

Emotion Wave: Control your mood and influence the game world.

Gravity Wave (NEW!): Manipulate gravitational forces to overcome obstacles.

Interactive Game Guide: A dedicated page explaining the concept and "how to play" for each of the six games.

Responsive Design: Built with Tailwind CSS to ensure a good experience across various devices (mobile, tablet, desktop).

Simple & Extensible: A straightforward HTML/CSS/JS structure for easy development and future expansion.

Getting Started
Follow these steps to get WaveCore up and running on your local machine or in a Codespaces environment.

Prerequisites
A web browser (e.g., Chrome, Firefox, Edge).

Python 3 (to run a simple local web server). If you're in GitHub Codespaces, Python 3 is usually pre-installed.

Installation & Setup
Clone the Repository:
If you haven't already, clone this repository to your local machine:

git clone https://github.com/your-username/WaveCore.git
# Replace 'your-username' with your actual GitHub username

Navigate to the Project Directory:

cd WaveCore

Running the Project
To view the project, you need to serve the files using a local web server. Python's built-in HTTP server is perfect for this.

Start the HTTP Server:
From the WaveCore root directory (where public/ and src/ are located), run the following command in your terminal:

python3 -m http.server 8000

You should see output indicating the server is running, usually on 0.0.0.0:8000.

Open in Your Browser:
Open your web browser and navigate to the following URL:

For Local Machine: http://127.0.0.1:8000/public/index.html

For GitHub Codespaces: Look for the "Ports" tab in your Codespaces interface. It should show port 8000. Click "Open in Browser" or "Open Preview," and then manually adjust the URL in your browser to:
https://your-codespace-name-8000.githubpreview.dev/public/index.html
(Replace your-codespace-name-8000.githubpreview.dev with the actual preview URL provided by Codespaces).

You should now see the WaveCore homepage, with links to all six mini-games and the game guide.

Project Structure
WaveCore/
├── .git/
├── backend/                  # Placeholder for future backend logic
├── public/
│   ├── index.html            # Main WaveCore hub page
│   ├── guide.html            # Game guide page
│   └── style.css             # Shared styles for public pages
├── src/
│   └── games/
│       ├── time-wave/
│       │   ├── index.html
│       │   ├── time.css
│       │   └── time.js
│       ├── sound-wave/
│       │   ├── index.html
│       │   ├── sound.css
│       │   └── sound.js
│       ├── heat-wave/
│       │   ├── index.html
│       │   ├── heat.css
│       │   └── heat.js
│       ├── memory-wave/
│       │   ├── index.html
│       │   ├── memory.css
│       │   └── memory.js
│       ├── emotion-wave/
│       │   ├── index.html
│       │   ├── emotion.css
│       │   └── emotion.js
│       └── gravity-wave/     # NEW!
│           ├── index.html
│           ├── gravity.css
│           └── gravity.js
└── README.md                 # This file

Contributing
Contributions are welcome! If you have ideas for new wave-inspired games, improvements to existing ones, or general enhancements, feel free to fork the repository, make your changes, and submit a pull request.
