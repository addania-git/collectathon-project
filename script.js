'use strict';
const NAME_KEY = 'fb_player_name';
let CURRENT_PLAYER_NAME = null; 

function getStoredName() {
    try {
        const n = localStorage.getItem(NAME_KEY);
        return n ? String(n) : null;
    }
    catch {
        return null;
    }
}

function setPlayerName(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    CURRENT_PLAYER_NAME = trimmed;
    localStorage.setItem(NAME_KEY, trimmed);
    renderNameBar();
    updateGateUI();
}

function clearPlayerName() {
    CURRENT_PLAYER_NAME = null;
    localStorage.removeItem(NAME_KEY);
    renderNameBar();
    updateGateUI();
}

function hasName() {
    return !!CURRENT_PLAYER_NAME;
}

CURRENT_PLAYER_NAME = getStoredName();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let move_speed = 3, gravity = 0.5;
const bird = document.querySelector('.bird');
const img = document.getElementById('bird-1');

const birdImg = new Image();
birdImg.src = 'src/images/Bird.png';
const birdFlapImg = new Image();
birdFlapImg.src = 'src/images/Bird-2.png';

const bgImg = new Image();
bgImg.src = 'src/images/background-img.jpg';

const diamondImg = new Image();
diamondImg.src = 'src/images/diamond.png';

let bird_props = bird.getBoundingClientRect();
const score_val = document.querySelector('.score_val');
const message = document.querySelector('.message');
const score_title = document.querySelector('.score_title');

const btnStart = document.getElementById('btnStart'); 
const btnLeaderboard = document.getElementById('btnLeaderboard');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardList = document.getElementById('leaderboardList');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const resetLeaderboardBtn = document.getElementById('resetLeaderboard');

const authStatus = document.getElementById('authStatus');
const nameView = document.getElementById('nameView');  
const gameView = document.getElementById('gameView');  
const nameForm = document.getElementById('nameForm');
const playerNameInput = document.getElementById('playerName');
const nameError = document.getElementById('nameError');

function showTitle() {
    const titles = document.querySelectorAll('.game-title');
    titles.forEach(el => { el.style.display = 'block'; });
}

function hideTitle() {
    const titles = document.querySelectorAll('.game-title');
    titles.forEach(el => { el.style.display = 'none'; });
}

/* ===== Views ===== */
function goToGameView() {
    nameView?.classList.add('hidden');
    nameView?.classList.remove('overlay'); 
    gameView?.classList.remove('hidden');
    
    showTitle();
    
    if (img) img.style.display = 'none'; // Bird hidden until play starts
    updateGateUI();
}

function goToNameView() {
    gameView?.classList.add('hidden');
    nameView?.classList.remove('hidden');
    nameView?.classList.remove('overlay'); 
    showTitle();
    
    if (playerNameInput && CURRENT_PLAYER_NAME) {
        playerNameInput.value = CURRENT_PLAYER_NAME;
    }
    playerNameInput?.focus();
}

goToNameView();

/* ===== Game state =====*/
let bird_dy = 0;
let bgPos = 0;
let pipe_separation = 0;
let pipe_gap = 35;       
let game_state = 'Start';
console.log('Game script loaded. Initial state:', game_state);

document.body.setAttribute('tabindex', '-1');
document.body.focus();

if (img) img.style.display = 'none';

let moveLoop, gravityLoop, pipeLoop, bgLoop;
let LAST_RUN_ID = null;

/* ===== Diamonds ===== */
const MAX_DIAMONDS = 4;            
const DIAMOND_COOLDOWN_MS = 900;   
const DIAMOND_CHANCE_PER_PAIR = 0.75; 
let lastDiamondTime = 0;

/* ===== Leaderboard ===== */
const LB_KEY = 'fb_leaderboard';

function loadLeaderboard() {
    try {
        const raw = localStorage.getItem(LB_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr)
        ? arr.filter((x) => x &&
            typeof x.score === 'number' &&
            typeof x.name === 'string' &&
            x.name.trim().length > 0
        ): [];
    }
    catch {
        return [];
    }
}

