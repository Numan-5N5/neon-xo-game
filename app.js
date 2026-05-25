/* ==========================================================================
   NEON TACTICS - CORE APP MOTOR & NETWORKING (VANILLA JS)
   ========================================================================== */

// --- GLOBAL GAME STATE ---
let gameState = {
    board: Array(9).fill(''),
    currentTurn: 'X', // X always plays first
    gameActive: false,
    gameMode: 'local', // 'local', 'ai', 'online'
    aiDifficulty: 'medium', // 'easy', 'medium', 'unbeatable'
    playerSymbol: 'X', // Local player's symbol ('X' or 'O') in AI/Online mode
    rivalName: 'RIVAL',
    scores: { X: 0, O: 0, ties: 0 },
    peer: null,
    conn: null,
    isHost: false,
    soundEnabled: true,
};

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
    [0, 4, 8], [2, 4, 6]             // Diagonal
];

// Cell grid coordinates mapping for winning laser line
const GRID_COORDS = {
    0: { x: 50, y: 50 },   1: { x: 150, y: 50 },  2: { x: 250, y: 50 },
    3: { x: 50, y: 150 },  4: { x: 150, y: 150 }, 5: { x: 250, y: 150 },
    6: { x: 50, y: 250 },  7: { x: 150, y: 250 }, 8: { x: 250, y: 250 }
};

// --- DOM ELEMENTS ---
const elements = {
    screens: {
        menu: document.getElementById('menu-screen'),
        ai: document.getElementById('ai-screen'),
        lobby: document.getElementById('online-lobby-screen'),
        game: document.getElementById('game-screen')
    },
    buttons: {
        local: document.getElementById('btn-local'),
        ai: document.getElementById('btn-ai'),
        online: document.getElementById('btn-online'),
        hostLobby: document.getElementById('btn-host-lobby'),
        joinLobby: document.getElementById('btn-join-lobby'),
        copyCode: document.getElementById('btn-copy-code'),
        sound: document.getElementById('sound-toggle'),
        reset: document.getElementById('btn-reset'),
        disconnect: document.getElementById('btn-disconnect'),
        quit: document.getElementById('btn-quit'),
        backBtns: document.querySelectorAll('.btn-back'),
        toggleManual: document.getElementById('btn-toggle-manual-webrtc'),
        manualHost: document.getElementById('btn-manual-host'),
        manualJoin: document.getElementById('btn-manual-join'),
        manualConnect: document.getElementById('btn-manual-connect'),
        copyManualOutput: document.getElementById('btn-copy-manual-output')
    },
    inputs: {
        joinCode: document.getElementById('join-code-input'),
        manualInput: document.getElementById('manual-offer-textarea'),
        manualOutput: document.getElementById('manual-output-textarea')
    },
    panels: {
        hostCode: document.getElementById('host-code-container'),
        joinStatus: document.getElementById('join-status-container'),
        manualWebrtc: document.getElementById('manual-webrtc-container'),
        manualOutput: document.getElementById('manual-output-section'),
        panelX: document.getElementById('panel-x'),
        panelO: document.getElementById('panel-o'),
        nameX: document.getElementById('name-x'),
        nameO: document.getElementById('name-o'),
        scoreX: document.getElementById('score-x'),
        scoreO: document.getElementById('score-o')
    },
    codeDisplay: document.getElementById('lobby-code-val'),
    joinStatusText: document.getElementById('join-status-text'),
    turnText: document.getElementById('turn-text'),
    board: document.getElementById('board'),
    cells: document.querySelectorAll('.cell'),
    winLine: document.getElementById('win-line'),
    toast: document.getElementById('toast-notification'),
    toastText: document.getElementById('toast-text'),
    soundOnIcon: document.getElementById('sound-on-icon'),
    soundOffIcon: document.getElementById('sound-off-icon'),
    // Chat UI
    chatDrawer: document.getElementById('chat-drawer'),
    chatToggle: document.getElementById('chat-toggle-btn'),
    chatClose: document.getElementById('btn-close-chat'),
    chatBadge: document.getElementById('chat-badge'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatPresets: document.querySelectorAll('.preset-btn')
};

// --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const now = audioCtx.currentTime;
        
        switch (type) {
            case 'click': {
                // High short neomorphic digital click
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'x-place': {
                // Cyber zap
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.12);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                // Add a simple bandpass filter for cyber vibe
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(400, now);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            }
            case 'o-place': {
                // Echo chime
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(650, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'join': {
                // Cyber double-chime ascending
                const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
                notes.forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                    gain.gain.setValueAtTime(0.04, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.25);
                });
                break;
            }
            case 'win': {
                // Retro digital success fanfare
                const fanfare = [
                    { f: 523.25, d: 0.1 },  // C5
                    { f: 659.25, d: 0.1 },  // E5
                    { f: 783.99, d: 0.1 },  // G5
                    { f: 1046.50, d: 0.25 } // C6
                ];
                let timeOffset = 0;
                fanfare.forEach((note) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(note.f, now + timeOffset);
                    gain.gain.setValueAtTime(0.06, now + timeOffset);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + note.d);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + timeOffset);
                    osc.stop(now + timeOffset + note.d);
                    timeOffset += note.d * 0.8;
                });
                break;
            }
            case 'draw': {
                // Decaying buzz
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.35);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(300, now);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
            }
            case 'notify': {
                // Crisp dual synth blip
                [600, 600].forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                    gain.gain.setValueAtTime(0.05, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.08);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.08);
                });
                break;
            }
        }
    } catch (e) {
        console.error('Audio synthesis failed:', e);
    }
}

