// --- I18n ---
let translations = {};

// 内嵌语言数据，避免CORS问题
const LANGUAGE_DATA = {
    'en': {
        "title": "Modern Minimalist Tetris",
        "score": "Score",
        "lines": "Lines",
        "level": "Level",
        "next": "Next",
        "game-controls": "Game Controls",
        "move": "Move",
        "accelerate": "Accelerate",
        "rotate": "Rotate",
        "drop": "Drop",
        "pause": "Pause",
        "space-key": "Space",
        "game-over": "Game Over",
        "final-score": "Final Score",
        "restart": "Restart",
        "game-paused": "Game Paused",
        "resume": "Resume",
        "start-game": "Start Game",
        "press-space-to-start": "Press Space to Start"
    },
    'zh-CN': {
        "title": "现代简约俄罗斯方块",
        "score": "分数",
        "lines": "行数",
        "level": "等级",
        "next": "下一个",
        "game-controls": "游戏控制",
        "move": "移动",
        "accelerate": "加速",
        "rotate": "旋转",
        "drop": "瞬落",
        "pause": "暂停",
        "space-key": "空格",
        "game-over": "游戏结束",
        "final-score": "最终分数",
        "restart": "重新开始",
        "game-paused": "游戏暂停",
        "resume": "继续游戏",
        "start-game": "开始游戏",
        "press-space-to-start": "按空格键开始"
    }
};

function loadTranslations(lang) {
    console.log('Loading translations for language:', lang);
    
    if (LANGUAGE_DATA[lang]) {
        translations = LANGUAGE_DATA[lang];
        console.log('Translations loaded from embedded data');
    } else {
        // 如果语言不存在，回退到英文
        translations = LANGUAGE_DATA['en'];
        console.warn(`Language ${lang} not found, falling back to English`);
    }
    
    translatePage();
    updateLanguageSwitcher(lang);
}

function translatePage() {
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
    
    // Also update the title
    if (translations.title) {
        document.title = translations.title;
    }
    // Update dynamic text in modals if they are visible
    updateDynamicText();
}

function updateLanguageSwitcher(lang) {
    const langEn = document.getElementById('lang-en');
    const langZhCN = document.getElementById('lang-zh-CN');
    
    langEn.classList.remove('active');
    langZhCN.classList.remove('active');
    
    if (lang === 'en') {
        langEn.classList.add('active');
    } else if (lang === 'zh-CN') {
        langZhCN.classList.add('active');
    }
}

function updateDynamicText() {
    if (isGameOver) {
        modalTitle.textContent = translations['game-over'] || "Game Over";
        restartButton.textContent = translations.restart || "Restart";
    } else if (isPaused) {
        modalTitle.textContent = translations['game-paused'] || "Game Paused";
        restartButton.textContent = translations['resume'] || "Resume";
    }
}

function getLanguage() {
    const savedLang = localStorage.getItem('language');
    
    if (savedLang) {
        return savedLang;
    }

    // 根据浏览器语言自动判断
    const browserLang = navigator.language || navigator.userLanguage;
    console.log('Browser language detected:', browserLang);
    
    if (browserLang.startsWith('zh')) {
        return 'zh-CN';
    }
    return 'en';
}

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    loadTranslations(lang);
}


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
let gameStarted = false;

// --- Animation State ---
let isClearing = false;
let clearingLines = [];
let clearingAnimationTime = 0;

// --- Particle System ---
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = (Math.random() - 0.5) * 8; // 水平速度
        this.velocityY = Math.random() * -5 - 2; // 向上的速度
        this.gravity = 0.3; // 重力
        this.life = 1.0; // 生命值
        this.decay = Math.random() * 0.02 + 0.015; // 衰减速度
        this.size = Math.random() * 4 + 2; // 粒子大小
        this.rotation = Math.random() * Math.PI * 2; // 旋转角度
        this.rotationSpeed = (Math.random() - 0.5) * 0.2; // 旋转速度
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.velocityX *= 0.98; // 空气阻力
    }
    
    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制方形粒子
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        // 添加发光效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// --- Utility Functions ---
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createParticlesForLine(lineY) {
    for (let x = 0; x < COLS; x++) {
        if (board[lineY][x]) {
            const blockColor = board[lineY][x];
            // 为每个方块生成多个粒子
            for (let i = 0; i < 8; i++) {
                const particleX = x * BLOCK_SIZE + Math.random() * BLOCK_SIZE;
                const particleY = lineY * BLOCK_SIZE + Math.random() * BLOCK_SIZE;
                particles.push(new Particle(particleX, particleY, blockColor));
            }
        }
    }
}

function updateParticles() {
    // 更新所有粒子
    particles.forEach(particle => particle.update());
    
    // 移除死亡的粒子
    particles = particles.filter(particle => !particle.isDead());
}

function drawParticles() {
    particles.forEach(particle => particle.draw(context));
}

