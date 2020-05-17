// Colours
const COLOUR_BACKGROUND = "mintcream";
const COLOUR_FRAME = "dodgerblue";
const COLOUR_FRAME_BOTTOM = "royalblue";
const COLOUR_PLAYER = "yellow";
const COLOUR_PLAYER_BORDER = "olive";
const COLOUR_COMPUTER = "red";
const COLOUR_COMPUTER_BORDER = "dakred";

// Frame measurements
const MARGIN = 0.02;
const GRID_COLS = 7;
const GRID_ROWS = 6;
const GRID_DIAMETER = 0.7;

// Game variables.
let grid = [],
  playerTurn,
  gameOver;

// Cell class
class Cell {
  // Initialise Cell properties.
  constructor(left, top, width, height, row, col) {
    this.bottom = top + height;
    this.left = left;
    this.right = left + width;
    this.top = top;
    this.radius = (width * GRID_DIAMETER) / 2;
    this.cx = left + width / 2; // centre on x-axis
    this.cy = top + height / 2; // centre on y-axis
    this.width = width;
    this.height = height;

    this.row = row;
    this.col = col;

    this.highlight = null;
    this.owner = null;
  }

  // Return the cell which contains x and y.
  contains(x, y) {
    return x < this.right && x > this.left && y < this.bottom && y > this.top;
  }

  // Draw the hole.
  draw(context) {
    // Set token colour.
    let colour =
      this.owner === null
        ? COLOUR_BACKGROUND
        : this.owner
        ? COLUR_PLAYER
        : COLOR_COMPUTER;

    // Draw the token.
    context.fillStyle = colour;
    context.beginPath();
    context.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    context.fill();

    // Add highlighting.
    if (this.highlight !== null) {
      // Set the colour.
      colour = this.highlight ? COLOUR_PLAYER : COLOR_COMPUTER;

      // Draw the border.
      context.lineWidth = this.radius / 4;
      context.strokeStyle = colour;
      context.beginPath();
      context.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
  }
}

// Initialise the canvas and context.
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

// Set the canvas dimensions and context scale.
let width, height, margin;
setDimensions();

// Resize the canvas whenever the window is resized.
window.addEventListener("resize", setDimensions);

// Track mouse movements to handle highlighting.
canvas.addEventListener("mousemove", highlightGrid);

// Game loop
let deltaTime, lastTime;
requestAnimationFrame(gameLoop);

function setDimensions() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.height = height;
  canvas.width = width;
  margin = MARGIN * Math.min(width, height);

  newGame();
}

function newGame() {
  playerTurn = Math.random() < 0.5;
  gameOver = false;

  createGrid();
}

function createGrid() {
  grid = [];
  let cell, marginX, marginY;

  // Portrait
  if (((width - margin * 2) * GRID_ROWS) / GRID_COLS < height - margin * 2) {
    cell = (width - margin * 2) / GRID_COLS;
    marginX = margin;
    marginY = (height - cell * GRID_ROWS) / 2;
  }
  // Landscape
  else {
    cell = (height - margin * 2) / GRID_ROWS;
    marginX = (width - cell * GRID_COLS) / 2;
    marginY = margin;
  }

  // Populate the grid
  for (let i = 0; i < GRID_ROWS; i++) {
    grid[i] = [];

    for (let j = 0; j < GRID_COLS; j++) {
      let left = marginX + j * cell;
      let top = marginY + i * cell;

      grid[i][j] = new Cell(left, top, cell, cell, i, j);
    }
  }
}

function gameLoop(currTime) {
  // Set last time.
  if (!lastTime) lastTime = currTime;

  // Calculate time difference.
  deltaTime = currTime - lastTime / 1000;
  lastTime = currTime;

  // Update

  // Draw
  drawBackground();
  drawGrid();

  // Next frame
  requestAnimationFrame(gameLoop);
}

function drawBackground() {
  context.fillStyle = COLOUR_BACKGROUND;
  context.fillRect(0, 0, width, height);
}

function drawGrid() {
  // Draw frame.
  let cell = grid[0][0];
  let frameW = cell.width * GRID_COLS;
  let frameH = cell.height * GRID_ROWS;

  context.fillStyle = COLOUR_FRAME;
  context.fillRect(cell.left, cell.top, frameW, frameH);

  // Draw the base of the frame.
  context.fillStyle = COLOUR_FRAME_BOTTOM;
  context.fillRect(
    cell.left - margin / 2,
    cell.top + frameH - margin / 2,
    frameW + margin,
    margin
  );

  // Draw cells.
  for (let row of grid) {
    for (let cell of row) {
      cell.draw(context);
    }
  }
}

function highlightGrid(event) {
  if (!playerTurn || gameOver) {
    return;
  }

  highlightCell(event.x, event.y);
}

function highlightCell(x, y) {
  let col = null;
  for (let row of grid) {
    for (let cell of row) {
      // Clear existing highlighting.
      cell.highlight = null;

      // Get the required column.
      if (cell.contains(x, y)) {
        col = cell.col;
      }
    }
  }

  // If the column is not found.
  if (col === null) {
    return;
  }

  // Highlight bottom-most empty cell in the column.
  for (let i = GRID_ROWS - 1; i >= 0; i--) {
    if (grid[i][col].owner === null) {
      grid[i][col].highlight = playerTurn;

      // Return the highlighted cell for the AI.
      return grid[i][col];
    }
  }

  return null;
}
