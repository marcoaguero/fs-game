// Canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Images
// const spriteImage = new Image();
// spriteImage.src = "fastspring-logo-8bit.png";
const backgroundImage = new Image();
backgroundImage.src = "background-1.png";

// Player images
const standingImage = new Image();
standingImage.src = "avatar 1.png"; // The standing image
const jumpingImage = new Image();
jumpingImage.src = "avatar 2.png"; // The jumping/running image

// Load the enemy image
const enemyImage = new Image();
enemyImage.src = "card_enemy_2.png";

// Game state
let gameStarted = false;
let isPaused = false;
let pauseStart = 0;
let totalPausedTime = 0;

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
const initialEnemySpeed = 6;
let enemySpeed = initialEnemySpeed;
let spawnDelay = 3000; // Spawn delay in milliseconds
const possibleWords = ["Taxes", "Compliance", "Localisation"];
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
}

// Ensure all assets are loaded before starting the game
Promise.all([
  new Promise((resolve) => (standingImage.onload = resolve)),
  new Promise((resolve) => (jumpingImage.onload = resolve)),
  // new Promise((resolve) => (spriteImage.onload = resolve)),
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  new Promise((resolve) => (enemyImage.onload = resolve)),
]).then(() => {
  initializeGame();
});

class Enemy {
  constructor(x, y, text, speed, image, size) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.speed = speed;
    this.image = image;
    this.size = size || {
      width: ctx.measureText(this.text).width,
      height: FONT_SIZE,
    };
  }

  draw() {
    if (this.image) {
      // Draw the enemy image
      ctx.drawImage(
        this.image,
        this.x,
        this.y,
        this.size.width,
        this.size.height
      );
    } else {
      // Draw the enemy text
      ctx.fillText(this.text, this.x, this.y);
    }
    // Draw a rectangle around the enemy for testing collision borders
    // ctx.strokeStyle = "red"; // Set the color of the rectangle
    // ctx.strokeRect(this.x, this.y, this.size.width, this.size.height);
  }

  update() {
    this.x -= this.speed;
    if (this.x < -100) return false; // Remove enemy if it goes off screen
    this.draw();
    return true;
  }
}

function spawnEnemy() {
  const possibleEnemies = [...possibleWords, "image"];
  const chosenEnemy =
    possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

  let text, image, size, y;
  if (chosenEnemy === "image") {
    image = enemyImage;
    const textMetrics = ctx.measureText("Taxes");
    const cardWidth = textMetrics.width;
    const aspectRatio = image.width / image.height;
    size = { width: cardWidth, height: cardWidth / aspectRatio };
    y = canvas.height - floorHeight - size.height; // Set a specific Y position for the image
  } else {
    text = chosenEnemy;
    const enemyIndex = possibleWords.indexOf(chosenEnemy);
    switch (chosenEnemy) {
      case "Taxes":
        y = canvas.height - floorHeight - (20 + enemyIndex * 50); // Ground level
        break;
      case "Compliance":
        y = canvas.height - floorHeight - (20 + enemyIndex * 20); // Adjusted middle level
        break;
      case "Localisation":
        y = canvas.height - floorHeight - (20 + enemyIndex * 50); // Adjusted upper level
        break;
    }
  }

  enemies.push(new Enemy(canvas.width, y, text, enemySpeed, image, size));
}

let animationFrameId;

// Main game loop
function gameLoop(timestamp) {
  if (!isPaused) {
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
  const enemyRight = enemy.x + enemy.size.width - enemyBorderAdjustment;
  const enemyBottom = enemy.y - enemyBorderAdjustment;

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
  cancelAnimationFrame(animationFrameId); // Stop the game loop

  // Show the modal
  document.getElementById("collisionModal").style.display = "block";

  // Listen for the checkout button click
  document.getElementById("checkoutButton").onclick = function () {
    securePurchase();
    // Hide the modal after initiating checkout
    document.getElementById("collisionModal").style.display = "none";
  };
}

// Restart the game
function restartGame() {
  document.getElementById("collisionModal").style.display = "none";
  document.getElementById("retryText").style.display = "none"; // Hide the retry button
  enemies = []; // Reset enemies
  points = 0; // Reset points
  enemySpeed = initialEnemySpeed;
  updatePoints(); // Update the points display
  gameLoop(0); // Restart game loop
}

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
      document.getElementById("startMessage").style.display = "none";
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
        product: "fs-game-revive",
        quantity: 1,
      },
    ],
  });

  fastspring.builder.viewCart();
  console.log(customerData);
};
