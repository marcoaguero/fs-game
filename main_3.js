// Canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Images
const backgroundImage = new Image();
backgroundImage.src = "background-1.png";

// Player images
const standingImage = new Image();
standingImage.src = "avatar 1.png"; // The standing image
const jumpingImage = new Image();
jumpingImage.src = "avatar 2.png"; // The jumping/running image

// Leaderboard logic
let leaderboard = [];
let playerName = "";

function loadLeaderboard() {
  const storedLeaderboard = JSON.parse(localStorage.getItem("leaderboard"));
  if (storedLeaderboard) {
    leaderboard = storedLeaderboard;
  }
}

function saveLeaderboard() {
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

// Load leaderboard when the game starts
loadLeaderboard();

document.getElementById("submitNameButton").onclick = function () {
  playerName = document.getElementById("playerNameInput").value || "Player";

  // Hide the name input modal
  document.getElementById("nameInputModal").style.display = "none";

  // Start the game
  startGame();
};

function startGame() {
  gameStarted = true;
  // Add your game start logic here
  requestAnimationFrame(gameLoop); // Start the game loop here
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard();
  updateLeaderboardDisplay(); // Show the leaderboard when the game loads
});

function updateLeaderboardDisplay() {
  const leaderboardList = document.getElementById("leaderboardList");
  leaderboardList.innerHTML = ""; // Clear the current list

  leaderboard.forEach((entry, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
    leaderboardList.appendChild(listItem);
  });
}

