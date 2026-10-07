// 페이지 뒤에 깔리는 흐린 색 배경. 뒤에 비칠 것이 있어야 유리 효과가 보인다.
// 지금은 기본 배경(primary, selected, overlay)만 있고, F4에서 재생 중인 썸네일로 바꾼다.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-primary absolute -top-32 -left-32 size-[36rem] rounded-full opacity-30 blur-3xl" />
      <div className="bg-selected absolute top-1/3 -right-40 size-[32rem] rounded-full opacity-30 blur-3xl" />
      <div className="bg-overlay absolute -bottom-40 left-1/4 size-[40rem] rounded-full opacity-50 blur-3xl" />
    </div>
  );
}
