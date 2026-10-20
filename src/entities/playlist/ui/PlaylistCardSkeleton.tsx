// 불러오는 중에 카드 자리를 미리 잡아 두는 스켈레톤. PlaylistCard와 크기·줄 높이를 똑같이 맞춰서,
// 결과로 바뀔 때 레이아웃이 움직이지 않게 한다. 모션 줄이기 설정을 켠 사용자에게는 반짝이지 않는다
export function PlaylistCardSkeleton() {
  return (
    <div className="bg-surface overflow-hidden rounded-xl motion-safe:animate-pulse">
      {/* 썸네일 자리 (16:9) */}
      <div className="bg-on-dark/10 aspect-video w-full" />
      <div className="p-3">
        {/* 제목 2줄 자리. 카드 제목과 같은 줄 높이(leading-6 = 24px) 두 줄 */}
        <div className="flex h-6 items-center">
          <div className="bg-on-dark/10 h-4 w-full rounded" />
        </div>
        <div className="flex h-6 items-center">
          <div className="bg-on-dark/10 h-4 w-2/3 rounded" />
        </div>
        {/* 채널명 자리. 카드 채널명(text-sm, 20px)과 같은 높이 */}
        <div className="mt-1 flex h-5 items-center">
          <div className="bg-on-dark/10 h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
