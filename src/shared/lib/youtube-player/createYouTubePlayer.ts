import { loadYouTubeIframeApi, YT_PLAYER_STATE } from './youtubeIframeApi';

// 앱에서 쓰는 재생 상태. YouTube의 숫자 코드를 이름으로 바꾼다
export type PlaybackState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

function toPlaybackState(code: number): PlaybackState {
  switch (code) {
    case YT_PLAYER_STATE.ENDED:
      return 'ended';
    case YT_PLAYER_STATE.PLAYING:
      return 'playing';
    case YT_PLAYER_STATE.PAUSED:
      return 'paused';
    case YT_PLAYER_STATE.BUFFERING:
      return 'buffering';
    case YT_PLAYER_STATE.CUED:
      return 'cued';
    default:
      return 'unstarted';
  }
}

export interface YouTubePlayerEvents {
  onStateChange: (state: PlaybackState) => void;
  // code: 2(잘못된 ID), 5(HTML5 재생 오류), 100(삭제·비공개), 101·150(퍼가기 차단)
  onError: (code: number) => void;
}

// 앱의 다른 코드는 YouTube 객체를 직접 만지지 않고 이 인터페이스만 쓴다.
// 테스트에서는 이 인터페이스를 따르는 가짜 플레이어로 바꿔 끼운다.
export interface YouTubePlayer {
  load: (videoId: string) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

// container 안에 플레이어를 만들고, 조작할 준비가 되면(onReady) resolve한다.
// YouTube는 넘겨받은 요소를 iframe으로 "교체"하므로, React가 관리하는 container 대신
// 그 안에 직접 만든 div를 넘긴다. 그래야 React의 DOM과 충돌하지 않는다.
export async function createYouTubePlayer(
  container: HTMLElement,
  events: YouTubePlayerEvents,
): Promise<YouTubePlayer> {
  const YT = await loadYouTubeIframeApi();
  const target = document.createElement('div');
  container.append(target);

  return new Promise<YouTubePlayer>((resolve) => {
    const player = new YT.Player(target, {
      width: '100%',
      height: '100%',
      playerVars: { playsinline: 1 },
      events: {
        onReady: () => {
          resolve({
            load: (videoId) => player.loadVideoById(videoId),
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
            seekTo: (seconds) => player.seekTo(seconds, true),
            getCurrentTime: () => player.getCurrentTime(),
            getDuration: () => player.getDuration(),
            setVolume: (volume) => player.setVolume(volume),
            mute: () => player.mute(),
            unMute: () => player.unMute(),
            destroy: () => {
              player.destroy();
              container.replaceChildren();
            },
          });
        },
        onStateChange: (event) => events.onStateChange(toPlaybackState(event.data)),
        onError: (event) => events.onError(event.data),
      },
    });
  });
}