// --- HTML5 CANVAS NEON CONFETTI CELEBRATION ---
// --- HTML5 CANVAS NEON CONFETTI CELEBRATION ---

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.querySelector("canvas");

    if (!canvas) {
        console.error("Canvas not found!");
        return; // 🔴 STOP execution safely
    }

    const ctx = canvas.getContext("2d");

    let particles = [];
    let animationId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // your rest of confetti code continues...
});

class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 8 + 4;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity - 3; // skewed upward
        this.radius = Math.random() * 3 + 2;
        this.gravity = 0.18;
        this.friction = 0.98;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        
        // Colors mapping to cyber theme
        const colors = [
            '#00f0ff', // Cyber Blue
            '#ff007f', // Cyber Pink
            '#a855f7', // Cyber Purple
            '#39ff14', // Cyber Green
            '#ffffff'  // Pure glow
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function launchConfetti(count = 100) {
    cancelAnimationFrame(animationId);
    particles = [];
    
    // Spawn centered or scattered at scoreboard heights
    const spawnX = window.innerWidth / 2;
    const spawnY = window.innerHeight * 0.45;
    
    for (let i = 0; i < count; i++) {
        particles.push(new ConfettiParticle(spawnX, spawnY));
    }
    
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, idx) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) {
            particles.splice(idx, 1);
        }
    });
    
    if (particles.length > 0) {
        animationId = requestAnimationFrame(animateConfetti);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// --- NAVIGATION & UI ENGINE ---
function showScreen(screenName) {
    Object.keys(elements.screens).forEach(key => {
        elements.screens[key].classList.remove('active');
    });
    elements.screens[screenName].classList.add('active');
    playSound('click');
}

// Sound toggle
elements.buttons.sound.addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    if (gameState.soundEnabled) {
        elements.soundOnIcon.classList.remove('hidden');
        elements.soundOffIcon.classList.add('hidden');
        playSound('click');
    } else {
        elements.soundOnIcon.classList.add('hidden');
        elements.soundOffIcon.classList.remove('hidden');
    }
});

// Toast System
function showToast(text, type = 'blue', duration = 3000) {
    elements.toastText.textContent = text;
    elements.toast.className = `toast toast-${type} show`;
    playSound('notify');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, duration);
}

// --- CHAT DRAWER SYSTEM ---
elements.chatToggle.addEventListener('click', () => {
    elements.chatDrawer.classList.toggle('open');
    elements.chatBadge.classList.add('hidden');
    elements.chatBadge.textContent = '';
    playSound('click');
});

elements.chatClose.addEventListener('click', () => {
    elements.chatDrawer.classList.remove('open');
    playSound('click');
});

