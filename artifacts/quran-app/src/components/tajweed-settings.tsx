import { useRef } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TAJWEED_RULES, TAJWEED_THEMES, RULE_BY_ID,
  type TajweedThemeId, type TajweedRule,
} from "@/lib/tajweed-rules";
import { RotateCcw, BookOpen } from "lucide-react";

/* ── Category order for the legend ───────────────────────────── */
const LEGEND_ORDER = [
  "madda_normal", "madda_permissible", "madda_necessary", "madda_obligatory",
  "qalqalah",
  "ghunnah",
  "ikhfa",
  "idgham_ghunnah", "idgham_no_ghunnah", "idgham_shafawi", "idgham_meem_meem",
  "iqlab",
  "ham_wasl", "silent", "lam_shamsiyyah",
];

/* ── Rule swatch — a tiny colored rectangle ───────────────────── */
function RuleSwatch({ ruleId, themeId }: { ruleId: string; themeId: TajweedThemeId }) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-sm shrink-0 mt-0.5 tj-swatch-${ruleId} data-tj-theme-swatch="${themeId}"`}
      style={{ background: getSwatchColor(ruleId, themeId) }}
    />
  );
}

function getSwatchColor(ruleId: string, themeId: TajweedThemeId): string {
  const map: Record<TajweedThemeId, Record<string, string>> = {
    vivid: {
      ham_wasl: "#aaaaaa", silent: "#cccccc", lam_shamsiyyah: "#aaaaaa",
      madda_normal: "#537FFF", madda_permissible: "#4050FF",
      madda_necessary: "#000EBC", madda_obligatory: "#3F7F3F",
      qalqalah: "#DD0008", ghunnah: "#169200", ikhfa: "#D500B7",
      idgham_ghunnah: "#58B800", idgham_no_ghunnah: "#169200",
      idgham_shafawi: "#58B800", idgham_meem_meem: "#008000", iqlab: "#26BFFD",
    },
    soft: {
      ham_wasl: "#b8b8b8", silent: "#d0d0d0", lam_shamsiyyah: "#b8b8b8",
      madda_normal: "#7aa3d4", madda_permissible: "#5d86c0",
      madda_necessary: "#4a6fa5", madda_obligatory: "#5a8a5a",
      qalqalah: "#c06060", ghunnah: "#4d9960", ikhfa: "#a060a0",
      idgham_ghunnah: "#78a850", idgham_no_ghunnah: "#4d9960",
      idgham_shafawi: "#78a850", idgham_meem_meem: "#4a7a4a", iqlab: "#5aaad0",
    },
    hc: {
      ham_wasl: "#808080", silent: "#aaaaaa", lam_shamsiyyah: "#808080",
      madda_normal: "#0044FF", madda_permissible: "#002299",
      madda_necessary: "#0000AA", madda_obligatory: "#005500",
      qalqalah: "#CC0000", ghunnah: "#007700", ikhfa: "#AA0099",
      idgham_ghunnah: "#338800", idgham_no_ghunnah: "#007700",
      idgham_shafawi: "#338800", idgham_meem_meem: "#005500", iqlab: "#0088CC",
    },
    cb: {
      ham_wasl: "#555555", silent: "#777777", lam_shamsiyyah: "#555555",
      madda_normal: "#0066CC", madda_permissible: "#0044AA",
      madda_necessary: "#002288", madda_obligatory: "#005522",
      qalqalah: "#AA2200", ghunnah: "#006600", ikhfa: "#660066",
      idgham_ghunnah: "#336600", idgham_no_ghunnah: "#004400",
      idgham_shafawi: "#336600", idgham_meem_meem: "#004400", iqlab: "#004488",
    },
  };
  return map[themeId]?.[ruleId] ?? "#888888";
}

/* ── Compact legend (shown on reading page) ───────────────────── */
export function TajweedLegendBar({ themeId }: { themeId: TajweedThemeId }) {
  const shown = [
    "madda_normal", "madda_obligatory", "qalqalah",
    "ghunnah", "ikhfa", "idgham_ghunnah", "iqlab",
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 bg-muted/30 border-b border-border/40 text-[10px] text-muted-foreground">
      {shown.map(id => {
        const rule = RULE_BY_ID.get(id);
        if (!rule) return null;
        return (
          <span key={id} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm shrink-0"
              style={{ background: getSwatchColor(id, themeId) }}
            />
            {rule.name}
          </span>
        );
      })}
    </div>
  );
}

/* ── Rule explanation popup (tap-to-explain) ─────────────────── */
export function TajweedRulePopup({
  rule,
  onClose,
}: {
  rule: TajweedRule;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-popover border border-border rounded-xl shadow-xl w-full max-w-sm p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-foreground">{rule.name}</p>
            <p className="text-base font-bold text-primary" dir="rtl">{rule.arabicName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground mt-0.5 text-lg leading-none"
          >×</button>
        </div>
        <p className="text-xs font-medium text-primary/80 uppercase tracking-wide">{rule.categoryLabel}</p>
        <p className="text-sm text-foreground">{rule.shortDesc}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{rule.longDesc}</p>
        <p className="text-[11px] text-muted-foreground/70 pt-1">
          Accessibility: <span className="font-mono">{rule.accessibilityMarker}</span>
        </p>
      </div>
    </div>
  );
}

/* ── Main settings sheet ─────────────────────────────────────── */
export interface TajweedSettingsProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  theme: TajweedThemeId;
  onThemeChange: (v: TajweedThemeId) => void;
  legendVisible: boolean;
  onLegendVisibleChange: (v: boolean) => void;
  tapExplain: boolean;
  onTapExplainChange: (v: boolean) => void;
  learningMode: boolean;
  onLearningModeChange: (v: boolean) => void;
  focusRule: string | null;
  onFocusRuleChange: (v: string | null) => void;
  onReset: () => void;
}

export function TajweedSettings({
  open, onOpenChange,
  enabled, onEnabledChange,
  theme, onThemeChange,
  legendVisible, onLegendVisibleChange,
  tapExplain, onTapExplainChange,
  learningMode, onLearningModeChange,
  focusRule, onFocusRuleChange,
  onReset,
}: TajweedSettingsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[380px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Tajweed Settings
          </SheetTitle>
          <SheetDescription className="text-xs">
            Color-coded recitation rules
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">

            {/* ── Master toggle ── */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Tajweed Colors</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show color-coded Tajweed rules</p>
              </div>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>

            {/* ── Theme picker ── */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Color Theme
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {TAJWEED_THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id)}
                    disabled={!enabled}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      theme === t.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    } ${!enabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {/* Color swatches preview */}
                    <div className="flex gap-1 mb-2">
                      {t.previewColors.map((c, i) => (
                        <span
                          key={i}
                          className="inline-block w-3.5 h-3.5 rounded-sm"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium leading-tight">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Display options ── */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Display
              </Label>
              <SettingRow
                label="Show Legend Bar"
                desc="Color key below the surah header"
                checked={legendVisible}
                onChange={onLegendVisibleChange}
                disabled={!enabled}
              />
              <SettingRow
                label="Tap to Explain"
                desc="Tap a colored letter to see the rule"
                checked={tapExplain}
                onChange={onTapExplainChange}
                disabled={!enabled}
              />
            </div>

            {/* ── Learning mode ── */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Learning Mode
              </Label>
              <SettingRow
                label="Focus on One Rule"
                desc="Dim all others, highlight only the selected rule"
                checked={learningMode}
                onChange={v => {
                  onLearningModeChange(v);
                  if (!v) onFocusRuleChange(null);
                }}
                disabled={!enabled}
              />
              {learningMode && enabled && (
                <div className="pl-2">
                  <p className="text-xs text-muted-foreground mb-2">Select rule to focus:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {TAJWEED_RULES.map(rule => (
                      <button
                        key={rule.id}
                        onClick={() => onFocusRuleChange(rule.id === focusRule ? null : rule.id)}
                        className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                          focusRule === rule.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ background: getSwatchColor(rule.id, theme) }}
                        />
                        <span className="font-medium">{rule.name}</span>
                        <span className="text-muted-foreground text-[10px] ml-auto">{rule.arabicName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Full legend ── */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rule Legend
              </Label>
              <div className="space-y-2">
                {LEGEND_ORDER.map(id => {
                  const rule = RULE_BY_ID.get(id);
                  if (!rule) return null;
                  return (
                    <div key={id} className="flex items-start gap-2.5">
                      <div className="flex items-center gap-1.5 shrink-0 w-[120px]">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5"
                          style={{ background: getSwatchColor(id, theme) }}
                        />
                        <span className={`text-[11px] font-medium leading-tight ${!enabled ? "opacity-40" : ""}`}>
                          {rule.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight flex-1 pt-0.5">
                        {rule.shortDesc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Reset ── */}
            <div className="border-t border-border/40 pt-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-muted-foreground text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Tajweed settings
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ── Reusable setting row ─────────────────────────────────────── */
function SettingRow({
  label, desc, checked, onChange, disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? "opacity-40" : ""}`}>
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
