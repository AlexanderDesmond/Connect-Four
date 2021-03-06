// Colours
const COLOUR_BACKGROUND = "mintcream";
const COLOUR_FRAME = "dodgerblue";
const COLOUR_FRAME_BOTTOM = "royalblue";
const COLOUR_PLAYER = "yellow";
const COLOUR_PLAYER_DARK = "olive";
const COLOUR_COMPUTER = "red";
const COLOUR_COMPUTER_DARK = "darkred";
const COLOUR_DRAW = "darkgrey";
const COLOUR_DRAW_DARK = "black";
const COLOUR_WIN = "black";

// Text
const TEXT_COMPUTER = "Computer";
const TEXT_PLAYER = "Player";
const TEXT_DRAW = "DRAW";
const TEXT_WIN = "WINS!";

// Frame measurements
const MARGIN = 0.02;
const GRID_COLS = 7;
const GRID_ROWS = 6;
const GRID_DIAMETER = 0.7;
const DELAY_COMP = 0.5;

// Game state variables.
let grid = [],
  playerTurn,
  gameOver,
  gameTied,
  timeComp;

// Cell class
class Cell {
  // Initialise Cell properties.
  constructor(left, top, width, height, row, col) {
    // Cell dimensions and measurements
    this.bottom = top + height;
    this.left = left;
    this.right = left + width;
    this.top = top;
    this.radius = (width * GRID_DIAMETER) / 2;
    this.cx = left + width / 2; // centre on x-axis
    this.cy = top + height / 2; // centre on y-axis
    this.width = width;
    this.height = height;

    // Cell rows / columns
    this.row = row;
    this.col = col;

    // Cell state
    this.highlight = null;
    this.owner = null;
    this.winner = false;
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
        ? COLOUR_PLAYER
        : COLOUR_COMPUTER;

    // Draw the token.
    context.fillStyle = colour;
    context.beginPath();
    context.arc(this.cx, this.cy, this.radius, 0, Math.PI * 2);
    context.fill();

    // Add highlighting.
    if (this.winner || this.highlight !== null) {
      // Set the colour.
      colour = this.winner
        ? COLOUR_WIN
        : this.highlight
        ? COLOUR_PLAYER
        : COLOUR_COMPUTER;

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

// Handle mouse clicks.
canvas.addEventListener("click", click);

// Game loop
let deltaTime, lastTime;
requestAnimationFrame(gameLoop);

// Set canvas dimensions.
function setDimensions() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.height = height;
  canvas.width = width;
  margin = MARGIN * Math.min(width, height);

  newGame();
}

// Start a new game.
function newGame() {
  playerTurn = Math.random() < 0.5;
  gameOver = false;
  gameTied = false;

  createGrid();
}

// Create the Connect Four game grid.
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

// The game loop
function gameLoop(currTime) {
  // Set last time.
  if (!lastTime) lastTime = currTime;

  // Calculate time difference.
  deltaTime = currTime - lastTime / 1000;
  lastTime = currTime;

  // Update
  goComputer(deltaTime);

  // Draw
  drawBackground();
  drawGrid();
  drawText();

  // Next frame
  requestAnimationFrame(gameLoop);
}

// Handle AI
function goComputer(deltaTime) {
  if (playerTurn || gameOver) return;

  // Computer pauses before it makes a move.
  if (timeComp > 0) {
    timeComp -= deltaTime;
    if (timeComp <= 0) {
      selectCell();
    }
    return;
  }

  // Set options.
  let options = [];
  options[0] = []; // Computer wins.
  options[1] = []; // Block player from winning.
  options[2] = []; // No significance.
  options[3] = []; // Give away a win.

  // Go through columns to determine options.
  let cell;
  for (let i = 0; i < GRID_COLS; i++) {
    cell = highlightCell(grid[0][i].cx, grid[0][i].cy);

    // If the column is full, go to the next column.
    if (cell === null) {
      continue;
    }

    // Check for first options.
    cell.owner = playerTurn;
    if (checkWin(cell.row, cell.col)) {
      options[0].push(i);
    } else {
      // Check for second options.
      cell.owner = !playerTurn;
      if (checkWin(cell.row, cell.col)) {
        options[1].push(i);
      } else {
        cell.owner = playerTurn;

        // Make sure there is a cell above.
        if (cell.row > 0) {
          grid[cell.row - 1][cell.col].owner = !playerTurn;

          // Check for fourth options - don't let player win.
          if (checkWin(cell.row - 1, cell.col)) {
            options[3].push(i);
          }

          // Check for third options - no significance
          else {
            options[2].push(i);
          }

          // Deselect cell above
          grid[cell.row - 1][cell.col].owner = null;
        }
        // No row above, no significant move available.
        else {
          options[2].push(i);
        }
      }
    }

    // Cancel highlight and selection.
    cell.highlight = null;
    cell.owner = null;
  }

  // Clear the winning cells.
  for (let row of grid) {
    for (let cell of row) {
      cell.winner = false;
    }
  }

  // Randomly select a column in priority order.
  let col;
  if (options[0].length > 0) {
    col = options[0][Math.floor(Math.random() * options[0].length)];
  } else if (options[1].length > 0) {
    col = options[1][Math.floor(Math.random() * options[1].length)];
  } else if (options[2].length > 0) {
    col = options[2][Math.floor(Math.random() * options[2].length)];
  } else if (options[3].length > 0) {
    col = options[3][Math.floor(Math.random() * options[3].length)];
  }

  // Highlight selected cell.
  highlightCell(grid[0][col].cx, grid[0][col].cy);

  // Set delay.
  timeComp = DELAY_COMP;
}

// Draw the background
function drawBackground() {
  context.fillStyle = COLOUR_BACKGROUND;
  context.fillRect(0, 0, width, height);
}

// Draw the Connect Four frame and cells
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

// Handle the drawing of end game text
function drawText() {
  if (!gameOver) return;

  // Set up text.
  let textSize = grid[0][0].height;
  context.fillStyle = gameTied
    ? COLOUR_DRAW
    : playerTurn
    ? COLOUR_PLAYER
    : COLOUR_COMPUTER;
  context.font = textSize + "px dejavu sans mono";
  context.lineJoin = "round";
  context.lineWidth = textSize / 10;
  context.strokeStyle = gameTied
    ? COLOUR_DRAW_DARK
    : playerTurn
    ? COLOUR_PLAYER_DARK
    : COLOUR_COMPUTER_DARK;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Draw text.
  let text = gameTied ? TEXT_DRAW : playerTurn ? TEXT_PLAYER : TEXT_COMPUTER;
  if (gameTied) {
    context.strokeText(text, width / 2, height / 2);
    context.fillText(text, width / 2, height / 2);
  } else {
    // Set offset
    let offset = textSize * 0.55;

    // Player / Computer
    context.strokeText(text, width / 2, height / 2 - offset);
    context.fillText(text, width / 2, height / 2 - offset);

    // Wins
    context.strokeText(TEXT_WIN, width / 2, height / 2 + offset);
    context.fillText(TEXT_WIN, width / 2, height / 2 + offset);
  }
}

// Handle the highlighting of winning cells
function highlightGrid(event) {
  if (!playerTurn || gameOver) {
    return;
  }

  highlightCell(event.x, event.y);
}

// Highlight cell
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

// Handle clicking.
function click(event) {
  if (gameOver) {
    newGame();
    return;
  }

  if (!playerTurn) {
    return;
  }

  selectCell();
}

// Handle selection of cells.
function selectCell() {
  let highlighting = false;

  // Allow player to place a token in a cell.
  OUTER: for (let row of grid) {
    for (let cell of row) {
      if (cell.highlight !== null) {
        highlighting = true;
        cell.highlight = null;
        cell.owner = playerTurn;

        if (checkWin(cell.row, cell.col)) {
          gameOver = true;
        }

        break OUTER;
      }
    }
  }

  // Prohibit clicking on cells which are not empty.
  if (!highlighting) {
    return;
  }

  // Check to see if there is a draw.
  if (!gameOver) {
    gameTied = true;
    OUTER: for (let row of grid) {
      for (let cell of row) {
        if (cell.owner === null) {
          gameTied = false;
          break OUTER;
        }
      }
    }

    // Set game over.
    if (gameTied) {
      gameOver = true;
    }
  }

  // Switch player.
  if (!gameOver) {
    playerTurn = !playerTurn;
  }
}

// Check if the game is finished.
function checkWin(row, col) {
  // Get all the cells from each possible direction.
  let horiz = [],
    vert = [],
    diagL = [],
    diagR = [];
  for (i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      // Horizontal
      if (i === row) {
        horiz.push(grid[i][j]);
      }

      // Vertical
      if (j === col) {
        vert.push(grid[i][j]);
      }

      // Diagonal, top-left to bottom-right
      if (i - j === row - col) {
        diagL.push(grid[i][j]);
      }

      // Diagonal, top-right to bottom-left
      if (i + j === row + col) {
        diagR.push(grid[i][j]);
      }
    }
  }

  // If any direction has four identical tokens in a row, the game has been won.
  return (
    connectFour(horiz) ||
    connectFour(vert) ||
    connectFour(diagL) ||
    connectFour(diagR)
  );
}

// Check if there are four identical tokens in a row
function connectFour(cells = []) {
  let count = 0,
    lastOwner = null,
    fourCells = [];

  for (let i = 0; i < cells.length; i++) {
    // If the next cell is empty, reset the counter.
    if (cells[i].owner === null) {
      count = 0;
      fourCells = [];
    }

    // If the next cell has a token belonging to the same owner,
    // increment the count and push the token to the array.
    else if (cells[i].owner === lastOwner) {
      count++;
      fourCells.push(cells[i]);
    }

    // If the next cell has a token belonging to a different owner,
    // set the count to 1, clear the array of previous entries, then push the token to the array.
    else {
      count = 1;
      fourCells = [];
      fourCells.push(cells[i]);
    }

    // Set the last owner.
    lastOwner = cells[i].owner;

    // Handle win condition.
    if (count === 4) {
      for (let cell of fourCells) {
        cell.winner = true;
      }
      return true;
    }
  }

  return false;
}
