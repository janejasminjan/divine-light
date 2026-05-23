import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  useGetUserProfile,
  getGetUserProfileQueryKey,
  useUpdateUserProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, Settings as SettingsIcon, Check, RotateCcw } from "lucide-react";
import { Sun, Moon, Flame, Layers, Smartphone, FileText } from "lucide-react";
import { useTranslationPreference } from "@/hooks/use-translation-preference";
import { useQuranScript, QURAN_SCRIPTS } from "@/hooks/use-quran-script";
import { useReadingProfile } from "@/hooks/use-reading-profile";
import {
  getPreviewColors,
  DEFAULT_SETTINGS,
  type ProfileId,
  type ProfileSettings,
  type KindleSubTheme,
} from "@/lib/display-profiles";

/* ── Static data ─────────────────────────────────────────────── */
const TRANSLATIONS = [
  { key: "en.sahih",         label: "Sahih International",     lang: "English"   },
  { key: "en.asad",          label: "Muhammad Asad",           lang: "English"   },
  { key: "en.pickthall",     label: "Pickthall",               lang: "English"   },
  { key: "en.yusufali",      label: "Yusuf Ali",               lang: "English"   },
  { key: "ur.jawadi",        label: "Jawadi",                  lang: "اردو"      },
  { key: "ur.ahmedali",      label: "Ahmed Ali",               lang: "اردو"      },
  { key: "fr.hamidullah",    label: "Hamidullah",              lang: "Français"  },
  { key: "es.bornez",        label: "Bornez",                  lang: "Español"   },
  { key: "tr.diyanet",       label: "Diyanet İşleri",          lang: "Türkçe"    },
  { key: "de.bubenheim",     label: "Bubenheim & Elyas",       lang: "Deutsch"   },
  { key: "id.indonesian",    label: "Indonesian Ministry",     lang: "Indonesia" },
  { key: "zh.majian",        label: "Ma Jian",                 lang: "中文"      },
];

