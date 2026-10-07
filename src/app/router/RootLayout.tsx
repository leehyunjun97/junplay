import { Outlet } from 'react-router';
import { AmbientBackground } from '@/widgets/ambient-background';
import { Header } from '@/widgets/header';

// 모든 페이지에 공통으로 들어가는 틀. 각 페이지는 <Outlet /> 자리에 렌더링된다
export function RootLayout() {
  return (
    // isolate: 새 쌓임 맥락을 만들어 앰비언트 배경(-z-10)이 이 틀 안에서 가장 뒤에 깔리게 한다
    <div className="relative isolate flex min-h-screen flex-col">
      <AmbientBackground />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
