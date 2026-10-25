// 큰 단위부터 확인한다
const UNITS = [
  { value: 100_000_000, label: '억' },
  { value: 10_000, label: '만' },
];

// 큰 수를 한국식 단위로 줄인다. 만 미만은 쉼표만 찍는다.
// 단위 앞자리가 한 자리일 때만 소수 한 자리를 쓰고, 반올림하지 않고 버린다 (YouTube 표기와 같은 방식).
// 예: 9999 → '9,999', 12345 → '1.2만', 99999 → '9.9만', 150000 → '15만', 123456789 → '1.2억'
export function formatKoreanCount(count: number): string {
  for (const unit of UNITS) {
    if (count >= unit.value) {
      const fractionDigits = count < unit.value * 10 ? 1 : 0;
      const factor = 10 ** fractionDigits;
      // count / unit.value를 먼저 하면 소수 오차가 생길 수 있어서, 정수끼리 계산한 뒤 버린다
      const truncated = Math.floor((count * factor) / unit.value) / factor;
      return `${truncated}${unit.label}`;
    }
  }
  return count.toLocaleString('ko-KR');
}
