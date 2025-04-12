// DOM Elements
const menuContainer = document.getElementById('menu-container');
const gameContainer = document.getElementById('game-container');
const gameOverContainer = document.getElementById('game-over-container');

const highScoreDisplay = document.querySelector('.snake-high-score');
const scoreDisplay = document.querySelector('.snake-score');

const menuPlayButton = document.querySelector('.menu-play-button');
const gameOverPlayButton = document.querySelector('.game-over-play-button');

const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");

// Controls
const btnUp = document.getElementById('up');
const btnDown = document.getElementById('down');
const btnLeft = document.getElementById('left');
const btnRight = document.getElementById('right');

// Game constants
const scale = 20;
const rows = canvas.height / scale;
const columns = canvas.width / scale;
let initialSpeed = 120; // Initial speed (ms per frame) - much faster than before
let speed = initialSpeed;
let lastRenderTime = 0;
let snake = null;
let fruit = null;
let animationFrameId = null;
let gameActive = false;
let lastKeyPress = 0;
let keyPressDelay = 80; // Prevent too rapid key presses
let currentDirection = "right"; // Track current direction
let lastDirection = "right"; // Track previous direction
let currentHighScore = parseInt(localStorage.getItem('snake_high_score')) || 0;
highScoreDisplay.innerText = currentHighScore;

// Colors
const snakeHeadColor = "#00ff66"; // Bright green for head
const snakeBodyColors = ["#00e060", "#00cc55", "#00b84f", "#00a548"]; // Gradient for body
const fruitColor = "#ff0066"; // Hot pink for apple

menuPlayButton.addEventListener('click', playGame);
gameOverPlayButton.addEventListener('click', playGame);

btnUp.addEventListener('click', () => { changeDirection('up'); });
btnDown.addEventListener('click', () => { changeDirection('down'); });
btnLeft.addEventListener('click', () => { changeDirection('left'); });
btnRight.addEventListener('click', () => { changeDirection('right'); });

window.addEventListener("keydown", evt => {
  const now = Date.now();
  if (now - lastKeyPress < keyPressDelay) return; // Prevent too rapid key presses
  lastKeyPress = now;
  
  switch(evt.key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      changeDirection('up');
      break;
    case 'arrowdown':
    case 's':
      changeDirection('down');
      break;
    case 'arrowleft':
    case 'a':
      changeDirection('left');
      break;
    case 'arrowright':
    case 'd':
      changeDirection('right');
      break;
  }
});

function changeDirection(newDirection) {
  if (!gameActive) return;
  
  // Prevent reverse direction (snake can't go backwards)
  if (
    (currentDirection === 'up' && newDirection === 'down') ||
    (currentDirection === 'down' && newDirection === 'up') ||
    (currentDirection === 'left' && newDirection === 'right') ||
    (currentDirection === 'right' && newDirection === 'left')
  ) {
    return;
  }
  
  // Only save the next direction if it's a valid change
  if (
    (currentDirection === 'up' || currentDirection === 'down') && 
    (newDirection === 'left' || newDirection === 'right')
  ) {
    snake.nextDirection = newDirection;
  } else if (
    (currentDirection === 'left' || currentDirection === 'right') && 
    (newDirection === 'up' || newDirection === 'down')
  ) {
    snake.nextDirection = newDirection;
  }
}

function hideMenu() {
  menuContainer.style.display = 'none';
  gameOverContainer.style.display = 'none';
}

function showGame() {
  gameContainer.style.display = 'block';
}

function showGameOver() {
  gameContainer.style.display = 'none';
  gameOverContainer.style.display = 'block';
}

function playGame() {
  hideMenu();
  showGame();
  startGame();
}

function startGame() {
  speed = initialSpeed;
  gameActive = true;
  currentDirection = "right";
  lastDirection = "right";
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  snake = new Snake();
  fruit = new Fruit();
  fruit.pickLocation();
  scoreDisplay.innerText = snake.total;

  lastRenderTime = 0;
  gameLoop(0);
}

function gameLoop(currentTime) {
  if (!gameActive) return;
  
  animationFrameId = requestAnimationFrame(gameLoop);
  
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
  const frameDelay = 1 / (1000 / speed);
  
  if (secondsSinceLastRender < frameDelay) return;
  
  lastRenderTime = currentTime;
  
  update();
  draw();
}

function update() {
  snake.update();
  
  // Check if snake ate the fruit
  if (snake.eat(fruit)) {
    fruit.pickLocation();
    // Increase speed after each apple - more noticeable now
    speed = Math.max(speed - 5, 40);
  }
  
  scoreDisplay.innerText = snake.total;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid lines for better visibility
  drawGrid();
  
  fruit.draw();
  snake.draw();
}

function drawGrid() {
  ctx.strokeStyle = "#003344";
  ctx.lineWidth = 0.5;
  
  for (let i = 0; i <= rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * scale);
    ctx.lineTo(canvas.width, i * scale);
    ctx.stroke();
  }
  
  for (let i = 0; i <= columns; i++) {
    ctx.beginPath();
    ctx.moveTo(i * scale, 0);
    ctx.lineTo(i * scale, canvas.height);
    ctx.stroke();
  }
}

