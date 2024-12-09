window.onload = function () {
  // 캔버스와 컨텍스트 가져오기
  const canvas = document.getElementById("GameCanvas");
  const ctx = canvas.getContext("2d");

  // 배경 이미지 로드
  const backgroundImage = new Image();
  backgroundImage.src = "assets/Background.png";

  backgroundImage.onload = function () {
    // 배경 이미지를 패턴으로 설정
    const pattern = ctx.createPattern(backgroundImage, "repeat");
    ctx.fillStyle = pattern;

    // 캔버스에 배경 그리기
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
};
