import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetBookmarks,
  getGetBookmarksQueryKey,
  useDeleteBookmark,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  BookmarkX,
  ExternalLink,
  Loader2,
  StickyNote,
  Trash2,
  BookMarked,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

const AUTO_BOOKMARK_NOTE = "__daily_auto__";

/* ── Static surah name map ──────────────────────────────────── */
const SURAH_NAMES: Record<number, string> = {
  1:"Al-Fatiha",2:"Al-Baqara",3:"Ali 'Imran",4:"An-Nisa",5:"Al-Ma'ida",
  6:"Al-An'am",7:"Al-A'raf",8:"Al-Anfal",9:"At-Tawba",10:"Yunus",
  11:"Hud",12:"Yusuf",13:"Ar-Ra'd",14:"Ibrahim",15:"Al-Hijr",
  16:"An-Nahl",17:"Al-Isra",18:"Al-Kahf",19:"Maryam",20:"Ta-Ha",
  21:"Al-Anbiya",22:"Al-Hajj",23:"Al-Mu'minun",24:"An-Nur",25:"Al-Furqan",
  26:"Ash-Shu'ara",27:"An-Naml",28:"Al-Qasas",29:"Al-'Ankabut",30:"Ar-Rum",
  31:"Luqman",32:"As-Sajda",33:"Al-Ahzab",34:"Saba",35:"Fatir",
  36:"Ya-Sin",37:"As-Saffat",38:"Sad",39:"Az-Zumar",40:"Ghafir",
  41:"Fussilat",42:"Ash-Shura",43:"Az-Zukhruf",44:"Ad-Dukhan",45:"Al-Jathiya",
  46:"Al-Ahqaf",47:"Muhammad",48:"Al-Fath",49:"Al-Hujurat",50:"Qaf",
  51:"Adh-Dhariyat",52:"At-Tur",53:"An-Najm",54:"Al-Qamar",55:"Ar-Rahman",
  56:"Al-Waqi'a",57:"Al-Hadid",58:"Al-Mujadila",59:"Al-Hashr",60:"Al-Mumtahana",
  61:"As-Saf",62:"Al-Jumu'a",63:"Al-Munafiqun",64:"At-Taghabun",65:"At-Talaq",
  66:"At-Tahrim",67:"Al-Mulk",68:"Al-Qalam",69:"Al-Haqqa",70:"Al-Ma'arij",
  71:"Nuh",72:"Al-Jinn",73:"Al-Muzzammil",74:"Al-Muddaththir",75:"Al-Qiyama",
  76:"Al-Insan",77:"Al-Mursalat",78:"An-Naba",79:"An-Nazi'at",80:"Abasa",
  81:"At-Takwir",82:"Al-Infitar",83:"Al-Mutaffifin",84:"Al-Inshiqaq",85:"Al-Buruj",
  86:"At-Tariq",87:"Al-A'la",88:"Al-Ghashiya",89:"Al-Fajr",90:"Al-Balad",
  91:"Ash-Shams",92:"Al-Layl",93:"Ad-Duha",94:"Ash-Sharh",95:"At-Tin",
  96:"Al-'Alaq",97:"Al-Qadr",98:"Al-Bayyina",99:"Az-Zalzala",100:"Al-'Adiyat",
  101:"Al-Qari'a",102:"At-Takathur",103:"Al-'Asr",104:"Al-Humaza",105:"Al-Fil",
  106:"Quraysh",107:"Al-Ma'un",108:"Al-Kawthar",109:"Al-Kafirun",110:"An-Nasr",
  111:"Al-Masad",112:"Al-Ikhlas",113:"Al-Falaq",114:"An-Nas",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: bookmarks, isLoading } = useGetBookmarks({
    query: { queryKey: getGetBookmarksQueryKey() },
  });
  const deleteBookmark = useDeleteBookmark();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteBookmark.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetBookmarksQueryKey() });
      toast({ title: "Bookmark removed" });
    } catch {
      toast({ title: "Failed to remove bookmark", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  // Auto-bookmarks appear at top, then sorted by date
  const sorted = [...(bookmarks ?? [])].sort((a, b) => {
    if (a.note === AUTO_BOOKMARK_NOTE && b.note !== AUTO_BOOKMARK_NOTE) return -1;
    if (b.note === AUTO_BOOKMARK_NOTE && a.note !== AUTO_BOOKMARK_NOTE) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2.5">
            <Bookmark className="h-7 w-7" />
            Bookmarks
          </h1>
          <p className="text-muted-foreground mt-1">
            {sorted.length > 0
              ? `${sorted.length} saved ayah${sorted.length !== 1 ? "s" : ""}`
              : "Your saved ayahs will appear here"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      ) : sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-4"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BookmarkX className="h-8 w-8 text-primary/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No bookmarks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap an ayah while reading and press Bookmark to save it here.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/quran">Browse the Quran →</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {sorted.map((bm) => {
              const surahName = SURAH_NAMES[bm.surahId] ?? `Surah ${bm.surahId}`;
              const href = `/quran/${bm.surahId}?ayah=${bm.ayahNumber}`;

              const isAuto = bm.note === AUTO_BOOKMARK_NOTE;
              const continueHref = isAuto
                ? `/quran/${bm.surahId}?ayah=${bm.ayahNumber}&mode=daily`
                : href;

              return (
                <motion.div
                  key={bm.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`group transition-colors ${isAuto ? "border-primary/30 bg-primary/[0.03] hover:border-primary/50" : "hover:border-primary/40"}`}>
                    <CardContent className="flex items-start gap-4 pt-4 pb-4">
                      {/* Surah badge */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[56px]">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isAuto ? "bg-primary/15" : "bg-primary/10"}`}>
                          {isAuto
                            ? <BookMarked className="h-4 w-4 text-primary" />
                            : <span className="text-xs font-bold text-primary">{bm.surahId}</span>}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{isAuto ? "Daily" : "Surah"}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{surahName}</span>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 rounded-full">
                            Ayah {bm.ayahNumber}
                          </Badge>
                          {isAuto && (
                            <Badge className="text-[10px] px-1.5 py-0 rounded-full bg-primary/15 text-primary border-0 font-medium">
                              Daily Reading Position
                            </Badge>
                          )}
                        </div>
                        {bm.note && !isAuto && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <StickyNote className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{bm.note}</span>
                          </div>
                        )}
                        {isAuto && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Auto-saved · {formatDate(bm.createdAt)}
                          </div>
                        )}
                        {!isAuto && (
                          <div className="mt-1 text-xs text-muted-foreground/60">
                            Saved {formatDate(bm.createdAt)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary">
                          <Link href={continueHref} title={isAuto ? "Continue reading" : "Open ayah"}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(bm.id)}
                          disabled={deletingId === bm.id}
                          title="Remove bookmark"
                        >
                          {deletingId === bm.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
