// 영상 설명란에서 업로더가 적은 타임스탬프를 찾아 타임라인으로 바꾼다.
// 예: `00:00 곡명 - 가수`, `[1:02:30] 곡명`, `01. 03:25 곡명`, `곡명 - 가수 03:25`

// 타입만 가져오므로 빌드 시 지워진다 (youtube.ts의 Playlist와 같은 이유로 순수 타입 파일을 직접 가리킨다)
import type { TimelineItem } from '../../src/entities/timeline/model/types.js';
import type { VideoComment } from './youtube.js';

// `0:00`, `00:00`, `1:02:30` 형태. 앞뒤에 숫자나 `:`가 붙어 있으면 더 긴 숫자의 일부이므로 제외한다
const TIMESTAMP_PATTERN = /(?<![\d:])(?:(\d{1,2}):)?(\d{1,3}):(\d{2})(?![\d:])/g;

// 타임스탬프가 하나뿐이면 "0:30부터 좋아요" 같은 문장일 가능성이 커서 타임라인으로 보지 않는다
const MIN_TIMELINE_ITEMS = 2;

// 시·분·초를 초로 바꾼다. 시간이 있으면 분은 59까지, 초는 항상 59까지만 인정한다
function toSeconds(hours: string | undefined, minutes: string, seconds: string): number | null {
  const h = hours === undefined ? 0 : Number(hours);
  const m = Number(minutes);
  const s = Number(seconds);
  if (s > 59) return null;
  if (hours !== undefined && m > 59) return null;
  return h * 3600 + m * 60 + s;
}

// 타임스탬프를 지운 줄에서 남은 장식(앞 번호, 빈 괄호, 앞뒤 구분 기호)을 걷어내 곡 정보만 남긴다
function cleanLabel(text: string): string {
  return text
    .replace(/\[\s*\]|\(\s*\)/g, ' ') // 타임스탬프를 감싸던 빈 괄호
    .replace(/^\s*\d{1,3}[.)]\s+/, '') // 앞의 트랙 번호 (`01. `, `1) `)
    .replace(/^[\s\-–—|·:~>▶►•*]+|[\s\-–—|·:~<]+$/g, '') // 앞뒤 구분 기호
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTimeline(description: string): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const line of description.split(/\r?\n/)) {
    // 한 줄에 시간이 여러 개면(`00:00 ~ 03:25 곡명`) 첫 번째를 시작 시간으로 쓴다
    const [first] = line.matchAll(TIMESTAMP_PATTERN);
    if (!first) continue;

    const [, hours, minutes = '', seconds = ''] = first;
    const startSeconds = toSeconds(hours, minutes, seconds);
    if (startSeconds === null) continue;

    items.push({ seconds: startSeconds, label: cleanLabel(line.replace(TIMESTAMP_PATTERN, ' ')) });
  }

  if (items.length < MIN_TIMELINE_ITEMS) return [];

  // 시간순으로 정렬하고, 같은 시간이 여러 번 나오면 처음 것만 남긴다
  const sorted = items
    .sort((a, b) => a.seconds - b.seconds)
    .filter((item, index, array) => index === 0 || item.seconds !== array[index - 1]?.seconds);

  // 곡 정보 없이 시간만 적힌 줄은 순번으로 이름을 붙인다
  return sorted.map((item, index) => ({ ...item, label: item.label || `${index + 1}번 트랙` }));
}

// 설명란에 타임라인이 없을 때, 업로더가 직접 쓴 댓글에서 타임라인을 찾는다.
// 다른 사람이 쓴 댓글은 정확한지 보장할 수 없어서 쓰지 않는다. 업로더 댓글이 여러 개면 앞(관련도가 높은) 것을 쓴다
export function findUploaderTimeline(
  comments: VideoComment[],
  uploaderChannelId: string,
): TimelineItem[] {
  for (const comment of comments) {
    if (comment.authorChannelId !== uploaderChannelId) continue;
    const items = parseTimeline(comment.text);
    if (items.length > 0) return items;
  }
  return [];
}
