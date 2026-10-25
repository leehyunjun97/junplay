import type { LoadMoreStatus } from '@/entities/playlist';
import { Button } from '@/shared/ui';

interface LoadMoreControlProps {
  status: LoadMoreStatus;
  onLoadMore: () => void;
}

// 결과 아래의 더 보기 버튼. 불러오는 중에는 비활성화하고, 실패하면 안내 문구와 다시 시도 버튼을 보여 준다
export function LoadMoreControl({ status, onLoadMore }: LoadMoreControlProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {status === 'error' && (
        <p role="alert" className="text-selected text-sm">
          더 불러오지 못했어요.
        </p>
      )}
      <Button onClick={onLoadMore} disabled={status === 'loading'}>
        {status === 'loading' ? '불러오는 중...' : status === 'error' ? '다시 시도' : '더 보기'}
      </Button>
    </div>
  );
}
