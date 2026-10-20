import { useCallback, useState } from 'react';
import { usePlayerStore } from '@/entities/player';
import { usePlayerNavigation } from '@/features/play-playlist';
import { formatTime } from '@/shared/lib/time';
import {
  CollapseIcon,
  ExpandIcon,
  IconButton,
  ListIcon,
  LoopIcon,
  MusicNoteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  Slider,
  VolumeIcon,
  VolumeMutedIcon,
} from '@/shared/ui';
import { findCurrentTimelineIndex } from '../lib/findCurrentTimelineIndex';
import { useEscapeKey } from '../model/useEscapeKey';
import { useSpacebarTogglePlay } from '../model/useSpacebarTogglePlay';
import { useTimeline } from '../model/useTimeline';
import { useYouTubePlayer, type PlayerError } from '../model/useYouTubePlayer';
import { TimelineList } from './TimelineList';

const ERROR_MESSAGES: Record<PlayerError, string> = {
  unplayable: '재생할 수 없는 영상이에요.',
  'load-failed': '플레이어를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
};

// 영상 상자의 두 가지 모양. 같은 요소의 클래스만 바꾼다.
// iframe을 다른 부모로 옮기면 브라우저가 새로 불러와 재생이 끊기기 때문에, 요소는 그대로 두고 크기·위치만 바꾼다
const VIDEO_BOX_CLASS = {
  // 오른쪽 아래, 플레이어 바(h-24) 위로 간격을 두고 384×224px
  small: 'right-4 bottom-28 h-56 w-96',
  // 헤더(h-16)와 플레이어 바 사이에서, 오른쪽 타임라인 목록(w-80 + 간격) 자리를 비우고 채운다.
  // 영상 비율이 맞지 않는 부분은 YouTube가 검은 여백으로 채운다
  expanded: 'left-4 right-88 top-20 bottom-28',
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
  const isExpanded = usePlayerStore((store) => store.isExpanded);
  const togglePlay = usePlayerStore((store) => store.togglePlay);
  const setVolume = usePlayerStore((store) => store.setVolume);
  const toggleMute = usePlayerStore((store) => store.toggleMute);
  const toggleLoop = usePlayerStore((store) => store.toggleLoop);
  const toggleExpanded = usePlayerStore((store) => store.toggleExpanded);
  const setExpanded = usePlayerStore((store) => store.setExpanded);
  const { canGoPrevious, canGoNext, playPrevious, playNext } = usePlayerNavigation();

  const hasCurrent = current !== null;

  const timeline = useTimeline(current?.id);
  const timelineItems = timeline.status === 'success' ? timeline.items : [];
  const currentTimelineIndex = findCurrentTimelineIndex(timelineItems, currentTime);
  const currentTrack = timelineItems[currentTimelineIndex];

  // 작은 상태에서 여는 타임라인 패널. 펼친 상태에서는 영상 옆에 목록이 항상 있으므로 쓰지 않는다
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const showTimelinePanel = hasCurrent && isTimelineOpen && !isExpanded;

  const collapseVideo = useCallback(() => setExpanded(false), [setExpanded]);
  const closeTimelinePanel = useCallback(() => setIsTimelineOpen(false), []);
  useEscapeKey(isExpanded, collapseVideo);
  useEscapeKey(showTimelinePanel, closeTimelinePanel);

  // 영상을 펼칠 때 패널을 닫아 둔다. 그래야 다시 접었을 때 패널이 저절로 다시 나타나지 않는다
  const handleToggleExpanded = () => {
    setIsTimelineOpen(false);
    toggleExpanded();
  };

  const timelineList = (
    <TimelineList state={timeline} currentIndex={currentTimelineIndex} onSelect={seekTo} />
  );

  return (
    <>
      {/* 크게 볼 때 뒤쪽 페이지 내용을 가리는 배경. 영상(z-20)보다 아래(z-10)에 깔아서 영상을 덮지 않는다 */}
      {hasCurrent && isExpanded && (
        <div aria-hidden="true" className="bg-bg/95 fixed inset-x-0 top-16 bottom-24 z-10" />
      )}
      {/* YouTube 정책: 플레이어는 200×200px 이상으로 보여야 하고, 그 위에 다른 요소를 겹치면 안 된다 */}
      {hasCurrent && (
        <div
          ref={setVideoContainer}
          className={`bg-bg fixed z-20 ${isExpanded ? VIDEO_BOX_CLASS.expanded : VIDEO_BOX_CLASS.small}`}
        />
      )}

      {/* 펼친 상태: 영상 오른쪽에 타임라인 목록을 항상 보여 준다 */}
      {hasCurrent && isExpanded && (
        <aside
          aria-label="타임라인 목록"
          className="bg-surface fixed top-20 right-4 bottom-28 z-20 w-80 overflow-y-auto rounded-xl"
        >
          {timelineList}
        </aside>
      )}

      {/* 작은 상태의 타임라인 패널. 영상 상자(z-20)보다 아래(z-10)에 둬서,
          화면이 좁아 겹치더라도 패널이 영상을 가리지 않게 한다 (YouTube 정책) */}
      {showTimelinePanel && (
        <aside
          aria-label="타임라인 목록"
          className="bg-surface fixed bottom-28 left-4 z-10 h-80 w-80 overflow-y-auto rounded-xl"
        >
          {timelineList}
        </aside>
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
              {/* 둘째 줄: 에러 > 지금 곡(타임라인) > 채널명 순으로 하나만 보여 준다 */}
              {error ? (
                <p role="alert" className="text-on-dark truncate text-sm font-bold">
                  {ERROR_MESSAGES[error]}
                </p>
              ) : currentTrack ? (
                <p className="text-on-dark truncate text-sm">
                  <span aria-hidden="true">♪ </span>
                  {currentTrack.label}
                </p>
              ) : (
                hasCurrent && (
                  <p className="text-on-dark/70 truncate text-sm">{current.channelTitle}</p>
                )
              )}
            </div>

            {/* 이전/다음은 내가 들었던 플레이리스트 사이를 이동한다. 기록의 처음/끝이면 비활성화한다 */}
            <IconButton label="이전" onClick={playPrevious} disabled={!canGoPrevious}>
              <PreviousIcon />
            </IconButton>
            <IconButton
              label={isPlaying ? '일시정지' : '재생'}
              onClick={togglePlay}
              disabled={!hasCurrent}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton label="다음" onClick={playNext} disabled={!canGoNext}>
              <NextIcon />
            </IconButton>
            <IconButton label="반복" onClick={toggleLoop} pressed={isLoop} disabled={!hasCurrent}>
              {/* 켜져 있을 때만 진하게 보여 상태를 구분한다 */}
              <span className={isLoop ? 'opacity-100' : 'opacity-50'}>
                <LoopIcon />
              </span>
            </IconButton>
            {/* 펼친 상태에서는 목록이 이미 보이므로 비활성화한다 */}
            <IconButton
              label="타임라인"
              onClick={() => setIsTimelineOpen((open) => !open)}
              pressed={showTimelinePanel}
              disabled={!hasCurrent || isExpanded}
            >
              <ListIcon />
            </IconButton>
            <IconButton
              label="영상 크게 보기"
              onClick={handleToggleExpanded}
              pressed={isExpanded}
              disabled={!hasCurrent}
            >
              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
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
