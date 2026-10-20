import { useState } from 'react';
import { usePlayerStore } from '@/entities/player';

// 페이지 뒤에 깔리는 흐린 배경. 뒤에 비칠 것이 있어야 유리 효과가 보인다.
// 재생할 항목이 있으면 그 썸네일을 크게 흐려서 깔아, 썸네일 색이 화면 전체에 번지게 한다 (SPEC: 앰비언트 배경).
// 재생 전에는 기본 배경(primary, selected, overlay 색)을 쓴다
export function AmbientBackground() {
  const thumbnailUrl = usePlayerStore((store) => store.current?.thumbnailUrl);

  // 화면에 깔린 썸네일들. 마지막 것이 맨 위다.
  // 썸네일이 바뀌면 이전 것 위에 새 것을 겹쳐 서서히 나타나게 하고, 다 나타나면 이전 것을 지운다 (크로스페이드)
  const [layers, setLayers] = useState<string[]>(() => (thumbnailUrl ? [thumbnailUrl] : []));
  // 렌더링 중에 바로 맞춘다. effect에서 바꾸면 이전 배경이 한 번 더 그려진 뒤에 바뀐다
  if (thumbnailUrl && layers.at(-1) !== thumbnailUrl) {
    setLayers([...layers.slice(-1), thumbnailUrl]);
  }

  const removeOldLayers = (url: string) => {
    setLayers((current) => (current.at(-1) === url ? [url] : current));
  };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 기본 배경. 썸네일이 처음 나타날 때 이 위로 서서히 겹쳐진다 */}
      <div className="bg-primary absolute -top-32 -left-32 size-[36rem] rounded-full opacity-30 blur-3xl" />
      <div className="bg-selected absolute top-1/3 -right-40 size-[32rem] rounded-full opacity-30 blur-3xl" />
      <div className="bg-overlay absolute -bottom-40 left-1/4 size-[40rem] rounded-full opacity-50 blur-3xl" />

      {layers.map((url) => (
        // scale-125: 흐림 효과로 가장자리가 투명하게 빠지는 부분을 화면 밖으로 밀어낸다.
        // 모션 줄이기 설정을 켠 사용자에게는 서서히 나타나지 않고 바로 바뀐다
        <img
          key={url}
          src={url}
          alt=""
          data-testid="ambient-thumbnail"
          onAnimationEnd={() => removeOldLayers(url)}
          className="motion-safe:animate-fade-in absolute inset-0 size-full scale-125 object-cover blur-3xl"
        />
      ))}
      {/* 밝은 썸네일 위에서도 글자가 읽히도록 어둡게 덮는다 */}
      {layers.length > 0 && <div className="bg-bg/70 absolute inset-0" />}
    </div>
  );
}
