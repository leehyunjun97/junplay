// YouTube IFrame Player API 중 이 앱이 실제로 쓰는 부분만 타입으로 적는다.
// 공식 문서: https://developers.google.com/youtube/iframe_api_reference
// 문서에 없는(undocumented) 메서드는 쓰지 않는다 (SPEC.md 6. 외부 API).

// 플레이어 상태 코드 (onStateChange의 data 값)
export const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTOnStateChangeEvent extends YTPlayerEvent {
  data: number;
}

interface YTOnErrorEvent extends YTPlayerEvent {
  data: number;
}

interface YTPlayerOptions {
  width?: string | number;
  height?: string | number;
  playerVars?: {
    // iOS에서 전체 화면으로 바뀌지 않고 페이지 안에서 재생한다
    playsinline?: 0 | 1;
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTOnStateChangeEvent) => void;
    onError?: (event: YTOnErrorEvent) => void;
  };
}

export interface YTPlayer {
  loadVideoById(videoId: string): void;
  // 영상을 불러와 썸네일만 보여 주고 재생하지 않는다. playVideo를 부르면 startSeconds부터 재생된다
  cueVideoById(videoId: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  // allowSeekAhead: true면 아직 내려받지 않은 위치로도 바로 이동한다
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  // 영상 정보를 불러오기 전에는 0을 돌려준다
  getDuration(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    // 스크립트가 준비되면 YouTube가 호출하는 전역 콜백
    onYouTubeIframeAPIReady?: () => void;
  }
}

const IFRAME_API_URL = 'https://www.youtube.com/iframe_api';

// 스크립트는 앱 전체에서 한 번만 불러온다. 여러 곳에서 동시에 요청해도 같은 Promise를 돌려준다
let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    // 다른 코드가 이미 콜백을 등록했을 수 있으므로 덮어쓰지 않고 이어서 호출한다
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error('YouTube IFrame API를 찾을 수 없습니다.'));
    };

    const script = document.createElement('script');
    script.src = IFRAME_API_URL;
    script.onerror = () => {
      // 실패한 Promise를 지워서 다음에 다시 시도할 수 있게 한다
      apiPromise = null;
      script.remove();
      reject(new Error('YouTube IFrame API 스크립트를 불러오지 못했습니다.'));
    };
    document.head.append(script);
  });

  return apiPromise;
}
