class Canvas {
  constructor(game) {
    this.canvas = document.getElementById("game-of-life");
    this.ctx = this.canvas.getContext("2d");
    this.cellSize = 10;
    this.game = game;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.offsetX = this.canvas.width / 2 - this.cellSize / 2;
    this.offsetY = this.canvas.height / 2 - this.cellSize / 2;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.initialOffsetX = 0;
    this.initialOffsetY = 0;

    this.minCellSize = 2;
    this.maxCellSize = 50;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    this.canvas.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.canvas.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.canvas.addEventListener("touchend", this.handleTouchEnd);
    this.canvas.addEventListener("touchcancel", this.handleTouchEnd);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  handleWheel(event) {
    const { deltaY, clientX, clientY } = event;

    const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
    const newCellSize = this.cellSize * zoomFactor;

    if (newCellSize < this.minCellSize || newCellSize > this.maxCellSize) {
      return;
    }

    const mouseX = clientX - this.canvas.getBoundingClientRect().left;
    const mouseY = clientY - this.canvas.getBoundingClientRect().top;

    const worldXBeforeZoom = (mouseX - this.offsetX) / this.cellSize;
    const worldYBeforeZoom = (mouseY - this.offsetY) / this.cellSize;

    this.cellSize = newCellSize;

    this.offsetX = mouseX - worldXBeforeZoom * this.cellSize;
    this.offsetY = mouseY - worldYBeforeZoom * this.cellSize;

    this.draw();
  }

  handleTouchStart(event) {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.isPanning = true;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.initialOffsetX = this.offsetX;
    this.initialOffsetY = this.offsetY;
    this.canvas.style.cursor = "grabbing";
  }

  handleTouchMove(event) {
    if (!this.isPanning || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    this.offsetX = this.initialOffsetX + dx;
    this.offsetY = this.initialOffsetY + dy;
    this.draw();
  }

  handleTouchEnd() {
    this.isPanning = false;
    this.canvas.style.cursor = "grab";
  }

  handleMouseDown(event) {
    this.isPanning = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialOffsetX = this.offsetX;
    this.initialOffsetY = this.offsetY;
    this.canvas.style.cursor = "grabbing";
  }

  handleMouseMove(event) {
    if (!this.isPanning) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.offsetX = this.initialOffsetX + dx;
    this.offsetY = this.initialOffsetY + dy;
    this.draw();
  }

  handleMouseUp() {
    this.isPanning = false;
    this.canvas.style.cursor = "grab";
  }

  handleMouseLeave() {
    this.isPanning = false;
    this.canvas.style.cursor = "grab";
  }

  draw() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);

    this.ctx.strokeStyle = "rgb(90, 90, 90)";
    this.drawGrid();

    this.ctx.fillStyle = "#fff";
    const cellObjects = this.game.getCellObjects();
    for (const cell of cellObjects) {
      this.ctx.fillRect(
        cell.x * this.cellSize,
        cell.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    }
    this.ctx.restore();
  }

  drawGrid() {
    const TILES_X = Math.floor((this.canvas.width + Math.abs(this.offsetX)) / this.cellSize) + 2;
    const TILES_Y = Math.floor((this.canvas.height + Math.abs(this.offsetY)) / this.cellSize) + 2;
    
    for (let x = -Math.abs(this.offsetX); x < TILES_X; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize - 0.5, -this.offsetY);
      this.ctx.lineTo(x * this.cellSize - 0.5, this.canvas.height - this.offsetY);
      this.ctx.stroke();
    }
    for (let y = -Math.abs(this.offsetY); y < TILES_Y; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(-this.offsetX, y * this.cellSize - 0.5);
      this.ctx.lineTo(this.canvas.width - this.offsetX, y * this.cellSize - 0.5);
      this.ctx.stroke();
    }
  }

}


class Game {
  constructor(cells) {
    this.cells = new Set(cells.map(cell => `${cell.x},${cell.y}`));
  }

  getNeighbors(key) {
    const [x, y] = key.split(',').map(Number);
    const neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        neighbors.push(`${x + dx},${y + dy}`);
      }
    }
    return neighbors;
  }

  nextGeneration() {
    const neighborCounts = new Map();

    this.cells.forEach(cell => {
      const neighbors = this.getNeighbors(cell);
      neighbors.forEach(neighbor => {
        neighborCounts.set(neighbor, (neighborCounts.get(neighbor) || 0) + 1);
      });
    });

    const newCells = new Set();
    neighborCounts.forEach((count, cell) => {
      if (this.cells.has(cell) && (count === 2 || count === 3)) {
        newCells.add(cell);
      } else if (!this.cells.has(cell) && count === 3) {
        newCells.add(cell);
      }
    });

    this.cells = newCells;
  }

  getCellObjects() {
    return Array.from(this.cells).map(key => {
      const [x, y] = key.split(',').map(Number);
      return new Cell(x, y);
    });
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const game = new Game([
  new Cell(1, 0),
  new Cell(0, 1),
  new Cell(1, 1),
  new Cell(2, 1),
  new Cell(2, 2),
]);
const canvasInstance = new Canvas(game);
canvasInstance.draw();

window.addEventListener("resize", () => {
  canvasInstance.canvas.width = window.innerWidth;
  canvasInstance.canvas.height = window.innerHeight;
  canvasInstance.draw();
});

setInterval(() => {
  canvasInstance.draw();
  game.nextGeneration();
}, 100);
