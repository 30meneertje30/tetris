// Game board dimensions
const cols = 10;
const rows = 20;
let board = [];
let currentBlock = null; // The current falling block
let blockPos = { x: 0, y: 0 }; // Position of the current block
const cellSize = 30; // Update the cell size to 30x30 pixels
let score = 0;
let fallTimer = 0;
let fallInterval = 0.5; // Time in seconds between each automatic move down
let keyStates = {
  left: false,
  right: false,
  down: false,
};
let horizontalMoveTimer = 0;
let horizontalMoveInterval = 0.1; // Adjust for desired speed of left/right movement

let startTime;
let levelSpeedFactor = 1; // Starts at normal speed
let reggaeMusic;

function preload() {
  reggaeMusic = loadSound("final shoppie.mp3");
}

function setup() {
  reggaeMusic.loop(0, 1, 1, 0, reggaeMusic.duration());
  createCanvas(300, 600);
  frameRate(60); // Set a consistent frame rate
  noStroke();
  initBoard();
  newBlock(); // Ensures currentBlock is initialized before the game starts
  startTime = millis(); // Record the start time
}

function draw() {
  background(50);
  drawBoard();
  checkForCompleteLines();
  updateFallTimer();
  updateDifficulty(); // Update the game's difficulty based on elapsed time

  fill(255);
  textSize(18);
  let elapsedTime = ((millis() - startTime) / 1000).toFixed(1); // Round to 1 decimal place
  text(`Time: ${int(elapsedTime)}s`, 200, 35); // Display at the bottom left

  if (currentBlock) {
    drawShape(currentBlock, blockPos.x, blockPos.y);
  } else {
    newBlock();
  }

  // Display the score
  fill(255); // Set fill color for text to white
  textSize(18); // Set text size
  text(`Score: ${score}`, 10, 30); // Display the score at the top left
}

// Define the Tetris shapes and their colors
const shapes = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "cyan",
  },
  J: {
    matrix: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0],
    ],
    color: "blue",
  },
  L: {
    matrix: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ],
    color: "orange",
  },
  O: {
    matrix: [
      [4, 4],
      [4, 4],
    ],
    color: "yellow",
  },
  S: {
    matrix: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ],
    color: "green",
  },
  T: {
    matrix: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ],
    color: "purple",
  },
  Z: {
    matrix: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ],
    color: "red",
  },
};

function drawBoard() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      fill(getColor(board[y][x]));
      // Draw each cell with a slight margin to create the grid effect
      rect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
  }
}

