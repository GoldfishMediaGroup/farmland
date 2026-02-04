(function () {
  "use strict";

  const config = {
    videos: {
      mobile: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/mobile.mp4",
        type: "video/mp4",
        pausePoints: [4.5, 10, 15, 20.5],
      },
      desktop: {
        src: "https://storage.yandexcloud.net/external-assets/tantum/modal-game/desktop.mp4",
        type: "video/mp4",
        pausePoints: [4.29, 9.9, 15, 20.5],
      },
    },
    buttonStyles: {
      desktop: { width: "130px", height: "130px" },
      mobile: { width: "130px", height: "130px" },
      imageUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/circle.png",
      videoUrl:
        "https://storage.yandexcloud.net/external-assets/tantum/modal-game/hello.png",
    },
    modalOverlayColor: "rgba(0, 0, 0, 0.7)",
    modalBackground: "transparent",
  };

  let videoButton = null,
    modalOverlay = null,
    videoElement = null,
    buttonVideoElement = null;
  let currentPauseIndex = -1,
    isPausedBySystem = false,
    currentVideoConfig = null;
  let videoAspectRatio = 16 / 9,
    isVideoFinished = false,
    rafId = null;

  function getDeviceType() {
    return window.innerWidth <= 768 ? "mobile" : "desktop";
  }
  function getButtonSize() {
    return config.buttonStyles[getDeviceType()];
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    createVideoButton();
    createModal();
    setupEventListeners();
    const isMobile = window.innerWidth <= 768;
    currentVideoConfig = config.videos[isMobile ? "mobile" : "desktop"];
    videoElement.src = currentVideoConfig.src; // Прямая установка src надежнее для Safari
  }

  function createVideoButton() {
    videoButton = document.createElement("button");
    videoButton.id = "video-modal-trigger";
    const buttonSize = getButtonSize();
    const buttonDiv = document.createElement("div");
    buttonDiv.className = "video-button-content";

    const buttonImg = document.createElement("img");
    buttonImg.src = config.buttonStyles.imageUrl;

    buttonVideoElement = document.createElement("video");
    buttonVideoElement.muted = true;
    buttonVideoElement.loop = true;
    buttonVideoElement.playsInline = true;
    buttonVideoElement.autoplay = true;
    buttonVideoElement.src = config.buttonStyles.videoUrl.replace(
      ".png",
      ".mp4",
    );

    Object.assign(buttonImg.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      position: "absolute",
      top: "0",
      left: "0",
      zIndex: "1",
    });
    Object.assign(buttonVideoElement.style, {
      width: "80%",
      height: "70%",
      objectFit: "contain",
      position: "absolute",
      top: "10%",
      left: "10%",
      zIndex: "2",
      borderRadius: "50%",
    });
    Object.assign(buttonDiv.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
      borderRadius: "50%",
    });
    Object.assign(videoButton.style, {
      position: "fixed",
      bottom: "110px",
      right: "20px",
      width: buttonSize.width,
      height: buttonSize.height,
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      borderRadius: "50%",
      zIndex: "1039",
      boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.3)",
      padding: "0",
    });

    buttonDiv.appendChild(buttonImg);
    buttonDiv.appendChild(buttonVideoElement);
    videoButton.appendChild(buttonDiv);
    document.body.appendChild(videoButton);
    setTimeout(() => {
      if (buttonVideoElement) buttonVideoElement.play().catch(() => {});
    }, 100);
  }

  function createModal() {
    modalOverlay = document.createElement("div");
    Object.assign(modalOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: config.modalOverlayColor,
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1101",
      opacity: "0",
      transition: "opacity 0.3s ease",
    });

    const modalContent = document.createElement("div");
    modalContent.id = "video-modal-content";
    Object.assign(modalContent.style, {
      backgroundColor: config.modalBackground,
      borderRadius: "12px",
      overflow: "hidden",
      position: "relative",
      transform: "translateY(30px)",
      transition: "transform 0.3s ease",
      maxWidth: "90vw",
      maxHeight: "90vh",
    });

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    Object.assign(closeButton.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "20px",
      zIndex: "1110",
    });

    videoElement = document.createElement("video");
    videoElement.setAttribute("playsinline", "");
    videoElement.setAttribute("webkit-playsinline", "");
    videoElement.muted = true;
    videoElement.preload = "auto";
    Object.assign(videoElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      backgroundColor: "#000",
    });

    modalContent.appendChild(closeButton);
    modalContent.appendChild(videoElement);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    closeButton.addEventListener("click", closeModal);
    addResponsiveStyles();
  }

  function updateModalSize() {
    const modalContent = document.getElementById("video-modal-content");
    if (!modalContent) return;
    const ratio = videoElement.videoWidth / videoElement.videoHeight || 16 / 9;
    const maxWidth = window.innerWidth * 0.9,
      maxHeight = window.innerHeight * 0.9;
    let width = maxWidth,
      height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    modalContent.style.width = `${width}px`;
    modalContent.style.height = `${height}px`;
  }

  function openModal() {
    isVideoFinished = false;
    modalOverlay.style.display = "flex";

    // СИНХРОННЫЙ ЗАПУСК для Safari
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        videoElement.play();
      });
    }

    setTimeout(() => {
      modalOverlay.style.opacity = "1";
      document.getElementById("video-modal-content").style.transform =
        "translateY(0)";
    }, 10);

    document.body.style.overflow = "hidden";
    currentPauseIndex = -1;
    isPausedBySystem = false;
    updateModalSize();
    startPreciseTimer();
  }

  // ТАЙМЕР С МИКРО-ЦИКЛОМ ДЛЯ SAFARI
  function startPreciseTimer() {
    const checkTime = () => {
      if (isVideoFinished) return;

      const currentTime = videoElement.currentTime;
      const nextPoint = currentVideoConfig.pausePoints[currentPauseIndex + 1];

      if (nextPoint !== undefined) {
        // Если мы в режиме "паузы" (цикла)
        if (isPausedBySystem) {
          if (currentTime >= nextPoint) {
            videoElement.currentTime = nextPoint; // Кидаем назад на точку
          }
        }
        // Если дошли до точки первый раз
        else if (currentTime >= nextPoint) {
          isPausedBySystem = true;
          videoElement.currentTime = nextPoint;
        }
      }
      rafId = requestAnimationFrame(checkTime);
    };
    rafId = requestAnimationFrame(checkTime);
  }

  function handleVideoClick() {
    if (isVideoFinished) {
      closeModal();
      return;
    }

    const nextPoint = currentVideoConfig.pausePoints[currentPauseIndex + 1];

    if (isPausedBySystem) {
      // ВЫХОДИМ ИЗ ЦИКЛА
      isPausedBySystem = false;
      currentPauseIndex++;

      // Пинок вперед, чтобы Safari не вернул в цикл на следующем кадре
      videoElement.currentTime += 0.3;
      videoElement.play();
      return;
    }

    // Опережение
    const currentTime = videoElement.currentTime;
    if (nextPoint !== undefined && nextPoint - currentTime <= 1.0) {
      currentPauseIndex++;
    }
  }

  function closeModal() {
    modalOverlay.style.opacity = "0";
    document.getElementById("video-modal-content").style.transform =
      "translateY(30px)";
    if (rafId) cancelAnimationFrame(rafId);
    setTimeout(() => {
      modalOverlay.style.display = "none";
      videoElement.pause();
      videoElement.currentTime = 0;
      document.body.style.overflow = "";
    }, 300);
  }

  function handleVideoEnded() {
    isVideoFinished = true;
    isPausedBySystem = false;
  }

  function setupEventListeners() {
    videoButton.addEventListener("click", openModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    videoElement.addEventListener("click", handleVideoClick);
    videoElement.addEventListener("ended", handleVideoEnded);
    videoElement.addEventListener("loadedmetadata", updateModalSize);
    window.addEventListener("resize", () => {
      updateButtonSize();
      if (modalOverlay.style.display === "flex") updateModalSize();
    });
  }

  function addResponsiveStyles() {
    const style = document.createElement("style");
    style.textContent = `@media (max-width: 768px) { #video-modal-trigger { width: 120px; height: 120px; } }`;
    document.head.appendChild(style);
  }

  function updateButtonSize() {
    const size = getButtonSize();
    videoButton.style.width = size.width;
    videoButton.style.height = size.height;
  }
})();
