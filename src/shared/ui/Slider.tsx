interface SliderProps {
  // 화면에 이름이 없으므로 스크린 리더가 읽을 이름을 반드시 받는다
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  // 숫자 대신 읽어 줄 값 (예: '1:05 / 3:20')
  valueText?: string;
  // 너비처럼 놓이는 자리에 따라 달라지는 클래스만 받는다
  className?: string;
}

// 가로 슬라이더(볼륨, 재생 위치). 클릭 가능한 요소의 상태를 여기서 정의한다
export function Slider({
  label,
  value,
  min = 0,
  max,
  onChange,
  disabled,
  valueText,
  className = '',
}: SliderProps) {
  return (
    <input
      type="range"
      aria-label={label}
      aria-valuetext={valueText}
      min={min}
      max={max}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`accent-on-dark focus-visible:outline-on-dark cursor-pointer rounded-sm hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150 ${className}`}
    />
  );
}
