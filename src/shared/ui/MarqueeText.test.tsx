import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarqueeText } from './MarqueeText';

// 실제로 흐르는지(애니메이션)는 jsdom이 레이아웃을 계산하지 않아 확인할 수 없다. 화면에서 확인한다
describe('MarqueeText', () => {
  it('글자를 자르지 않고 전부 그린다', () => {
    const title =
      '잠깐 왔다가 사라지는 계절처럼, 머물렀다 가는 사람들처럼 | 악뮤, 잔나비, 김필, 카더가든';
    render(<MarqueeText>{title}</MarqueeText>);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('칸 너비를 기준으로 움직이도록 바깥을 컨테이너로, 안쪽에 마키 애니메이션을 둔다', () => {
    render(<MarqueeText>제목</MarqueeText>);

    const inner = screen.getByText('제목');
    expect(inner).toHaveClass('motion-safe:animate-marquee', 'whitespace-nowrap');
    expect(inner.parentElement).toHaveClass('@container', 'overflow-hidden');
  });
});
