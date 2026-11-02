const POSTER_TIMEOUT_MS = 5000;

/**
 * 동영상의 첫 장면을 이미지 주소로 뽑음. 디코딩이 안 되거나 시간이 걸리면 null을 돌려주고,
 * 호출하는 쪽은 빈 썸네일 위에 재생 아이콘만 보여 줌.
 */
export function getVideoPoster(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const finish = (poster: string | null) => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(poster);
    };
    const timer = setTimeout(() => finish(null), POSTER_TIMEOUT_MS);
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.onerror = () => finish(null);
    // 첫 프레임이 검게 나오는 영상이 있어 0.1초 지점(짧은 영상은 중간)을 씀.
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, (video.duration || 0.2) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context || canvas.width === 0) return finish(null);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL("image/jpeg", 0.7));
    };
    video.src = videoUrl;
  });
}