function getRandomPiece() {
    const type = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
    const pieceData = PIECES[type];
    return {
        shape: pieceData.shape.map(row => [...row]), // 创建shape的深拷贝，避免修改原始模板
        color: getComputedStyle(document.documentElement).getPropertyValue(pieceData.color.slice(4, -1)).trim(),
        x: Math.floor(COLS / 2) - Math.floor(pieceData.shape[0].length / 2),
        y: 0,
        type: type // 添加type字段用于调试
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
                let blockColor = value;
                
                // 如果正在清行动画，为待清除行添加闪烁效果
                if (isClearing && clearingLines.includes(y)) {
                    const flashInterval = 100; // 闪烁间隔ms
                    const currentTime = Date.now();
                    const flashPhase = Math.floor(currentTime / flashInterval) % 2;
                    
                    if (flashPhase === 0) {
                        // 闪烁时变白色
                        blockColor = '#ffffff';
                    }
                }
                
                drawBlock(context, x, y, blockColor);
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

    // Draw start game message if game hasn't started
    if (!gameStarted && !isGameOver) {
        context.save();
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#fff';
        context.font = 'bold 18px Roboto, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        const startText = translations['press-space-to-start'] || '按空格键开始';
        context.fillText(startText, canvas.width / 2, canvas.height / 2);
        context.restore();
    }
    
    // Draw particles (always on top)
    drawParticles();
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
    // 找到需要清除的行
    const linesToClear = [];
    for (let y = ROWS - 1; y >= 0; y--) {
        let fullLine = true;
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                fullLine = false;
                break;
            }
        }
        if (fullLine) {
            linesToClear.push(y);
        }
    }
    
    if (linesToClear.length > 0) {
        // 开始清行动画
        clearLinesWithAnimation(linesToClear);
    }
}

function clearLinesWithAnimation(linesToClear) {
    // 标记动画状态
    isClearing = true;
    clearingLines = linesToClear;
    clearingAnimationTime = 0;
    
    // 为每行生成粒子效果
    linesToClear.forEach(lineY => {
        createParticlesForLine(lineY);
    });
    
    // 立即更新显示以开始动画
    drawBoard();
    
    // 800ms后真正清除行（增加时间让粒子效果更完整）
    setTimeout(() => {
        clearLinesImmediate(linesToClear);
    }, 800);
}

function clearLinesImmediate(linesToClear) {
    // 真正清除行
    linesToClear.sort((a, b) => b - a); // 从下往上清除
    linesToClear.forEach(lineY => {
        const row = board.splice(lineY, 1)[0].fill(0);
        board.unshift(row);
    });
    
    // 更新分数
    const linesCleared = linesToClear.length;
    const linePoints = [0, 40, 100, 300, 1200];
    score += linePoints[linesCleared] * level;
    lines += linesCleared;

    if (lines >= level * 10) {
        level++;
        dropInterval = Math.max(150, 1000 - (level - 1) * 75);
    }
    
    // 清除动画状态
    isClearing = false;
    clearingLines = [];
    clearingAnimationTime = 0;
    
    updateUI();
}

function resetPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    updateUI(); // 每次重置方块时更新UI，确保下一个方块显示正确
    
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
     // resetPiece() 已经会调用 updateUI()，所以这里不需要重复调用
}

function move(dir) {
     if(isPaused || isGameOver) return;
     currentPiece.x += dir;
     if (collide(currentPiece, board)) {
         currentPiece.x -= dir;
     }
}

function gameLoop(time = 0) {
    if(isGameOver || !gameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused && !isClearing) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }
    
    // 始终更新粒子（即使游戏暂停或清行中）
    updateParticles();
    
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
    gameStarted = false;
    currentPiece = null;
    nextPiece = null;
    
    // 重置动画状态
    isClearing = false;
    clearingLines = [];
    clearingAnimationTime = 0;
    
    // 清空粒子
    particles = [];
    
    updateUI();
    drawBoard(); // Draw the initial state
}

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    nextPiece = getRandomPiece();
    resetPiece();
    updateUI(); // 确保下一个方块在游戏开始时显示
    lastTime = performance.now();
    gameLoop();
}

function togglePause() {
    if (isGameOver || !gameStarted) return;
    isPaused = !isPaused;
    if (isPaused) {
        modalTitle.textContent = translations['game-paused'] || "Game Paused";
        finalScoreElement.parentNode.style.display = 'none';
        restartButton.textContent = translations['resume'] || "Resume";
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
    gameStarted = false;
    modalTitle.textContent = translations['game-over'] || "Game Over";
    finalScoreElement.textContent = score;
    finalScoreElement.parentNode.style.display = 'block';
    restartButton.textContent = translations.restart || "Restart";
    gameOverModal.classList.add('visible');
}

// --- Event Listeners ---
document.addEventListener('keydown', event => {
    if (!gameStarted) {
        if (event.key === ' ') {
            startGame();
        }
        return;
    }

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
    } else if (event.key.toLowerCase() === 'x' || event.key === 'ArrowUp') {
        rotate(currentPiece);
    } else if (event.key === ' ') {
        hardDrop();
    }
});

restartButton.addEventListener('click', () => {
    gameOverModal.classList.remove('visible');
    init();
});

// --- Start Game ---
window.onload = function() {
    const lang = getLanguage();
    loadTranslations(lang);
    updateLanguageSwitcher(lang);

    // Setup language switcher event listeners
    document.getElementById('lang-en').addEventListener('click', (e) => {
        e.preventDefault();
        setLanguage('en');
    });

    document.getElementById('lang-zh-CN').addEventListener('click', (e) => {
        e.preventDefault();
        setLanguage('zh-CN');
    });

    init();
};

window.onresize = function() {
     const nextCanvasContainer = document.querySelector('#next-piece-canvas').parentNode;
     nextCanvas.width = nextCanvasContainer.clientWidth;
     drawNextPiece();
}

