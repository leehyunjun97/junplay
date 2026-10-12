import { useState } from 'react';
import { usePlayerStore } from '@/entities/player';
import { formatTime } from '@/shared/lib/time';
import {
  IconButton,
  LoopIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  Slider,
  VolumeIcon,
  VolumeMutedIcon,
} from '@/shared/ui';
import { useSpacebarTogglePlay } from '../model/useSpacebarTogglePlay';
import { useYouTubePlayer, type PlayerError } from '../model/useYouTubePlayer';

const ERROR_MESSAGES: Record<PlayerError, string> = {
  unplayable: '재생할 수 없는 영상이에요.',
  'load-failed': '플레이어를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
};

// 화면 하단에 항상 떠 있는 플레이어 바. 재생할 항목이 생기면 그 위에 영상 상자가 나타난다
export function PlayerBar() {
  // 영상 상자 요소. ref 대신 state로 받아서, 상자가 나타나는 순간 플레이어를 만드는 effect가 실행되게 한다
  const [videoContainer, setVideoContainer] = useState<HTMLDivElement | null>(null);
  const { currentTime, duration, error, seekTo } = useYouTubePlayer(videoContainer);
  useSpacebarTogglePlay();

  const current = usePlayerStore((store) => store.current);
  const isPlaying = usePlayerStore((store) => store.isPlaying);
  const volume = usePlayerStore((store) => store.volume);
  const isMuted = usePlayerStore((store) => store.isMuted);
  const isLoop = usePlayerStore((store) => store.isLoop);
  const togglePlay = usePlayerStore((store) => store.togglePlay);
  const setVolume = usePlayerStore((store) => store.setVolume);
  const toggleMute = usePlayerStore((store) => store.toggleMute);
  const toggleLoop = usePlayerStore((store) => store.toggleLoop);

  const hasCurrent = current !== null;

  return (
    <>
      {/* YouTube 정책: 플레이어는 200×200px 이상으로 보여야 하고, 그 위에 다른 요소를 겹치면 안 된다.
          그래서 플레이어 바(h-24) 위로 간격을 두고 384×224px 크기로 띄운다 */}
      {hasCurrent && (
        <div ref={setVideoContainer} className="bg-bg fixed right-4 bottom-28 z-20 h-56 w-96" />
      )}

      <section
        aria-label="플레이어"
        className="glass-player fixed inset-x-0 bottom-0 z-20 border-t"
      >
        <div className="mx-auto flex h-24 max-w-6xl flex-col justify-center gap-1 px-4">
          <div className="flex items-center gap-3">
            {hasCurrent ? (
              // 제목이 바로 옆에 있으므로 썸네일은 장식으로 처리한다
              <img src={current.thumbnailUrl} alt="" className="size-12 rounded-md object-cover" />
            ) : (
              <div className="bg-on-dark/15 flex size-12 shrink-0 items-center justify-center rounded-md">
                <MusicNoteIcon />
              </div>
            )}
            {/* min-w-0: flex 안에서 글자가 길어도 줄어들 수 있게 해야 truncate가 동작한다 */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {hasCurrent ? current.title : '플레이리스트를 골라 주세요'}
              </p>
              {error ? (
                <p role="alert" className="text-on-dark truncate text-sm font-bold">
                  {ERROR_MESSAGES[error]}
                </p>
              ) : (
                hasCurrent && (
                  <p className="text-on-dark/70 truncate text-sm">{current.channelTitle}</p>
                )
              )}
            </div>

            <IconButton
              label={isPlaying ? '일시정지' : '재생'}
              onClick={togglePlay}
              disabled={!hasCurrent}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton label="반복" onClick={toggleLoop} pressed={isLoop} disabled={!hasCurrent}>
              {/* 켜져 있을 때만 진하게 보여 상태를 구분한다 */}
              <span className={isLoop ? 'opacity-100' : 'opacity-50'}>
                <LoopIcon />
              </span>
            </IconButton>
            <IconButton label={isMuted ? '음소거 해제' : '음소거'} onClick={toggleMute}>
              {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
            </IconButton>
            {/* 음소거 중에는 0으로 보여 준다. 슬라이더를 움직이면 음소거가 풀린다 */}
            <Slider
              label="볼륨"
              value={isMuted ? 0 : volume}
              max={100}
              onChange={setVolume}
              className="w-24 shrink-0"
            />
          </div>

          <div className="text-on-dark/80 flex items-center gap-3 text-xs tabular-nums">
            <span className="w-14 text-right">{formatTime(currentTime)}</span>
            <Slider
              label="재생 위치"
              value={Math.min(currentTime, duration)}
              max={duration}
              onChange={seekTo}
              disabled={!hasCurrent || duration === 0}
              valueText={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              className="min-w-0 flex-1"
            />
            <span className="w-14">{formatTime(duration)}</span>
          </div>
        </div>
      </section>
    </>
  );
}
