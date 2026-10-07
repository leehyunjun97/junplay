import type { RouteObject } from 'react-router';
import { HomePage } from '@/pages/home';
import { MyPlaylistPage } from '@/pages/my-playlist';
import { SearchPage } from '@/pages/search';
import { RootLayout } from './RootLayout';

// 브라우저 라우터와 테스트용 메모리 라우터가 같은 정의를 쓰도록 분리했다
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'my', element: <MyPlaylistPage /> },
    ],
  },
];
