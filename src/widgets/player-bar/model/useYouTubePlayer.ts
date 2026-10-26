import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore, type PlaybackProgress } from '@/entities/player';
import { createYouTubePlayer, type YouTubePlayer } from '@/shared/lib/youtube-player';

// 현재 재생 위치를 읽는 간격. IFrame API에는 "시간이 바뀌었다"는 이벤트가 없어서 주기적으로 읽는다
export const PROGRESS_POLL_MS = 500;

export type PlayerError = 'unplayable' | 'load-failed';

const EMPTY_PROGRESS: PlaybackProgress = { currentTime: 0, duration: 0 };

// 이어 듣기용 위치를 저장한다. 0.5초마다 localStorage에 쓰지 않도록 초 단위가 바뀔 때만 저장한다
function saveProgressEverySecond(progress: PlaybackProgress) {
  const { savedProgress, saveProgress } = usePlayerStore.getState();
  if (savedProgress && Math.floor(savedProgress.currentTime) === Math.floor(progress.currentTime)) {
    return;
  }
  saveProgress(progress);
}

// container 안에 YouTube 플레이어를 만들고, 스토어 값(재생할 영상, 재생 여부, 볼륨)에 맞춰 조작한다.
// container는 재생할 항목이 생겨 영상 상자가 화면에 나타날 때 들어온다 (그 전에는 null).
// 데이터 흐름: 버튼 클릭 → 스토어 변경 → 이 훅이 실제 플레이어 조작
//            영상 안 컨트롤 조작·영상 끝남 → onStateChange → 스토어 변경
export function useYouTubePlayer(container: HTMLDivElement | null) {
  // 플레이어가 준비되면 값이 생긴다. 아래 effect들이 준비된 뒤에 다시 실행되도록 state로 둔다
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  // 재생 위치는 0.5초마다 바뀌므로 전역 스토어가 아니라 여기(플레이어 바)에만 둔다.
  // 이어 듣기로 복원된 항목이 있으면 저장된 위치를 먼저 보여 준다
  const [progress, setProgress] = useState<PlaybackProgress>(
    () => usePlayerStore.getState().savedProgress ?? EMPTY_PROGRESS,
  );
  // 에러가 난 영상의 ID를 함께 기록해서, 다른 영상을 고르면 에러가 저절로 사라지게 한다
  const [unplayableVideoId, setUnplayableVideoId] = useState<string | null>(null);
  const [isLoadFailed, setIsLoadFailed] = useState(false);
  // 이 플레이어에 영상을 한 번이라도 불러왔는지. 처음 불러올 때는 바꿀 이전 영상이 없다
  const hasLoadedVideoRef = useRef(false);
  // 이전 영상을 새 영상으로 바꾸는 중인지. 새 영상이 실제로 재생되면(playing) 끝난다
  const isSwitchingRef = useRef(false);

  const videoId = usePlayerStore((store) => store.current?.id);
  const startRequest = usePlayerStore((store) => store.startRequest);
  const isPlaying = usePlayerStore((store) => store.isPlaying);
  const volume = usePlayerStore((store) => store.volume);
  const isMuted = usePlayerStore((store) => store.isMuted);

  // 플레이어는 영상 상자가 생길 때 한 번만 만든다. 영상이 바뀌면 새로 만들지 않고 load로 바꿔 끼운다
  useEffect(() => {
    if (!container) return;

    // 준비되기 전에 화면에서 사라지면(StrictMode의 두 번 실행 포함) 만들어진 플레이어를 바로 정리한다
    let cancelled = false;
    let created: YouTubePlayer | null = null;
    hasLoadedVideoRef.current = false;
    isSwitchingRef.current = false;

    createYouTubePlayer(container, {
      onStateChange: (state) => {
        const { isLoop, setPlaying } = usePlayerStore.getState();
        // 재생 중에 다른 영상으로 바꾸면 YouTube가 이전 영상의 paused(또는 ended) 이벤트를 먼저 보낸다.
        // 이걸 "사용자가 멈췄다"로 받으면 스토어가 멈춤이 되고, 그에 맞춰 새 영상까지 멈춰 버린다.
        // 그래서 교체 중에는 이 이벤트를 무시하고, 새 영상이 재생되면 원래대로 돌아간다
        if (isSwitchingRef.current) {
          if (state === 'playing') isSwitchingRef.current = false;
          else if (state === 'paused' || state === 'ended') return;
        }
        // 반복이 켜져 있으면 끝난 영상을 처음부터 다시 재생한다
        if (state === 'ended' && isLoop && created) {
          created.seekTo(0);
          created.play();
          return;
        }
        if (state === 'playing') setPlaying(true);
        else if (state === 'paused' || state === 'ended') setPlaying(false);
      },
      onError: () => {
        // 새 영상이 재생되지 못했으므로 교체도 끝난 것으로 본다
        isSwitchingRef.current = false;
        const { current, setPlaying } = usePlayerStore.getState();
        setUnplayableVideoId(current?.id ?? null);
        setPlaying(false);
      },
    })
      .then((createdPlayer) => {
        if (cancelled) {
          createdPlayer.destroy();
          return;
        }
        created = createdPlayer;
        setPlayer(createdPlayer);
      })
      .catch(() => {
        if (!cancelled) setIsLoadFailed(true);
      });

    return () => {
      cancelled = true;
      created?.destroy();
      setPlayer(null);
    };
  }, [container]);

  // 재생할 영상이 바뀌거나 시작 위치 요청(담은 곡)이 오면 불러온다.
  // 시작 위치 요청이 있으면 load로 그 위치부터 바로 재생한다. 지금과 같은 영상이어도 다시 불러온다.
  // 새로 고른 영상은 load로 처음부터 바로 재생한다.
  // 다시 접속해 복원한 영상(저장된 위치가 있거나 멈춘 상태)은 그 위치에 cue해 두기만 한다 (자동 재생 안 함).
  // 재생은 아래 isPlaying effect가 맡으므로, 플레이어 준비 전에 재생을 눌렀어도 저장된 위치부터 재생된다
  useEffect(() => {
    if (!player || !videoId) return;
    const { isPlaying: shouldPlay, savedProgress } = usePlayerStore.getState();
    if (startRequest || (shouldPlay && !savedProgress)) {
      // 이미 불러온 영상이 있으면 교체다. 이전 영상의 멈춤 이벤트를 무시하도록 표시한다
      if (hasLoadedVideoRef.current) isSwitchingRef.current = true;
      if (startRequest) player.load(videoId, startRequest.seconds);
      else player.load(videoId);
    } else {
      player.cue(videoId, savedProgress?.currentTime ?? 0);
    }
    hasLoadedVideoRef.current = true;
  }, [player, videoId, startRequest]);

  useEffect(() => {
    if (!player) return;
    if (isPlaying) player.play();
    else player.pause();
  }, [player, isPlaying]);

  useEffect(() => {
    if (!player) return;
    player.setVolume(volume);
    if (isMuted) player.mute();
    else player.unMute();
  }, [player, volume, isMuted]);

  useEffect(() => {
    if (!player) return;
    const timerId = window.setInterval(() => {
      // 멈춰 있을 때는 위치가 바뀌지 않으므로 읽지 않는다.
      // 복원 직후(cue 상태) 플레이어가 0초를 돌려줘서 저장된 위치를 덮어쓰는 것도 이걸로 막는다
      if (!usePlayerStore.getState().isPlaying) return;
      const next = { currentTime: player.getCurrentTime(), duration: player.getDuration() };
      setProgress(next);
      saveProgressEverySecond(next);
    }, PROGRESS_POLL_MS);
    return () => window.clearInterval(timerId);
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) return;
      player.seekTo(seconds);
      // 다음 읽기(최대 0.5초 뒤)까지 기다리지 않고 진행 바를 바로 옮긴다.
      // 멈춘 상태에서 옮긴 위치는 읽기로 저장되지 않으므로 여기서 저장한다
      const next = { currentTime: seconds, duration: progress.duration };
      setProgress(next);
      saveProgressEverySecond(next);
    },
    [player, progress.duration],
  );

  let error: PlayerError | null = null;
  if (isLoadFailed) error = 'load-failed';
  else if (videoId && unplayableVideoId === videoId) error = 'unplayable';

  return { ...progress, error, seekTo };
}
