import { Outlet } from 'react-router';
import { usePlayerStore } from '@/entities/player';
import { AmbientBackground } from '@/widgets/ambient-background';
import { Header } from '@/widgets/header';
import { PlayerBar } from '@/widgets/player-bar';

// 모든 페이지에 공통으로 들어가는 틀. 각 페이지는 <Outlet /> 자리에 렌더링된다.
// 페이지를 이동해도 이 틀은 그대로 남으므로, 여기 둔 플레이어 바는 재생이 끊기지 않는다
export function RootLayout() {
  const hasVideo = usePlayerStore((store) => store.current !== null);

  return (
    // isolate: 새 쌓임 맥락을 만들어 앰비언트 배경(-z-10)이 이 틀 안에서 가장 뒤에 깔리게 한다
    <div className="relative isolate flex min-h-screen flex-col">
      <AmbientBackground />
      <Header />
      {/* 아래쪽 여백을 둬서, 끝까지 스크롤했을 때 마지막 내용이 가려지지 않게 한다.
          플레이어 바(높이 96px)는 항상 있고, 재생 중에는 영상 상자까지 바닥에서
          모바일 약 312px(상자 높이 200px), md 이상 약 336px(상자 높이 224px)을 차지한다 */}
      <main
        className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 ${hasVideo ? 'pb-82 md:pb-88' : 'pb-28'}`}
      >
        <Outlet />
      </main>
      <PlayerBar />
    </div>
  );
}