function addChatMessage(text, senderType = 'system', senderName = 'SYS') {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${senderType}`;
    
    if (senderType !== 'system') {
        const senderLabel = document.createElement('span');
        senderLabel.className = 'msg-sender';
        senderLabel.textContent = senderName;
        msgEl.appendChild(senderLabel);
    }
    
    const textLabel = document.createElement('span');
    textLabel.className = 'msg-text';
    textLabel.textContent = text;
    msgEl.appendChild(textLabel);
    
    elements.chatMessages.appendChild(msgEl);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    // If chat drawer is closed, show dynamic badge
    if (!elements.chatDrawer.classList.contains('open') && senderType !== 'system') {
        playSound('notify');
        elements.chatBadge.classList.remove('hidden');
        const currentBadgeVal = parseInt(elements.chatBadge.textContent) || 0;
        elements.chatBadge.textContent = currentBadgeVal + 1;
    }
}

// Preset Quick Send buttons
elements.chatPresets.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        sendChatMessage(text);
        playSound('click');
    });
});

elements.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.chatInput.value.trim();
    if (!text) return;
    
    sendChatMessage(text);
    elements.chatInput.value = '';
});

function sendChatMessage(text) {
    addChatMessage(text, 'sent', 'YOU');
    
    if (gameState.gameMode === 'online' && gameState.conn) {
        gameState.conn.send({
            type: 'CHAT',
            text: text,
            sender: gameState.playerSymbol === 'X' ? 'PLAYER X' : 'PLAYER O'
        });
    }
}

// --- TIC-TAC-TOE GAME ENGINE ---

function setupGameBoard() {
    elements.cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('taken');
    });
    
    elements.winLine.className = 'hidden-line';
    elements.winLine.setAttribute('x1', '0');
    elements.winLine.setAttribute('y1', '0');
    elements.winLine.setAttribute('x2', '0');
    elements.winLine.setAttribute('y2', '0');
    
    gameState.board = Array(9).fill('');
    gameState.currentTurn = 'X';
    document.body.setAttribute('data-turn', 'X');
    gameState.gameActive = true;
    
    updateScoreboardUI();
    updateTurnAnnouncer();
}

function updateScoreboardUI() {
    elements.panels.scoreX.textContent = gameState.scores.X;
    elements.panels.scoreO.textContent = gameState.scores.O;
    
    if (gameState.gameMode === 'ai') {
        elements.panels.nameX.textContent = 'YOU (X)';
        elements.panels.nameO.textContent = `CORE_${gameState.aiDifficulty.toUpperCase()} (O)`;
    } else if (gameState.gameMode === 'online') {
        if (gameState.playerSymbol === 'X') {
            elements.panels.nameX.textContent = 'YOU (X)';
            elements.panels.nameO.textContent = `${gameState.rivalName} (O)`;
        } else {
            elements.panels.nameX.textContent = `${gameState.rivalName} (X)`;
            elements.panels.nameO.textContent = 'YOU (O)';
        }
    } else {
        elements.panels.nameX.textContent = 'PLAYER X';
        elements.panels.nameO.textContent = 'PLAYER O';
    }
}

function updateTurnAnnouncer() {
    // Highlighting active panel card
    if (gameState.currentTurn === 'X') {
        elements.panels.panelX.classList.add('active');
        elements.panels.panelO.classList.remove('active');
    } else {
        elements.panels.panelX.classList.remove('active');
        elements.panels.panelO.classList.add('active');
    }

    if (!gameState.gameActive) return;

    if (gameState.gameMode === 'ai' && gameState.currentTurn === 'O') {
        elements.turnText.textContent = 'SYNTHETIC CORE THINKING...';
        elements.turnText.className = 'turn-announcer pulses';
    } else if (gameState.gameMode === 'online') {
        if (gameState.currentTurn === gameState.playerSymbol) {
            elements.turnText.textContent = 'YOUR TURN. TRANSMIT ACTION.';
            elements.turnText.style.color = gameState.playerSymbol === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)';
        } else {
            elements.turnText.textContent = `WAITING FOR ${gameState.rivalName}...`;
            elements.turnText.style.color = 'var(--text-muted)';
        }
        elements.turnText.className = 'turn-announcer';
    } else {
        elements.turnText.textContent = `PLAYER ${gameState.currentTurn}'S TURN`;
        elements.turnText.style.color = gameState.currentTurn === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)';
        elements.turnText.className = 'turn-announcer';
    }
}

// User clicked cell
elements.cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = parseInt(cell.getAttribute('data-index'));
        
        // Block moves if game inactive, tile taken, or not player's turn in AI/online modes
        if (!gameState.gameActive || gameState.board[index] !== '') return;
        
        if (gameState.gameMode === 'ai' && gameState.currentTurn === 'O') return;
        
        if (gameState.gameMode === 'online' && gameState.currentTurn !== gameState.playerSymbol) {
            showToast("IT IS NOT YOUR TURN!", 'orange');
            return;
        }
        
        executeMove(index);
        
        // Transmit moves if in online room
        if (gameState.gameMode === 'online' && gameState.conn) {
            gameState.conn.send({
                type: 'MOVE',
                index: index
            });
        }
    });
});

