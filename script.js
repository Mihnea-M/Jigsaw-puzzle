const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const resetImageBtn = document.getElementById("resetImage");
const startGameBtn = document.getElementById("startGame");
const debugModeBtn = document.getElementById("debugMode");
const timerDisplay = document.getElementById("timer");
let img = new Image();
let pieces = [];
let draggingPiece = null;
let offsetX, offsetY;
let timer = null;
let timeElapsed = 0;
let debugMode = false;
let gameRunning = false;

// Load sound files
const pickUpSound = new Audio("sounds/pickup-piece.mp3");
const dropSound = new Audio("sounds/drop-piece.mp3");

resetImageBtn.addEventListener("click", loadRandomImage);
startGameBtn.addEventListener("click", startGame);
debugModeBtn.addEventListener("click", toggleDebugMode);
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);

function loadRandomImage() {
  gameRunning = false;
  const randomImageUrl = `https://picsum.photos/800/600?random=${Math.random()}`;
  img.crossOrigin = "Anonymous";
  img.src = randomImageUrl;
  img.onload = function () {
    canvas.width = window.innerWidth;
    canvas.height = Math.min(img.height * 1.5, window.innerHeight - 100);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      (canvas.width - img.width) / 2,
      (canvas.height - img.height) / 2
    );
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (canvas.width - img.width) / 2,
      (canvas.height - img.height) / 2,
      img.width,
      img.height
    );

    clearInterval(timer);
    timeElapsed = 0;
    timerDisplay.textContent = `Time: ${timeElapsed}s`;
    startGameBtn.disabled = false;
  };
}

function startGame() {
  if (img.complete) {
    sliceImage(4, 4);
    startGameBtn.disabled = true;
    timeElapsed = 0;
    timerDisplay.textContent = `Time: ${timeElapsed}s`;
    timer = setInterval(() => {
      timeElapsed++;
      timerDisplay.textContent = `Time: ${timeElapsed}s`;
    }, 1000);
    gameRunning = true;
  } else {
    alert("Please wait for the image to load.");
  }
}

function toggleDebugMode() {
  debugMode = !debugMode;
  debugModeBtn.textContent = debugMode ? "Debug Mode: ON" : "Debug Mode: OFF";
  if (!debugMode) {
    clearDebugInfo();
  }
}

function clearDebugInfo() {
  ctx.clearRect(0, 0, canvas.width, 20);
  renderPieces();
}

function sliceImage(rows, cols) {
  const pieceWidth = img.width / cols;
  const pieceHeight = img.height / rows;
  pieces = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pieceCanvas = document.createElement("canvas");
      pieceCanvas.width = pieceWidth;
      pieceCanvas.height = pieceHeight;
      const pieceCtx = pieceCanvas.getContext("2d");
      pieceCtx.drawImage(
        img,
        x * pieceWidth,
        y * pieceHeight,
        pieceWidth,
        pieceHeight,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      const scatterSide = Math.random() > 0.5 ? "left" : "right";
      const scatterX =
        scatterSide === "left"
          ? Math.random() * (canvas.width / 2 - pieceWidth)
          : canvas.width / 2 + Math.random() * (canvas.width / 2 - pieceWidth);
      const scatterY = Math.random() * (canvas.height - pieceHeight);

      pieces.push({
        canvas: pieceCanvas,
        x: scatterX,
        y: scatterY,
        correctX: (canvas.width - img.width) / 2 + x * pieceWidth,
        correctY: (canvas.height - img.height) / 2 + y * pieceHeight,
        width: pieceWidth,
        height: pieceHeight,
      });
    }
  }

  renderPieces();
}