const RECITERS = [
  { id: "ar.alafasy",           name: "Mishary Rashid Alafasy",              style: "Murattal" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman Al-Sudais",             style: "Murattal" },
  { id: "ar.abdullahbasfar",    name: "Abdullah Basfar",                     style: "Murattal" },
  { id: "ar.husary",            name: "Mahmoud Khalil Al-Husary",            style: "Murattal" },
  { id: "ar.minshawi",          name: "Mohamed Siddiq Al-Minshawi",          style: "Murattal" },
  { id: "ar.muhammadayyoub",    name: "Muhammad Ayyoub",                     style: "Murattal" },
  { id: "ar.shaatree",          name: "Abu Bakr Al-Shatri",                  style: "Murattal" },
  { id: "ar.mahermuaiqly",      name: "Maher Al-Muaiqly",                    style: "Murattal" },
  { id: "ar.saoodshuraym",      name: "Saud Al-Shuraim",                     style: "Murattal" },
  { id: "ar.ahmedajamy",        name: "Ahmed ibn Ali Al-Ajamy",              style: "Murattal" },
  { id: "ar.hanirifai",         name: "Hani Ar-Rifai",                       style: "Murattal" },
  { id: "ar.hudhaify",          name: "Ali Al-Hudhaifi",                     style: "Murattal" },
  { id: "ar.muhammadjibreel",   name: "Muhammad Jibreel",                    style: "Murattal" },
  { id: "ar.minshawimujawwad",  name: "Mohamed Al-Minshawi (Mujawwad)",      style: "Mujawwad" },
  { id: "ar.husarymujawwad",    name: "Mahmoud Khalil Al-Husary (Mujawwad)", style: "Mujawwad" },
];

const GOALS    = [
  { id: "recite",     label: "Learn to Recite"       },
  { id: "memorize",   label: "Memorize (Hifz)"       },
  { id: "understand", label: "Understand Meanings"   },
  { id: "all",        label: "All of the Above"      },
];
const LEVELS   = [
  { id: "beginner",     label: "Beginner"     },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced",     label: "Advanced"     },
];
const FONT_SIZES = [
  { id: "small",       label: "Small"       },
  { id: "medium",      label: "Medium"      },
  { id: "large",       label: "Large"       },
  { id: "extra_large", label: "Extra Large" },
];
const DURATIONS = [5, 10, 15, 30, 60];

/* ── Profile catalogue ───────────────────────────────────────── */
const PROFILES: {
  id: ProfileId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  eReader: boolean;
}[] = [
  { id: "light",  label: "Light",    desc: "Standard bright display",          icon: Sun,        eReader: false },
  { id: "dark",   label: "Dark",     desc: "Dark OLED / night reading",         icon: Moon,       eReader: false },
  { id: "kobo",   label: "Kobo",     desc: "ComfortLight PRO warm ramp",        icon: Flame,      eReader: true  },
  { id: "boox",   label: "BOOX",     desc: "Dual white + amber front-light",    icon: Layers,     eReader: true  },
  { id: "kindle", label: "Kindle",   desc: "Software White / Sepia / Black",    icon: Smartphone, eReader: true  },
  { id: "paper",  label: "Paper",    desc: "Passive reflective e-ink surface",  icon: FileText,   eReader: true  },
];

const E_READER_IDS = ["kobo", "boox", "kindle", "paper"] as const;

/* ── Mini preview card ───────────────────────────────────────── */
function ProfilePreview({
  id, label, desc, settings, isActive, onClick,
}: {
  id: "kobo" | "boox" | "kindle" | "paper";
  label: string; desc: string;
  settings: ProfileSettings;
  isActive: boolean;
  onClick: () => void;
}) {
  const c = getPreviewColors(id, settings);
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl overflow-hidden transition-all ${
        isActive ? "ring-2 ring-primary shadow-md" : "opacity-80 hover:opacity-100 hover:shadow-sm"
      }`}
      style={{ border: `1.5px solid ${isActive ? "var(--primary)" : c.border}` }}
    >
      {/* Mini reading surface */}
      <div className="flex" style={{ height: "96px" }}>
        {/* Tiny sidebar strip */}
        <div className="w-4 flex-shrink-0" style={{ background: c.sidebar }} />
        {/* Page */}
        <div
          className="flex-1 flex flex-col justify-between px-2 py-2"
          style={{ background: c.bg }}
        >
          <p
            dir="rtl"
            className="font-arabic text-[11px] leading-relaxed text-right"
            style={{ color: c.fg }}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <p className="text-[8px] leading-snug" style={{ color: c.fg2 }}>
            In the name of Allah, the Entirely Merciful
          </p>
        </div>
      </div>
      {/* Label strip */}
      <div className="px-2 py-1.5" style={{ background: c.sidebar }}>
        <p className="text-[10px] font-semibold leading-none truncate" style={{ color: c.fg }}>
          {label}
        </p>
        <p className="text-[9px] mt-0.5 leading-none truncate" style={{ color: c.fg2 }}>
          {desc}
        </p>
      </div>
    </button>
  );
}

/* ── Calibration row helper ──────────────────────────────────── */
function CalibRow({
  label, hint, value, min = 0, max = 100, onChange,
}: {
  label: string; hint?: string;
  value: number; min?: number; max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-foreground">{label}</span>
          {hint && <span className="ml-2 text-[10px] text-muted-foreground">{hint}</span>}
        </div>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-8 text-right">
          {value}
        </span>
      </div>
      <Slider
        min={min} max={max} step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="h-1.5"
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Page component
   ════════════════════════════════════════════════════════════════ */
export default function Settings() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetUserProfile({
    query: { queryKey: getGetUserProfileQueryKey() },
  });
  const updateProfile = useUpdateUserProfile();
  const [saved, setSaved] = useState(false);

  const { translationKey, setTranslationKey } = useTranslationPreference();
  const { scriptId, setScriptId }             = useQuranScript();

  const {
    profileId, setProfileId,
    settings,  updateSettings, resetProfile,
    isEReader,
  } = useReadingProfile();

  const [form, setForm] = useState({
    displayName: "",
    goal: "all",
    level: "beginner",
    dailyDurationMinutes: 15,
    tajweedHighlightingEnabled: false,
    transliterationEnabled: false,
    preferredReciter: "ar.alafasy",
    fontSizePreference: "medium",
    darkMode: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName:               profile.displayName ?? "",
        goal:                      profile.goal,
        level:                     profile.level,
        dailyDurationMinutes:      profile.dailyDurationMinutes,
        tajweedHighlightingEnabled: profile.tajweedHighlightingEnabled,
        transliterationEnabled:    profile.transliterationEnabled,
        preferredReciter:          profile.preferredReciter,
        fontSizePreference:        profile.fontSizePreference,
        darkMode:                  profile.darkMode,
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: form as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const activeProfile = PROFILES.find(p => p.id === profileId);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <SettingsIcon className="h-7 w-7" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Customize your learning experience.</p>
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
          {saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : updateProfile.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : "Save Changes"}
        </Button>
      </div>

      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* ── Profile ─────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your name"
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Learning ────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Learning</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Goal</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => setForm({ ...form, goal: g.id })}
                    className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                      form.goal === g.id
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setForm({ ...form, level: l.id })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      form.level === l.id
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daily Practice Duration</Label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setForm({ ...form, dailyDurationMinutes: d })}
                    className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                      form.dailyDurationMinutes === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Reading Profile ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading Profile</CardTitle>
            <CardDescription>
              Simulate real e-reader display surfaces with precise perceptual colour control.
              Each profile has its own isolated token set — changing one never affects another.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* 6-profile selector */}
            <div className="flex flex-wrap gap-2">
              {PROFILES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProfileId(p.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border transition-all ${
                    profileId === p.id
                      ? "border-primary bg-primary/8 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <p.icon className="h-3.5 w-3.5" />
                  {p.label}
                  {profileId === p.id && <Check className="h-3 w-3 ml-0.5" />}
                </button>
              ))}
            </div>

            {/* Side-by-side e-reader preview */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Surface Preview — same text across all four profiles
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {E_READER_IDS.map(id => {
                  const p = PROFILES.find(x => x.id === id)!;
                  return (
                    <ProfilePreview
                      key={id}
                      id={id}
                      label={p.label}
                      desc={p.desc}
                      settings={settings}
                      isActive={profileId === id}
                      onClick={() => setProfileId(id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Calibration panel — shown only for e-reader profiles */}
            {isEReader && (
              <div className="rounded-xl border border-border bg-muted/25 p-5 space-y-5">
                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeProfile?.label} Calibration
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {activeProfile?.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => resetProfile(profileId as keyof ProfileSettings)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset defaults
                  </button>
                </div>

                {/* ── Kobo controls ── */}
                {profileId === "kobo" && (
                  <div className="space-y-4">
                    <CalibRow
                      label="Front-light Brightness"
                      hint="dim → full bright"
                      value={settings.kobo.brightness}
                      onChange={v => updateSettings("kobo", { brightness: v })}
                    />
                    <CalibRow
                      label="Warmth"
                      hint="cool daylight → candlelight"
                      value={settings.kobo.warmth}
                      onChange={v => updateSettings("kobo", { warmth: v })}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground -mt-2">
                      <span>Cool white</span><span>Candlelight</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
                      ComfortLight PRO model — front-lit warm ramp with gradual blue-light reduction.
                      Background stays paper-like at all warmth levels; never becomes a glowing LCD.
                    </p>
                  </div>
                )}

                {/* ── BOOX controls ── */}
                {profileId === "boox" && (
                  <div className="space-y-4">
                    <CalibRow
                      label="White LED Channel"
                      hint="cool white contribution"
                      value={settings.boox.whiteChannel}
                      onChange={v => updateSettings("boox", { whiteChannel: v })}
                    />
                    <CalibRow
                      label="Amber LED Channel"
                      hint="warm amber contribution"
                      value={settings.boox.amberChannel}
                      onChange={v => updateSettings("boox", { amberChannel: v })}
                    />
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
                      Dual front-light channels blend perceptually in OKLCH space. The mix stays
                      paper-like across all combinations — never resembles backlit LCD glow.
                    </p>
                  </div>
                )}

                {/* ── Kindle controls ── */}
                {profileId === "kindle" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-foreground">Theme</span>
                      <div className="flex gap-2">
                        {(["white", "sepia", "black"] as KindleSubTheme[]).map(t => (
                          <button
                            key={t}
                            onClick={() => updateSettings("kindle", { subTheme: t })}
                            className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-all ${
                              settings.kindle.subTheme === t
                                ? "border-primary bg-primary/8 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {settings.kindle.subTheme === "sepia" && (
                      <CalibRow
                        label="Sepia Intensity"
                        hint="mild → deep tint"
                        value={settings.kindle.sepiaIntensity}
                        onChange={v => updateSettings("kindle", { sepiaIntensity: v })}
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
                      Kindle App software theme simulation. No hardware LED warmth is modelled —
                      only the display software colour profile. Sepia tint uses OKLCH chroma interpolation
                      to avoid hue drift.
                    </p>
                  </div>
                )}

                {/* ── Paper controls ── */}
                {profileId === "paper" && (
                  <div className="space-y-4">
                    <CalibRow
                      label="Ink Contrast"
                      hint="light charcoal → deep ink"
                      value={settings.paper.contrast}
                      onChange={v => updateSettings("paper", { contrast: v })}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground -mt-2">
                      <span>Low contrast</span><span>Deep charcoal</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
                      Passive reflective surface — no emitted light. The matte off-white background
                      is fixed (ambient-light-first). Only text ink depth is adjustable.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Display ─────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Display</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tajweed Highlighting</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Color-code Tajweed rules in the text</p>
              </div>
              <Switch
                checked={form.tajweedHighlightingEnabled}
                onCheckedChange={v => setForm({ ...form, tajweedHighlightingEnabled: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Transliteration</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show Latin-script phonetics below Arabic</p>
              </div>
              <Switch
                checked={form.transliterationEnabled}
                onCheckedChange={v => setForm({ ...form, transliterationEnabled: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Font Size</Label>
              <div className="flex gap-2">
                {FONT_SIZES.map(fs => (
                  <button key={fs.id} onClick={() => setForm({ ...form, fontSizePreference: fs.id })}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                      form.fontSizePreference === fs.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Quran Script ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quran Script Style</CardTitle>
            <CardDescription>
              Choose the calligraphy tradition used to display the Arabic text throughout the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {QURAN_SCRIPTS.map(script => (
                <button key={script.id} onClick={() => setScriptId(script.id)}
                  className={`w-full flex items-start justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                    scriptId === script.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }`}>
                  <div className="min-w-0">
                    <div className={`text-sm ${scriptId === script.id ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                      {script.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{script.region}</div>
                    <div className="text-xs text-muted-foreground/60">{script.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    {scriptId === script.id && <Check className="h-4 w-4 text-primary" />}
                    <span className={`text-lg leading-loose ${script.fontClass}`} dir="rtl">
                      {script.id === "uthmani" && "ٱلْحَمْدُ لِلَّهِ"}
                      {script.id === "indopak"  && "ٱلْحَمْدُ لِلَّهِ"}
                      {script.id === "warsh"    && "الحمد لله"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Preferred Reciter ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferred Reciter</CardTitle>
            <CardDescription>Choose the voice for audio recitation — applies to all playback throughout the app</CardDescription>
          </CardHeader>
          <CardContent>
            {(["Murattal", "Mujawwad"] as const).map(style => {
              const group = RECITERS.filter(r => r.style === style);
              return (
                <div key={style} className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {style === "Murattal" ? "Murattal (Measured recitation)" : "Mujawwad (Melodic recitation)"}
                  </div>
                  <div className="space-y-1.5">
                    {group.map(r => (
                      <button key={r.id} onClick={() => setForm({ ...form, preferredReciter: r.id })}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-all ${
                          form.preferredReciter === r.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}>
                        <span className={`text-sm ${form.preferredReciter === r.id ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                          {r.name}
                        </span>
                        {form.preferredReciter === r.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Preferred Translation ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferred Translation</CardTitle>
            <CardDescription>
              Your chosen translation is used in the Quran reader and saved across sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const groups = TRANSLATIONS.reduce<Record<string, typeof TRANSLATIONS>>((acc, t) => {
                if (!acc[t.lang]) acc[t.lang] = [];
                acc[t.lang].push(t);
                return acc;
              }, {});
              return Object.entries(groups).map(([lang, options]) => (
                <div key={lang} className="mb-5 last:mb-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {lang}
                  </div>
                  <div className="space-y-1.5">
                    {options.map(t => (
                      <button key={t.key} onClick={() => setTranslationKey(t.key)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-all ${
                          translationKey === t.key
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}>
                        <span className={`text-sm ${translationKey === t.key ? "font-semibold text-primary" : "font-medium text-foreground"}`}>
                          {t.label}
                        </span>
                        {translationKey === t.key && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </CardContent>
        </Card>

      {/* ── Attribution ───────────────────────────────────────── */}
      <div className="pt-2 pb-4 flex flex-col items-center gap-1.5">
        <div className="text-base font-medium text-foreground/80 tracking-wide">
          Made with <span className="text-red-500">❤️</span> by <span className="font-semibold text-primary">Badrul</span>
        </div>
        <div className="text-xs text-muted-foreground">Qiyam · Quran & Hadith Learning</div>
      </div>

      </motion.div>
    </div>
  );
}
