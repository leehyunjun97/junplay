import type { SaveSongResult } from '@/entities/saved-song';

// 담기 결과마다 토스트로 보여 줄 문구
export const SAVE_SONG_MESSAGES: Record<SaveSongResult, string> = {
  saved: '내 곡에 담았어요',
  duplicate: '이미 담은 곡이에요',
};
