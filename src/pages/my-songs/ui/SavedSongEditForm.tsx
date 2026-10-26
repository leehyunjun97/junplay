import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { SavedSong, SaveSongChanges } from '@/entities/saved-song';
import { Button } from '@/shared/ui';

interface SavedSongEditFormProps {
  song: SavedSong;
  onSave: (changes: SaveSongChanges) => void;
  onCancel: () => void;
}

const FIELD_CLASS =
  'bg-input border-input-border text-bg placeholder:text-bg/60 hover:border-primary-light focus-visible:outline-primary w-full rounded-lg border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2';

// 담은 곡의 곡명과 메모를 고치는 폼. 내 곡 목록의 행 안에서 바로 열린다.
// 곡명 칸에서 Enter는 저장(폼 제출), 메모 칸에서 Enter는 줄바꿈, 어디서든 Esc는 취소다
export function SavedSongEditForm({ song, onSave, onCancel }: SavedSongEditFormProps) {
  const [title, setTitle] = useState(song.title);
  const [memo, setMemo] = useState(song.memo);
  // 공백만 있는 곡명도 빈 곡명으로 본다
  const canSave = title.trim() !== '';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSave) onSave({ title, memo });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') onCancel();
  };

  return (
    <form
      aria-label="곡 수정"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex min-w-0 flex-1 flex-col gap-2 text-sm"
    >
      <label className="flex flex-col gap-1">
        <span className="text-on-dark/70">곡명</span>
        {/* 수정을 누르면 바로 입력할 수 있게 곡명 칸에 포커스를 준다 */}
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
          className={FIELD_CLASS}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-on-dark/70">메모</span>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={3}
          placeholder="이 곡에 대해 적어 두세요"
          className={`${FIELD_CLASS} resize-none`}
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>취소</Button>
        <Button type="submit" disabled={!canSave}>
          저장
        </Button>
      </div>
    </form>
  );
}
