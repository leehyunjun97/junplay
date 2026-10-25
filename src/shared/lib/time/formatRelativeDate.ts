const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 이 날수까지는 "N일 전"으로, 넘으면 절대 날짜로 보여 준다
const RELATIVE_DAYS_LIMIT = 7;

// 예: 2025. 10. 1.
const absoluteDateFormat = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

// 날짜를 "3일 전"처럼 지금과의 차이로 보여 준다. 7일이 넘으면 "2025. 10. 1."처럼 날짜 그대로 보여 준다.
// 날짜를 읽을 수 없으면 null을 반환한다. 테스트하기 쉽게 현재 시각을 인자로 받는다
export function formatRelativeDate(isoDate: string, now: number = Date.now()): string | null {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return null;

  // 기기 시계가 조금 느려서 미래 날짜가 되는 경우도 "방금 전"으로 본다
  const elapsed = now - time;
  if (elapsed < MINUTE_MS) return '방금 전';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}분 전`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}시간 전`;

  const days = Math.floor(elapsed / DAY_MS);
  if (days <= RELATIVE_DAYS_LIMIT) return `${days}일 전`;
  return absoluteDateFormat.format(time);
}
