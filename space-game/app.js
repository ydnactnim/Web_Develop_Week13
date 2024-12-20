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

  // 플레이어 위치 및 크기
  let playerX = canvas.width / 2;
  let playerY = canvas.height / 2;
  const playerWidth = 100; // 원하는 너비
  const playerHeight = 80; // 원하는 높이

  // 플레이어 라이프
  let playerLives = 3;

  // 플레이어 경험치 및 레벨
  let playerExp = 50;
  const maxExp = 100; // 레벨업에 필요한 최대 경험치

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
  let lastFireTime = 0;

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

      // 레이저 발사
      if (keys.space && timestamp - lastFireTime > 50) {
        lasers.push({
          x: playerX + playerWidth / 2 - laserImage.width / 2,
          y: playerY,
        });
        lastFireTime = timestamp;
      }

      // 레이저 이동 및 그리기
      for (let i = 0; i < lasers.length; i++) {
        lasers[i].y -= 10;
        ctx.drawImage(laserImage, lasers[i].x, lasers[i].y);
      }

      // 화면 밖으로 나간 레이저 제거
      while (lasers.length > 0 && lasers[0].y < 0) {
        lasers.shift();
      }

      // 플레이어 그리기
      ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);

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
      const filledWidth = (playerExp / maxExp) * 500; // 채워진 너비 (내부 크기 500px)

      // 경험치 바 배경 그리기
      ctx.drawImage(expBarImage, expBarX, expBarY, expBarWidth, expBarHeight);

      // 경험치 바 채우기
      ctx.fillStyle = "green"; // 채워지는 색상
      ctx.fillRect(expBarX + 2, expBarY + 2, filledWidth, 20); // 내부 채우기 (2px 테두리 고려)

      // 다음 프레임 요청
      requestAnimationFrame(gameLoop);
    }

    // 게임 루프 시작
    gameLoop();
  };
};
