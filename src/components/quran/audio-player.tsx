import { Pause, Play, Repeat } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function AudioPlayer({
  currentAudio,
  currentLabel,
  repeatCount,
  onRepeatCountChange,
}: {
  currentAudio: string;
  currentLabel: string;
  repeatCount: number;
  onRepeatCountChange: (count: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopIteration, setLoopIteration] = useState(1);

  const repeatOptions = useMemo(
    () => [
      { label: "1x", value: 1 },
      { label: "3x", value: 3 },
      { label: "5x", value: 5 },
      { label: "10x", value: 10 },
    ],
    [],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (loopIteration < repeatCount) {
        setLoopIteration((value) => value + 1);
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      setLoopIteration(1);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [loopIteration, repeatCount]);

  useEffect(() => {
    setLoopIteration(1);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [currentAudio]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    await audio.play();
    setIsPlaying(true);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const target = Math.min(duration, Math.max(0, value));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Now playing</p>
          <p className="text-xs text-muted-foreground">{currentLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
            <Repeat className="h-3.5 w-3.5" />
            <select
              className="bg-transparent text-foreground"
              value={repeatCount}
              onChange={(event) => onRepeatCountChange(Number(event.target.value))}
            >
              {repeatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(event) => handleSeek(Number(event.target.value))}
        className="w-full"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.floor(currentTime)}s</span>
        <span>
          Repeat {loopIteration}/{repeatCount}
        </span>
        <span>{Math.floor(duration)}s</span>
      </div>

      <audio ref={audioRef} preload="metadata">
        <source src={currentAudio} type="audio/mpeg" />
      </audio>
    </section>
  );
}