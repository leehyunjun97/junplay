// 초를 화면에 보여 줄 시간 문자열로 바꾼다. 1시간이 넘으면 시간을 붙인다.
// 예: 5 → '0:05', 65 → '1:05', 3750 → '1:02:30'
export function formatTime(totalSeconds: number): string {
  // 영상 정보가 오기 전의 NaN이나 음수는 0으로 본다
  const seconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = String(seconds % 60).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${restSeconds}`;
  }
  return `${minutes}:${restSeconds}`;
}