function executeMove(index) {
    const symbol = gameState.currentTurn;
    gameState.board[index] = symbol;
    
    const cell = elements.cells[index];
    cell.classList.add('taken');
    
    // Inject custom self-drawing inline SVG
    if (symbol === 'X') {
        cell.innerHTML = `
            <svg class="symbol-svg svg-x" viewBox="0 0 100 100">
                <line x1="15" y1="15" x2="85" y2="85" />
                <line x1="85" y1="15" x2="15" y2="85" />
            </svg>
        `;
        playSound('x-place');
    } else {
        cell.innerHTML = `
            <svg class="symbol-svg svg-o" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" />
            </svg>
        `;
        playSound('o-place');
    }
    
    checkGameOutcome();
    
    if (gameState.gameActive) {
        // Toggle Turn
        gameState.currentTurn = gameState.currentTurn === 'X' ? 'O' : 'X';
        document.body.setAttribute('data-turn', gameState.currentTurn);
        updateTurnAnnouncer();
        
        // Trigger AI Opponent if active
        if (gameState.gameMode === 'ai' && gameState.currentTurn === 'O') {
            setTimeout(triggerAIMove, 650); // Small realistic delay for UI flow
        }
    }
}

function checkGameOutcome() {
    let winInfo = null;
    
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
        const [a, b, c] = WINNING_COMBOS[i];
        if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
            winInfo = { winner: gameState.board[a], combo: [a, b, c] };
            break;
        }
    }
    
    if (winInfo) {
        gameState.gameActive = false;
        triggerWinSlash(winInfo.combo, winInfo.winner);
        
        // Update score
        gameState.scores[winInfo.winner]++;
        updateScoreboardUI();
        
        // Display outcome
        let resultMsg = "";
        if (gameState.gameMode === 'ai') {
            resultMsg = winInfo.winner === 'X' ? 'MATRIX CRACKED. YOU WIN!' : 'SYNTHETIC CORE DOMINATES. SYSTEM LOST.';
        } else if (gameState.gameMode === 'online') {
            resultMsg = winInfo.winner === gameState.playerSymbol ? 'GRID CONQUERED. VICTORY CAPTURED!' : 'GRID ENVELOPE SURRENDERED. RIVAL WINS.';
        } else {
            resultMsg = `PLAYER ${winInfo.winner} TRIUMPHS!`;
        }
        
        elements.turnText.textContent = resultMsg;
        elements.turnText.className = 'turn-announcer';
        elements.turnText.style.color = winInfo.winner === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)';
        
        playSound('win');
        launchConfetti(120);
        return;
    }
    
    // Check Tie
    if (!gameState.board.includes('')) {
        gameState.gameActive = false;
        gameState.scores.ties++;
        
        elements.turnText.textContent = "SYNCHRONIZATION TIE. DUAL DEADLOCK.";
        elements.turnText.style.color = "var(--text-muted)";
        elements.turnText.className = 'turn-announcer';
        
        playSound('draw');
        return;
    }
}

function triggerWinSlash(combo, winner) {
    const startCoord = GRID_COORDS[combo[0]];
    const endCoord = GRID_COORDS[combo[2]];
    
    // Set glowing colors
    const glowColor = winner === 'X' ? 'var(--neon-blue)' : 'var(--neon-pink)';
    elements.winLine.style.setProperty('--win-glow-color', glowColor);
    elements.winLine.setAttribute('stroke', winner === 'X' ? '#00f0ff' : '#ff007f');
    
    elements.winLine.setAttribute('x1', startCoord.x);
    elements.winLine.setAttribute('y1', startCoord.y);
    elements.winLine.setAttribute('x2', endCoord.x);
    elements.winLine.setAttribute('y2', endCoord.y);
    
    elements.winLine.className = 'draw-line';
}

// Reset Match
elements.buttons.reset.addEventListener('click', () => {
    if (gameState.gameMode === 'online' && gameState.conn) {
        // Offer rematch to online player
        gameState.conn.send({ type: 'RESET_REQUEST' });
        showToast("REMATCH REQUESTED. AWAITING RIVAL...", 'blue');
        playSound('click');
    } else {
        setupGameBoard();
        playSound('click');
    }
});

