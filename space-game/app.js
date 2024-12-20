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

  // 적 기체 배열
  const enemies = [];

  // 적 기체 생성 함수
  function createEnemy() {
    const enemyX = canvas.width / 2 - 50;
    const enemyY = canvas.height / 2 - 50;
    enemies.push({
      x: enemyX,
      y: enemyY,
      width: 100,
      height: 100,
      alive: true,
    });
  }

  // 초기 적 기체 생성
  createEnemy();

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
            enemy.alive = false;
            playerExp += 10;
            lasers.splice(i, 1);
            i--;
            createEnemy(); // 새로운 적 기체 생성
            break;
          }
        }
      }

      // 화면 밖으로 나간 레이저 제거
      while (lasers.length > 0 && lasers[0].y < 0) {
        lasers.shift();
      }

      // 플레이어 그리기
      if (!isInvincible || Math.floor(timestamp / 100) % 2 === 0) {
        ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
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

      // 적 기체 그리기
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.alive) {
          ctx.drawImage(
            enemyImage,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
          );
        }
      }

      // 보조 기체 그리기
      if (supportShips >= 1) {
        ctx.drawImage(playerImage, playerX - 60, playerY + 20, 50, 35);
      }
      if (supportShips >= 2) {
        ctx.drawImage(playerImage, playerX + 110, playerY + 20, 50, 35);
      }
      if (supportShips >= 3) {
        ctx.drawImage(playerImage, playerX + 25, playerY + 100, 50, 35);
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
      enemies.length = 0;
      createEnemy();
      isPaused = false;
      isInvincible = false;
      requestAnimationFrame(gameLoop);
    }
  };
};