function updateLeaderboard(name, score) {
  leaderboard.push({ name: name, score: score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score descending
  if (leaderboard.length > 10) {
    leaderboard.pop(); // Keep only top 10 scores
  }

  saveLeaderboard(); // Save to localStorage
  updateLeaderboardDisplay(); // Update the leaderboard display
}

function displayLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList");
  leaderboardList.innerHTML = "";

  leaderboard.forEach((entry, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${index + 1}. ${entry.name} - ${entry.score}`;
    leaderboardList.appendChild(listItem);
  });

  // // Show the leaderboard modal
  // document.getElementById("leaderboard").style.display = "flex";
}

// function displayLeaderboard() {
//   console.log("Leaderboard:", leaderboard);
//   // Update the leaderboard UI if you have one
// }

// Enemy images
const enemyImages = [
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
];

enemyImages[0].src = "localization2.png";
enemyImages[1].src = "currencies2.png";
enemyImages[2].src = "taxes2.png";
enemyImages[3].src = "subscriptions2.png";
enemyImages[4].src = "churn2.png";
enemyImages[5].src = "fraud2.png";

// Game state
let gameStarted = false;
let gameOverState = false;
let isPaused = false;
let pauseStart = 0;
let totalPausedTime = 0;
let lives = 1; // Initialize lives

// Background
let backgroundX = 0;
const backgroundSpeed = 1;

// Environment
const floorHeight = 30;

// Player
let currentSprite = standingImage; // Start with the player standing
const characterHeight = 100;
const posX = 10;
let posY = canvas.height - characterHeight - floorHeight - 10; // Initialize posY
let isJumping = false;
let ascending = true;
const gravity = 2;
const jumpSpeed = 6;
const maxHeight = 100;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 100;

// Player state
let lastSpriteChangeTime = 0;
let spriteAnimationInterval = 100; // Time in ms to hold each sprite frame

// Enemies
let enemies = [];
let spawnInterval = 3000;
let lastTimeSpawned = 0;
const initialEnemySpeed = 8;
let enemySpeed = initialEnemySpeed;
let spawnDelay = 3000; // Spawn delay in milliseconds
// const possibleWords = ["Taxes", "Compliance", "Localisation"];
const FONT_SIZE = 13;
ctx.font = `${FONT_SIZE}px 'Press Start 2P'`;

// Points
let points = 0;
const pointsThreshold = 50; // Threshold to increase enemy speed
const speedIncrement = 1; // Amount to increase speed

function drawInitialImages() {
  // Draw the background
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Draw the player
  drawPlayer(); // Use drawPlayer to handle initial player rendering

  // Draw a rectangle around the player for testing collision borders
  // ctx.strokeStyle = "blue"; // Set the color of the rectangle
  // ctx.strokeRect(posX, posY, PLAYER_WIDTH, PLAYER_HEIGHT);
}

function initializeGame() {
  document.addEventListener("keydown", handleKeyDown);
  drawInitialImages(); // Draw initial game state without starting the loop
  updateLives(); // Update the initial lives display

  // Display the start game modal
  // document.getElementById("startGame").style.display = "flex";
}

// Ensure all assets are loaded before starting the game
Promise.all([
  new Promise((resolve) => (standingImage.onload = resolve)),
  new Promise((resolve) => (jumpingImage.onload = resolve)),
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  ...enemyImages.map(
    (enemy) => new Promise((resolve) => (enemy.onload = resolve))
  ),
]).then(() => {
  initializeGame();
});

class Enemy {
  constructor(x, y, speed, image) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.image = image;
    this.width = 50; // Adjust the width as needed
    this.height = 50; // Adjust the height as needed
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= this.speed;
    this.draw();
    return this.x > -this.width; // Return false if the enemy is off screen
  }
}

// function spawnEnemy() {
//   const possibleEnemies = [...possibleWords, "image"];
//   const chosenEnemy =
//     possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

//   let text, image, size, y;
//   if (chosenEnemy === "image") {
//     image = enemyImage;
//     const textMetrics = ctx.measureText("Taxes");
//     const cardWidth = textMetrics.width;
//     const aspectRatio = image.width / image.height;
//     size = { width: cardWidth, height: cardWidth / aspectRatio };
//     y = canvas.height - floorHeight - size.height; // Set a specific Y position for the image
//   } else {
//     text = chosenEnemy;
//     const enemyIndex = possibleWords.indexOf(chosenEnemy);
//     switch (chosenEnemy) {
//       case "Taxes":
//         y = canvas.height - floorHeight - (20 + enemyIndex * 50); // Ground level
//         break;
//       case "Compliance":
//         y = canvas.height - floorHeight - (20 + enemyIndex * 20); // Adjusted middle level
//         break;
//       case "Localisation":
//         y = canvas.height - floorHeight - (20 + enemyIndex * 50); // Adjusted upper level
//         break;
//     }
//   }

//   enemies.push(new Enemy(canvas.width, y, text, enemySpeed, image, size));
// }

function spawnEnemy() {
  const randomIndex = Math.floor(Math.random() * enemyImages.length);
  const image = enemyImages[randomIndex];

  // Set specific Y positions for the images based on their index
  let y;
  let width = 50; // Default width for most enemies
  switch (randomIndex) {
    case 0: // Ground level
      y = canvas.height - floorHeight - 50; // Adjust the Y position as needed
      // width = 100; // Set a different width for the "Localisation" sprite
      console.log("Enemy 0 (Ground level) at Y position:", y);
      break;
    case 1: // Adjusted middle level
      y = canvas.height - floorHeight - 70; // Adjust the Y position as needed
      console.log("Enemy 1 (Middle level) at Y position:", y);
      break;
    case 2: // Adjusted upper level
      y = canvas.height - floorHeight - 70; // Adjust the Y position as needed
      console.log("Enemy 2 (Upper level) at Y position:", y);
      break;
    case 3: // Another level
      y = canvas.height - floorHeight - 170; // Adjust the Y position as needed
      console.log("Enemy 3 (Another level) at Y position:", y);
      break;
    case 4: // Near ground level
      y = canvas.height - floorHeight - 180; // Adjust the Y position as needed
      console.log("Enemy 4 (Near ground level) at Y position:", y);
      break;
    case 5: // Higher level
      y = canvas.height - floorHeight - 190; // Adjust the Y position as needed
      console.log("Enemy 5 (Higher level) at Y position:", y);
      break;
    default:
      y = canvas.height - floorHeight - 50; // Default to ground level
      console.log("Default case (Ground level) at Y position:", y);
  }

  // Create a new enemy and add it to the enemies array
  const enemy = new Enemy(canvas.width, y, enemySpeed, image);
  enemy.width = width; // Override the default width if needed
  enemies.push(enemy);
}

let animationFrameId;

// Main game loop
function gameLoop(timestamp) {
  if (!isPaused && gameStarted) {
    animationFrameId = requestAnimationFrame(gameLoop);
    clearCanvas();
    drawBackground();
    updateSprite(); // Update the sprite based on the state
    handleSpawningEnemies(timestamp);
    updateAndDrawEnemies();
    handlePlayerJump();
    drawPlayer();
    updatePoints();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Spawn new enemies based on the timestamp
function handleSpawningEnemies(timestamp) {
  let adjustedTimestamp = timestamp - totalPausedTime;
  if (adjustedTimestamp - lastTimeSpawned > spawnInterval) {
    spawnEnemy();
    lastTimeSpawned = adjustedTimestamp;
  }
}

// Update the enemies positions and draws them on the canvas. It also checks for collisions and handles scoring
function updateAndDrawEnemies() {
  enemies = enemies.filter((enemy, index) => {
    let shouldStay = enemy.update();
    if (shouldStay) {
      if (
        checkCollision(
          { x: posX, y: posY, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
          enemy
        )
      ) {
        console.log("Collision Detected!");
        gameOver(); // Handle game over
        shouldStay = false;
      }
    } else {
      points += 10; // Increase points for dodging an enemy
      // Check if points reached the threshold to increase enemy speed
      if (points % pointsThreshold === 0) {
        enemySpeed += speedIncrement;
        spawnInterval = 6000; // Double the spawn interval
        console.log("Current speed is: " + enemySpeed);
        console.log("Current spawn interval is: " + spawnInterval);
      } else {
        spawnInterval = 3000;
      }
    }
    return shouldStay;
  });
}

// Check if the player has collided with an enemy
function checkCollision(player, enemy) {
  const playerRight = player.x + PLAYER_WIDTH;
  const playerBottom = player.y + PLAYER_HEIGHT;

  // Adjust the enemy's collision border
  const enemyBorderAdjustment = 5; // Adjust this value as needed
  const enemyRight = enemy.x + enemy.width - enemyBorderAdjustment;
  const enemyBottom = enemy.y + enemy.height - enemyBorderAdjustment;

  return (
    player.x < enemyRight &&
    playerRight > enemy.x + enemyBorderAdjustment &&
    player.y < enemyBottom &&
    playerBottom > enemy.y + enemyBorderAdjustment
  );
}

// Draw the player on the canvas
function drawPlayer() {
  ctx.drawImage(currentSprite, posX, posY, PLAYER_WIDTH, PLAYER_HEIGHT);
}

// Game over function stops the game loop and shows the game over modal
function gameOver() {
  gameOverState = true; // Set gameOverState to true
  lives -= 1;
  updateLives();

  if (lives > 0) {
    // Reset player position or any other logic to continue the game
    posX = 10;
    posY = canvas.height - characterHeight - floorHeight - 10;
  } else {
    cancelAnimationFrame(animationFrameId);

    // Check if the score is a new high score
    if (
      leaderboard.length < 10 ||
      points > leaderboard[leaderboard.length - 1].score
    ) {
      updateLeaderboard(playerName, points);

      // Show the game over modal
      document.querySelector("#overlay").style.display = "block";
      document.querySelector("#collisionModal").style.display = "flex";
    } else {
      // Show the game over modal without updating the leaderboard
      document.querySelector("#overlay").style.display = "block";
      document.querySelector("#collisionModal").style.display = "flex";
    }
  }
}

// Clear high scores
function clearHighScores() {
  localStorage.removeItem("leaderboard");
  leaderboard = []; // Clear the in-memory leaderboard as well
  updateLeaderboardDisplay(); // Update the UI to reflect the cleared leaderboard
}

// After webhook received from buying a live
function addLife() {
  lives++;
}

// Restart the game
function restartGame() {
  if (lives > 0) {
    gameOverState = false; // Reset gameOverState to false
    document.querySelector("#collisionModal").style.display = "none";
    document.querySelector("#overlay").style.display = "none";
    document.querySelector("#retryText").style.display = "none"; // Hide the retry button
    enemies = []; // Reset enemies
    points = 0; // Reset points
    enemySpeed = initialEnemySpeed;
    updatePoints(); // Update the points display
    updateLives(); // Update the lives display
    gameLoop(0); // Restart game loop
  } else {
    // Show the buy life modal
    document.querySelector("#collisionModal").style.display = "flex";
  }
}

// Update the lives display
function updateLives() {
  document.getElementById("lives").innerText = lives;
}

// Update the points display
function updatePoints() {
  document.getElementById("points").innerText = points;
}

function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  enemies = enemies.filter((enemy) => enemy.update());
  handlePlayerJump();
  ctx.drawImage(spriteImage, posX, posY, PLAYER_WIDTH, PLAYER_HEIGHT);
  updatePoints();
}

function drawBackground() {
  ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
  ctx.drawImage(
    backgroundImage,
    backgroundX + canvas.width,
    0,
    canvas.width,
    canvas.height
  );
  backgroundX -= backgroundSpeed;
  if (backgroundX <= -canvas.width) backgroundX = 0;
}

function handleKeyDown(event) {
  if (event.code === "Space") {
    if (!gameStarted) {
      gameStarted = true;
      document.getElementById("startGame").style.display = "none"; // Hide the start game modal
      requestAnimationFrame(gameLoop); // Start the game loop here
    } else if (!isJumping) {
      isJumping = true;
      ascending = true;
    }
  } else if (event.code === "KeyP") {
    togglePause();
  }
}

function togglePause() {
  if (gameOverState) {
    return; // Do not allow pausing if the game is over
  }
  if (!isPaused) {
    // Game is about to be paused
    pauseStart = performance.now();
    isPaused = true;
  } else {
    // Game is resuming from pause
    totalPausedTime += performance.now() - pauseStart;
    isPaused = false;
    if (gameStarted) {
      requestAnimationFrame(gameLoop);
    }
  }
}

function updateSprite() {
  const now = Date.now();

  // Toggle the sprite based on jumping state and elapsed time for animation smoothness
  if (isJumping) {
    currentSprite = jumpingImage;
  } else {
    // Check if enough time has passed to toggle the sprite
    if (now - lastSpriteChangeTime > spriteAnimationInterval) {
      // Toggle between standing and jumping image when running
      currentSprite =
        currentSprite === standingImage ? jumpingImage : standingImage;
      lastSpriteChangeTime = now; // Reset the last change time
    }
  }
}

function handlePlayerJump() {
  if (isJumping) {
    if (
      ascending &&
      posY > canvas.height - characterHeight - floorHeight - maxHeight
    ) {
      posY -= jumpSpeed;
    } else {
      ascending = false;
      posY += gravity;
      if (posY >= canvas.height - characterHeight - floorHeight - 10) {
        posY = canvas.height - characterHeight - floorHeight - 10;
        isJumping = false; // Player has landed
      }
    }
  }
}

function updatePoints() {
  // Implement points updating logic
  document.getElementById("points").innerText = points;
}

const securePurchase = () => {
  const customerData = {
    email: "fastspring.demos@gmail.com",
    firstName: "FastSpring",
    lastName: "Game",
  };

  fastspring.builder.secure({
    reset: true,
    contact: customerData,
    language: "EN",
    items: [
      {
        product: "1-up",
        quantity: 1,
      },
    ],
  });

  fastspring.builder.checkout();
  // console.log(customerData);
};
