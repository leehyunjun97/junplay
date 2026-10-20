// 곡 정보 자리의 막대 길이. 줄마다 조금씩 달라야 실제 목록처럼 보인다
const LABEL_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5', 'w-2/3', 'w-1/2', 'w-3/4'];

// 타임라인을 불러오는 중에 목록 자리를 잡아 두는 스켈레톤. TimelineList 항목과 줄 높이·여백을 맞춘다.
// 장식이라 스크린 리더에서는 숨긴다. 모션 줄이기 설정을 켠 사용자에게는 반짝이지 않는다
export function TimelineListSkeleton() {
  return (
    <div
      aria-hidden="true"
      data-testid="timeline-skeleton"
      className="flex flex-col gap-1 p-2 motion-safe:animate-pulse"
    >
      {LABEL_WIDTHS.map((width, index) => (
        // 항목 버튼과 같은 여백(px-3 py-2)과 글자 줄 높이(text-sm, 20px)
        <div key={index} className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-5 items-center">
            {/* 시간 자리 */}
            <div className="bg-on-dark/10 h-3 w-10 rounded" />
          </div>
          <div className="flex h-5 flex-1 items-center">
            {/* 곡 정보 자리 */}
            <div className={`bg-on-dark/10 h-3 rounded ${width}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
