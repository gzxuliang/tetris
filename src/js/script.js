// --- DOM Elements ---
const canvas = document.getElementById('game-board');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece-canvas');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const modalTitle = document.getElementById('modal-title');

// --- Game Constants ---
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const PIECES = {
    'I': { shape: [[1,1,1,1]], color: 'var(--color-I)' },
    'O': { shape: [[1,1],[1,1]], color: 'var(--color-O)' },
    'T': { shape: [[0,1,0],[1,1,1]], color: 'var(--color-T)' },
    'L': { shape: [[0,0,1],[1,1,1]], color: 'var(--color-L)' },
    'J': { shape: [[1,0,0],[1,1,1]], color: 'var(--color-J)' },
    'S': { shape: [[0,1,1],[1,1,0]], color: 'var(--color-S)' },
    'Z': { shape: [[1,1,0],[0,1,1]], color: 'var(--color-Z)' }
};
const pieceKeys = Object.keys(PIECES);

// --- Game State ---
let board = [];
let currentPiece;
let nextPiece;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;

// --- Utility Functions ---
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function getRandomPiece() {
    const type = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    const pieceData = PIECES[type];
    return {
        shape: pieceData.shape,
        color: getComputedStyle(document.documentElement).getPropertyValue(pieceData.color.slice(4, -1)).trim(),
        x: Math.floor(COLS / 2) - Math.floor(pieceData.shape[0].length / 2),
        y: 0
    };
}

function drawBlock(ctx, x, y, color, blockSize = BLOCK_SIZE) {
    const realX = x * blockSize;
    const realY = y * blockSize;
    
    ctx.fillStyle = color;
    ctx.fillRect(realX, realY, blockSize, blockSize);

    // Add a subtle inner border for definition
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(realX, realY, blockSize, blockSize);
}

function drawBoard() {
    // Clear board
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);


    // Draw grid
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
    context.lineWidth = 1;
    for(let c = 1; c < COLS; c++) {
        context.beginPath();
        context.moveTo(c * BLOCK_SIZE, 0);
        context.lineTo(c * BLOCK_SIZE, canvas.height);
        context.stroke();
    }
    for(let r = 1; r < ROWS; r++) {
        context.beginPath();
        context.moveTo(0, r * BLOCK_SIZE);
        context.lineTo(canvas.width, r * BLOCK_SIZE);
        context.stroke();
    }

    // Draw placed pieces
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
               drawBlock(context, x, y, value);
            }
        });
    });

    // Draw current piece
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(context, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            });
        });
    }
}

function drawNextPiece() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        const pieceSize = 20;
        const offsetX = (nextCanvas.width - shape[0].length * pieceSize) / 2;
        const offsetY = (nextCanvas.height - shape.length * pieceSize) / 2;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(nextContext, x + offsetX / pieceSize, y + offsetY / pieceSize, color, pieceSize);
                }
            });
        });
    }
}

function updateUI() {
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;
    drawNextPiece();
}

function collide(piece, board) {
    const shape = piece.shape;
    const xPos = piece.x;
    const yPos = piece.y;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                let newY = yPos + y;
                let newX = xPos + x;
                if (newY >= ROWS || newX < 0 || newX >= COLS || (board[newY] && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(piece, board) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

function rotate(piece) {
    // Transpose and reverse rows to rotate
    const newShape = piece.shape[0].map((_, colIndex) => piece.shape.map(row => row[colIndex])).reverse();
    
    const originalShape = piece.shape;
    const originalX = piece.x;
    piece.shape = newShape;
    
    // Wall kick logic
    let offset = 1;
    while(collide(piece, board)){
        piece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if(Math.abs(offset) > piece.shape[0].length){
            piece.shape = originalShape; // revert shape
            piece.x = originalX; // revert position
            return;
        }
    }
}

function pieceDrop() {
    if(isPaused || isGameOver) return;
    currentPiece.y++;
    if (collide(currentPiece, board)) {
        currentPiece.y--;
        merge(currentPiece, board);
        resetPiece();
        clearLines();
    }
    dropCounter = 0;
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        const linePoints = [0, 40, 100, 300, 1200];
        score += linePoints[linesCleared] * level;
        lines += linesCleared;

        if (lines >= level * 10) {
            level++;
            dropInterval = Math.max(150, 1000 - (level - 1) * 75);
        }
        updateUI();
    }
}

function resetPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    
    if (collide(currentPiece, board)) {
        gameOver();
    }
}

function hardDrop() {
     if(isPaused || isGameOver) return;
     while(!collide(currentPiece, board)) {
         currentPiece.y++;
     }
     currentPiece.y--;
     merge(currentPiece, board);
     resetPiece();
     clearLines();
     dropCounter = 0;
     updateUI();
}

function move(dir) {
     if(isPaused || isGameOver) return;
     currentPiece.x += dir;
     if (collide(currentPiece, board)) {
         currentPiece.x -= dir;
     }
}

function gameLoop(time = 0) {
    if(isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }
    
    drawBoard();
    requestAnimationFrame(gameLoop);
}

function init() {
    // Setup Canvases
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    
    const nextCanvasContainer = document.querySelector('#next-piece-canvas').parentNode;
    nextCanvas.width = nextCanvasContainer.clientWidth;
    nextCanvas.height = 100;
    
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    isGameOver = false;
    isPaused = false;
    
    nextPiece = getRandomPiece();
    resetPiece();
    
    updateUI();
    gameLoop();
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        modalTitle.textContent = "游戏暂停";
        finalScoreElement.parentNode.style.display = 'none';
        restartButton.textContent = "继续游戏";
        gameOverModal.classList.add('visible');
    } else {
        gameOverModal.classList.remove('visible');
        // To avoid a sudden jump in time after unpausing
        lastTime = performance.now(); 
        gameLoop();
    }
}

function gameOver() {
    isGameOver = true;
    modalTitle.textContent = "游戏结束";
    finalScoreElement.textContent = score;
    finalScoreElement.parentNode.style.display = 'block';
    restartButton.textContent = "重新开始";
    gameOverModal.classList.add('visible');
}

// --- Event Listeners ---
document.addEventListener('keydown', event => {
    if (event.key === 'p' || event.key === 'P') {
         togglePause();
         return;
    }

    if (isPaused || isGameOver) return;

    if (event.key === 'ArrowLeft') {
        move(-1);
    } else if (event.key === 'ArrowRight') {
        move(1);
    } else if (event.key === 'ArrowDown') {
        pieceDrop();
    } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'x') {
        rotate(currentPiece);
    } else if (event.key === ' ') {
        hardDrop();
    }
});

restartButton.addEventListener('click', () => {
    gameOverModal.classList.remove('visible');
    if(isGameOver){
        init();
    } else if (isPaused) {
        togglePause();
    }
});

// --- Start Game ---
window.onload = function() {
    init();
};

window.onresize = function() {
     const nextCanvasContainer = document.querySelector('#next-piece-canvas').parentNode;
     nextCanvas.width = nextCanvasContainer.clientWidth;
     drawNextPiece();
}
