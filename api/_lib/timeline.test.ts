// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseTimeline } from './timeline.js';

describe('parseTimeline', () => {
  it('줄 앞의 타임스탬프와 곡 정보를 읽는다', () => {
    const description = ['00:00 첫 번째 곡 - 가수A', '03:25 두 번째 곡 - 가수B'].join('\n');

    expect(parseTimeline(description)).toEqual([
      { seconds: 0, label: '첫 번째 곡 - 가수A' },
      { seconds: 205, label: '두 번째 곡 - 가수B' },
    ]);
  });

  it('시간이 포함된 타임스탬프(1:02:30)와 한 자리 분(0:00)을 읽는다', () => {
    const description = ['0:00 곡1', '59:59 곡2', '1:02:30 곡3', '10:00:00 곡4'].join('\n');

    expect(parseTimeline(description).map((item) => item.seconds)).toEqual([0, 3599, 3750, 36000]);
  });

  it('60분이 넘는 분 단위 표기(75:30)도 읽는다', () => {
    const description = ['00:00 곡1', '75:30 곡2'].join('\n');
    expect(parseTimeline(description)[1]?.seconds).toBe(4530);
  });

  it('줄 끝에 있는 타임스탬프를 읽는다', () => {
    const description = ['곡1 - 가수A 00:00', '곡2 - 가수B | 04:10'].join('\n');

    expect(parseTimeline(description)).toEqual([
      { seconds: 0, label: '곡1 - 가수A' },
      { seconds: 250, label: '곡2 - 가수B' },
    ]);
  });

  it('괄호, 트랙 번호, 구분 기호를 걷어낸다', () => {
    const description = [
      '[00:00] 곡1',
      '(03:00) 곡2',
      '01. 06:00 곡3',
      '2) 09:00 - 곡4',
      '▶ 12:00 | 곡5',
      '• 15:00 : 곡6',
    ].join('\n');

    expect(parseTimeline(description).map((item) => item.label)).toEqual([
      '곡1',
      '곡2',
      '곡3',
      '곡4',
      '곡5',
      '곡6',
    ]);
  });

  it('한 줄에 구간(시작 ~ 끝)이 적혀 있으면 시작 시간을 쓴다', () => {
    const description = ['00:00 ~ 03:25 곡1', '03:25 ~ 07:00 곡2'].join('\n');

    expect(parseTimeline(description)).toEqual([
      { seconds: 0, label: '곡1' },
      { seconds: 205, label: '곡2' },
    ]);
  });

  it('타임스탬프가 없는 줄은 건너뛴다', () => {
    const description = [
      '오늘의 플레이리스트입니다 🎧',
      '',
      '00:00 곡1',
      '구독과 좋아요 부탁드려요',
      '04:00 곡2',
      'https://example.com/link',
    ].join('\n');

    expect(parseTimeline(description).map((item) => item.label)).toEqual(['곡1', '곡2']);
  });

  it('타임스탬프가 하나뿐이면 타임라인으로 보지 않는다', () => {
    expect(parseTimeline('0:30부터 너무 좋아요')).toEqual([]);
  });

  it('타임스탬프가 없으면 빈 배열을 반환한다', () => {
    expect(parseTimeline('설명란에 시간 정보가 없습니다.')).toEqual([]);
    expect(parseTimeline('')).toEqual([]);
  });

  it('범위를 벗어난 값(초 60 이상, 시간이 있을 때 분 60 이상)은 무시한다', () => {
    const description = ['00:00 곡1', '03:60 잘못된 초', '1:75:00 잘못된 분', '05:00 곡2'].join(
      '\n',
    );

    expect(parseTimeline(description).map((item) => item.label)).toEqual(['곡1', '곡2']);
  });

  it('날짜나 긴 숫자 안의 콜론은 타임스탬프로 보지 않는다', () => {
    const description = ['00:00 곡1', '05:00 곡2', '업로드 2024:01:02:03', '비율 123:45:678'].join(
      '\n',
    );

    expect(parseTimeline(description)).toHaveLength(2);
  });

  it('순서가 섞여 있으면 시간순으로 정렬하고 같은 시간은 하나만 남긴다', () => {
    const description = ['05:00 곡2', '00:00 곡1', '05:00 곡2 중복'].join('\n');

    expect(parseTimeline(description)).toEqual([
      { seconds: 0, label: '곡1' },
      { seconds: 300, label: '곡2' },
    ]);
  });

  it('곡 정보 없이 시간만 있으면 순번으로 이름을 붙인다', () => {
    const description = ['00:00', '03:00 곡2'].join('\n');

    expect(parseTimeline(description)[0]?.label).toBe('1번 트랙');
  });

  it('Windows 줄바꿈(\\r\\n)도 처리한다', () => {
    expect(parseTimeline('00:00 곡1\r\n03:00 곡2')).toEqual([
      { seconds: 0, label: '곡1' },
      { seconds: 180, label: '곡2' },
    ]);
  });
});
