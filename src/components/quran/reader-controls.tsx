import type { ReciterEdition, SupportedLanguage } from "@/lib/quran-api";

const languageOptions: Array<{ label: string; value: SupportedLanguage }> = [
  { label: "English", value: "en.asad" },
  { label: "French", value: "fr.hamidullah" },
  { label: "Urdu", value: "ur.jalandhry" },
];

const reciterOptions: Array<{ label: string; value: ReciterEdition }> = [
  { label: "Mishary Alafasy", value: "ar.alafasy" },
  { label: "Husary", value: "ar.husary" },
  { label: "Abdurrahmaan Sudais", value: "ar.abdurrahmaansudais" },
];

export function ReaderControls({
  language,
  reciter,
  showTranslation,
  showTransliteration,
  onLanguageChange,
  onReciterChange,
  onToggleTranslation,
  onToggleTransliteration,
}: {
  language: SupportedLanguage;
  reciter: ReciterEdition;
  showTranslation: boolean;
  showTransliteration: boolean;
  onLanguageChange: (value: SupportedLanguage) => void;
  onReciterChange: (value: ReciterEdition) => void;
  onToggleTranslation: (checked: boolean) => void;
  onToggleTransliteration: (checked: boolean) => void;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Translation language
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Reciter
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          value={reciter}
          onChange={(event) => onReciterChange(event.target.value as ReciterEdition)}
        >
          {reciterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={showTranslation}
          onChange={(event) => onToggleTranslation(event.target.checked)}
        />
        Translation
      </label>

      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={showTransliteration}
          onChange={(event) => onToggleTransliteration(event.target.checked)}
        />
        Transliteration
      </label>
    </section>
  );
}