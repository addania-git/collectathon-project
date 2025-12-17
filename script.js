const canvas = document.getElementById('gameCanvas'); 
const ctx = canvas.getContext('2d');

let move_speed = 3, gravity = 0.5;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');

const birdImg = new Image();
birdImg.src = 'Bird.png';

const birdFlapImg = new Image();
birdFlapImg.src = 'Bird-2.png';

const bgImg = new Image();
bgImg.src = 'background-img.jpg';

const diamondImg = new Image();
diamondImg.src = 'diamond.png';

let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background');
let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

const btnStart = document.getElementById('btnStart');    
const btnLeaderboard = document.getElementById('btnLeaderboard');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardList = document.getElementById('leaderboardList');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const resetLeaderboardBtn = document.getElementById('resetLeaderboard');

// --- State ---
let bird_dy = 0;
let bgPos = 0;
let pipe_separation = 0;
let pipe_gap = 35;
let game_state = 'Start';
console.log('Game script loaded. Initial state:', game_state);

document.body.setAttribute('tabindex', '-1');
document.body.focus();

img.style.display = 'none';
message.classList.add('messageStyle');

let moveLoop, gravityLoop, pipeLoop, bgLoop;

let LAST_RUN_ID = null;

function saveScore(score) {
    const lb = loadLeaderboard();
    const entry = {
        score: Number(score),
        date: new Date().toISOString(),
        runId: Date.now()   // unique id for this run
        };
        lb.push(entry);
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 20))); // keep top 20
        
        LAST_RUN_ID = entry.runId;
    }
    
    const LB_KEY = 'fb_leaderboard';
    
    function loadLeaderboard() {
        try {
            const raw = localStorage.getItem(LB_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.filter(x => typeof x.score === 'number') : [];
        }
        catch {
            return [];
        }
    }
    
    function getTop5() {
        return loadLeaderboard().sort((a, b) => b.score - a.score).slice(0, 5);
    }
    
    function resetLeaderboard() {
        localStorage.removeItem(LB_KEY);
    }
    
    function renderLeaderboard() {
        if (!leaderboardList) return;
        const top5 = getTop5();
        
        leaderboardList.innerHTML = '';
        if (top5.length === 0) {
            leaderboardList.innerHTML = '<li>No scores yet — play a round!</li>';
            return;
        }
        
        top5.forEach((entry, idx) => {
            const li = document.createElement('li');
            const when = new Date(entry.date).toLocaleString();
            const isCurrent = entry.runId && entry.runId === LAST_RUN_ID;

            li.textContent = `${entry.score}  (${when})${isCurrent ? '  (You)' : ''}`;
            if (isCurrent) {
                li.classList.add('lb-current');
            }
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
    
    btnLeaderboard?.addEventListener('click', openLeaderboard);
    closeLeaderboard?.addEventListener('click', closeLeaderboardModal);
    resetLeaderboardBtn?.addEventListener('click', () => { resetLeaderboard(); renderLeaderboard(); });
    
    btnStart?.addEventListener('click', () => {
        if (game_state === 'Start') {
            resetGame();
            game_state = 'Play';
            play();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLeaderboardModal();
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Enter at state:', game_state);
        
        const go = () => {
            resetGame();
            game_state = 'Play';
            document.body.focus();
            play();
        };
        
        if (game_state === 'Start') {
            go();
        } else if (game_state === 'End') {
            go();
        }
    }, true);
    
    function resetGame() {
        cancelAnimationFrame(moveLoop);
        cancelAnimationFrame(gravityLoop);
        cancelAnimationFrame(pipeLoop);
        cancelAnimationFrame(bgLoop);
        
        // Remove pipes and diamonds
        document.querySelectorAll('.pipe_sprite').forEach(el => el.remove());
        document.querySelectorAll('.diamond').forEach(el => el.remove());
        
        // Reset bird
        img.style.display = 'block';
        img.src = 'Bird.png';
        bird.style.top = '40vh';
        bird_dy = 0;
        
        bird_props = bird.getBoundingClientRect();
        
        // Reset background
        bgPos = 0;
        document.querySelector('.background').style.transform = `translateX(0px)`;
        
        pipe_separation = 0;
        
        // Reset score
        score_val.innerHTML = '0';
        score_title.innerHTML = 'Score : ';
        
        message.style.display = 'none';
        message.innerHTML = '';
        document.querySelector('.game-title').style.display = 'none';
        
        leaderboardModal?.classList.add('hidden');
        
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }
    
    // == Bird controls ==
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === ' ') {
            img.src = 'Bird-2.png';
            bird_dy = -7.6;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key === ' ') {
            img.src = 'Bird.png';
        }
    });
    
    // == Play ==
    function play() {
        
        function move() {
            if (game_state !== 'Play') return;
            
            let diamonds = document.querySelectorAll('.diamond');
            diamonds.forEach((diamond) => {
                let diamond_props = diamond.getBoundingClientRect();
                
                if (diamond_props.right <= 0) {
                    diamond.remove();
                } else {
                    
                    // == Collision with bird ==
                    if (
                        bird_props.left < diamond_props.left + diamond_props.width &&
                        bird_props.left + bird_props.width > diamond_props.left &&
                        bird_props.top < diamond_props.top + diamond_props.height &&
                        bird_props.top + bird_props.height > diamond_props.top
                    ){
                        score_val.innerHTML = +score_val.innerHTML + 5; // Bonus points
                        diamond.remove();
                    }
                    diamond.style.left = diamond_props.left - move_speed + 'px';
                }
            });
            
            let pipe_sprite = document.querySelectorAll('.pipe_sprite');
            pipe_sprite.forEach((element) => {
                let pipe_sprite_props = element.getBoundingClientRect();
                bird_props = bird.getBoundingClientRect();
                
                if (pipe_sprite_props.right <= 0) {
                    element.remove();
                } else {
                    
                    // == Collision detection ==
                    if (
                        bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                        bird_props.left + bird_props.width > pipe_sprite_props.left &&
                        bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                        bird_props.top + bird_props.height > pipe_sprite_props.top
                    ){
                        
                        // == Game Over ==
                        game_state = 'End';
                        
                        // == Save score ==
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
                        
                        img.style.display = 'none';
                        
                        const btnViewLbGO = document.getElementById('btnViewLbGO');
                        btnViewLbGO?.addEventListener('click', openLeaderboard);
                        
                        return;
                    
                    } else {
                        
                        // == Score update ==
                        if (
                            pipe_sprite_props.right < bird_props.left &&
                            pipe_sprite_props.right + move_speed >= bird_props.left &&
                            element.increase_score === '1'
                        ){ 
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
        
        // == Bird gravity ==
        function apply_gravity() {
            if (game_state !== 'Play') return;
            bird_dy += gravity;
            
            if (bird_props.top <= 0 || bird_props.bottom >= background.getBoundingClientRect().bottom) {
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
                
                img.style.display = 'none';
                
                const btnViewLbGO = document.getElementById('btnViewLbGO');
                btnViewLbGO?.addEventListener('click', openLeaderboard);
                return;
            }
            
            bird.style.top = bird_props.top + bird_dy + 'px';
            bird_props = bird.getBoundingClientRect();
            gravityLoop = requestAnimationFrame(apply_gravity);
        }
        gravityLoop = requestAnimationFrame(apply_gravity);
        
        // ----- Diamonds -----
        function create_diamond() {
            if (game_state !== 'Play')
                return;
            
            if (Math.random() < 0.008) {
                let diamond = document.createElement('img');
                diamond.src = 'diamond.png';
                diamond.className = 'diamond';
                diamond.style.position = 'absolute';
                diamond.style.width = '40px';
                diamond.style.height = '40px';
                diamond.style.left = '100vw';
                diamond.style.top = Math.floor(Math.random() * 70 + 10) + 'vh'; 
                document.body.appendChild(diamond);
            }
            
            requestAnimationFrame(create_diamond);
        }
        requestAnimationFrame(create_diamond);
        
        // ----- Pipes -----
        function create_pipe() {
            if (game_state !== 'Play')
                return;
            
            if (pipe_separation > 115) {
                pipe_separation = 0;
                let pipe_posi = Math.floor(Math.random() * 43) + 8;
                
                // Top pipe
                let pipe_sprite_inv = document.createElement('div');
                pipe_sprite_inv.className = 'pipe_sprite';
                pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
                pipe_sprite_inv.style.left = '100vw';
                document.body.appendChild(pipe_sprite_inv);
                
                // Bottom pipe
                let pipe_sprite = document.createElement('div');
                pipe_sprite.className = 'pipe_sprite';
                pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
                pipe_sprite.style.left = '100vw';
                pipe_sprite.increase_score = '1';
                document.body.appendChild(pipe_sprite);
            }
            
            pipe_separation++;
            pipeLoop = requestAnimationFrame(create_pipe);
        }
        pipeLoop = requestAnimationFrame(create_pipe);
        
        // ----- Background -----
        function moveBackground() {
            if (game_state !== 'Play') return;
            bgPos -= 0.2;
            document.querySelector('.background').style.transform = `translateX(${bgPos}px)`;
            bgLoop = requestAnimationFrame(moveBackground);
        }
        bgLoop = requestAnimationFrame(moveBackground);
    }