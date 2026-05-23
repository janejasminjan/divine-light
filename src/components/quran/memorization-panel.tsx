export function MemorizationPanel({
  fromAyah,
  toAyah,
  hideWords,
  onFromAyahChange,
  onToAyahChange,
  onToggleHideWords,
  onSaveProgress,
}: {
  fromAyah: number;
  toAyah: number;
  hideWords: boolean;
  onFromAyahChange: (value: number) => void;
  onToAyahChange: (value: number) => void;
  onToggleHideWords: (value: boolean) => void;
  onSaveProgress: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-medium">Memorization mode</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From ayah
          <input
            type="number"
            min={1}
            value={fromAyah}
            onChange={(event) => onFromAyahChange(Number(event.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To ayah
          <input
            type="number"
            min={1}
            value={toAyah}
            onChange={(event) => onToAyahChange(Number(event.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hideWords}
          onChange={(event) => onToggleHideWords(event.target.checked)}
        />
        Hide words for active recall
      </label>

      <button
        type="button"
        onClick={onSaveProgress}
        className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
      >
        Save memorization progress
      </button>
    </section>
  );
}