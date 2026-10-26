import { beforeEach, describe, expect, it } from 'vitest';
import {
  initialSavedSongState,
  SAVED_SONG_STORAGE_KEY,
  useSavedSongStore,
  type SavedSongPlaylist,
} from './savedSongStore';

function createPlaylist(id: string): SavedSongPlaylist {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// 담은 곡의 ID들 (최근 것이 앞)
function savedIds() {
  return useSavedSongStore.getState().songs.map((song) => song.id);
}

describe('useSavedSongStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSavedSongStore.setState(initialSavedSongState);
  });

  it('처음에는 담은 곡이 없다', () => {
    expect(useSavedSongStore.getState().songs).toEqual([]);
  });

  it('곡을 담으면 영상, 시작 시간, 곡명을 저장하고 메모는 비워 둔다', () => {
    const playlist = createPlaylist('VID1');

    const result = useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    expect(result).toBe('saved');
    expect(useSavedSongStore.getState().songs).toEqual([
      {
        id: 'VID1-200',
        playlist,
        seconds: 200,
        title: '곡2',
        memo: '',
        savedAt: expect.any(Number),
      },
    ]);
  });

  it('최근에 담은 곡이 앞에 온다', () => {
    const playlist = createPlaylist('VID1');

    useSavedSongStore.getState().save({ playlist, seconds: 0, title: '곡1' });
    useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    expect(savedIds()).toEqual(['VID1-200', 'VID1-0']);
  });

  it('같은 영상의 같은 구간을 다시 담으면 저장하지 않고 duplicate를 돌려준다', () => {
    const playlist = createPlaylist('VID1');
    useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    const result = useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    expect(result).toBe('duplicate');
    expect(savedIds()).toEqual(['VID1-200']);
  });

  it('다른 영상에서 담은 곡은 곡명과 시간이 같아도 따로 저장한다', () => {
    useSavedSongStore
      .getState()
      .save({ playlist: createPlaylist('VID1'), seconds: 0, title: '곡1' });

    const result = useSavedSongStore
      .getState()
      .save({ playlist: createPlaylist('VID2'), seconds: 0, title: '곡1' });

    expect(result).toBe('saved');
    expect(savedIds()).toEqual(['VID2-0', 'VID1-0']);
  });

  it('update로 곡명과 메모를 바꾸고, 앞뒤 공백을 지운다', () => {
    const playlist = createPlaylist('VID1');
    useSavedSongStore.getState().save({ playlist, seconds: 0, title: '곡1' });
    useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    useSavedSongStore.getState().update('VID1-0', { title: '  새 곡명 ', memo: ' 좋은 곡\n최고 ' });

    const [second, first] = useSavedSongStore.getState().songs;
    expect(first).toMatchObject({ id: 'VID1-0', title: '새 곡명', memo: '좋은 곡\n최고' });
    expect(second).toMatchObject({ id: 'VID1-200', title: '곡2', memo: '' });
  });

  it('곡명이 비거나 공백뿐이면 바꾸지 않는다', () => {
    useSavedSongStore
      .getState()
      .save({ playlist: createPlaylist('VID1'), seconds: 0, title: '곡1' });

    useSavedSongStore.getState().update('VID1-0', { title: '   ', memo: '메모' });

    expect(useSavedSongStore.getState().songs[0]).toMatchObject({ title: '곡1', memo: '' });
  });

  it('remove로 담은 곡을 삭제한다', () => {
    const playlist = createPlaylist('VID1');
    useSavedSongStore.getState().save({ playlist, seconds: 0, title: '곡1' });
    useSavedSongStore.getState().save({ playlist, seconds: 200, title: '곡2' });

    useSavedSongStore.getState().remove('VID1-0');

    expect(savedIds()).toEqual(['VID1-200']);
  });

  it('담은 곡을 localStorage에 저장하고 다시 불러온다', async () => {
    useSavedSongStore.getState().save({ playlist: createPlaylist('VID1'), seconds: 0, title: '' });
    const stored = localStorage.getItem(SAVED_SONG_STORAGE_KEY);
    expect(stored).not.toBeNull();

    // 새로고침 후 앱이 시작될 때처럼, 메모리 상태를 비우고 저장소에서 다시 읽는다
    useSavedSongStore.setState(initialSavedSongState);
    localStorage.setItem(SAVED_SONG_STORAGE_KEY, stored ?? '');
    await useSavedSongStore.persist.rehydrate();

    expect(savedIds()).toEqual(['VID1-0']);
  });
});
