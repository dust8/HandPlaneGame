const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 250;
const mobile = isMobile();
let model;

function isMobile() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid || isiOS;
}

function drawPoint(ctx, y, x, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}
function drawKeypoints(ctx, keypoints) {
  const keypointsArray = keypoints;
  // console.log(keypointsArray[0]);

  // 触发坐标更改事件
  let event = new CustomEvent("handmove", {
    detail: {
      clientX: ((VIDEO_WIDTH - keypointsArray[0][0]) / VIDEO_WIDTH) * WIDTH,
      clientY: (keypointsArray[0][1] / VIDEO_HEIGHT) * HEIGHT
    }
  });
  document.dispatchEvent(event);

  for (let i = 0; i < keypointsArray.length; i++) {
    const y = keypointsArray[i][0];
    const x = keypointsArray[i][1];

    drawPoint(ctx, x - 2, y - 2, 3);
    // break;
  }
}
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      // 优先使用前置摄像头（如果有的话）
      facingMode: "user",
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT
    }
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();
  return video;
}

async function main() {
  // Load the MediaPipe handpose model.
  model = await handpose.load();
  let video;

  try {
    video = await loadVideo();
  } catch (e) {
    console.log(e);
  }

  landmarksRealTime(video);
}

const landmarksRealTime = async video => {
  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;

  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");

  // 设置指定矩形区域内（以 点 (x, y) 为起点，范围是(width, height) ）所有像素变成透明，并擦除之前绘制的所有内容
  ctx.clearRect(0, 0, videoWidth, videoHeight);
  // 设置图形轮廓的颜色
  ctx.strokeStyle = "red";
  // 设置图形的填充颜
  ctx.fillStyle = "red";

  // 修正偏移
  ctx.translate(canvas.width, 0);
  // 以 x 轴镜像反转
  ctx.scale(-1, 1);
  // ctx.scale(-0.5, 0.5);

  let i = 0;
  async function frameLandmarks() {
    i++;
    // 减少识别的次数
    if (i != 4) {
      requestAnimationFrame(frameLandmarks);
      return;
    }

    i = 0;

    ctx.drawImage(
      video,
      0,
      0,
      videoWidth,
      videoHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    // ctx.drawImage(video, 0, 0);
    const predictions = await model.estimateHands(video);
    if (predictions.length > 0) {
      const result = predictions[0].landmarks;
      // console.log(predictions);
      // console.log("result", result);

      drawKeypoints(ctx, result);
    }

    requestAnimationFrame(frameLandmarks);
  }

  frameLandmarks();
};

document.addEventListener("DOMContentLoaded", function() {
  main();
});
