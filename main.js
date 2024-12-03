const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let spriteImage = new Image();
spriteImage.src = "fastspring-logo.png"; // Default sprite
let backgroundImage = new Image();
backgroundImage.src = "background_image.jpg"; // Replace with your background image path

let backgroundX = 0;
let backgroundSpeed = 1; // Speed at which the background scrolls

function drawBackground() {
  // Draw the first background image
  ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
  // Draw the second background image
  ctx.drawImage(
    backgroundImage,
    backgroundX + canvas.width,
    0,
    canvas.width,
    canvas.height
  );

  // Update the X position
  backgroundX -= backgroundSpeed;
  if (backgroundX <= -canvas.width) {
    backgroundX = 0;
  }
}

let gameStarted = false;

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    document.getElementById("startMessage").style.display = "none"; // Hide the start message
    gameLoop(0);
  }
}

const characterHeight = 40; // Assuming your character's height is 50 pixels
let floorHeight = 90;
let posX = 10,
  posY = canvas.height - characterHeight - 10 - floorHeight;
// Adjust the starting position Y based on canvas height and character height
let gravity = 1.5; // Lower gravity for a slower fall
let isJumping = false;
let animationFrameId;
let jumpSpeed = 5; // Control the ascent speed
let maxHeight = 75; // Maximum height of the jump
let ascending = true; // Flag to check if the jump is ascending
let groundPositionY = posY; // Remember the ground position to reset after jumping
let isPaused = false; // New variable to track pause state
let spawnDelay = 3000; // Spawn delay in milliseconds

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !isJumping) {
    isJumping = true;
    ascending = true;
    jumpPeak = posY - maxHeight; // Update the peak for each new jump
  }
  if (event.code === "KeyP") {
    isPaused = !isPaused;
    if (!isPaused) {
      // If unpausing, call the game loop again
      gameLoop();
    }
  }
  if (event.code === "Space") {
    startGame();
  }
});

function changeSprite(spriteName) {
  spriteImage.src = spriteName + ".png"; // Update sprite source
}

// Enemy constructor
function Enemy(x, y, text, speed) {
  this.x = x;
  this.y = y;
  this.text = text; // Add the text property
  this.speed = speed;

  this.draw = function () {
    // ctx.fillStyle = "red"; // Change color if needed
    // ctx.fillRect(this.x, this.y, this.width, this height);
    ctx.fillText(this.text, this.x, this.y);
  };

  this.update = function () {
    this.x -= this.speed;
    this.draw();
  };
}

// Initialize enemies array
let enemies = [];
let spawnInterval = 3000; // Adjust as needed
let lastTimeSpawned = 0;
let enemySpeed = 3; // Initial enemy speed
let pointsThreshold = 50; // Threshold to increase enemy speed
let speedIncrement = 1; // Amount to increase speed

// Modify the spawnEnemy function to create three types of enemies
function spawnEnemy() {
  const possibleWords = ["Taxes", "Compliance", "Localisation"];
  const enemyText =
    possibleWords[Math.floor(Math.random() * possibleWords.length)]; // Randomly choose a word
  const fontSize = 20; // Adjust the font size as needed

  // ctx.font = fontSize + "px Arial"; // Set the font size and type
  ctx.font = "13px 'Press Start 2P'";

  const enemySize = ctx.measureText(enemyText).width; // Calculate width based on text size
  let enemyYPosition;
  let enemyAction;

  // Determine the enemy type and action based on the word
  if (enemyText === "Taxes") {
    enemyYPosition = canvas.height - fontSize - floorHeight; // Ground level
    enemyAction = "jump"; // Jumpable enemy
  } else if (enemyText === "Compliance") {
    enemyYPosition = canvas.height - fontSize * 3 - floorHeight; // Middle level
    enemyAction = "down"; // Press down to dodge
  } else if (enemyText === "Localisation") {
    enemyYPosition = canvas.height - fontSize * 5 - floorHeight; // Upper level
    enemyAction = "none"; // No action required
  }

  let enemy = new Enemy(
    canvas.width,
    enemyYPosition,
    enemyText,
    enemySpeed,
    enemyAction
  );
  enemies.push(enemy);
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

// Points counter
let points = 0;

function updatePoints() {
  document.getElementById("points").innerText = points;
}

// Collision detection
function checkCollision(player, enemy) {
  const playerRight = player.x + player.width;
  const playerBottom = player.y + player.height;
  const enemyRight = enemy.x + ctx.measureText(enemy.text).width;
  const enemyBottom = enemy.y;

  return (
    player.x < enemyRight &&
    playerRight > enemy.x &&
    player.y < enemyBottom &&
    playerBottom > enemy.y
  );
}

// Game over function modified to trigger securePurchase on collision
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

  // Trigger secure purchase process
  // securePurchase();

  // Reset game state
  document.getElementById("retryText").style.display = "block"; // Show the retry button
  points = 0; // Reset points
  enemySpeed = 3;
  updatePoints(); // Update the points display

  // Add an event listener for the "Enter" key to restart the game
  document.addEventListener("keydown", function (event) {
    if (event.code === "Enter") {
      restartGame();
      document.getElementById("retryText").style.display = "none"; // Hide the retry button after restarting
      document.removeEventListener("keydown", this); // Remove the event listener to prevent multiple restarts
    }
  });
}

// Function to restart the game
function restartGame() {
  document.getElementById("collisionModal").style.display = "none";
  document.getElementById("retryText").style.display = "none"; // Hide the retry button
  enemies = []; // Reset enemies
  points = 0; // Reset points
  updatePoints(); // Update the points display
  gameLoop(0); // Restart game loop
}

// Modified gameLoop function
function gameLoop(timestamp) {
  if (!isPaused) {
    animationFrameId = requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Spawn and update enemies
    if (timestamp - lastTimeSpawned > spawnInterval) {
      spawnEnemy();
      lastTimeSpawned = timestamp;
    }

    enemies.forEach((enemy, index) => {
      enemy.update();
      if (enemy.x + ctx.measureText(enemy.text).width < 0) {
        enemies.splice(index, 1);
        points += 10; // Increase points when enemy leaves the screen
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

      // Collision detection logic
      if (checkCollision({ x: posX, y: posY, width: 25, height: 50 }, enemy)) {
        console.log("Collision Detected!");
        gameOver(); // Handle game over
      }
    });

    // Player logic for jumping
    if (isJumping) {
      if (ascending && posY > jumpPeak) {
        posY -= jumpSpeed;
      } else {
        ascending = false;
        if (posY < groundPositionY) posY += gravity;
        else {
          isJumping = false;
          ascending = true;
          posY = groundPositionY; // Reset posY to ground position
        }
      }
    }

    ctx.drawImage(spriteImage, posX, posY, 25, 50);

    // Update points display last to ensure it's on top of other elements
    updatePoints();
  }
}

spriteImage.onload = () => {};
