import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  FAVORITES: '@barky_favorites',
  HISTORY: '@barky_history',
  PERSONALITY: '@barky_personality',
  SOUND_ENABLED: '@barky_sound',
  HAPTICS_ENABLED: '@barky_haptics',
  ACHIEVEMENTS: '@barky_achievements',
  STATS: '@barky_stats',
  FIRST_LAUNCH: '@barky_first_launch',
} as const;

// Types
export interface BarkRecord {
  id: string;
  text: string;
  category: string;
  timestamp: number;
  isRare: boolean;
}

export interface AppStats {
  totalBarks: number;
  spicyBarks: number;
  rareBarksFound: number;
  chaosModeUses: number;
  streakDays: number;
  lastOpened: number;
}

export interface Achievement {
  id: string;
  unlockedAt: number;
}

// Hook for async storage
export function useStorage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Generic get
  const getItem = useCallback(async <T>(key: string, defaultValue: T): Promise<T> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  // Generic set
  const setItem = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silent fail
    }
  }, []);

  // Favorites
  const getFavorites = useCallback(async (): Promise<BarkRecord[]> => {
    return getItem(STORAGE_KEYS.FAVORITES, []);
  }, [getItem]);

  const addFavorite = useCallback(async (bark: BarkRecord): Promise<void> => {
    const favorites = await getFavorites();
    if (!favorites.some(f => f.text === bark.text)) {
      favorites.unshift(bark);
      // Keep only last 50
      if (favorites.length > 50) favorites.pop();
      await setItem(STORAGE_KEYS.FAVORITES, favorites);
    }
  }, [getFavorites, setItem]);

  const removeFavorite = useCallback(async (barkText: string): Promise<void> => {
    const favorites = await getFavorites();
    const filtered = favorites.filter(f => f.text !== barkText);
    await setItem(STORAGE_KEYS.FAVORITES, filtered);
  }, [getFavorites, setItem]);

  const isFavorite = useCallback(async (barkText: string): Promise<boolean> => {
    const favorites = await getFavorites();
    return favorites.some(f => f.text === barkText);
  }, [getFavorites]);

  // History
  const getHistory = useCallback(async (): Promise<BarkRecord[]> => {
    return getItem(STORAGE_KEYS.HISTORY, []);
  }, [getItem]);

  const addToHistory = useCallback(async (bark: BarkRecord): Promise<void> => {
    const history = await getHistory();
    history.unshift(bark);
    // Keep only last 100
    if (history.length > 100) history.pop();
    await setItem(STORAGE_KEYS.HISTORY, history);
  }, [getHistory, setItem]);

  const clearHistory = useCallback(async (): Promise<void> => {
    await setItem(STORAGE_KEYS.HISTORY, []);
  }, [setItem]);

  // Personality
  const getPersonality = useCallback(async (): Promise<string> => {
    return getItem(STORAGE_KEYS.PERSONALITY, 'lab');
  }, [getItem]);

  const setPersonality = useCallback(async (personality: string): Promise<void> => {
    await setItem(STORAGE_KEYS.PERSONALITY, personality);
  }, [setItem]);

  // Settings
  const getSoundEnabled = useCallback(async (): Promise<boolean> => {
    return getItem(STORAGE_KEYS.SOUND_ENABLED, true);
  }, [getItem]);

  const setSoundEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    await setItem(STORAGE_KEYS.SOUND_ENABLED, enabled);
  }, [setItem]);

  const getHapticsEnabled = useCallback(async (): Promise<boolean> => {
    return getItem(STORAGE_KEYS.HAPTICS_ENABLED, true);
  }, [getItem]);

  const setHapticsEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    await setItem(STORAGE_KEYS.HAPTICS_ENABLED, enabled);
  }, [setItem]);

  // Achievements
  const getAchievements = useCallback(async (): Promise<Achievement[]> => {
    return getItem(STORAGE_KEYS.ACHIEVEMENTS, []);
  }, [getItem]);

  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    const achievements = await getAchievements();
    if (!achievements.some(a => a.id === achievementId)) {
      achievements.push({ id: achievementId, unlockedAt: Date.now() });
      await setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
      return true; // New unlock
    }
    return false; // Already had it
  }, [getAchievements, setItem]);

  const hasAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    const achievements = await getAchievements();
    return achievements.some(a => a.id === achievementId);
  }, [getAchievements]);

  // Stats
  const getStats = useCallback(async (): Promise<AppStats> => {
    return getItem(STORAGE_KEYS.STATS, {
      totalBarks: 0,
      spicyBarks: 0,
      rareBarksFound: 0,
      chaosModeUses: 0,
      streakDays: 0,
      lastOpened: Date.now(),
    });
  }, [getItem]);

  const updateStats = useCallback(async (updater: (stats: AppStats) => AppStats): Promise<void> => {
    const stats = await getStats();
    const updated = updater(stats);
    await setItem(STORAGE_KEYS.STATS, updated);
  }, [getStats, setItem]);

  // First launch
  const getFirstLaunch = useCallback(async (): Promise<boolean> => {
    const launched = await getItem(STORAGE_KEYS.FIRST_LAUNCH, true);
    if (launched) {
      await setItem(STORAGE_KEYS.FIRST_LAUNCH, false);
    }
    return launched;
  }, [getItem, setItem]);

  return {
    isReady,
    getFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    getHistory,
    addToHistory,
    clearHistory,
    getPersonality,
    setPersonality,
    getSoundEnabled,
    setSoundEnabled,
    getHapticsEnabled,
    setHapticsEnabled,
    getAchievements,
    unlockAchievement,
    hasAchievement,
    getStats,
    updateStats,
    getFirstLaunch,
  };
}