// Quit Match
elements.buttons.quit.addEventListener('click', () => {
    if (gameState.gameMode === 'online') {
        cleanOnlineState();
    }
    showScreen('menu');
});

// Back Buttons
elements.buttons.backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        cleanOnlineState();
        showScreen('menu');
    });
});

// --- SINGLE PLAYER AI MOTOR ---
function triggerAIMove() {
    if (!gameState.gameActive) return;
    
    let moveIndex = -1;
    
    if (gameState.aiDifficulty === 'easy') {
        moveIndex = selectRandomAIMove();
    } else if (gameState.aiDifficulty === 'medium') {
        moveIndex = selectSmartAIMove();
    } else {
        moveIndex = selectMinimaxMove();
    }
    
    if (moveIndex !== -1) {
        executeMove(moveIndex);
    }
}

function selectRandomAIMove() {
    const emptyCells = getEmptyCellIndexes();
    if (emptyCells.length === 0) return -1;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getEmptyCellIndexes() {
    const indices = [];
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') indices.push(i);
    }
    return indices;
}

function selectSmartAIMove() {
    // 1. Can AI win on this turn?
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
        const [a, b, c] = WINNING_COMBOS[i];
        if (gameState.board[a] === 'O' && gameState.board[b] === 'O' && gameState.board[c] === '') return c;
        if (gameState.board[a] === 'O' && gameState.board[c] === 'O' && gameState.board[b] === '') return b;
        if (gameState.board[b] === 'O' && gameState.board[c] === 'O' && gameState.board[a] === '') return a;
    }
    
    // 2. Can player win on next turn? Block it!
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
        const [a, b, c] = WINNING_COMBOS[i];
        if (gameState.board[a] === 'X' && gameState.board[b] === 'X' && gameState.board[c] === '') return c;
        if (gameState.board[a] === 'X' && gameState.board[c] === 'X' && gameState.board[b] === '') return b;
        if (gameState.board[b] === 'X' && gameState.board[c] === 'X' && gameState.board[a] === '') return a;
    }
    
    // 3. Take Center if open
    if (gameState.board[4] === '') return 4;
    
    // 4. Take Corner
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(idx => gameState.board[idx] === '');
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // 5. Random
    return selectRandomAIMove();
}

// --- MINIMAX AI ALGORITHM ---
function selectMinimaxMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'O'; // AI is O
            const score = minimax(gameState.board, 0, false);
            gameState.board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const scores = { O: 10, X: -10, tie: 0 };
    
    const result = evaluateBoardStateForMinimax(board);
    if (result !== null) {
        return scores[result] + (result === 'O' ? -depth : depth); // depth penalty encourages faster wins
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function evaluateBoardStateForMinimax(board) {
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
        const [a, b, c] = WINNING_COMBOS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    if (!board.includes('')) return 'tie';
    return null;
}

// --- SELECTION ROUTING LISTENABLES ---
elements.buttons.local.addEventListener('click', () => {
    gameState.gameMode = 'local';
    gameState.scores = { X: 0, O: 0, ties: 0 };
    elements.chatDrawer.classList.add('hidden');
    elements.buttons.disconnect.classList.add('hidden');
    setupGameBoard();
    showScreen('game');
});

elements.buttons.ai.addEventListener('click', () => {
    showScreen('ai');
});

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameState.gameMode = 'ai';
        gameState.aiDifficulty = btn.getAttribute('data-diff');
        gameState.playerSymbol = 'X';
        gameState.scores = { X: 0, O: 0, ties: 0 };
        elements.chatDrawer.classList.add('hidden');
        elements.buttons.disconnect.classList.add('hidden');
        setupGameBoard();
        showScreen('game');
    });
});

elements.buttons.online.addEventListener('click', () => {
    showScreen('lobby');
});

// --- PEERJS P2P ONLINE MULTIPLAYER ENGINE ---

// Generates NT-XXXX short room codes
function generateRoomCode() {
    const chars = '0123456789ABCDEF';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * 16)];
    }
    return code;
}

