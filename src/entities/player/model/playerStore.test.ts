import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_VOLUME,
  initialPlayerState,
  PLAYER_STORAGE_KEY,
  usePlayerStore,
  type PlayerItem,
} from './playerStore';

const item: PlayerItem = {
  id: 'VID1',
  title: '공부할 때 듣는 플레이리스트',
  channelTitle: '채널',
  thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
};

// localStorage에 저장된 플레이어 값을 읽는다
function readStoredState(): unknown {
  const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
  return raw === null ? null : (JSON.parse(raw) as { state: unknown }).state;
}

describe('usePlayerStore', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
  });

  it('처음에는 재생 중인 항목이 없고 기본 볼륨이다', () => {
    const state = usePlayerStore.getState();
    expect(state.current).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(DEFAULT_VOLUME);
    expect(state.isMuted).toBe(false);
  });

  it('play를 호출하면 해당 항목이 재생 상태가 된다', () => {
    usePlayerStore.getState().play(item);

    expect(usePlayerStore.getState().current).toEqual(item);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('togglePlay로 재생과 일시정지를 오간다', () => {
    usePlayerStore.getState().play(item);

    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('재생할 항목이 없으면 togglePlay를 해도 재생 상태가 되지 않는다', () => {
    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it.each([
    [150, 100],
    [-10, 0],
    [33.6, 34],
  ])('볼륨 %d은 0~100 정수인 %d로 맞춘다', (input, expected) => {
    usePlayerStore.getState().setVolume(input);
    expect(usePlayerStore.getState().volume).toBe(expected);
  });

  it('음소거를 켜고 끌 수 있고, 볼륨을 움직이면 음소거가 풀린다', () => {
    usePlayerStore.getState().toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(true);

    usePlayerStore.getState().setVolume(70);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it('반복을 켜고 끌 수 있고, 다른 플레이리스트를 재생해도 반복 설정은 유지된다', () => {
    usePlayerStore.getState().toggleLoop();
    expect(usePlayerStore.getState().isLoop).toBe(true);

    usePlayerStore.getState().play(item);
    expect(usePlayerStore.getState().isLoop).toBe(true);

    usePlayerStore.getState().toggleLoop();
    expect(usePlayerStore.getState().isLoop).toBe(false);
  });

  it('영상 크게 보기를 켜고 끌 수 있다', () => {
    usePlayerStore.getState().toggleExpanded();
    expect(usePlayerStore.getState().isExpanded).toBe(true);

    usePlayerStore.getState().setExpanded(false);
    expect(usePlayerStore.getState().isExpanded).toBe(false);
  });

  it('볼륨과 음소거 상태만 localStorage에 저장한다', () => {
    usePlayerStore.getState().play(item);
    usePlayerStore.getState().toggleLoop();
    usePlayerStore.getState().toggleExpanded();
    usePlayerStore.getState().setVolume(30);
    usePlayerStore.getState().toggleMute();

    expect(readStoredState()).toEqual({ volume: 30, isMuted: true });
  });

  it('저장된 볼륨과 음소거 상태를 다시 불러온다', async () => {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify({ state: { volume: 20, isMuted: true }, version: 0 }),
    );

    // 새로고침 후 앱이 시작될 때처럼 저장소에서 다시 읽는다
    await usePlayerStore.persist.rehydrate();

    expect(usePlayerStore.getState().volume).toBe(20);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });
});
