window.onload = function () {
  // 캔버스와 컨텍스트 가져오기
  const canvas = document.getElementById("GameCanvas");
  const ctx = canvas.getContext("2d");

  // 배경 이미지 로드
  const backgroundImage = new Image();
  backgroundImage.src = "assets/background.png";

  // 플레이어 이미지 로드
  const playerImage = new Image();
  playerImage.src = "assets/player.png";

  // 플레이어 좌우 이동 이미지를 추가로 로드
  const playerLeftImage = new Image();
  playerLeftImage.src = "assets/playerLeft.png";
  const playerRightImage = new Image();
  playerRightImage.src = "assets/playerRight.png";

  // 레이저 이미지 로드
  const laserImage = new Image();
  laserImage.src = "assets/laserRed.png";

  // 라이프 이미지 로드
  const lifeImage = new Image();
  lifeImage.src = "assets/life.png";

  // 경험치 바 이미지 로드
  const expBarImage = new Image();
  expBarImage.src = "assets/expBar.png";

  // 적 기체 이미지 로드
  const enemyImage = new Image();
  enemyImage.src = "assets/enemyShip.png";

  // 방어막 이미지 로드
  const shieldImage = new Image();
  shieldImage.src = "assets/shield.png";

  // 이펙트 이미지 로드
  const effectImage = new Image();
  effectImage.src = "assets/laserRedShot.png";

  const hpBarImage = new Image();
  hpBarImage.src = "assets/hpBar.png";

  // 보스 이미지 변경
  const bossImage = new Image();
  bossImage.src = "assets/enemyUFO.png";

  // 플레이어 위치 및 크기
  const playerWidth = 100; // 원하는 너비
  const playerHeight = 80; // 원하는 높이
  let playerX = (canvas.width - playerWidth) / 2; // 하단 정중앙
  let playerY = canvas.height - playerHeight - 100; // 하단 정중앙

  // 플레이어 라이프
  let playerLives = 3;

  // 플레이어 경험치 및 레벨
  let playerExp = 0;
  let playerLevel = 0;
  let expForNextLevel = 100; // 초기 레벨업에 필요한 경험치

  // 플레이어 업그레이드 상태
  let laserCooldown = 500; // 초기 레이저 발사 속도
  let supportShips = 0; // 보조 기체 수
  let shield = 0; // 방어막
  let playerDamage = 10; // 플레이어 레이저 공격력 추가

  // 적 기체 배열
  const enemies = [];

  // 적 사망 이펙트를 저장할 배열
  const deathEffects = [];

  // 스테이지, 보스 관련 변수
  let currentStage = 1; // 현재 스테이지
  let bossHits = 0; // 보스가 맞은 횟수
  const maxBossHits = 100; // 보스가 맞아야 하는 횟수

  // 보스 행동 관련 변수
  let lastBossFireTime = 0;
  let bossFireCooldown = 1000; // 초당 1발
  let lastBossDashTime = 0;
  let bossDashCooldown = 5000; // 5초마다 돌진
  let bossMoveSpeed = 2;

  // 보스를 위한 레이저 배열 추가
  const bossLasers = [];

  // 기존 createEnemy 함수 제거 후, 스테이지 적 생성 함수
  function spawnStageEnemies(stage) {
    // 스테이지별 열 갯수 (1스테이지: 3, 2스테이지: 5, 3스테이지: 7)
    const columns = 3 + (stage - 1) * 2;
    const rows = 10; // 각 스테이지에서 적은 10행
    const gap = 10; // 적 사이 간격
    const enemyW = 100; // 적 기체 너비
    const enemyH = 100; // 적 기체 높이

    // 스테이지 적들이 중앙에서 나오도록 시작 X 좌표 조정
    const totalWidth = columns * enemyW + (columns - 1) * gap;
    let startX = (canvas.width - totalWidth) / 2;
    let startY = -enemyH; // 위쪽 영역에서 순차적으로 내려옴

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        enemies.push({
          x: startX + c * (enemyW + gap),
          y: startY - r * (enemyH + gap),
          width: enemyW,
          height: enemyH,
          alive: true,
          isBoss: false,
          hp: 10, // 일반 적 HP 추가
        });
      }
    }
  }

  // 보스 생성 함수
  function spawnBoss() {
    enemies.push({
      x: canvas.width / 2 - 100,
      y: canvas.height / 2 - 100,
      width: 200,
      height: 200,
      alive: true,
      isBoss: true,
      hp: 1000, // 보스 HP 추가
      direction: 1,  // 좌우 이동 방향
    });
    bossHits = 0;
  }

  // 스테이지 진행 체크
  function checkStageProgress() {
    // 현재 남은 적 확인
    const aliveEnemies = enemies.filter((e) => e.alive);
    if (aliveEnemies.length === 0) {
      // 모든 적 처치 시 다음 스테이지
      currentStage++;
      if (currentStage === 4) {
        // 4스테이지 = 보스
        spawnBoss();
      } else if (currentStage > 4) {
        // 보스 처치 후 1스테이지로 재시작
        currentStage = 1;
        enemies.length = 0;
        spawnStageEnemies(currentStage);
      } else {
        spawnStageEnemies(currentStage);
      }
    }
  }

  // 초기 적 기체 생성
  spawnStageEnemies(currentStage);

  // 키 입력 상태 추적
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  };

  // 레이저 배열
  const lasers = [];
  let lastFireTime = 0; // 플레이어 레이저 발사 시간 기록
  let lastSupportFireTime = 0; // 보조 기체 레이저 발사 시간 기록

  // 게임 일시정지 상태
  let isPaused = false;

  // 무적 상태
  let isInvincible = false;
  let invincibleEndTime = 0;

  // 방어막 깜빡임 상태
  let isShieldBlinking = false;
  let shieldBlinkEndTime = 0;

  // 키 다운 이벤트
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "ArrowDown") keys.down = true;
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === " ") keys.space = true;
  });

  // 키 업 이벤트
  window.addEventListener("keyup", function (e) {
    if (e.key === "ArrowUp") keys.up = false;
    if (e.key === "ArrowDown") keys.down = false;
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === " ") keys.space = false;
  });

  // 배경 이미지 로드 완료 시
  backgroundImage.onload = function () {
    // 애니메이션 루프
    function gameLoop(timestamp) {
      if (isPaused) return;

      // 배경 그리기
      const pattern = ctx.createPattern(backgroundImage, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 플레이어 이동
      if (keys.up) playerY = Math.max(0, playerY - 5);
      if (keys.down)
        playerY = Math.min(canvas.height - playerHeight, playerY + 5);
      if (keys.left) playerX = Math.max(0, playerX - 5);
      if (keys.right)
        playerX = Math.min(canvas.width - playerWidth, playerX + 5);

      // 플레이어 레이저 발사
      if (keys.space && timestamp - lastFireTime > laserCooldown) {
        lasers.push({
          x: playerX + playerWidth / 2 - laserImage.width / 2,
          y: playerY,
        });
        lastFireTime = timestamp;
      }

      // 보조 기체 레이저 발사 (플레이어 발사의 절반 속도)
      if (
        keys.space &&
        supportShips > 0 &&
        timestamp - lastSupportFireTime > laserCooldown * 2
      ) {
        // 보조 기체 1
        if (supportShips >= 1) {
          lasers.push({
            x: playerX - 60 + 50 / 2 - laserImage.width / 2,
            y: playerY + 20 + 35 / 2 - laserImage.height / 2,
          });
        }
        // 보조 기체 2
        if (supportShips >= 2) {
          lasers.push({
            x: playerX + 110 + 50 / 2 - laserImage.width / 2,
            y: playerY + 20 + 35 / 2 - laserImage.height / 2,
          });
        }
        lastSupportFireTime = timestamp;
      }

      // 레이저 이동 및 그리기
      for (let i = 0; i < lasers.length; i++) {
        lasers[i].y -= 10;
        ctx.drawImage(laserImage, lasers[i].x, lasers[i].y);

        // 적 기체와 충돌 검사
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (
            enemy.alive &&
            lasers[i].x < enemy.x + enemy.width &&
            lasers[i].x + laserImage.width > enemy.x &&
            lasers[i].y < enemy.y + enemy.height &&
            lasers[i].y + laserImage.height > enemy.y
          ) {
            enemy.hp -= playerDamage; // 적의 HP 깎기
            if (enemy.hp <= 0) {
              enemy.alive = false;
              // 적 처치 시 사망 이펙트 등록
              if (enemy.isBoss) {
                bossHits++;
                if (bossHits >= maxBossHits) {
                  enemy.alive = false;
                }
              } else {
                enemy.alive = false;
              }
              playerExp += 10;
              deathEffects.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                startTime: performance.now(),
                duration: 200, // 2초간 유지
              });

              lasers.splice(i, 1);
              i--;
              checkStageProgress(); // 스테이지 진행 체크
              break;
            }
            // 레이저 제거
            lasers.splice(i, 1);
            i--;
            break;
          }
        }
      }

      // 화면 밖으로 나간 레이저 제거
      while (lasers.length > 0 && lasers[0].y < 0) {
        lasers.shift();
      }

      // 보스 레이저 이동 및 그리기
      for (let i = 0; i < bossLasers.length; i++) {
        bossLasers[i].y += 5; // 보스 레이저 속도 조절
        ctx.drawImage(laserImage, bossLasers[i].x, bossLasers[i].y);

        // 플레이어와의 충돌 검사
        if (
          playerX < bossLasers[i].x + laserImage.width &&
          playerX + playerWidth > bossLasers[i].x &&
          playerY < bossLasers[i].y + laserImage.height &&
          playerY + playerHeight > bossLasers[i].y
        ) {
          if (!isInvincible) {
            if (shield > 0) {
              shield = Math.max(0, shield - 50);
              isInvincible = true;
              invincibleEndTime = timestamp + 500; // 0.5초 무적
              isShieldBlinking = true;
              shieldBlinkEndTime = timestamp + 500;
            } else {
              playerLives--;
              isInvincible = true;
              invincibleEndTime = timestamp + 1500; // 1.5초 무적
              if (playerLives <= 0) {
                gameOver();
                return;
              }
            }
            // 보스 레이저 제거
            bossLasers.splice(i, 1);
            i--;
          }
        }

        // 화면 밖으로 나간 레이저 제거
        if (bossLasers[i] && bossLasers[i].y > canvas.height) {
          bossLasers.splice(i, 1);
          i--;
        }
      }

      // 현재 플레이어 이미지 결정
      let currentPlayerImage = playerImage;
      if (keys.left && !keys.right) {
        currentPlayerImage = playerLeftImage;
      } else if (keys.right && !keys.left) {
        currentPlayerImage = playerRightImage;
      }

      // 보조 기체도 플레이어 방향에 따라 동일 이미지 사용
      let currentSupportImage = playerImage;
      if (keys.left && !keys.right) {
        currentSupportImage = playerLeftImage;
      } else if (keys.right && !keys.left) {
        currentSupportImage = playerRightImage;
      }

      // 플레이어 그리기 (좌우 키 상태에 따른 이미지)
      if (!isInvincible || Math.floor(timestamp / 100) % 2 === 0) {
        ctx.drawImage(
          currentPlayerImage,
          playerX,
          playerY,
          playerWidth,
          playerHeight
        );
      }

      // 방어막 그리기
      if (shield > 0) {
        if (!isShieldBlinking || Math.floor(timestamp / 100) % 2 === 0) {
          ctx.drawImage(
            shieldImage,
            playerX - 10,
            playerY - 10,
            playerWidth + 20,
            playerHeight + 20
          );
        }
      }

      // 체력 바 그리기 함수 추가
      function drawHealthBar(x, y, width, height, ratio) {
        // HP 바 배경 그리기
        ctx.drawImage(hpBarImage, x, y, width, height);
      
        // HP 바 채우기
        ctx.fillStyle = "green";
        ctx.fillRect(x + 2, y + 2, (width - 4) * ratio, height - 4);
      }

      // 적 기체 이동 및 그리기
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.alive) {
          if (enemy.isBoss) {
            // 보스 이동 로직
            if (enemy.hp >= 500) {
              enemy.x += bossMoveSpeed * enemy.direction;
              if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                enemy.direction *= -1;
              }
              // 레이저 발사
              if (timestamp - lastBossFireTime > bossFireCooldown) {
                bossLasers.push({
                  x: enemy.x + enemy.width / 2 - laserImage.width / 2,
                  y: enemy.y + enemy.height,
                });
                lastBossFireTime = timestamp;
              }
            } else {
              // HP 49% 이하 로직
              enemy.x += bossMoveSpeed * enemy.direction;
              if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                enemy.direction *= -1;
              }
              // 레이저 발사
              if (timestamp - lastBossFireTime > bossFireCooldown) {
                bossLasers.push({
                  x: enemy.x + enemy.width / 2 - laserImage.width / 2,
                  y: enemy.y + enemy.height,
                });
                lastBossFireTime = timestamp;
              }
              // 돌진 공격
              if (timestamp - lastBossDashTime > bossDashCooldown) {
                const dx = playerX - enemy.x;
                const dy = playerY - enemy.y;
                const dashSpeed = 50;
                enemy.x = Math.max(0, Math.min(
                  canvas.width - enemy.width,
                  enemy.x + (dx > 0 ? dashSpeed : -dashSpeed)
                ));
                enemy.y = Math.max(0, Math.min(
                  canvas.height - enemy.height,
                  enemy.y + (dy > 0 ? dashSpeed : -dashSpeed)
                ));
                lastBossDashTime = timestamp;
              }
            }
      
            // 보스 HP 바 그리기
            const bossHpBarWidth = 200;
            const bossHpBarHeight = 20;
            const bossHpBarX = enemy.x + (enemy.width - bossHpBarWidth) / 2;
            const bossHpBarY = enemy.y - 30;
            const bossHpRatio = enemy.hp / 1000;
      
            drawHealthBar(bossHpBarX, bossHpBarY, bossHpBarWidth, bossHpBarHeight, bossHpRatio);
      
            // 보스 그리기
            ctx.drawImage(bossImage, enemy.x, enemy.y, enemy.width, enemy.height);
          } else {
            // 기존 일반 적 처리
            enemy.y += 1;
            // 화면 밖으로 나가면 제거
            if (enemy.y > canvas.height) {
              enemy.alive = false;
            }
            // 적 기체 그리기
            ctx.drawImage(
              enemyImage,
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            );
      
            // 일반 적 HP 바 그리기
            const enemyHpBarWidth = 50;
            const enemyHpBarHeight = 5;
            const enemyHpBarX = enemy.x + (enemy.width - enemyHpBarWidth) / 2;
            const enemyHpBarY = enemy.y - 10;
            const enemyHpRatio = enemy.hp / 10;
      
            drawHealthBar(enemyHpBarX, enemyHpBarY, enemyHpBarWidth, enemyHpBarHeight, enemyHpRatio);
          }
        }
      }

      // 적 이동 및 상태 업데이트 후 스테이지 진행 체크
      checkStageProgress();

      // 적 사망 이펙트 그리기 (시간 경과에 따라 alpha 감소)
      for (let i = deathEffects.length - 1; i >= 0; i--) {
        const effect = deathEffects[i];
        const elapsed = timestamp - effect.startTime;
        const alpha = 1 - elapsed / effect.duration;

        if (alpha <= 0) {
          deathEffects.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          effectImage,
          effect.x - effectImage.width / 2,
          effect.y - effectImage.height / 2
        );
        ctx.restore();
      }

      // 보조 기체 그리기
      if (supportShips >= 1) {
        ctx.drawImage(currentSupportImage, playerX - 60, playerY + 20, 50, 35);
      }
      if (supportShips >= 2) {
        ctx.drawImage(currentSupportImage, playerX + 110, playerY + 20, 50, 35);
      }

      // 라이프 그리기
      const lifeWidth = 30; // 라이프 이미지 너비
      const lifeHeight = 30; // 라이프 이미지 높이
      const lifePadding = 10; // 라이프 이미지 간격
      for (let i = 0; i < playerLives; i++) {
        ctx.drawImage(
          lifeImage,
          canvas.width - (i + 1) * (lifeWidth + lifePadding),
          canvas.height - lifeHeight - lifePadding,
          lifeWidth,
          lifeHeight
        );
      }

      // 경험치 바 그리기
      const expBarWidth = 504; // 경험치 바 전체 너비
      const expBarHeight = 24; // 경험치 바 높이
      const expBarX = (canvas.width - expBarWidth) / 2; // 중앙 정렬
      const expBarY = canvas.height - expBarHeight - 20; // 하단에서 20px 위
      const filledWidth = (playerExp / expForNextLevel) * 500; // 채워진 너비 (내부 크기 500px)

      // 경험치 바 배경 그리기
      ctx.drawImage(expBarImage, expBarX, expBarY, expBarWidth, expBarHeight);

      // 경험치 바 채우기
      ctx.fillStyle = "green"; // 채워지는 색상
      ctx.fillRect(expBarX + 2, expBarY + 2, filledWidth, 20); // 내부 채우기 (2px 테두리 고려)

      // 플레이어 레벨 표시
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `Level ${playerLevel}`,
        expBarX + expBarWidth / 2,
        expBarY - 10
      );

      // 레벨업 처리
      if (playerExp >= expForNextLevel) {
        playerLevel++;
        playerExp -= expForNextLevel;
        expForNextLevel += 100 * playerLevel;
        showUpgradeOptions();
      }

      // 플레이어와 적 기체 충돌 검사
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (
          enemy.alive &&
          playerX < enemy.x + enemy.width &&
          playerX + playerWidth > enemy.x &&
          playerY < enemy.y + enemy.height &&
          playerY + playerHeight > enemy.y
        ) {
          if (!isInvincible) {
            if (shield > 0) {
              shield = Math.max(0, shield - 50);
              isInvincible = true;
              invincibleEndTime = timestamp + 500; // 0.5초간 무적
              isShieldBlinking = true;
              shieldBlinkEndTime = timestamp + 500; // 방어막 깜빡임 시간
            } else {
              playerLives--;
              isInvincible = true;
              invincibleEndTime = timestamp + 1500; // 1.5초간 무적
              if (playerLives <= 0) {
                gameOver();
                return;
              }
            }
          }
        }
      }

      // 무적 상태 해제
      if (isInvincible && timestamp >= invincibleEndTime) {
        isInvincible = false;
      }

      // 방어막 깜빡임 상태 해제
      if (isShieldBlinking && timestamp >= shieldBlinkEndTime) {
        isShieldBlinking = false;
      }

      // 다음 프레임 요청
      requestAnimationFrame(gameLoop);
    }

    // 게임 루프 시작
    gameLoop();

    // 업그레이드 선택지 표시
    function showUpgradeOptions() {
      isPaused = true;
      const upgrades = [
        { text: "발사속도 증가", action: increaseLaserFireRate },
        { text: "보조기체 추가", action: addSupportShip },
        { text: "목숨 추가", action: addExtraLife },
        { text: "방어막 추가", action: addShield },
        { text: "공격력 증가", action: increasePlayerDamage } // 새 업그레이드
      ];

      // 랜덤으로 3개의 업그레이드 선택지 선택
      const selectedUpgrades = [];
      while (selectedUpgrades.length < 3) {
        const randomIndex = Math.floor(Math.random() * upgrades.length);
        const upgrade = upgrades[randomIndex];
        if (!selectedUpgrades.includes(upgrade)) {
          selectedUpgrades.push(upgrade);
        }
      }

      // 업그레이드 선택지 그리기
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "업그레이드를 선택하세요!",
        canvas.width / 2,
        canvas.height / 2 - 100
      );

      selectedUpgrades.forEach((upgrade, index) => {
        ctx.fillText(
          upgrade.text,
          canvas.width / 2,
          canvas.height / 2 - 50 + index * 50
        );
      });

      // 마우스 클릭 이벤트로 업그레이드 선택
      canvas.addEventListener("click", function onClick(event) {
        const mouseX = event.clientX - canvas.offsetLeft;
        const mouseY = event.clientY - canvas.offsetTop;

        selectedUpgrades.forEach((upgrade, index) => {
          const textY = canvas.height / 2 - 50 + index * 50;
          const textWidth = ctx.measureText(upgrade.text).width;
          if (
            mouseX > canvas.width / 2 - textWidth / 2 &&
            mouseX < canvas.width / 2 + textWidth / 2 &&
            mouseY > textY - 10 &&
            mouseY < textY + 10
          ) {
            upgrade.action();
            canvas.removeEventListener("click", onClick);
            isPaused = false;
            requestAnimationFrame(gameLoop);
          }
        });
      });
    }

    // 업그레이드 함수들
    function increaseLaserFireRate() {
      if (laserCooldown > 20) {
        laserCooldown -= 20;
      }
    }

    function addSupportShip() {
      if (supportShips < 2) {
        supportShips++;
      }
    }

    function addExtraLife() {
      if (playerLives < 10) {
        playerLives++;
      }
    }

    function addShield() {
      shield += 100;
    }

    function increasePlayerDamage() {
      if (playerDamage < 1000) {
        playerDamage = Math.min(playerDamage + 10, 1000);
      }
    }

    // 게임 오버 처리
    function gameOver() {
      isPaused = true;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
      ctx.fillText(`점수 : ${playerExp}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(
        "게임 다시시작하기",
        canvas.width / 2,
        canvas.height / 2 + 50
      );

      // 마우스 클릭 이벤트로 게임 다시 시작
      canvas.addEventListener("click", function onClick(event) {
        const mouseX = event.clientX - canvas.offsetLeft;
        const mouseY = event.clientY - canvas.offsetTop;
        const textWidth = ctx.measureText("게임 다시시작하기").width;
        if (
          mouseX > canvas.width / 2 - textWidth / 2 &&
          mouseX < canvas.width / 2 + textWidth / 2 &&
          mouseY > canvas.height / 2 + 40 &&
          mouseY < canvas.height / 2 + 60
        ) {
          canvas.removeEventListener("click", onClick);
          resetGame();
        }
      });
    }

    // 게임 초기화
    function resetGame() {
      playerX = (canvas.width - playerWidth) / 2;
      playerY = canvas.height - playerHeight - 100;
      playerLives = 3;
      playerExp = 0;
      playerLevel = 0;
      expForNextLevel = 100;
      laserCooldown = 500;
      supportShips = 0;
      shield = 0;
      currentStage = 1;
      enemies.length = 0;
      bossHits = 0;
      spawnStageEnemies(currentStage);
      isPaused = false;
      isInvincible = false;
      requestAnimationFrame(gameLoop);
    }
  };
};
