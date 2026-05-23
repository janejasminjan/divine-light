import { motion } from "framer-motion";
import { Link } from "wouter";
import { useReminders, SPECIAL_SURAHS, type Frequency } from "@/hooks/use-reminders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, BellRing, BookOpen, ExternalLink, Info } from "lucide-react";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Every day",
  friday: "Fridays only",
  weekends: "Fri & Sat",
};

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

function FrequencyPicker({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
}) {
  const options: Frequency[] = ["daily", "friday", "weekends"];
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            value === f
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          {FREQUENCY_LABELS[f]}
        </button>
      ))}
    </div>
  );
}

export default function Reminders() {
  const {
    config,
    permissionState,
    requestPermission,
    setDailyRecitation,
    setSurahReminder,
    sendTestNotification,
  } = useReminders();

  const notSupported = !("Notification" in window);
  const granted = permissionState === "granted";
  const denied = permissionState === "denied";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Reminders
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay consistent with daily recitation and special Surahs.
          </p>
        </div>
      </div>

      {/* Permission banner */}
      {notSupported ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-start gap-3 pt-4">
            <BellOff className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-orange-800 text-sm">Notifications not supported</div>
              <p className="text-xs text-orange-600 mt-0.5">Your browser doesn't support the Notification API. Try Chrome, Edge, or Firefox.</p>
            </div>
          </CardContent>
        </Card>
      ) : !granted ? (
        <Card className={`border-2 ${denied ? "border-red-200 bg-red-50" : "border-secondary/40 bg-secondary/5"}`}>
          <CardContent className="flex items-center justify-between pt-4 pb-4 gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <BellRing className={`h-5 w-5 mt-0.5 flex-shrink-0 ${denied ? "text-red-500" : "text-primary"}`} />
              <div>
                <div className={`font-medium text-sm ${denied ? "text-red-700" : "text-foreground"}`}>
                  {denied ? "Notifications blocked" : "Enable browser notifications"}
                </div>
                <p className={`text-xs mt-0.5 ${denied ? "text-red-500" : "text-muted-foreground"}`}>
                  {denied
                    ? "You blocked notifications. Re-enable them in your browser's site settings, then reload."
                    : "Qiyam needs permission to send you reminder notifications."}
                </p>
              </div>
            </div>
            {!denied && (
              <Button onClick={() => requestPermission()} size="sm" className="flex-shrink-0 gap-2">
                <Bell className="h-3.5 w-3.5" /> Allow Notifications
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between pt-4 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-green-600" />
              <div className="text-sm font-medium text-green-800">Notifications are enabled</div>
            </div>
            <Button variant="outline" size="sm" onClick={sendTestNotification} className="text-xs border-green-300 text-green-700 hover:bg-green-100">
              Send Test
            </Button>
          </CardContent>
        </Card>
      )}

      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* Daily recitation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">📖</span> Daily Recitation
                </CardTitle>
                <CardDescription className="mt-1">
                  A daily nudge to open the Quran and read.
                </CardDescription>
              </div>
              <Switch
                checked={config.dailyRecitation.enabled}
                onCheckedChange={v => setDailyRecitation({ enabled: v })}
                disabled={!granted}
              />
            </div>
          </CardHeader>
          {config.dailyRecitation.enabled && (
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Remind me at</Label>
                  <TimePicker
                    value={config.dailyRecitation.time}
                    onChange={t => setDailyRecitation({ time: t })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <FrequencyPicker
                    value={config.dailyRecitation.frequency}
                    onChange={f => setDailyRecitation({ frequency: f })}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Special Surahs */}
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">Special Surah Reminders</div>
          <p className="text-xs text-muted-foreground mb-4">
            These surahs carry immense rewards when recited regularly. Set a reminder for each one.
          </p>

          <div className="space-y-4">
            {SPECIAL_SURAHS.map((surah, idx) => {
              const sr = config.surahs[surah.id];
              if (!sr) return null;
              return (
                <motion.div
                  key={surah.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card className={sr.enabled ? "border-primary/20 bg-primary/[0.02]" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl leading-none mt-0.5">{surah.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">Surah {surah.name}</span>
                              <span className="font-arabic text-base text-primary">{surah.arabic}</span>
                              <Badge variant="outline" className="text-xs">#{surah.id}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{surah.benefit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Read this Surah">
                            <Link href={`/quran/${surah.id}`}>
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                          </Button>
                          <Switch
                            checked={sr.enabled}
                            onCheckedChange={v => setSurahReminder(surah.id, { enabled: v })}
                            disabled={!granted}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    {sr.enabled && (
                      <CardContent className="pt-0 pb-4">
                        <div className="flex flex-wrap items-center gap-4 pl-9">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Remind me at</Label>
                            <TimePicker
                              value={sr.time}
                              onChange={t => setSurahReminder(surah.id, { time: t })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Frequency</Label>
                            <FrequencyPicker
                              value={sr.frequency}
                              onChange={f => setSurahReminder(surah.id, { frequency: f })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Info note */}
        <Card className="bg-muted/40 border-muted">
          <CardContent className="flex gap-3 pt-4 pb-4">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reminders are checked every minute while the app is open in your browser. For reminders to fire on time, keep a Qiyam tab open, or pin it. Notification timing has a ±30 minute window to account for when you open the app.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