// Host Lobby initialization
elements.buttons.hostLobby.addEventListener('click', () => {
    elements.buttons.hostLobby.disabled = true;
    elements.buttons.hostLobby.textContent = "LAUNCHING CORE...";
    playSound('click');
    
    const code = generateRoomCode();
    const fullPeerId = `NT-${code}`;
    
    // Connect to free public PeerJS server
    gameState.peer = new Peer(fullPeerId, {
        debug: 1
    });
    
    gameState.peer.on('open', (id) => {
        console.log('Lobby initialized. Host Peer ID:', id);
        gameState.isHost = true;
        gameState.playerSymbol = 'X'; // Host plays X
        gameState.rivalName = 'RIVAL';
        
        elements.codeDisplay.textContent = code;
        elements.panels.hostCode.classList.add('visible');
        elements.buttons.hostLobby.textContent = "LOBBY SECURED";
    });
    
    gameState.peer.on('connection', (connection) => {
        gameState.conn = connection;
        setupP2PListeners(connection);
    });
    
    gameState.peer.on('error', (err) => {
        console.error('PeerJS error encountered:', err);
        elements.buttons.hostLobby.disabled = false;
        elements.buttons.hostLobby.textContent = "INITIALIZE LOBBY";
        
        if (err.type === 'unavailable-id') {
            // Room code already taken, retry
            elements.buttons.hostLobby.click();
        } else {
            showToast("NETWORK DOCKING FAILED. RETRY OR USE MANUAL PORT.", 'orange');
        }
    });
});

// Join Lobby connection
elements.buttons.joinLobby.addEventListener('click', () => {
    const rawInput = elements.inputs.joinCode.value.trim().toUpperCase();
    if (!rawInput) {
        showToast("PLEASE INPUT A CODE!", 'orange');
        return;
    }
    
    elements.buttons.joinLobby.disabled = true;
    elements.buttons.joinLobby.textContent = "DOCKING...";
    elements.panels.joinStatus.classList.add('visible');
    elements.joinStatusText.textContent = "Synchronizing coordinate channels...";
    playSound('click');
    
    // Prepare peer code
    let code = rawInput;
    if (code.startsWith('NT-')) {
        code = code.substring(3);
    }
    
    // Setup local client peer
    gameState.peer = new Peer({
        debug: 1
    });
    
    gameState.peer.on('open', (localId) => {
        console.log('Local guest peer open. Connecting to host NT-' + code);
        const connection = gameState.peer.connect(`NT-${code}`);
        gameState.conn = connection;
        setupP2PListeners(connection);
    });
    
    gameState.peer.on('error', (err) => {
        console.error('Guest connection error:', err);
        elements.buttons.joinLobby.disabled = false;
        elements.buttons.joinLobby.textContent = "CONNECT";
        elements.panels.joinStatus.classList.remove('visible');
        showToast("FAILED TO ESTABLISH PEER SYNC. RE-CHECK ROOM CODE.", 'orange');
    });
});

function setupP2PListeners(connection) {
    connection.on('open', () => {
        console.log('Direct WebRTC DataChannel active between players.');
        gameState.gameMode = 'online';
        gameState.scores = { X: 0, O: 0, ties: 0 };
        
        if (!gameState.isHost) {
            gameState.playerSymbol = 'O'; // Guest plays O
        }
        
        playSound('join');
        
        // Transition game panels
        elements.chatDrawer.classList.remove('hidden');
        elements.buttons.disconnect.classList.remove('hidden');
        elements.chatMessages.innerHTML = '<div class="chat-msg system"><span class="msg-text">Secure socket initialized. Comms active.</span></div>';
        
        // Transmit Handshake Check
        connection.send({
            type: 'HANDSHAKE',
            symbol: gameState.playerSymbol,
            name: gameState.isHost ? 'HOST' : 'RIVAL'
        });
        
        setTimeout(() => {
            setupGameBoard();
            showScreen('game');
            showToast("DIRECT SYNC SECURED. BATTLE ENGAGED!", 'green');
        }, 1000);
    });
    
    connection.on('data', (data) => {
        console.log('Payload Received:', data);
        
        switch (data.type) {
            case 'HANDSHAKE':
                gameState.rivalName = data.name;
                updateScoreboardUI();
                break;
                
            case 'MOVE':
                if (gameState.currentTurn !== gameState.playerSymbol) {
                    executeMove(data.index);
                }
                break;
                
            case 'CHAT':
                addChatMessage(data.text, 'received', data.sender);
                break;
                
            case 'RESET_REQUEST':
                // Prompt user to accept rematch
                playSound('notify');
                showToast("RIVAL OFFERS DUAL REMATCH! CLICK REBOOT TO ACCEPT.", 'pink', 5000);
                break;
                
            case 'RESET_CONFIRM':
                setupGameBoard();
                showToast("REMATCH LAUNCHED!", 'green');
                break;
        }
    });
    
    connection.on('close', () => {
        console.warn('Online sync disconnected by peer.');
        showToast("RIVAL DETACHED FROM GRID.", 'orange');
        cleanOnlineState();
        showScreen('menu');
    });
    
    connection.on('error', (err) => {
        console.error('Socket stream error:', err);
        showToast("COMMUNICATION STREAM BLOCKED.", 'orange');
        cleanOnlineState();
        showScreen('menu');
    });
}

