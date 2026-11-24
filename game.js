
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const $ = id => document.getElementById(id);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// GAME VARIABLES
let player;
let enemies = [];
let bullets = [];
let particles = [];
let running = false;

let score = 0;
let kills = 0;
let wave = 1;
let gameTime = 0;
let spawnTimer = 0;
let lastTime = 0;

let playerName = "Cowboy";

const keys = {};
const mouse = { x: 0, y: 0, down: false };

const predators = [
    { emoji: "🐺", name: "Wolf", hp: 2, speed: 1.5, size: 20 },
    { emoji: "🐍", name: "Snake", hp: 1, speed: 2.2, size: 15 },
    { emoji: "🐻", name: "Bear", hp: 5, speed: 0.8, size: 25 },
    { emoji: "🦂", name: "Scorpion", hp: 2, speed: 1.8, size: 17 }
];

// CITY OBJECTS
const buildings = [
    { x: 60, y: 100, w: 150, h: 105, name: "SALOON" },
    { x: 300, y: 80, w: 130, h: 100, name: "STORE" },
    { x: 540, y: 100, w: 150, h: 110, name: "HOTEL" },
    { x: 800, y: 80, w: 130, h: 100, name: "BANK" },
    { x: 120, y: 430, w: 150, h: 105, name: "STABLE" },
    { x: 420, y: 460, w: 140, h: 100, name: "SHERIFF" },
    { x: 720, y: 430, w: 160, h: 110, name: "HOUSE" }
];

function newPlayer() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        speed: 3.5,
        hp: 100,
        size: 17,
        cooldown: 0,
        invincible: 0,
        facing: 0,
        moving: false
    };
}

// INPUT
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", () => mouse.down = true);
window.addEventListener("mouseup", () => mouse.down = false);

// COLLISION WITH BUILDINGS
function insideBuilding(x, y, size) {
    return buildings.some(b =>
        x + size > b.x &&
        x - size < b.x + b.w &&
        y + size > b.y &&
        y - size < b.y + b.h
    );
}

// DRAW CITY
function drawCity() {
    // Desert ground
    ctx.fillStyle = "#b78a4c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground details
    for (let i = 0; i < 100; i++) {
        let x = (i * 137) % canvas.width;
        let y = (i * 239) % canvas.height;

        ctx.fillStyle = "#a87940";
        ctx.fillRect(x, y, 3, 3);
    }

    // Main dusty road
    ctx.fillStyle = "#d4ae76";
    ctx.fillRect(0, canvas.height / 2 - 95, canvas.width, 190);

    // Road lines
    ctx.strokeStyle = "#ad8655";
    ctx.setLineDash([25, 20]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Buildings
    buildings.forEach(b => {
        // Building shadow
        ctx.fillStyle = "#59402a";
        ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);

        // Walls
        ctx.fillStyle = "#d6a66b";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Roof
        ctx.fillStyle = "#743c22";
        ctx.fillRect(b.x - 8, b.y - 15, b.w + 16, 35);

        // Windows
        ctx.fillStyle = "#42291b";
        ctx.fillRect(b.x + 15, b.y + 42, 25, 30);
        ctx.fillRect(b.x + b.w - 40, b.y + 42, 25, 30);

        // Door
        ctx.fillStyle = "#59351e";
        ctx.fillRect(b.x + b.w / 2 - 15, b.y + b.h - 42, 30, 42);

        // Name
        ctx.fillStyle = "#fff0c4";
        ctx.font = "bold 13px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(b.name, b.x + b.w / 2, b.y + 14);
    });

    // Cacti
    for (let i = 0; i < 14; i++) {
        let x = (i * 173 + 70) % canvas.width;
        let y = (i * 127 + 30) % canvas.height;

        ctx.font = "32px Arial";
        ctx.fillText("🌵", x, y);
    }

    // Fences
    ctx.strokeStyle = "#704323";
    ctx.lineWidth = 6;

    for (let i = 0; i < 2; i++) {
        let y = 280 + i * 45;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(canvas.width - 30, y);
        ctx.stroke();
    }

    ctx.textAlign = "left";
}