function renderPieces() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    (canvas.width - img.width) / 2,
    (canvas.height - img.height) / 2,
    img.width,
    img.height
  );

  const pieceWidth = img.width / 4;
  const pieceHeight = img.height / 4;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(
        (canvas.width - img.width) / 2 + x * pieceWidth,
        (canvas.height - img.height) / 2 + y * pieceHeight,
        pieceWidth,
        pieceHeight
      );
      ctx.strokeRect(
        (canvas.width - img.width) / 2 + x * pieceWidth,
        (canvas.height - img.height) / 2 + y * pieceHeight,
        pieceWidth,
        pieceHeight
      );
    }
  }

  pieces.forEach((piece) => {
    ctx.drawImage(piece.canvas, piece.x, piece.y);
    if (debugMode) {
      ctx.fillStyle = "red";
      ctx.font = "12px Arial";
      ctx.fillText(
        `(${piece.x.toFixed(0)}, ${piece.y.toFixed(0)})`,
        piece.x,
        piece.y - 5
      );
    }
  });

  if (debugMode && draggingPiece) {
    highlightCorrectPosition(draggingPiece);
  }

  if (debugMode) {
    displayMousePosition();
  }
}

function displayMousePosition() {
  canvas.addEventListener("mousemove", (e) => {
    if (!debugMode) return;
    const mousePos = getMousePos(e);
    ctx.fillStyle = "blue";
    ctx.font = "14px Arial";
    ctx.clearRect(0, 0, canvas.width, 20);
    ctx.fillText(
      `Mouse: (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`,
      10,
      15
    );
  });
}

function onMouseDown(e) {
  if (!gameRunning) return;
  const mousePos = getMousePos(e);
  for (let i = pieces.length - 1; i >= 0; i--) {
    if (isMouseOnPiece(mousePos, pieces[i])) {
      draggingPiece = pieces[i];
      offsetX = mousePos.x - draggingPiece.x;
      offsetY = mousePos.y - draggingPiece.y;

      // Move the piece to the end of the array to render it on top
      pieces.splice(i, 1);
      pieces.push(draggingPiece);

      pickUpSound.play();

      break;
    }
  }
}

function onMouseMove(e) {
  if (!gameRunning) return;
  if (draggingPiece) {
    const mousePos = getMousePos(e);
    draggingPiece.x = Math.max(
      0,
      Math.min(mousePos.x - offsetX, canvas.width - draggingPiece.width)
    );
    draggingPiece.y = Math.max(
      0,
      Math.min(mousePos.y - offsetY, canvas.height - draggingPiece.height)
    );
    renderPieces();
  }
}

function onMouseUp(e) {
  if (!gameRunning) return;
  if (draggingPiece) {
    const possiblePosition = getPossiblePosition(draggingPiece);
    if (possiblePosition) {
      draggingPiece.x = possiblePosition.x;
      draggingPiece.y = possiblePosition.y;
      if (checkWinCondition()) {
        clearInterval(timer);
        timerDisplay.textContent = `Congratulations! You completed the puzzle in ${timeElapsed} seconds.`;
        startGameBtn.disabled = false;
        gameRunning = false;
      }
    }
    draggingPiece = null;
    renderPieces();
    dropSound.play();
  }
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function isMouseOnPiece(mousePos, piece) {
  return (
    mousePos.x > piece.x &&
    mousePos.x < piece.x + piece.width &&
    mousePos.y > piece.y &&
    mousePos.y < piece.y + piece.height
  );
}

function getPossiblePosition(piece) {
  const threshold = 20;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const correctX = (canvas.width - img.width) / 2 + x * piece.width;
      const correctY = (canvas.height - img.height) / 2 + y * piece.height;
      if (
        Math.abs(piece.x - correctX) < threshold &&
        Math.abs(piece.y - correctY) < threshold
      ) {
        return { x: correctX, y: correctY };
      }
    }
  }
  return null;
}

function checkWinCondition() {
  return pieces.every(
    (piece) => piece.x === piece.correctX && piece.y === piece.correctY
  );
}

function highlightCorrectPosition(piece) {
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillRect(piece.correctX, piece.correctY, piece.width, piece.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.strokeRect(piece.correctX, piece.correctY, piece.width, piece.height);
}

loadRandomImage();
