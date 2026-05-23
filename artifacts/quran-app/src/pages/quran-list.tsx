import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export default function QuranList() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) setSurahs(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = surahs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number).includes(q) ||
      s.name.includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          The Quran
        </h1>
        <p className="text-muted-foreground">114 Surahs — select one to begin reading</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, number, or meaning..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      <div className="space-y-1">
        {filtered.map((surah, i) => (
          <motion.div
            key={surah.number}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.01, duration: 0.2 }}
          >
            <Link href={`/quran/${surah.number}`}>
              <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-secondary/10 cursor-pointer transition-all group border border-transparent hover:border-border">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{surah.englishName}</span>
                    <span className="text-xs text-muted-foreground">· {surah.englishNameTranslation}</span>
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {surah.revelationType}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{surah.numberOfAyahs} ayahs</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-arabic text-xl text-primary">{surah.name}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No surahs match your search.
        </div>
      )}
    </div>
  );
}