// DRAW COWBOY
function drawCowboy() {
    if (!player) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Aim direction
    ctx.rotate(player.facing);

    // Gun
    ctx.fillStyle = "#555";
    ctx.fillRect(5, -5, 26, 7);

    // Body
    ctx.fillStyle = "#87451f";
    ctx.fillRect(-12, -8, 25, 25);

    // Head
    ctx.fillStyle = "#e6a56a";
    ctx.beginPath();
    ctx.arc(0, -17, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = "#603516";
    ctx.fillRect(-15, -29, 30, 6);
    ctx.fillRect(-9, -39, 18, 12);

    // Bandana
    ctx.fillStyle = "#b52222";
    ctx.fillRect(-8, -9, 16, 5);

    // Legs
    ctx.fillStyle = "#30221c";
    ctx.fillRect(-10, 14, 7, 12);
    ctx.fillRect(4, 14, 7, 12);

    // Boots
    ctx.fillStyle = "#4b2816";
    ctx.fillRect(-13, 23, 12, 6);
    ctx.fillRect(3, 23, 12, 6);

    ctx.restore();
}

// SPAWN PREDATORS
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);

    let x, y;

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = 10;
    } else if (side === 1) {
        x = canvas.width - 10;
        y = Math.random() * canvas.height;
    } else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height - 10;
    } else {
        x = 10;
        y = Math.random() * canvas.height;
    }

    const type = predators[Math.floor(Math.random() * predators.length)];

    enemies.push({
        x, y,
        emoji: type.emoji,
        hp: type.hp + Math.floor(wave / 4),
        speed: type.speed + wave * 0.06,
        size: type.size
    });
}

// SHOOTING
function shoot() {
    if (player.cooldown > 0) return;

    const angle = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );

    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * 10,
        dy: Math.sin(angle) * 10,
        life: 90
    });

    player.cooldown = 18;
    player.facing = angle;
}

// PARTICLES
function makeParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            life: 25
        });
    }
}

// UPDATE GAME
function update(dt) {
    if (!running) return;

    gameTime += dt;

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    player.moving = dx !== 0 || dy !== 0;

    if (player.moving) {
        const length = Math.hypot(dx, dy);
        dx /= length;
        dy /= length;

        const nextX = player.x + dx * player.speed;
        const nextY = player.y + dy * player.speed;

        if (
            nextX > 20 &&
            nextX < canvas.width - 20 &&
            !insideBuilding(nextX, player.y, player.size)
        ) {
            player.x = nextX;
        }

        if (
            nextY > 45 &&
            nextY < canvas.height - 20 &&
            !insideBuilding(player.x, nextY, player.size)
        ) {
            player.y = nextY;
        }
    }

    player.facing = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );

    if (player.cooldown > 0) player.cooldown--;
    if (player.invincible > 0) player.invincible--;

    if (mouse.down) shoot();

    // Spawn enemies
    spawnTimer += dt;

    if (spawnTimer > Math.max(350, 1400 - wave * 80)) {
        spawnEnemy();
        spawnTimer = 0;
    }

    // Bullets
    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
        b.life--;
    });

    bullets = bullets.filter(b => b.life > 0);

    // Enemies
    enemies.forEach(e => {
        const angle = Math.atan2(
            player.y - e.y,
            player.x - e.x
        );

        let nextX = e.x + Math.cos(angle) * e.speed;
        let nextY = e.y + Math.sin(angle) * e.speed;

        if (!insideBuilding(nextX, nextY, e.size)) {
            e.x = nextX;
            e.y = nextY;
        }

        // Predator touches cowboy
        const distance = Math.hypot(
            player.x - e.x,
            player.y - e.y
        );

        if (distance < player.size + e.size - 5) {
            if (player.invincible <= 0) {
                endGame();
                return;
            }
        }

        // Bullet hits predator
        bullets.forEach(b => {
            if (
                Math.hypot(b.x - e.x, b.y - e.y)
                < e.size + 7
            ) {
                e.hp--;
                b.life = 0;
                makeParticles(e.x, e.y);

                if (e.hp <= 0) {
                    score += 10;
                    kills++;
                }
            }
        });
    });

    enemies = enemies.filter(e => e.hp > 0);

    // Particles
    particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
    });

    particles = particles.filter(p => p.life > 0);

    wave = 1 + Math.floor(gameTime / 20000);

    // Score for survival
    score = kills * 10 + Math.floor(gameTime / 1000);

    $("health").textContent = player.hp;
    $("score").textContent = score;
    $("kills").textContent = kills;
    $("wave").textContent = wave;
}

