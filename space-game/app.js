let heroX, heroY; // hero의 위치
let bullets = []; // 발사된 총알
let enemies = []; // 적을 저장할 배열
let effects = []; // 충돌 이펙트 저장
let lives = 3; // 플레이어 목숨
let score = 0; // 점수
let isInvincible = false; // 무적 상태
let gameOver = false; // 게임 종료 상태
let victory = false; // 승리 상태
const BULLET_SPEED = 10; // 총알 속도
const ENEMY_SPEED = 0.1; // 적의 속도 (아래로 이동)
const EFFECT_DURATION = 500; // 이펙트 지속 시간(ms)
const INVINCIBLE_DURATION = 3000; // 무적 지속 시간(ms)

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  const heroImg = await loadTexture("assets/player.png");
  const enemyImg = await loadTexture("assets/enemyShip.png");
  const bulletImg = await loadTexture("assets/laserRed.png");
  const effectImg = await loadTexture("assets/laserGreenShot.png");
  const lifeImg = await loadTexture("assets/life.png");
  const pattern = ctx.createPattern(
    await loadTexture("assets/starBackground.png"),
    "repeat"
  );

  // hero 초기 위치 설정
  heroX = canvas.width / 2 - 50;
  heroY = canvas.height - canvas.height / 4;

  // 적 생성
  createEnemies(canvas, enemyImg);

  // 키 입력 이벤트 처리
  window.addEventListener("keydown", (event) => {
    handleKeyPress(event, canvas, ctx, heroImg, bulletImg, pattern);
  });

  /// 애니메이션 루프 시작
  function gameLoop() {
    if (!gameOver && !victory) {
      updateBullets();
      updateEnemies();
      updateEffects();
      detectCollisions(ctx, bulletImg, effectImg);
      drawScene(
        ctx,
        canvas,
        heroImg,
        bulletImg,
        enemyImg,
        effectImg,
        pattern,
        lifeImg
      );
      requestAnimationFrame(gameLoop);
    } else {
      drawEndMessage(ctx, canvas);
    }
  }

  gameLoop();
};

// 적 생성 함수
function createEnemies(canvas, enemyImg) {
  const rows = 4; // 적의 행 수
  const cols = 10; // 적의 열 수
  const spacing = 20; // 적 사이 간격

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push({
        x: 50 + col * (enemyImg.width + spacing),
        y: 50 + row * (enemyImg.height + spacing),
        width: enemyImg.width,
        height: enemyImg.height,
      });
    }
  }
}

// 화면 업데이트
function drawScene(
  ctx,
  canvas,
  heroImg,
  bulletImg,
  enemyImg,
  effectImg,
  pattern,
  lifeImg
) {
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // hero와 작은 hero 그리기
  if (isInvincible) {
    if (Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.drawImage(heroImg, heroX, heroY, 100, 100);
      ctx.drawImage(heroImg, heroX - 45, heroY + 30, 30, 30);
      ctx.drawImage(heroImg, heroX + 115, heroY + 30, 30, 30);
    }
  } else {
    ctx.drawImage(heroImg, heroX, heroY, 100, 100);
    ctx.drawImage(heroImg, heroX - 45, heroY + 30, 30, 30);
    ctx.drawImage(heroImg, heroX + 115, heroY + 30, 30, 30);
  }

  // 총알 그리기
  bullets.forEach((bullet) => {
    ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // 적 그리기
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // 충돌 이펙트 그리기
  effects.forEach((effect) => {
    ctx.drawImage(effectImg, effect.x, effect.y, effect.width, effect.height);
  });

  // 라이프 그리기
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(
      lifeImg,
      canvas.width - (i + 1) * 40,
      canvas.height - 40,
      30,
      30
    );
  }

  // 점수 그리기
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Points: " + score, 10, canvas.height - 10);
}

// 총알 업데이트
function updateBullets() {
  bullets = bullets.filter((bullet) => bullet.y > 0); // 화면 밖으로 나간 총알 제거
  bullets.forEach((bullet) => {
    bullet.y -= BULLET_SPEED; // 총알 이동
  });
}

// 적 업데이트
function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.y += ENEMY_SPEED; // 적 아래로 이동
  });

  if (enemies.length === 0) {
    victory = true;
  }
}

// 충돌 이펙트 업데이트
function updateEffects() {
  const now = Date.now();
  effects = effects.filter(
    (effect) => now - effect.startTime < EFFECT_DURATION
  );
}

// 충돌 감지
function detectCollisions(ctx, bulletImg, effectImg) {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        // 충돌 발생 시
        effects.push({
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
          startTime: Date.now(),
        });

        // 총알과 적 제거
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);

        // 점수 증가
        score += 100;
      }
    });
  });

  enemies.forEach((enemy, eIndex) => {
    if (
      !isInvincible &&
      heroX < enemy.x + enemy.width &&
      heroX + 100 > enemy.x &&
      heroY < enemy.y + enemy.height &&
      heroY + 100 > enemy.y
    ) {
      // 플레이어와 적 충돌 시
      lives -= 1;
      enemies.splice(eIndex, 1);

      if (lives > 0) {
        isInvincible = true;
        setTimeout(() => {
          isInvincible = false;
        }, INVINCIBLE_DURATION);
      } else {
        // 게임 오버 처리
        gameOver = true;
      }
    }
  });
}

// 키 입력 처리
function handleKeyPress(event, canvas, ctx, heroImg, bulletImg, pattern) {
  event.preventDefault(); // 기본 동작 방지

  if (gameOver || victory) {
    if (event.key === "Enter") {
      restartGame(canvas, ctx, heroImg, bulletImg, pattern);
    }
    return;
  }

  const STEP = 20; // hero 이동 거리

  switch (event.key) {
    case "ArrowUp":
      heroY = Math.max(0, heroY - STEP);
      break;
    case "ArrowDown":
      heroY = Math.min(canvas.height - 100, heroY + STEP);
      break;
    case "ArrowLeft":
      heroX = Math.max(0, heroX - STEP);
      break;
    case "ArrowRight":
      heroX = Math.min(canvas.width - 100, heroX + STEP);
      break;
    case " ": // 스페이스바 입력 시 총알 발사
      fireBullet();
      break;
    default:
      return;
  }
}

// 총알 생성
function fireBullet() {
  // 큰 hero의 총알
  bullets.push({
    x: heroX + 45,
    y: heroY - 25,
    width: 10,
    height: 30,
  });

  // 작은 hero들의 총알
  bullets.push({
    x: heroX - 33,
    y: heroY + 30,
    width: 5,
    height: 15,
  });
  bullets.push({
    x: heroX + 127,
    y: heroY + 30,
    width: 5,
    height: 15,
  });
}

// 게임 종료 메시지 그리기
function drawEndMessage(ctx, canvas) {
  ctx.fillStyle = victory ? "green" : "red";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    victory
      ? "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew"
      : "You died !!! Press [Enter] to start a new game Captain Pew Pew",
    canvas.width / 2,
    canvas.height / 2
  );
}

// 게임 재시작
function restartGame(canvas, ctx, heroImg, bulletImg, pattern) {
  heroX = canvas.width / 2 - 50;
  heroY = canvas.height - canvas.height / 4;
  bullets = [];
  enemies = [];
  effects = [];
  lives = 3;
  score = 0;
  isInvincible = false;
  gameOver = false;
  victory = false;
  createEnemies(canvas, enemyImg);
  requestAnimationFrame(gameLoop);
}
