const startBtn = document.querySelector(".js-btn-start");
const downloadLink = document.querySelector(".js-link");
let blob = null;
let videoStream = null;

startBtn.addEventListener("click", startScreenCapturing);

async function startScreenCapturing() {
  if (!navigator.mediaDevices.getDisplayMedia) {
    return alert("Your browser does not support screen capturing.");
  }
  try {
    if (!videoStream?.active) {
      videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        surfaceSwitching: "include",
      });
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      const audioTrack = audioStream.getAudioTracks()[0];
      videoStream.addTrack(audioTrack);
      recordStream(videoStream);
    } else {
      throw new Error(
        "There is an ongoing recording. Please, stop it before starting a new one."
      );
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
}

function recordStream(stream) {
  countDown();
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=vp8,opus",
  });
  const recordedChunks = [];
  mediaRecorder.addEventListener("dataavailable", (event) => {
    recordedChunks.push(event.data);
  });

  stream.getVideoTracks()[0].addEventListener("ended", () => {
    mediaRecorder.stop();
    stream.getAudioTracks()[0].stop();
  });

  mediaRecorder.addEventListener("stop", () => {
    createVideoBlob(recordedChunks);
    showRecordedVideo(blob);
  });
  setTimeout(() => {
    mediaRecorder.start();
  }, 4000);
}

function countDown() {
  const countDownElement = document.querySelector(".js-countdown");
  countDownElement.style.display = "grid";
  let count = 3;

  function reduceCount() {
    countDownElement.textContent = count;
    count--;
    if (count >= 0) {
      setTimeout(reduceCount, 1000);
    } else {
      countDownElement.style.display = "none";
    }
  }
  reduceCount();
}

function createVideoBlob(recordedChunks) {
  blob = new Blob(recordedChunks, {
    type: recordedChunks[0].type,
  });
}

function calculateVideoDuration(videoElement) {
  videoElement.addEventListener("loadedmetadata", () => {
    if (videoElement.duration === Infinity) {
      videoElement.currentTime = 1e101;
      videoElement.addEventListener(
        "timeupdate",
        () => {
          videoElement.currentTime = 0;
        },
        { once: true }
      );
    }
  });
}

function showRecordedVideo() {
  const video = document.querySelector(".js-video");
  video.src = URL.createObjectURL(blob);
  calculateVideoDuration(video);
}

downloadLink.addEventListener("click", () => {
    downloadLink.href = URL.createObjectURL(blob);
    const fileName = prompt('What is the name of your video?');
    downloadLink.download = `${fileName}.webm`;
    downloadLink.type = "video/webm";
});