function cleanOnlineState() {
    // Reset network handles
    if (gameState.conn) {
        try { gameState.conn.close(); } catch (e) {}
        gameState.conn = null;
    }
    if (gameState.peer) {
        try { gameState.peer.destroy(); } catch (e) {}
        gameState.peer = null;
    }
    
    gameState.isHost = false;
    elements.buttons.hostLobby.disabled = false;
    elements.buttons.hostLobby.textContent = "INITIALIZE LOBBY";
    elements.panels.hostCode.classList.remove('visible');
    
    elements.buttons.joinLobby.disabled = false;
    elements.buttons.joinLobby.textContent = "CONNECT";
    elements.panels.joinStatus.classList.remove('visible');
    elements.inputs.joinCode.value = '';
    
    elements.chatDrawer.classList.add('hidden');
    elements.buttons.disconnect.classList.add('hidden');
    
    gameState.gameMode = 'local';
}

elements.buttons.disconnect.addEventListener('click', () => {
    cleanOnlineState();
    showScreen('menu');
});

// --- MANUAL WEBRTC OFFLINE FALLBACK ---
let manualPc = null;
let manualDc = null;

elements.buttons.toggleManual.addEventListener('click', () => {
    elements.panels.manualWebrtc.classList.toggle('visible');
    playSound('click');
});

// Host generates Offer
elements.buttons.manualHost.addEventListener('click', async () => {
    playSound('click');
    gameState.isHost = true;
    gameState.playerSymbol = 'X';
    
    initManualConnection();
    
    manualDc = manualPc.createDataChannel('gameChannel');
    setupManualDataChannelListeners(manualDc);
    
    const offer = await manualPc.createOffer();
    await manualPc.setLocalDescription(offer);
    
    // Output serialized Offer SDP
    elements.inputs.manualOutput.value = btoa(JSON.stringify(offer));
    elements.panels.manualOutput.classList.add('visible');
    showToast("OFFER GENERATED. COPY AND TRANSMIT.", 'blue');
});

// Joiner processes Offer and generates Answer
elements.buttons.manualJoin.addEventListener('click', async () => {
    playSound('click');
    const inputVal = elements.inputs.manualInput.value.trim();
    if (!inputVal) {
        showToast("PASTE RIVAL'S OFFER FIRST!", 'orange');
        return;
    }
    
    gameState.isHost = false;
    gameState.playerSymbol = 'O';
    
    try {
        const decodedOffer = JSON.parse(atob(inputVal));
        if (decodedOffer.type !== 'offer') {
            showToast("INVALID DOCKING OFFER STRING!", 'orange');
            return;
        }
        
        initManualConnection();
        
        await manualPc.setRemoteDescription(decodedOffer);
        const answer = await manualPc.createAnswer();
        await manualPc.setLocalDescription(answer);
        
        // Output serialized Answer SDP
        elements.inputs.manualOutput.value = btoa(JSON.stringify(answer));
        elements.panels.manualOutput.classList.add('visible');
        showToast("ANSWER GENERATED. COPY AND SEND BACK.", 'pink');
    } catch (e) {
        console.error('Manual SDP Join parse error:', e);
        showToast("DECODING PATH FAILED. CHECKSUM INCORRECT.", 'orange');
    }
});