function drawShape(shape, x, y) {
  for (let i = 0; i < shape.matrix.length; i++) {
    for (let j = 0; j < shape.matrix[i].length; j++) {
      // Use getColor function to determine the block color based on its matrix value
      if (shape.matrix[i][j] !== 0) {
        fill(getColor(shape.matrix[i][j])); // Use getColor for consistency
        rect((x + j) * cellSize, (y + i) * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Initialize the game board with empty spaces
function initBoard() {
  for (let y = 0; y < rows; y++) {
    board[y] = [];
    for (let x = 0; x < cols; x++) {
      board[y][x] = 0;
    }
  }
}

function getColor(value) {
  const colors = {
    0: "black", // Consider black as the background or empty space
    1: "green", // Rastafari green for 'I' block
    2: "gold", // Rastafari gold for 'J' block
    3: "red", // Rastafari red for 'L' block
    4: "darkgreen", // A variant for the 'O' block
    5: "#DAA520", // A darker shade of gold for 'S' block
    6: "#8B0000", // A darker shade of red for 'T' block
    7: "maroon", // Maroon for 'Z' block, a variation of red
  };
  return colors[value] || "black";
}

function newBlock() {
  const keys = Object.keys(shapes);
  const randomShape = keys[Math.floor(Math.random() * keys.length)];
  currentBlock = shapes[randomShape];
  blockPos = { x: Math.floor(cols / 2) - 2, y: 0 }; // Position the block at the top middle of the board
}

// Move the block left
function moveLeft() {
  if (!checkCollision(blockPos.x - 1, blockPos.y)) {
    blockPos.x--;
  }
}

// Move the block right
function moveRight() {
  if (!checkCollision(blockPos.x + 1, blockPos.y)) {
    blockPos.x++;
  }
}

function keyPressed() {
  if (key === "R" || key === "r") {
    resetGame(); // Reset the game when 'R' is pressed
  }
  if (keyCode === DOWN_ARROW) {
    keyStates.down = true;
  } else if (keyCode === LEFT_ARROW) {
    keyStates.left = true;
  } else if (keyCode === RIGHT_ARROW) {
    keyStates.right = true;
  } else if (key === " ") {
    rotateCurrentBlock("clockwise");
  }

  if (keyCode === UP_ARROW) {
    // Assuming SPACE for instant drop
    instantDrop();
  }
  if (key === " ") {
    rotateBlockMatrix("horizontal");
  }
}

function keyReleased() {
  if (keyCode === DOWN_ARROW) {
    keyStates.down = false;
  } else if (keyCode === LEFT_ARROW) {
    keyStates.left = false;
  } else if (keyCode === RIGHT_ARROW) {
    keyStates.right = false;
  }
}

function checkCollision(newX, newY, newMatrix = currentBlock.matrix) {
  if (!currentBlock) return false; // or handle as appropriate for your game logic

  for (let y = 0; y < newMatrix.length; y++) {
    for (let x = 0; x < newMatrix[y].length; x++) {
      if (newMatrix[y][x] !== 0) {
        let boardX = newX + x;
        let boardY = newY + y;

        // Check boundaries
        if (boardX < 0 || boardX >= cols || boardY >= rows) {
          return true; // Collision detected
        }
        // Check for collision with existing blocks on the board
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return true; // Collision detected
        }
      }
    }
  }
  return false; // No collision
}

function lockBlock() {
  for (let y = 0; y < currentBlock.matrix.length; y++) {
    for (let x = 0; x < currentBlock.matrix[y].length; x++) {
      if (currentBlock.matrix[y][x] !== 0) {
        if (currentBlock.matrix[y][x] !== 0) {
          board[blockPos.y + y][blockPos.x + x] = currentBlock.matrix[y][x];
        }

        if (blockPos.y + y < 0) {
          console.log("Game Over"); // Game over condition
          noLoop(); // Stop the game loop
          return;
        }
        // Lock the block into the board
        board[blockPos.y + y][blockPos.x + x] = currentBlock.matrix[y][x];
      }
    }
  }
  // Add line clearing logic here
}

function rotateBlockMatrix(matrix, direction) {
  // Create a deep copy of the matrix to avoid mutating the original
  let newMatrix = matrix.map((arr) => arr.slice());

  // Transpose the matrix
  for (let y = 0; y < newMatrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [newMatrix[x][y], newMatrix[y][x]] = [newMatrix[y][x], newMatrix[x][y]];
    }
  }

  // Reverse each row for a clockwise rotation
  if (direction === "clockwise") {
    newMatrix.forEach((row) => row.reverse());
  } else if (direction === "counterclockwise") {
    newMatrix.reverse(); // Reverse the matrix for a counterclockwise rotation
  }

  return newMatrix;
}

function rotateCurrentBlock(direction) {
  let rotatedMatrix = rotateBlockMatrix(currentBlock.matrix, direction);

  // Check if the rotation would result in a collision
  if (!checkCollision(blockPos.x, blockPos.y, rotatedMatrix)) {
    currentBlock.matrix = rotatedMatrix; // Apply the rotation
  }
}

function checkForCompleteLines() {
  let linesCleared = 0;
  for (let y = rows - 1; y >= 0; y--) {
    let isLineComplete = true;

    for (let x = 0; x < cols; x++) {
      if (board[y][x] === 0) {
        isLineComplete = false;
        break;
      }
    }

    if (isLineComplete) {
      linesCleared++;
      for (let yy = y; yy > 0; yy--) {
        for (let x = 0; x < cols; x++) {
          board[yy][x] = board[yy - 1][x];
        }
      }
      for (let x = 0; x < cols; x++) {
        board[0][x] = 0;
      }
      y++; // Since we've modified the board, check the same line again
    }
  }
  updateScore(linesCleared);
}

function updateScore(linesCleared) {
  const scores = [0, 100, 300, 500, 800]; // Example scoring, 0 lines = 0 points, 1 line = 100 points, etc.
  score += scores[linesCleared];
}

function newBlock() {
  const keys = Object.keys(shapes);
  const randomShape = keys[Math.floor(Math.random() * keys.length)];
  currentBlock = shapes[randomShape];
  blockPos = { x: Math.floor(cols / 2) - 1, y: 0 }; // Adjusted for centering

  // Check if the new block collides immediately upon spawning (indicating game over)
  if (checkCollision(blockPos.x, blockPos.y, currentBlock.matrix)) {
    lose(); // Trigger the lose function if there's a collision
  }
}

function updateFallTimer() {
  // Increment the timer based on the elapsed time since the last frame
  fallTimer += deltaTime / 1000; // Convert deltaTime from milliseconds to seconds

  // Check if it's time to move the block down
  if (fallTimer > fallInterval) {
    moveDown();
    fallTimer = 0; // Reset the timer
  }
}

function moveDown() {
  if (!checkCollision(blockPos.x, blockPos.y + 1, currentBlock.matrix)) {
    blockPos.y += 1;
  } else {
    // Lock the block in place and check for completed lines
    lockBlock();
    checkForCompleteLines();
    newBlock();
  }
}

function updateFallTimer() {
  // Convert deltaTime from milliseconds to seconds
  let delta = deltaTime / 1000;

  // Handle fast drop
  let interval = keyStates.down ? fallInterval / 10 : fallInterval;

  fallTimer += delta;
  horizontalMoveTimer += delta;

  if (fallTimer > interval) {
    moveDown();
    fallTimer = 0;
  }

  // Handle continuous left/right movement
  if (horizontalMoveTimer > horizontalMoveInterval) {
    if (keyStates.left) {
      moveLeft();
    }
    if (keyStates.right) {
      moveRight();
    }
    horizontalMoveTimer = 0; // Reset timer after moving
  }
}

function instantDrop() {
  while (!checkCollision(blockPos.x, blockPos.y + 1, currentBlock.matrix)) {
    blockPos.y++;
  }
  lockBlock();
  checkForCompleteLines();
  newBlock();
}

function lose() {
  console.log("Game Over"); // Log a game over message to the console
  noLoop(); // Stop the draw loop, effectively pausing the game
  // Here, you could also display a game over message on the canvas
  fill(255); // Set fill color to white
  textSize(25); // Set text size
  textAlign(CENTER, CENTER); // Align text to be centered
  text("Game Over.", width / 2, height / 2.2);
  text("Press R to play again.", width / 2, height / 2);
  text("Your score was " + score, width / 2, height / 1.8);
}

function resetGame() {
  initBoard(); // Reinitialize the game board
  score = 0; // Reset the score to 0
  newBlock(); // Start a new block
  loop(); // Restart the draw loop if previously stopped
}

function updateDifficulty() {
  let elapsedTime = (millis() - startTime) / 1000; // Convert milliseconds to seconds
  // Example difficulty adjustment: increase level every 30 seconds
  let newLevel = Math.floor(elapsedTime / 30);
  levelSpeedFactor = 1 - newLevel * 0.1; // Increase speed by reducing the interval

  fallInterval = 0.5 * levelSpeedFactor; // Adjust fallInterval based on the level speed factor
}
