const canvas = document.getElementById('gameCanvas'); // Add this in HTML too
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

// Bird properties
let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background');
let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');

let bird_dy = 0;
let bgPos = 0;
let pipe_separation = 0;
let pipe_gap = 35;
let game_state = 'Start';

img.style.display = 'none';
message.classList.add('messageStyle');

// Animation IDs for canceling old loops
let moveLoop, gravityLoop, pipeLoop, bgLoop;

// Start or Restart Game
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && game_state === 'Start') {
            resetGame();
            game_state = 'Play';
            play();
        }
});

function resetGame() {
    // Cancel old loops
    cancelAnimationFrame(moveLoop);
    cancelAnimationFrame(gravityLoop);
    cancelAnimationFrame(pipeLoop);
    cancelAnimationFrame(bgLoop);

    // Remove pipes
    document.querySelectorAll('.pipe_sprite').forEach(el => el.remove());

    // Reset bird
    img.style.display = 'block';
    img.src = 'Bird.png';
    bird.style.top = '40vh';
    bird_dy = 0;

    // Reset background
    bgPos = 0;
    document.querySelector('.background').style.transform = `translateX(0px)`;

    // Reset score
    score_val.innerHTML = '0';
    score_title.innerHTML = 'Score : ';

    // Hide ALL messages
    message.style.display = 'none';
    document.querySelector('.game-title').style.display = 'none';
}

// Bird control
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

function play() {
    // Move pipes
    function move() {
        if (game_state !== 'Play') return;

        let diamonds = document.querySelectorAll('.diamond');
        diamonds.forEach((diamond) => {
            let diamond_props = diamond.getBoundingClientRect();

            if (diamond_props.right <= 0) {
                diamond.remove();
            } else {
                // Collision with bird
                if (
                    bird_props.left < diamond_props.left + diamond_props.width &&
                    bird_props.left + bird_props.width > diamond_props.left &&
                    bird_props.top < diamond_props.top + diamond_props.height &&
                    bird_props.top + bird_props.height > diamond_props.top
                ) {
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
                // Collision detection
                if (
                    bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                    bird_props.left + bird_props.width > pipe_sprite_props.left &&
                    bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                    bird_props.top + bird_props.height > pipe_sprite_props.top
                ) {
                    game_state = 'End';
                    message.style.display = 'block';
                    message.innerHTML = `
                        <p class="game-over-text">Game Over!</p>
                        <p class="score-text">Your Score: ${score_val.innerHTML}</p>
                    `;
                    img.style.display = 'none';
                    return;
                } else {
                    // Score update
                    if (
                        pipe_sprite_props.right < bird_props.left &&
                        pipe_sprite_props.right + move_speed >= bird_props.left &&
                        element.increase_score === '1'
                    ) {
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

    // Gravity
    function apply_gravity() {
        if (game_state !== 'Play') return;
        bird_dy += gravity;

        if (bird_props.top <= 0 || bird_props.bottom >= background.getBoundingClientRect().bottom) {
            game_state = 'End';
            message.style.display = 'block';
            message.innerHTML = `
                <p class="game-over-text">Game Over!</p>
                <p class="score-text">Your Score: ${score_val.innerHTML}</p>
            `;
            img.style.display = 'none';
            return;
        }

        bird.style.top = bird_props.top + bird_dy + 'px';
        bird_props = bird.getBoundingClientRect();
        gravityLoop = requestAnimationFrame(apply_gravity);
    }
    gravityLoop = requestAnimationFrame(apply_gravity);

    function create_diamond() {
    if (game_state !== 'Play') return;

    if (Math.random() < 0.008) { 
        let diamond = document.createElement('img');
        diamond.src = 'diamond.png'; 
        diamond.className = 'diamond';
        diamond.style.position = 'absolute';
        diamond.style.width = '40px';
        diamond.style.height = '40px';
        diamond.style.left = '100vw';
        diamond.style.top = Math.floor(Math.random() * 70 + 10) + 'vh'; // Random vertical position
        document.body.appendChild(diamond);
    }

    requestAnimationFrame(create_diamond);
}
requestAnimationFrame(create_diamond);

    // Create pipes
    function create_pipe() {
        if (game_state !== 'Play') return;

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

    // Background movement
    function moveBackground() {
        if (game_state !== 'Play') return;
        bgPos -= 0.2;
        document.querySelector('.background').style.transform = `translateX(${bgPos}px)`;
        bgLoop = requestAnimationFrame(moveBackground);
    }
    bgLoop = requestAnimationFrame(moveBackground);
}