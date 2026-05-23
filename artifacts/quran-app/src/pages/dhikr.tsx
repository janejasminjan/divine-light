import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { DHIKR_COLLECTIONS } from "@/lib/dhikr-data";

export default function Dhikr() {
  const totalEntries = (id: string) => {
    const col = DHIKR_COLLECTIONS.find((c) => c.id === id);
    if (!col) return 0;
    return col.sections.reduce((acc, s) => acc + s.entries.length, 0);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold text-primary">Dhikr & Dua</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Remembrance, litanies, and supplications.
        </p>
        <p className="font-arabic text-lg text-primary/70 leading-relaxed mt-1" dir="rtl">
          وَاذْكُر رَّبَّكَ كَثِيرًا وَسَبِّحْ بِالْعَشِيِّ وَالْإِبْكَارِ
        </p>
        <p className="text-xs text-muted-foreground italic">
          "Remember your Lord much and exalt Him in the evening and the morning." — 3:41
        </p>
      </div>

      {/* Collection grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {DHIKR_COLLECTIONS.map((col, idx) => {
          const sectionCount = col.sections.length;
          const entryCount   = totalEntries(col.id);
          const hasFlagged   = col.sections.some((s) => s.entries.some((e) => e.flagged));

          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <Link href={`/dhikr/${col.id}`}>
                <div className="group relative rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer overflow-hidden">
                  {/* Subtle top accent */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />

                  <div className="p-5 flex gap-4 items-start">
                    {/* Icon */}
                    <div className="text-4xl leading-none flex-shrink-0 mt-0.5 select-none">
                      {col.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold text-foreground leading-tight">
                            {col.title}
                          </h2>
                          <p className="font-arabic text-base text-primary/80 leading-tight mt-0.5" dir="rtl">
                            {col.arabicTitle}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 flex-shrink-0 group-hover:text-primary/60 transition-colors" />
                      </div>

                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                        {col.subtitle}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                          {sectionCount} {sectionCount === 1 ? "section" : "sections"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                          {entryCount} {entryCount === 1 ? "entry" : "entries"}
                        </span>
                        {hasFlagged && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 px-2.5 py-0.5 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                            ⚑ needs review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground/60 text-center leading-relaxed px-4">
        All text is sourced from authenticated hadith collections and the Quran.
        Sections marked "needs review" require manual entry from the printed source.
      </p>
    </div>
  );
}
