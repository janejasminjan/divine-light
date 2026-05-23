import { Bookmark, BookmarkCheck, Play } from "lucide-react";

export function AyahCard({
  ayahNumber,
  arabicText,
  translation,
  transliteration,
  showTranslation,
  showTransliteration,
  hiddenMode,
  isBookmarked,
  onToggleBookmark,
  onPlay,
}: {
  ayahNumber: number;
  arabicText: string;
  translation: string;
  transliteration: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  hiddenMode: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onPlay: () => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-secondary px-2 text-xs font-medium">
          {ayahNumber}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
            title="Play ayah"
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleBookmark}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-right text-2xl leading-loose sm:text-3xl" dir="rtl" lang="ar">
        {hiddenMode ? "• ".repeat(Math.max(6, Math.round(arabicText.length / 5))) : arabicText}
      </p>

      {showTransliteration && !hiddenMode ? (
        <p className="mt-4 text-sm text-muted-foreground">{transliteration}</p>
      ) : null}

      {showTranslation && !hiddenMode ? <p className="mt-2 text-sm sm:text-base">{translation}</p> : null}
    </article>
  );
}