// Host processes Answer and finalizes WebRTC
elements.buttons.manualConnect.addEventListener('click', async () => {
    playSound('click');
    const inputVal = elements.inputs.manualInput.value.trim();
    if (!inputVal) {
        showToast("PASTE RIVAL'S ANSWER STRING!", 'orange');
        return;
    }
    
    try {
        const decodedAnswer = JSON.parse(atob(inputVal));
        if (decodedAnswer.type !== 'answer') {
            showToast("INVALID DOCKING ANSWER STRING!", 'orange');
            return;
        }
        
        await manualPc.setRemoteDescription(decodedAnswer);
        showToast("ANSWER PROCESSED. COMPLETING HANDSHAKE.", 'green');
    } catch (e) {
        console.error('Manual SDP Connect parse error:', e);
        showToast("DECODING PATH FAILED. CHECKSUM INCORRECT.", 'orange');
    }
});

elements.buttons.copyManualOutput.addEventListener('click', () => {
    playSound('click');
    elements.inputs.manualOutput.select();
    document.execCommand('copy');
    showToast("SDP COPIED TO SYSTEM CLIPBOARD!", 'green');
});

function initManualConnection() {
    if (manualPc) {
        try { manualPc.close(); } catch(e) {}
    }
    
    // Set up standard STUN server list so direct connection traverses NAT
    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    
    manualPc = new RTCPeerConnection(configuration);
    
    manualPc.onicecandidate = (event) => {
        if (!event.candidate) {
            // Re-serialize with full candidates populated
            elements.inputs.manualOutput.value = btoa(JSON.stringify(manualPc.localDescription));
        }
    };
    
    if (!gameState.isHost) {
        manualPc.ondatachannel = (event) => {
            manualDc = event.channel;
            setupManualDataChannelListeners(manualDc);
        };
    }
}

function setupManualDataChannelListeners(dataChannel) {
    dataChannel.onopen = () => {
        console.log('Manual direct WebRTC DataChannel active.');
        
        // Wrap the standard manual data channel to mimic the PeerJS connection API
        gameState.gameMode = 'online';
        gameState.scores = { X: 0, O: 0, ties: 0 };
        gameState.conn = {
            send: (payload) => {
                try {
                    dataChannel.send(JSON.stringify(payload));
                } catch(e) {
                    console.error('Manual data channel payload send failed:', e);
                }
            },
            close: () => {
                try { dataChannel.close(); } catch(e) {}
            }
        };
        
        playSound('join');
        
        elements.chatDrawer.classList.remove('hidden');
        elements.buttons.disconnect.classList.remove('hidden');
        elements.chatMessages.innerHTML = '<div class="chat-msg system"><span class="msg-text">Secure socket initialized. Comms active.</span></div>';
        
        gameState.conn.send({
            type: 'HANDSHAKE',
            symbol: gameState.playerSymbol,
            name: gameState.isHost ? 'MANUAL_HOST' : 'MANUAL_RIVAL'
        });
        
        setTimeout(() => {
            setupGameBoard();
            showScreen('game');
            showToast("DIRECT SYNC SECURED. BATTLE ENGAGED!", 'green');
        }, 1000);
    };
    
    dataChannel.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Manual P2P Payload Received:', data);
            
            switch (data.type) {
                case 'HANDSHAKE':
                    gameState.rivalName = data.name;
                    updateScoreboardUI();
                    break;
                    
                case 'MOVE':
                    if (gameState.currentTurn !== gameState.playerSymbol) {
                        executeMove(data.index);
                    }
                    break;
                    
                case 'CHAT':
                    addChatMessage(data.text, 'received', data.sender);
                    break;
                    
                case 'RESET_REQUEST':
                    playSound('notify');
                    showToast("RIVAL OFFERS DUAL REMATCH! CLICK REBOOT TO ACCEPT.", 'pink', 5000);
                    break;
                    
                case 'RESET_CONFIRM':
                    setupGameBoard();
                    showToast("REMATCH LAUNCHED!", 'green');
                    break;
            }
        } catch(e) {
            console.error('Failed to parse manual data channel message:', e);
        }
    };
    
    dataChannel.onclose = () => {
        console.warn('Manual DataChannel closed.');
        showToast("RIVAL DETACHED FROM GRID.", 'orange');
        cleanOnlineState();
        showScreen('menu');
    };
}

// Initialise Application
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");

    // Show main menu initially
    if (typeof elements !== "undefined") {
    elements.screens.menu.classList.add("active");
} else {
    console.log("elements not defined — skipping menu activation");
}

    // Set default body attribute
    document.body.setAttribute("data-turn", "X");

    // Attach click listeners
    const buttons = document.querySelectorAll("div");

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            console.log("Clicked:", btn.innerText);
        });
    });
});