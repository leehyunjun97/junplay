import type { ReactNode } from 'react';

interface MarqueeTextProps {
  children: ReactNode;
}

// 한 줄 글자. 칸보다 길면 옆으로 천천히 흘러가며 끝까지 보여 주고, 짧으면 가만히 있다.
// 길이는 JavaScript로 재지 않는다: 바깥 칸을 컨테이너(@container)로 두고, 애니메이션에서
// 칸 너비(cqw)와 글자 너비(%)의 차이만큼만 움직인다 (index.css의 marquee 참고).
// 모션 줄이기 설정을 켠 사용자에게는 움직이지 않고 ...으로 자른다
export function MarqueeText({ children }: MarqueeTextProps) {
  return (
    <span className="@container block overflow-hidden">
      <span className="motion-safe:animate-marquee block whitespace-nowrap motion-safe:w-max motion-reduce:truncate">
        {children}
      </span>
    </span>
  );
}
