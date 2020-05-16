// Colours
const COLOUR_BACKGROUND = "mintcream";
const COLOUR_FRAME = "dodgerblue";
const COLOUR_FRAME_BOTTOM = "royalblue";
const COLOUR_PLAYER = "yellow";
const COLOUR_PLAYER_BORDER = "olive";
const COLOUR_COMPUTER = "red";
const COLOUR_COMPUTER_BORDER = "dakred";

// Game stuff
const MARGIN = 0.02;
const GRID_COLS = 7;
const GRID_ROWS = 6;
const GRID_DIAMETER = 0.7;
let grid = [];

// Classes
class Cell {
  constructor(left, top, width, height, row, col) {
    this.bottom = top + height;
    this.left = left;
    this.right = left + width;
    this.top = top;
    this.radius = (width * GRID_DIAMETER) / 2;
    // Centre points
    this.cx = left + width / 2;
    this.cy = top + height / 2;

    this.width = width;
    this.height = height;

    this.row = row;
    this.col = col;

    this.owner = null;
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

  context.fillStyle = COLOUR_FRAME_BOTTOM;
  context.fillRect(
    cell.left - margin / 2,
    cell.top + frameH - margin / 2,
    frameW + margin,
    margin
  );
}
