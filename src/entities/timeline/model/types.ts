// 영상 설명란에 업로더가 적은 타임스탬프 한 줄 (예: `03:25 곡명 - 가수`)
export interface TimelineItem {
  seconds: number; // 시작 시간(초)
  label: string; // 업로더가 적은 곡 정보 그대로
}
