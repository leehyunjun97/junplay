import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimelineItem } from '../model/types';

const fetchMock = vi.fn<typeof fetch>();

const timeline: TimelineItem[] = [
  { seconds: 0, label: '곡1' },
  { seconds: 205, label: '곡2' },
];

// 캐시가 모듈 안에 있으므로, 테스트마다 모듈을 새로 불러와 빈 캐시에서 시작한다
async function loadFetchTimeline() {
  vi.resetModules();
  const module = await import('./fetchTimeline');
  return module.fetchTimeline;
}

describe('fetchTimeline', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('/api/video에 영상 ID를 담아 요청하고 타임라인을 반환한다', async () => {
    fetchMock.mockResolvedValue(Response.json(timeline));
    const fetchTimeline = await loadFetchTimeline();

    await expect(fetchTimeline('AcbC3bhPgzY')).resolves.toEqual(timeline);
    expect(fetchMock).toHaveBeenCalledWith('/api/video?id=AcbC3bhPgzY');
  });

  it('같은 영상을 다시 요청하면 API를 다시 호출하지 않고 캐시를 쓴다', async () => {
    fetchMock.mockResolvedValue(Response.json(timeline));
    const fetchTimeline = await loadFetchTimeline();

    await fetchTimeline('AcbC3bhPgzY');
    await expect(fetchTimeline('AcbC3bhPgzY')).resolves.toEqual(timeline);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('서버가 에러로 응답하면 에러를 던지고, 다음 요청에서 다시 시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: '실패' }, { status: 502 }))
      .mockResolvedValueOnce(Response.json(timeline));
    const fetchTimeline = await loadFetchTimeline();

    await expect(fetchTimeline('AcbC3bhPgzY')).rejects.toThrow('502');
    await expect(fetchTimeline('AcbC3bhPgzY')).resolves.toEqual(timeline);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('응답 형식이 올바르지 않으면 에러를 던진다', async () => {
    fetchMock.mockResolvedValue(Response.json([{ seconds: '0', label: '곡1' }]));
    const fetchTimeline = await loadFetchTimeline();

    await expect(fetchTimeline('AcbC3bhPgzY')).rejects.toThrow('형식');
  });
});
