import { Audio, AVPlaybackStatus } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AyahRef {
  numberInSurah: number;
  number: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentAyahIndex: number;
  positionMs: number;
  durationMs: number;
}

export interface UseAyahAudioReturn extends AudioPlayerState {
  play: (ayahIndex: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  stop: () => void;
  seekTo: (ms: number) => void;
}

const CDN_BASE = "https://cdn.islamic.network/quran/audio/128";

export function useAyahAudio(
  ayahs: AyahRef[],
  reciter: string
): UseAyahAudioReturn {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentIndexRef = useRef<number>(-1);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentAyahIndex: -1,
    positionMs: 0,
    durationMs: 0,
  });

  const reciterRef = useRef(reciter);
  reciterRef.current = reciter;

  const ayahsRef = useRef(ayahs);
  ayahsRef.current = ayahs;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const loadAndPlay = useCallback(async (index: number) => {
    const list = ayahsRef.current;
    if (index < 0 || index >= list.length) return;

    currentIndexRef.current = index;
    setState((s) => ({ ...s, isLoading: true, currentAyahIndex: index }));

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const globalNum = list[index].number;
      const url = `${CDN_BASE}/${reciterRef.current}/${globalNum}.mp3`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setState((s) => ({
            ...s,
            isPlaying: status.isPlaying,
            positionMs: status.positionMillis ?? 0,
            durationMs: status.durationMillis ?? 0,
            isLoading: false,
          }));
          if (status.didJustFinish) {
            const nextIdx = index + 1;
            if (nextIdx < ayahsRef.current.length) {
              loadAndPlay(nextIdx);
            } else {
              currentIndexRef.current = -1;
              setState((s) => ({
                ...s,
                isPlaying: false,
                currentAyahIndex: -1,
                positionMs: 0,
                durationMs: 0,
              }));
            }
          }
        }
      );

      soundRef.current = sound;
    } catch {
      currentIndexRef.current = -1;
      setState((s) => ({ ...s, isLoading: false, currentAyahIndex: -1 }));
    }
  }, []);

  const play = useCallback(
    (ayahIndex: number) => {
      loadAndPlay(ayahIndex);
    },
    [loadAndPlay]
  );

  const togglePlayPause = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, []);

  const playNext = useCallback(() => {
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < ayahsRef.current.length) {
      loadAndPlay(nextIdx);
    }
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const prevIdx = currentIndexRef.current - 1;
    if (prevIdx >= 0) {
      loadAndPlay(prevIdx);
    }
  }, [loadAndPlay]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    currentIndexRef.current = -1;
    setState((s) => ({
      ...s,
      isPlaying: false,
      currentAyahIndex: -1,
      positionMs: 0,
      durationMs: 0,
    }));
  }, []);

  const seekTo = useCallback(async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms).catch(() => {});
  }, []);

  return {
    ...state,
    play,
    togglePlayPause,
    playNext,
    playPrev,
    stop,
    seekTo,
  };
}