function resetLeaderboard() {
    localStorage.removeItem(LB_KEY);
}

function saveScore(score) {
    const lb = loadLeaderboard();
    const entry = {
        name: CURRENT_PLAYER_NAME || 'Anonymous',
        score: Number(score),
        date: new Date().toISOString(),
        runId: Date.now(), 
        };
        lb.push(entry);
        
        // Keep up to 100 entries
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 100)));
        
        LAST_RUN_ID = entry.runId;
    }
    
    /* ===== Top 5 Users ===== */
    function getTop5Users() {
        const lb = loadLeaderboard();
        const bestByName = new Map();

        for (const e of lb) {
            if (!e || typeof e.score !== 'number' || !e.name) continue;
            const curr = bestByName.get(e.name);
            if (!curr || e.score > curr.score || (e.score === curr.score && e.date > curr.date)) {
                bestByName.set(e.name, e);
            }
        }
        const arr = Array.from(bestByName.values()).sort((a, b) => b.score - a.score);
        return arr.slice(0, 5);
    }
    
    async function renderLeaderboard() {
        leaderboardList.innerHTML = '';
        
        const top5 = getTop5Users();
        if (!top5.length) {
            leaderboardList.innerHTML = '<li>No scores yet — play a round!</li>';
            return;
        }
        
        top5.forEach((entry) => {
            const li = document.createElement('li');
            const when = new Date(entry.date).toLocaleString();
            const isYou = entry.name === CURRENT_PLAYER_NAME;
            li.textContent = `${entry.name} — ${entry.score} (${when})${isYou ? ' (You)' : ''}`;
            if (isYou && entry.runId === LAST_RUN_ID) li.classList.add('lb-current');
            leaderboardList.appendChild(li);
        });
    }
    
    function openLeaderboard() {
        renderLeaderboard();
        leaderboardModal?.classList.remove('hidden');
    }
    
    function closeLeaderboardModal() {
        leaderboardModal?.classList.add('hidden');
    }
    
    function pauseGame() {
        if (game_state === 'Play') {
            game_state = 'Paused';
            cancelAnimationFrame(moveLoop);
            cancelAnimationFrame(gravityLoop);
            cancelAnimationFrame(pipeLoop);
            cancelAnimationFrame(bgLoop);
        }
    }
    
    let OVERLAY_OPENED_FROM = 'Start';
    
    function openNameOverlay() {
        OVERLAY_OPENED_FROM = game_state; 
        pauseGame();
        hideTitle();                    
        nameView?.classList.remove('hidden');
        nameView?.classList.add('overlay');
        gameView?.classList.add('hidden');
        
        if (playerNameInput) {
            playerNameInput.value = CURRENT_PLAYER_NAME || '';
            playerNameInput.focus();
        }
    }
    
    function closeOverlayToMainPrePlay() {
        nameView?.classList.add('hidden');
        nameView?.classList.remove('overlay');
        gameView?.classList.remove('hidden');
        
        resetGame(); 
        game_state = 'Start';
        showTitle(); 
        if (img) img.style.display = 'none';
        updateGateUI();
        
        OVERLAY_OPENED_FROM = 'Start'; 
    }
    
    function closeOverlayAndAutoStart() {
        nameView?.classList.add('hidden');
        nameView?.classList.remove('overlay');
        gameView?.classList.remove('hidden');
        
        resetGame();
        game_state = 'Play';
        hideTitle();
        if (img) img.style.display = 'block';
        document.body.focus();
        play();
        
        OVERLAY_OPENED_FROM = 'Start';
    }
    
    function renderNameBar() {
        if (hasName()) {
            authStatus.innerHTML = `
            <div class="auth-pill">
            <span>${CURRENT_PLAYER_NAME}</span>
            <button id="btnChangeName">Change</button>
            </div>`
            document.getElementById('btnChangeName')?.addEventListener('click', () => {
                openNameOverlay();
            });
        }
        else {
            authStatus.innerHTML = '';
        }
    }
    
    renderNameBar();
    updateGateUI();
    
    btnLeaderboard?.addEventListener('click', (e) => {
        if (!hasName()) {
            e.preventDefault();
            goToNameView();
            return;
        }
        openLeaderboard();
    });
    
    closeLeaderboard?.addEventListener('click', closeLeaderboardModal);
    resetLeaderboardBtn?.addEventListener('click', () => {
        resetLeaderboard();
        renderLeaderboard();
    });
    
    window.addEventListener(
        'keydown',
        (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            e.stopPropagation();
            
            if (nameView && nameView.classList.contains('overlay') && !nameView.classList.contains('hidden')) {
                return;
            }
            
            if (!hasName()) {
                goToNameView();
                return;
            }
            
            const go = () => {
                resetGame();
                game_state = 'Play';
                
                hideTitle();
                if (img) img.style.display = 'block';
                
                document.body.focus();
                play();
            };
            
            if (game_state === 'Start' || game_state === 'End') {
                go();
            }
        },
        true
    );
    
    btnStart?.addEventListener('click', () => {
        if (!hasName()) {
            goToNameView();
            return;
        }
        if (game_state === 'Start') {
            resetGame();
            game_state = 'Play';
            hideTitle();
            if (img) img.style.display = 'block';
            play();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLeaderboardModal();
    });
    
    nameForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        nameError.style.display = 'none';
        
        const name = playerNameInput.value.trim();
        
        if (!name) {
            nameError.style.color = '#b00020';
            nameError.textContent = 'Please enter your name.';
            nameError.style.display = 'block';
            return;
        }
        if (name.length > 24) {
            nameError.style.color = '#b00020';
            nameError.textContent = 'Name is too long (max 24 characters).';
            nameError.style.display = 'block';
            return;
        }
        
        setPlayerName(name);
        
        if (nameView?.classList.contains('overlay')) {
            if (OVERLAY_OPENED_FROM === 'End') {
                closeOverlayAndAutoStart();  
                }
                else {
                    closeOverlayToMainPrePlay(); // return to main page
                    }
                }
                else {
                    goToGameView();
                }
            });
            
            function updateGateUI() {
                const msg = document.querySelector('.message');
                const startText = msg?.querySelector('.start-text');
                const lbBtn = document.getElementById('btnLeaderboard');
                
                if (!msg || !startText || !lbBtn) return;
                
                if (hasName()) {
                    startText.textContent = 'Press Enter to Start';
                    startText.classList.remove('disabled');
                    lbBtn.classList.remove('disabled');
                    lbBtn.setAttribute('aria-disabled', 'false');
                }
                else {
                    startText.textContent = 'Enter your name to play';
                    startText.classList.add('disabled');
                    lbBtn.classList.add('disabled');
                    lbBtn.setAttribute('aria-disabled', 'true');
                }
            }
            
            function resetGame() {
                cancelAnimationFrame(moveLoop);
                cancelAnimationFrame(gravityLoop);
                cancelAnimationFrame(pipeLoop);
                cancelAnimationFrame(bgLoop);
                
                document.querySelectorAll('.pipe_sprite').forEach((el) => el.remove());
                document.querySelectorAll('.diamond').forEach((el) => el.remove());
                
                if (img) {
                    img.style.display = 'block';   // will be shown only when play starts
                    img.src = 'src/images/Bird.png';
                }
                bird.style.top = '40vh';
                bird_dy = 0;
                bird_props = bird.getBoundingClientRect();
                
                bgPos = 0;
                document.querySelector('.background').style.transform = `translateX(0px)`;
                
                pipe_separation = 0;
                score_val.innerHTML = '0';
                score_title.innerHTML = 'Score : ';
                
                message.style.display = 'none';
                message.innerHTML = '';
                leaderboardModal?.classList.add('hidden');
                
                if (document.activeElement && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
            }
            
            document.addEventListener('keydown', (e) => {
                if (game_state !== 'Play') return; // prevent jumping while not playing
                if (e.key === 'ArrowUp' || e.key === ' ') {
                    if (img) img.src = 'src/images/Bird-2.png';
                    bird_dy = -7.6;
                }
            });
            document.addEventListener('keyup', (e) => {
                if (game_state !== 'Play') return;
                if (e.key === 'ArrowUp' || e.key === ' ') {
                    if (img) img.src = 'src/images/Bird.png';
                }
            });
            
            function play() {
                function move() {
                    if (game_state !== 'Play') return;
                    
                    // Diamonds (collectibles)
                    const diamonds = document.querySelectorAll('.diamond');
                    diamonds.forEach((diamond) => {
                        const diamond_props = diamond.getBoundingClientRect();
                        
                        if (diamond_props.right <= 0) {
                            diamond.remove();
                        }
                        else {
                            // Collision with a small padding tolerance
                            const padding = 4;
                            const birdLeft   = bird_props.left + padding;
                            const birdRight  = bird_props.right - padding;
                            const birdTop    = bird_props.top + padding;
                            const birdBottom = bird_props.bottom - padding;

                            const diaLeft   = diamond_props.left;
                            const diaRight  = diamond_props.right;
                            const diaTop    = diamond_props.top;
                            const diaBottom = diamond_props.bottom;

                            const overlaps =
                            birdLeft < diaRight &&
                            birdRight > diaLeft &&
                            birdTop < diaBottom &&
                            birdBottom > diaTop;
                            
                            if (overlaps) {
                                score_val.innerHTML = +score_val.innerHTML + 5; // Bonus points
                                diamond.remove();
                            }
                            diamond.style.left = diamond_props.left - move_speed + 'px';
                        }
                    });
                    // Pipes
                    const pipe_sprite = document.querySelectorAll('.pipe_sprite');
                    pipe_sprite.forEach((element) => {
                        const pipe_sprite_props = element.getBoundingClientRect();
                        bird_props = bird.getBoundingClientRect();
                        
                        if (pipe_sprite_props.right <= 0) {
                            element.remove();
                        }
                        else {
                            // Collision detection with small tolerance
                            const padding = 4;
                            const birdLeft   = bird_props.left + padding;
                            const birdRight  = bird_props.right - padding;
                            const birdTop    = bird_props.top + padding;
                            const birdBottom = bird_props.bottom - padding;

                            const pipeLeft   = pipe_sprite_props.left;
                            const pipeRight  = pipe_sprite_props.right;
                            const pipeTop    = pipe_sprite_props.top;
                            const pipeBottom = pipe_sprite_props.bottom;

                            const overlaps =
                            birdLeft < pipeRight &&
                            birdRight > pipeLeft &&
                            birdTop < pipeBottom &&
                            birdBottom > pipeTop;
                            
                            if (overlaps) {
                                game_state = 'End'; // Game over
                                saveScore(+score_val.innerHTML); // Save score
                                
                                message.style.display = 'block';
                                message.innerHTML = `
                                <p class="game-over-text">Game Over!</p>
                                <p class="score-text">Your Score: ${score_val.innerHTML}</p>
                                <p class="restart-hint">Press Enter to restart</p>
                                <div style="margin-top:8px;">
                                <button id="btnViewLbGO" class="leaderboard-btn">View Leaderboard</button>
                                </div>
                                `;
                                
                                if (img) img.style.display = 'none';
                                const btnViewLbGO = document.getElementById('btnViewLbGO');
                                btnViewLbGO?.addEventListener('click', openLeaderboard);
                                return;
                            }
                            else {
                                
                                // Score update when passing pipe
                                if (
                                    pipe_sprite_props.right < bird_props.left &&
                                    pipe_sprite_props.right + move_speed >= bird_props.left &&
                                    element.increase_score === '1')
                                    {
                                        score_val.innerHTML = +score_val.innerHTML + 1;
                                        element.increase_score = '0';
                                    }
                                    element.style.left = pipe_sprite_props.left - move_speed + 'px';
                                }
                            }
                        });
                        
                        moveLoop = requestAnimationFrame(move);
                    }
                    moveLoop = requestAnimationFrame(move);
                    
                    // Bird gravity
                    function apply_gravity() {
                        if (game_state !== 'Play')
                            return;

                        bird_dy += gravity;
                        
                        const viewportBottom = window.innerHeight;
                        const viewportTop = 0;
                        
                        if (bird_props.top <= viewportTop || bird_props.bottom >= viewportBottom) {
                            game_state = 'End'; // Game over
                            saveScore(+score_val.innerHTML);
                            
                            message.style.display = 'block';
                            message.innerHTML = `
                            <p class="game-over-text">Game Over!</p>
                            <p class="score-text">Your Score: ${score_val.innerHTML}</p>
                            <p class="restart-hint">Press Enter to restart</p>
                            <div style="margin-top:8px;">
                            <button id="btnViewLbGO" class="leaderboard-btn">View Leaderboard</button>
                            </div>
                            `;
                            
                            if (img) img.style.display = 'none';
                            const btnViewLbGO = document.getElementById('btnViewLbGO');
                            btnViewLbGO?.addEventListener('click', openLeaderboard);
                            return;
                        }
                        
                        bird.style.top = bird_props.top + bird_dy + 'px';
                        bird_props = bird.getBoundingClientRect();
                        gravityLoop = requestAnimationFrame(apply_gravity);
                    }
                    gravityLoop = requestAnimationFrame(apply_gravity);
                    
                    function create_pipe() {
                        if (game_state !== 'Play')
                            return;
                        
                        if (pipe_separation > 115) {
                            pipe_separation = 0;
                            
                            const pipe_posi = Math.floor(Math.random() * 43) + 8; 
                            const pipe_sprite_inv = document.createElement('div');
                            pipe_sprite_inv.className = 'pipe_sprite';
                            pipe_sprite_inv.style.top = (pipe_posi - 70) + 'vh';
                            pipe_sprite_inv.style.left = '100vw';
                            document.body.appendChild(pipe_sprite_inv);
                            
                            const pipe_sprite = document.createElement('div');
                            pipe_sprite.className = 'pipe_sprite';
                            pipe_sprite.style.top = (pipe_posi + pipe_gap) + 'vh';
                            pipe_sprite.style.left = '100vw';
                            pipe_sprite.increase_score = '1';
                            document.body.appendChild(pipe_sprite);
                            
                            const now = performance.now();
                            const activeDiamonds = document.querySelectorAll('.diamond').length;
                            
                            if (
                                activeDiamonds < MAX_DIAMONDS &&
                                (now - lastDiamondTime) >= DIAMOND_COOLDOWN_MS &&
                                Math.random() < DIAMOND_CHANCE_PER_PAIR)
                                {
                                    const diamond = document.createElement('img');
                                    diamond.src = 'src/images/diamond.png';
                                    diamond.className = 'diamond';
                                    diamond.style.position = 'absolute';
                                    diamond.style.width = '40px';
                                    diamond.style.height = '40px';
                                    diamond.style.left = 'calc(100vw + 6vw + 24px)'; 
                                    
                                    const vhPerPx = 100 / window.innerHeight;  
                                    const diamondVh = 40 * vhPerPx;           
                                    const gapTopVh = pipe_posi;
                                    const gapBotVh = pipe_posi + pipe_gap;
                                    const marginVh = 2;
                                    const topMinVh = gapTopVh + marginVh;
                                    const topMaxVh = Math.max(topMinVh, gapBotVh - diamondVh - marginVh);
                                    const diamondTopVh = topMinVh + Math.random() * (topMaxVh - topMinVh);
                                    
                                    diamond.style.top = `${diamondTopVh}vh`;
                                    document.body.appendChild(diamond);
                                    lastDiamondTime = now;
                                }
                            }
                            
                            pipe_separation++;
                            pipeLoop = requestAnimationFrame(create_pipe);
                        }
                        pipeLoop = requestAnimationFrame(create_pipe);
                        
                        function moveBackground() {
                            if (game_state !== 'Play') 
                                return;
                            
                            bgPos -= 0.2;
                            
                            const bgEl = document.querySelector('.background');
                            if (bgEl) {
                                bgEl.style.transform = `translateX(${bgPos}px)`;  
                            }
                            bgLoop = requestAnimationFrame(moveBackground);
                        }
                    }