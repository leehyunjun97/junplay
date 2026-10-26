import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 곡을 담은 영상. 같은 레이어(entities)의 playlist 슬라이스를 import하지 않으려고 필요한 모양을 따로 적는다.
// TypeScript는 모양이 같으면 같은 타입으로 보므로 Playlist를 그대로 넘길 수 있다.
export interface SavedSongPlaylist {
  id: string; // YouTube videoId
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt?: string;
  viewCount?: number;
}

// 담은 곡. 곡 단위 재생이 아니라 "이 영상의 이 위치" 북마크다
export interface SavedSong {
  id: string; // `${videoId}-${seconds}`. 같은 영상의 같은 구간 중복 판별에 사용
  playlist: SavedSongPlaylist;
  seconds: number; // 곡 시작 시간(초)
  title: string; // 타임라인 label 또는 직접 입력. 비어 있을 수 있음
  memo: string;
  savedAt: number; // timestamp
}

// 담을 때 넘기는 값. id, 메모, 담은 시각은 스토어가 채운다
export interface SaveSongInput {
  playlist: SavedSongPlaylist;
  seconds: number;
  title: string;
}

// 수정할 수 있는 값
export interface SaveSongChanges {
  title: string;
  memo: string;
}

// 담기 결과. 이미 담은 곡이면 저장하지 않고 'duplicate'를 돌려준다
export type SaveSongResult = 'saved' | 'duplicate';

interface SavedSongState {
  // 최근에 담은 것이 앞에 온다
  songs: SavedSong[];
}

interface SavedSongActions {
  save: (input: SaveSongInput) => SaveSongResult;
  // 곡명과 메모를 바꾼다. 앞뒤 공백은 지우고, 곡명이 비면 바꾸지 않는다
  update: (id: string, changes: SaveSongChanges) => void;
  remove: (id: string) => void;
}

export type SavedSongStore = SavedSongState & SavedSongActions;

export const SAVED_SONG_STORAGE_KEY = 'junplaylist-saved-songs';

export const initialSavedSongState: SavedSongState = {
  songs: [],
};

// 다른 영상이면 곡명이 같아도 id가 달라서 따로 저장된다
export function createSavedSongId(videoId: string, seconds: number): string {
  return `${videoId}-${seconds}`;
}

export const useSavedSongStore = create<SavedSongStore>()(
  persist(
    (set, get) => ({
      ...initialSavedSongState,
      save: ({ playlist, seconds, title }) => {
        const id = createSavedSongId(playlist.id, seconds);
        if (get().songs.some((song) => song.id === id)) return 'duplicate';

        const song: SavedSong = { id, playlist, seconds, title, memo: '', savedAt: Date.now() };
        set((state) => ({ songs: [song, ...state.songs] }));
        return 'saved';
      },
      update: (id, changes) => {
        const title = changes.title.trim();
        // 화면에서 저장을 막더라도, 빈 곡명이 저장되지 않도록 스토어에서도 한 번 더 막는다
        if (!title) return;
        const memo = changes.memo.trim();
        set((state) => ({
          songs: state.songs.map((song) => (song.id === id ? { ...song, title, memo } : song)),
        }));
      },
      remove: (id) => set((state) => ({ songs: state.songs.filter((song) => song.id !== id) })),
    }),
    // 새로고침해도 담은 곡이 유지되도록 localStorage에 저장한다
    { name: SAVED_SONG_STORAGE_KEY },
  ),
);