function endGame() {
  gameActive = false;
  showGameOver();

  // Check high score
  if (snake.total > currentHighScore) {
    currentHighScore = snake.total;
    localStorage.setItem('snake_high_score', currentHighScore);
    highScoreDisplay.innerText = currentHighScore;
  }
}

// Snake Constructor
function Snake() {
  // Start in the middle with 3 segments
  this.x = Math.floor(columns / 2) * scale;
  this.y = Math.floor(rows / 2) * scale;
  
  this.xSpeed = scale;
  this.ySpeed = 0;
  this.nextDirection = null;
  
  this.total = 0;
  this.tail = [];
  
  // Add initial segments
  for (let i = 1; i <= 3; i++) {
    this.tail.push({
      x: this.x - (i * scale),
      y: this.y
    });
    this.total++;
  }

  this.draw = function() {
    // Draw tail segments with gradient colors
    for (let i = 0; i < this.tail.length; i++) {
      const colorIndex = i % snakeBodyColors.length;
      drawSegment(this.tail[i].x, this.tail[i].y, snakeBodyColors[colorIndex], false);
    }
    
    // Draw head with different color
    drawSegment(this.x, this.y, snakeHeadColor, true);
  };

  this.update = function() {
    // Handle direction change
    if (this.nextDirection) {
      this.changeDirection(this.nextDirection);
      this.nextDirection = null;
    }
    
    // Move the tail segments
    for (let i = 0; i < this.tail.length - 1; i++) {
      this.tail[i] = { ...this.tail[i + 1] };
    }
    
    if (this.total >= 1) {
      this.tail[this.total - 1] = { x: this.x, y: this.y };
    }

    // Move the head based on current speed
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // Wall collision - die when hitting walls
    if (this.x >= canvas.width || this.x < 0 || this.y >= canvas.height || this.y < 0) {
      endGame();
      return;
    }

    // Self collision check
    this.checkCollision();
  };

  this.changeDirection = function(direction) {
    lastDirection = currentDirection;
    currentDirection = direction;
    
    switch (direction) {
      case "up":
        this.xSpeed = 0;
        this.ySpeed = -scale;
        break;
      case "down":
        this.xSpeed = 0;
        this.ySpeed = scale;
        break;
      case "left":
        this.xSpeed = -scale;
        this.ySpeed = 0;
        break;
      case "right":
        this.xSpeed = scale;
        this.ySpeed = 0;
        break;
    }
  };

  this.eat = function(fruit) {
    if (this.x === fruit.x && this.y === fruit.y) {
      this.total++;
      return true;
    }
    return false;
  };

  this.checkCollision = function() {
    // Check collision with itself - start checking from a few segments in
    // to prevent false collisions when turning quickly
    for (let i = 3; i < this.tail.length; i++) {
      if (this.x === this.tail[i].x && this.y === this.tail[i].y) {
        endGame();
        return;
      }
    }
  };
}

function drawSegment(x, y, color, isHead) {
  ctx.fillStyle = color;
  
  // Draw rounded rectangle for body segments
  const radius = 6;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + scale - radius, y);
  ctx.quadraticCurveTo(x + scale, y, x + scale, y + radius);
  ctx.lineTo(x + scale, y + scale - radius);
  ctx.quadraticCurveTo(x + scale, y + scale, x + scale - radius, y + scale);
  ctx.lineTo(x + radius, y + scale);
  ctx.quadraticCurveTo(x, y + scale, x, y + scale - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.fill();
  
  // Draw eyes if it's the head
  if (isHead) {
    ctx.fillStyle = "#000022";
    
    // Position eyes based on direction
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    const eyeRadius = 2;
    
    switch(currentDirection) {
      case "right":
        leftEyeX = x + scale - 6; leftEyeY = y + 7;
        rightEyeX = x + scale - 6; rightEyeY = y + scale - 7;
        break;
      case "left":
        leftEyeX = x + 6; leftEyeY = y + 7;
        rightEyeX = x + 6; rightEyeY = y + scale - 7;
        break;
      case "up":
        leftEyeX = x + 7; leftEyeY = y + 6;
        rightEyeX = x + scale - 7; rightEyeY = y + 6;
        break;
      case "down":
        leftEyeX = x + 7; leftEyeY = y + scale - 6;
        rightEyeX = x + scale - 7; rightEyeY = y + scale - 6;
        break;
    }
    
    // Draw left eye
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right eye
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Fruit Constructor (Apple)
function Fruit() {
  this.x;
  this.y;

  this.pickLocation = function() {
    this.x = (Math.floor(Math.random() * columns)) * scale;
    this.y = (Math.floor(Math.random() * rows)) * scale;

    // Prevent fruit from spawning on the snake
    if (snake && (snake.tail.some(segment => segment.x === this.x && segment.y === this.y) ||
        (snake.x === this.x && snake.y === this.y))) {
      this.pickLocation();
    }
  };

  this.draw = function() {
    const radius = scale / 2;
    ctx.beginPath();
    ctx.arc(this.x + radius, this.y + radius, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = fruitColor;
    ctx.fill();

    // small leaf
    ctx.beginPath();
    ctx.fillStyle = "#00ff66";
    ctx.arc(this.x + radius, this.y + radius - (radius / 1.5), 3, 0, Math.PI * 2);
    ctx.fill();
  };
}