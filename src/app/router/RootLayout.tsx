import { Outlet } from 'react-router';
import { Header } from '@/widgets/header';

// 모든 페이지에 공통으로 들어가는 틀. 각 페이지는 <Outlet /> 자리에 렌더링된다
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
