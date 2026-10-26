interface ToastProps {
  // 보여 줄 문구. null이면 아무것도 보이지 않는다
  message: string | null;
  // 화면 위치 (top-*, left-* 등). 놓을 자리는 쓰는 쪽이 정한다
  className?: string;
}

// 잠깐 보였다가 사라지는 안내 문구. 사라지는 시점은 shared/lib/toast의 useToast가 정한다.
// role="status" 영역은 항상 그려 둔다. 영역이 미리 있어야 문구가 바뀔 때 스크린 리더가 읽어 준다
export function Toast({ message, className = '' }: ToastProps) {
  return (
    <div role="status" className={`pointer-events-none fixed z-30 ${className}`}>
      {message && (
        <p className="bg-overlay text-on-dark rounded-lg px-4 py-3 text-center text-sm font-bold shadow-lg">
          {message}
        </p>
      )}
    </div>
  );
}
