const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 8;
const ROWS = 8;
const SIZE = 50;

const COLORS = ["red", "orange", "yellow", "green", "blue", "purple"];

let board = [];
let selected = null;
let animating = false;

/* --------------------
   初期化
-------------------- */
function init() {
  board = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      row.push(randomTile());
    }
    board.push(row);
  }
  removeInitialMatches();
  draw();
}

function randomTile() {
  return {
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    offsetY: 0,
  };
}

/* --------------------
   描画
-------------------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = board[y][x];
      if (!tile) continue;

      ctx.fillStyle = tile.color;
      ctx.fillRect(
        x * SIZE,
        y * SIZE + tile.offsetY,
        SIZE - 2,
        SIZE - 2
      );
    }
  }

  if (selected) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      selected.x * SIZE + 2,
      selected.y * SIZE + 2,
      SIZE - 6,
      SIZE - 6
    );
  }
}

/* --------------------
   入力
-------------------- */
canvas.addEventListener("click", (e) => {
  if (animating) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / SIZE);
  const y = Math.floor((e.clientY - rect.top) / SIZE);

  if (!selected) {
    selected = { x, y };
  } else {
    const dx = Math.abs(selected.x - x);
    const dy = Math.abs(selected.y - y);

    if (dx + dy === 1) {
      swap(selected.x, selected.y, x, y);
      selected = null;
    } else {
      selected = { x, y };
    }
  }
  draw();
});

/* --------------------
   ゲームロジック
-------------------- */
function swap(x1, y1, x2, y2) {
  [board[y1][x1], board[y2][x2]] =
    [board[y2][x2], board[y1][x1]];

  if (!checkMatches()) {
    // マッチしなければ戻す
    setTimeout(() => {
      [board[y1][x1], board[y2][x2]] =
        [board[y2][x2], board[y1][x1]];
      draw();
    }, 200);
  } else {
    resolveMatches();
  }
}

function checkMatches() {
  return findMatches().length > 0;
}

function findMatches() {
  const matches = [];

  // 横
  for (let y = 0; y < ROWS; y++) {
    let count = 1;
    for (let x = 1; x <= COLS; x++) {
      if (
        x < COLS &&
        board[y][x] &&
        board[y][x - 1] &&
        board[y][x].color === board[y][x - 1].color
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x: x - 1 - i, y });
          }
        }
        count = 1;
      }
    }
  }

  // 縦
  for (let x = 0; x < COLS; x++) {
    let count = 1;
    for (let y = 1; y <= ROWS; y++) {
      if (
        y < ROWS &&
        board[y][x] &&
        board[y - 1][x] &&
        board[y][x].color === board[y - 1][x].color
      ) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matches.push({ x, y: y - 1 - i });
          }
        }
        count = 1;
      }
    }
  }

  return matches;
}

function resolveMatches() {
  animating = true;
  const matches = findMatches();

  matches.forEach(({ x, y }) => {
    board[y][x] = null;
  });

  setTimeout(dropTiles, 200);
}

function dropTiles() {
  for (let x = 0; x < COLS; x++) {
    let pointer = ROWS - 1;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y][x]) {
        board[pointer][x] = board[y][x];
        if (pointer !== y) {
          board[pointer][x].offsetY = (y - pointer) * SIZE;
        }
        pointer--;
      }
    }
    for (let y = pointer; y >= 0; y--) {
      board[y][x] = randomTile();
      board[y][x].offsetY = -SIZE * (pointer - y + 1);
    }
  }

  animateDrop();
}

function animateDrop() {
  let done = true;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = board[y][x];
      if (tile && tile.offsetY !== 0) {
        tile.offsetY *= 0.6;
        if (Math.abs(tile.offsetY) < 1) {
          tile.offsetY = 0;
        } else {
          done = false;
        }
      }
    }
  }

  draw();

  if (!done) {
    requestAnimationFrame(animateDrop);
  } else if (checkMatches()) {
    setTimeout(resolveMatches, 200);
  } else {
    animating = false;
  }
}

function removeInitialMatches() {
  while (checkMatches()) {
    const matches = findMatches();
    matches.forEach(({ x, y }) => {
      board[y][x] = randomTile();
    });
  }
}

/* --------------------
   起動
-------------------- */
init();
