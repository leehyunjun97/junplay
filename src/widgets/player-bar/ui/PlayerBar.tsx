import { useCallback, useState } from 'react';
import { usePlayerStore } from '@/entities/player';
import { usePlayerNavigation } from '@/features/play-playlist';
import { SaveSongButton } from '@/features/save-song';
import { LikeButton } from '@/features/toggle-like';
import { formatTime } from '@/shared/lib/time';
import { useToast } from '@/shared/lib/toast';
import {
  CollapseIcon,
  ExpandIcon,
  IconButton,
  ListIcon,
  LoopIcon,
  MarqueeText,
  MusicNoteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  Slider,
  Toast,
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
// iframe을 다른 부모로 옮기면 브라우저가 새로 불러와 재생이 끊기기 때문에, 요소는 그대로 두고 크기·위치만 바꾼다.
// 모바일에서도 YouTube 정책(200×200px 이상)을 지키도록 높이를 200px 이상으로 둔다
const VIDEO_BOX_CLASS = {
  // 플레이어 바(h-24) 위로 간격을 두고, 모바일은 좌우를 채운 높이 200px, md 이상은 오른쪽 아래 384×224px
  small: 'left-4 right-4 bottom-28 h-50 md:left-auto md:h-56 md:w-96',
  // 모바일: 헤더(h-16) 아래 위쪽에 높이 224px로 두고, 그 아래에 타임라인 목록을 쌓는다.
  // md 이상: 헤더와 플레이어 바 사이에서, 오른쪽 타임라인 목록(w-80 + 간격) 자리를 비우고 채운다.
  // 영상 비율이 맞지 않는 부분은 YouTube가 검은 여백으로 채운다
  expanded: 'left-4 right-4 top-20 h-56 md:right-88 md:bottom-28 md:h-auto',
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
  const setPlaying = usePlayerStore((store) => store.setPlaying);
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

  // 담기 결과 안내. 담기 버튼이 모두 이 위젯(타임라인 목록) 안에 있어서 전역 스토어 없이 여기서 관리한다
  const toast = useToast();

  // 타임라인이 없을 때 YouTube 영상 페이지에서 곡 정보를 찾도록 안내한다.
  // 새 탭에서 영상이 재생되면 소리가 겹치므로 우리 플레이어는 멈춘다
  const youtubeUrl = current
    ? `https://www.youtube.com/watch?v=${current.id}&t=${Math.floor(currentTime)}s`
    : '';

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
    <TimelineList
      state={timeline}
      currentIndex={currentTimelineIndex}
      onSelect={seekTo}
      youtubeUrl={youtubeUrl}
      onOpenYouTube={() => setPlaying(false)}
      renderSaveButton={(item) => (
        <SaveSongButton
          playlist={current}
          seconds={item.seconds}
          title={item.label}
          onResult={toast.show}
          iconClassName="size-5"
        />
      )}
    />
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

      {/* 펼친 상태: 타임라인 목록을 항상 보여 준다.
          모바일은 영상 아래(top-80 = 영상 top-20 + h-56 + 간격), md 이상은 영상 오른쪽 */}
      {hasCurrent && isExpanded && (
        <aside
          aria-label="타임라인 목록"
          className="bg-surface fixed inset-x-4 top-80 bottom-28 z-20 overflow-y-auto rounded-xl md:top-20 md:left-auto md:w-80"
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

      {/* 작은 상태: 헤더 바로 아래 가운데. 작은 영상은 아래쪽에 있어서 겹치지 않는다.
          펼친 상태: 헤더 아래에 영상이 있으므로, 영상을 가리지 않게(YouTube 정책) 타임라인 목록 위쪽으로 옮긴다.
          모바일은 영상 아래의 목록(top-80), md 이상은 오른쪽 목록(w-80)이다 */}
      <Toast
        message={toast.message}
        className={`inset-x-4 flex justify-center ${isExpanded ? 'top-80 md:top-20 md:left-auto md:w-80' : 'top-20'}`}
      />

      <section
        aria-label="플레이어"
        className="glass-player fixed inset-x-0 bottom-0 z-20 border-t"
      >
        <div className="mx-auto flex h-24 max-w-6xl flex-col justify-center gap-1 px-4">
          {/* 모바일은 버튼 사이 간격을 줄여 제목 자리를 확보한다 */}
          <div className="flex items-center gap-2 md:gap-3">
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
              {/* 제목과 둘째 줄은 길면 옆으로 흘러가며 끝까지 보여 준다.
                  key: 글자가 바뀌면(다른 플레이리스트, 다음 곡) 처음 위치부터 다시 흐르게 한다.
                  title: 흐르는 걸 기다리지 않아도(모션 줄이기면 ...으로 잘림) 마우스를 올려 전체 제목을 볼 수 있다 */}
              <p title={hasCurrent ? current.title : undefined} className="font-bold">
                <MarqueeText key={current?.id}>
                  {hasCurrent ? current.title : '플레이리스트를 골라 주세요'}
                </MarqueeText>
              </p>
              {/* 둘째 줄: 에러 > 지금 곡(타임라인) > 채널명 순으로 하나만 보여 준다 */}
              {error ? (
                <p role="alert" className="text-on-dark truncate text-sm font-bold">
                  {ERROR_MESSAGES[error]}
                </p>
              ) : currentTrack ? (
                <p className="text-on-dark text-sm">
                  <MarqueeText key={currentTrack.seconds}>
                    <span aria-hidden="true">♪ </span>
                    {currentTrack.label}
                  </MarqueeText>
                </p>
              ) : (
                hasCurrent && (
                  <p className="text-on-dark/70 text-sm">
                    <MarqueeText key={current.id}>{current.channelTitle}</MarqueeText>
                  </p>
                )
              )}
            </div>

            {/* 모바일(md 미만)에서는 한 줄에 다 들어가지 않아 일부 버튼을 숨긴다.
                md:contents: 감싼 div는 없는 것처럼 되어 안의 버튼이 바로 flex 항목으로 놓인다 */}
            {/* 이전/다음은 내가 들었던 플레이리스트 사이를 이동한다. 기록의 처음/끝이면 비활성화한다 */}
            <div className="hidden md:contents">
              <IconButton label="이전" onClick={playPrevious} disabled={!canGoPrevious}>
                <PreviousIcon />
              </IconButton>
            </div>
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
            {/* 듣는 도중 카드 위치를 잃어도 여기서 바로 좋아요할 수 있게 한다. 재생 전에는 비활성화된다 */}
            <LikeButton playlist={current} iconClassName="size-6" />
            {/* 모바일에서 타임라인은 크게 보기 화면에서 볼 수 있다 */}
            <div className="hidden md:contents">
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
            </div>
            <IconButton
              label="영상 크게 보기"
              onClick={handleToggleExpanded}
              pressed={isExpanded}
              disabled={!hasCurrent}
            >
              {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
            {/* 모바일은 기기의 볼륨 버튼으로 조절한다 (iOS는 웹에서 볼륨을 바꿀 수도 없다) */}
            <div className="hidden md:contents">
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