// DRAW EVERYTHING
function draw() {
    drawCity();

    // Bullets
    bullets.forEach(b => {
        ctx.fillStyle = "#ffdf54";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffdf54";

        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.shadowBlur = 0;

    // Predators
    enemies.forEach(e => {
        ctx.font = `${e.size * 2}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(e.emoji, e.x, e.y + e.size / 2);
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = "#ffd36c";
        ctx.fillRect(p.x, p.y, 5, 5);
    });

    ctx.globalAlpha = 1;

    // Cowboy
    drawCowboy();

    ctx.textAlign = "left";
}

// GAME LOOP
function loop(timestamp) {
    const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// LEADERBOARD
function getLeaderboard() {
    try {
        return JSON.parse(
            localStorage.getItem("wildWestLeaderboard")
        ) || [];
    } catch {
        return [];
    }
}

function saveScore() {
    const board = getLeaderboard();

    board.push({
        name: playerName,
        score: score
    });

    board.sort((a, b) => b.score - a.score);

    localStorage.setItem(
        "wildWestLeaderboard",
        JSON.stringify(board.slice(0, 10))
    );
}

function showLeaderboard() {
    const board = getLeaderboard();
    const list = $("leaderboardList");

    list.innerHTML = "";

    if (board.length === 0) {
        list.textContent = "No records yet. Be the first!";
        return;
    }

    board.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "rank";

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${item.name}`;

        const points = document.createElement("b");
        points.textContent = item.score;

        row.append(name, points);
        list.appendChild(row);
    });
}

// START GAME
function startGame() {
    playerName = $("playerName").value.trim() || "Cowboy";

    player = newPlayer();

    enemies = [];
    bullets = [];
    particles = [];

    score = 0;
    kills = 0;
    wave = 1;
    gameTime = 0;
    spawnTimer = 0;

    running = true;

    $("menu").classList.add("hidden");
    $("leaderboard").classList.add("hidden");
    $("gameOver").classList.add("hidden");
    $("hud").classList.remove("hidden");
}

function endGame() {
    if (!running) return;

    running = false;
    saveScore();

    $("hud").classList.add("hidden");
    $("gameOver").classList.remove("hidden");

    $("finalScore").textContent = score;

    const board = getLeaderboard();
    const position = board.findIndex(
        item => item.name === playerName && item.score === score
    );

    $("recordMessage").textContent =
        position >= 0 && position < 3
        ? "🏆 AMAZING! YOU ARE IN THE TOP 3!"
        : "Keep practicing, cowboy!";
}

// BUTTONS
$("startBtn").addEventListener("click", startGame);

$("restartBtn").addEventListener("click", startGame);

$("menuBtn").addEventListener("click", () => {
    $("gameOver").classList.add("hidden");
    $("menu").classList.remove("hidden");
});

$("leaderboardBtn").addEventListener("click", () => {
    showLeaderboard();
    $("menu").classList.add("hidden");
    $("leaderboard").classList.remove("hidden");
});

$("backBtn").addEventListener("click", () => {
    $("leaderboard").classList.add("hidden");
    $("menu").classList.remove("hidden");
});

// START RENDERING
player = newPlayer();
requestAnimationFrame(loop);

