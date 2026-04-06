import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StatusBar,
  Vibration,
  Platform,
  Animated as RNAnimated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { 
  CATEGORIES, 
  PERSONALITIES, 
  BARKS, 
  RARE_BARKS,
  getRandomBark, 
  getChaosBark,
  type BarkCategory,
  type DogPersonality,
} from "./src/data/barks";
import { 
  useStorage, 
  type BarkRecord, 
  type AppStats 
} from "./src/hooks/useStorage";

const { width, height } = Dimensions.get("window");

// Warm, dog-friendly color palette
const PALETTE = {
  bgTop: "#2d2420",
  bgBottom: "#1a1512",
  primary: "#d4a574",
  accent: "#e76f51",
  secondary: "#e9c46a",
  text: "#faf6f1",
  textMuted: "#b8a89a",
  surface: "#3d322b",
  surfaceHighlight: "#4a3f37",
  rare: "#9b5de5",
  success: "#2a9d8f",
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_bark', name: "First Translation", desc: "Translate your first bark", icon: "🎤" },
  { id: 'rare_find', name: "Rare Discovery", desc: "Find a rare bark", icon: "💎" },
  { id: 'spicy_collector', name: "Spicy Aficionado", desc: "Get 10 spicy barks", icon: "🌶️" },
  { id: 'chaos_theorist', name: "Chaos Theorist", desc: "Use Chaos Mode 5 times", icon: "🌀" },
  { id: 'collector', name: "Collector", desc: "Get barks from every category", icon: "🏆" },
  { id: 'streak_3', name: "3-Day Streak", desc: "Use the app 3 days in a row", icon: "🔥" },
  { id: 'hundred_barks', name: "Century Mark", desc: "Translate 100 barks", icon: "💯" },
];

// Achievement types
interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function App() {
  // Core state
  const [currentBark, setCurrentBark] = useState<BarkRecord | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [personality, setPersonality] = useState<DogPersonality>(PERSONALITIES[3]); // Default to Pug
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRareToast, setShowRareToast] = useState(false);
  const [newAchievement, setNewAchievement] = useState<AchievementDef | null>(null);
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [favorites, setFavorites] = useState<BarkRecord[]>([]);
  const [history, setHistory] = useState<BarkRecord[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalBarks: 0,
    spicyBarks: 0,
    rareBarksFound: 0,
    chaosModeUses: 0,
    streakDays: 0,
    lastOpened: Date.now(),
  });

  // Storage hook
  const storage = useStorage();
  
  // Animation values
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;
  const bounceAnim = useRef(new RNAnimated.Value(1)).current;
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;

  // Load saved data
  useEffect(() => {
    loadSavedData();
    startPulseAnimation();
  }, []);

  // Update streak
  useEffect(() => {
    checkAndUpdateStreak();
  }, []);

  const loadSavedData = async () => {
    const [savedFavorites, savedHistory, savedPersonality, savedSound, savedHaptics, savedAchievements, savedStats] = await Promise.all([
      storage.getFavorites(),
      storage.getHistory(),
      storage.getPersonality(),
      storage.getSoundEnabled(),
      storage.getHapticsEnabled(),
      storage.getAchievements(),
      storage.getStats(),
    ]);

    setFavorites(savedFavorites);
    setHistory(savedHistory);
    const pers = PERSONALITIES.find(p => p.id === savedPersonality) || PERSONALITIES[3];
    setPersonality(pers);
    setSoundEnabled(savedSound);
    setHapticsEnabled(savedHaptics);
    setUnlockedAchievements(savedAchievements.map(a => a.id));
    setStats(savedStats);
  };

  const checkAndUpdateStreak = async () => {
    const now = Date.now();
    const lastOpened = stats.lastOpened;
    const oneDay = 24 * 60 * 60 * 1000;
    
    const daysSinceLastOpen = Math.floor((now - lastOpened) / oneDay);
    
    if (daysSinceLastOpen === 1) {
      // Continued streak
      const newStreak = stats.streakDays + 1;
      await storage.updateStats(s => ({ ...s, streakDays: newStreak, lastOpened: now }));
      setStats(s => ({ ...s, streakDays: newStreak, lastOpened: now }));
      
      if (newStreak === 3) {
        await unlockAchievement('streak_3');
      }
    } else if (daysSinceLastOpen > 1) {
      // Streak broken
      await storage.updateStats(s => ({ ...s, streakDays: 1, lastOpened: now }));
      setStats(s => ({ ...s, streakDays: 1, lastOpened: now }));
    } else {
      // Same day, just update last opened
      await storage.updateStats(s => ({ ...s, lastOpened: now }));
    }
  };

  const startPulseAnimation = () => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const triggerBounce = () => {
    RNAnimated.sequence([
      RNAnimated.timing(bounceAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(bounceAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      RNAnimated.timing(bounceAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const unlockAchievement = async (achievementId: string) => {
    const isNew = await storage.unlockAchievement(achievementId);
    if (isNew) {
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (achievement) {
        setNewAchievement(achievement);
        setUnlockedAchievements(prev => [...prev, achievementId]);
        if (hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => setNewAchievement(null), 3000);
      }
    }
  };

  const checkAchievements = async (bark: BarkRecord, isChaos: boolean = false) => {
    const newStats = { ...stats };
    
    // First bark
    if (stats.totalBarks === 0) {
      await unlockAchievement('first_bark');
    }
    
    // Rare find
    if (bark.isRare) {
      await unlockAchievement('rare_find');
      newStats.rareBarksFound++;
    }
    
    // Spicy collector
    if (bark.category === 'spicy') {
      newStats.spicyBarks++;
      if (newStats.spicyBarks >= 10) {
        await unlockAchievement('spicy_collector');
      }
    }
    
    // Chaos theorist
    if (isChaos) {
      newStats.chaosModeUses++;
      if (newStats.chaosModeUses >= 5) {
        await unlockAchievement('chaos_theorist');
      }
    }
    
    // Collector - check if we've hit all categories
    const categoriesHit = new Set(history.map(h => h.category));
    categoriesHit.add(bark.category);
    if (categoriesHit.size >= CATEGORIES.length) {
      await unlockAchievement('collector');
    }
    
    // Century mark
    newStats.totalBarks++;
    if (newStats.totalBarks >= 100) {
      await unlockAchievement('hundred_barks');
    }
    
    await storage.updateStats(() => newStats);
    setStats(newStats);
  };

  const speakBark = async (text: string) => {
    if (!soundEnabled) return;
    
    setIsSpeaking(true);
    await Speech.stop();
    
    await Speech.speak(text, {
      rate: personality.voiceRate,
      pitch: personality.voicePitch,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const generateBark = async (category?: string, isChaos: boolean = false) => {
    triggerBounce();
    
    if (hapticsEnabled) {
      const impact = category === 'spicy' ? Haptics.ImpactFeedbackStyle.Heavy :
                    category === 'rare' ? Haptics.ImpactFeedbackStyle.Medium :
                    Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(impact);
    }

    let barkRecord: BarkRecord;
    
    if (isChaos) {
      const chaosText = getChaosBark();
      barkRecord = {
        id: generateId(),
        text: chaosText,
        category: 'chaos',
        timestamp: Date.now(),
        isRare: false,
      };
    } else {
      const result = getRandomBark(category || undefined);
      barkRecord = {
        id: generateId(),
        text: result.text,
        category: result.category,
        timestamp: Date.now(),
        isRare: result.isRare,
      };
    }

    setCurrentBark(barkRecord);
    
    if (barkRecord.isRare) {
      setShowRareToast(true);
      setTimeout(() => setShowRareToast(false), 2000);
    }

    await storage.addToHistory(barkRecord);
    setHistory(prev => [barkRecord, ...prev].slice(0, 50));
    
    await checkAchievements(barkRecord, isChaos);
    await speakBark(barkRecord.text);
  };

  const toggleFavorite = async () => {
    if (!currentBark) return;
    
    const isFav = favorites.some(f => f.text === currentBark.text);
    
    if (isFav) {
      await storage.removeFavorite(currentBark.text);
      setFavorites(prev => prev.filter(f => f.text !== currentBark.text));
    } else {
      await storage.addFavorite(currentBark);
      setFavorites(prev => [currentBark, ...prev]);
    }
    
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shareBark = async () => {
    if (!currentBark) return;
    
    try {
      await Share.share({
        message: `"${currentBark.text}" 🐾 #BarkyTalk`,
        title: 'Share this bark!',
      });
    } catch {
      // User cancelled
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await storage.setSoundEnabled(newValue);
    if (!newValue) {
      Speech.stop();
    }
  };

  const toggleHaptics = async () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    await storage.setHapticsEnabled(newValue);
    if (newValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const changePersonality = async (newPersonality: DogPersonality) => {
    setPersonality(newPersonality);
    await storage.setPersonality(newPersonality.id);
    setShowPersonalityModal(false);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Animation interpolations
  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] });

  const isCurrentFavorited = currentBark ? favorites.some(f => f.text === currentBark.text) : false;

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bgBottom }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[PALETTE.bgTop, PALETTE.bgBottom]} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 20, 
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 16,
          paddingBottom: 12,
        }}>
          <TouchableOpacity 
            onPress={() => setShowSettingsModal(true)}
            style={{ padding: 8, borderRadius: 12, backgroundColor: PALETTE.surface }}
          >
            <Ionicons name="settings-outline" size={22} color={PALETTE.text} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: PALETTE.primary, fontSize: 24, fontWeight: '800' }}>🐾 Barky Talk</Text>
            <Text style={{ color: PALETTE.textMuted, fontSize: 12 }}>300+ dog thoughts</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowAchievementsModal(true)}
            style={{ padding: 8, borderRadius: 12, backgroundColor: PALETTE.surface, position: 'relative' }}
          >
            <Ionicons name="trophy-outline" size={22} color={PALETTE.secondary} />
            {unlockedAchievements.length > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: PALETTE.accent,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                  {unlockedAchievements.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
          {/* Personality Selector */}
          <TouchableOpacity 
            onPress={() => setShowPersonalityModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: PALETTE.surface,
              borderRadius: 16,
              padding: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: PALETTE.surfaceHighlight,
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 8 }}>{personality.emoji}</Text>
            <Text style={{ color: PALETTE.text, fontSize: 16, fontWeight: '600' }}>
              {personality.name}
            </Text>
            <Ionicons name="chevron-down" size={18} color={PALETTE.textMuted} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {/* Rare Bark Toast */}
          {showRareToast && (
            <RNAnimated.View style={{
              backgroundColor: PALETTE.rare,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>💎</Text>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                RARE BARK DISCOVERED!
              </Text>
            </RNAnimated.View>
          )}

          {/* Achievement Unlock Toast */}
          {newAchievement && (
            <RNAnimated.View style={{
              backgroundColor: PALETTE.success,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{newAchievement.icon}</Text>
              <View>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  Achievement Unlocked!
                </Text>
                <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9 }}>
                  {newAchievement.name}
                </Text>
              </View>
            </RNAnimated.View>
          )}

          {/* Main Bark Display */}
          <RNAnimated.View style={{
            backgroundColor: PALETTE.surface,
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: currentBark?.isRare ? PALETTE.rare : currentBark?.category === 'spicy' ? PALETTE.accent : PALETTE.surfaceHighlight,
            minHeight: 150,
            transform: [{ scale: bounceAnim }],
          }}>
            {currentBark ? (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{
                    backgroundColor: currentBark.isRare ? PALETTE.rare : PALETTE.primary,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      {currentBark.isRare ? 'RARE' : currentBark.category === 'chaos' ? 'CHAOS' : CATEGORIES.find(c => c.id === currentBark.category)?.label || 'BARK'}
                    </Text>
                  </View>
                  {currentBark.isRare && (
                    <Text style={{ fontSize: 20 }}>💎</Text>
                  )}
                </View>
                <Text style={{ 
                  color: PALETTE.text, 
                  fontSize: 20, 
                  lineHeight: 28,
                  fontWeight: '500',
                  fontStyle: currentBark.isRare ? 'italic' : 'normal',
                }}>
                  "{currentBark.text}"
                </Text>
                
                {/* Action buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
                  <TouchableOpacity onPress={toggleFavorite} style={{ padding: 8 }}>
                    <Ionicons 
                      name={isCurrentFavorited ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isCurrentFavorited ? PALETTE.accent : PALETTE.textMuted} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={shareBark} style={{ padding: 8 }}>
                    <Ionicons name="share-outline" size={24} color={PALETTE.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => speakBark(currentBark.text)} 
                    style={{ padding: 8 }}
                    disabled={isSpeaking}
                  >
                    <Ionicons 
                      name={isSpeaking ? "volume-high" : "play-circle-outline"} 
                      size={24} 
                      color={isSpeaking ? PALETTE.primary : PALETTE.textMuted} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🐕</Text>
                <Text style={{ color: PALETTE.textMuted, fontSize: 16, textAlign: 'center' }}>
                  Tap the paw button to translate your pup's thoughts!
                </Text>
              </View>
            )}
          </RNAnimated.View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8, gap: 8 }}
            style={{ marginBottom: 16 }}
          >
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={{
                backgroundColor: selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.color : PALETTE.surface,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: selectedCategory ? 'transparent' : PALETTE.primary,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>
                {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.emoji : '🎲'}
              </Text>
              <Text style={{ 
                color: selectedCategory ? '#fff' : PALETTE.text, 
                fontWeight: '600', 
                fontSize: 14 
              }}>
                {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.label : 'All Categories'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={selectedCategory ? '#fff' : PALETTE.text} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            
            {/* Chaos Mode Button */}
            <TouchableOpacity
              onPress={() => generateBark(undefined, true)}
              style={{
                backgroundColor: '#9b5de5',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>🌀</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                Chaos Mode
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Main Paw Button */}
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <RNAnimated.View style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: `${PALETTE.primary}30`,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: ringScale }],
            }}>
              <RNAnimated.View style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: PALETTE.primary,
                opacity: glowOpacity,
              }} />
              
              <TouchableOpacity
                onPress={() => generateBark(selectedCategory || undefined)}
                activeOpacity={0.8}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: PALETTE.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: PALETTE.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text style={{ fontSize: 50 }}>🐾</Text>
                <Text style={{ 
                  color: '#fff', 
                  fontWeight: '700', 
                  fontSize: 14,
                  marginTop: 4,
                }}>
                  TAP TO BARK
                </Text>
              </TouchableOpacity>
            </RNAnimated.View>
          </View>

          {/* Quick Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              onPress={() => setShowFavoritesModal(true)}
              style={{
                flex: 1,
                backgroundColor: PALETTE.surface,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: PALETTE.surfaceHighlight,
              }}
            >
              <Ionicons name="heart" size={24} color={PALETTE.accent} />
              <Text style={{ color: PALETTE.text, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                Favorites
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 10 }}>
                {favorites.length} saved
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowHistoryModal(true)}
              style={{
                flex: 1,
                backgroundColor: PALETTE.surface,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: PALETTE.surfaceHighlight,
              }}
            >
              <Ionicons name="time" size={24} color={PALETTE.secondary} />
              <Text style={{ color: PALETTE.text, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                History
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 10 }}>
                {history.length} barks
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => generateBark('spicy')}
              style={{
                flex: 1,
                backgroundColor: `${PALETTE.accent}20`,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: PALETTE.accent,
              }}
            >
              <Text style={{ fontSize: 24 }}>🌶️</Text>
              <Text style={{ color: PALETTE.accent, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                Spicy
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 10 }}>
                Bold takes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Summary */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: PALETTE.surface,
            borderRadius: 16,
            padding: 16,
            marginTop: 20,
            borderWidth: 1,
            borderColor: PALETTE.surfaceHighlight,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: PALETTE.primary, fontSize: 20, fontWeight: '700' }}>
                {stats.totalBarks}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>Total Barks</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: PALETTE.rare, fontSize: 20, fontWeight: '700' }}>
                {stats.rareBarksFound}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>Rare Found</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: PALETTE.secondary, fontSize: 20, fontWeight: '700' }}>
                {stats.streakDays}
              </Text>
              <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>Day Streak</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: height * 0.7,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: PALETTE.text, fontSize: 20, fontWeight: '700' }}>Choose Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color={PALETTE.textMuted} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => { setSelectedCategory(null); setShowCategoryModal(false); }}
              style={{
                backgroundColor: selectedCategory === null ? PALETTE.primary : PALETTE.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🎲</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: selectedCategory === null ? '#fff' : PALETTE.text, fontWeight: '600' }}>
                  All Categories
                </Text>
                <Text style={{ color: selectedCategory === null ? '#ffffff80' : PALETTE.textMuted, fontSize: 12 }}>
                  Random selection from all barks
                </Text>
              </View>
              {selectedCategory === null && <Ionicons name="checkmark" size={20} color="#fff" />}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setSelectedCategory(cat.id); setShowCategoryModal(false); }}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color : PALETTE.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{cat.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: selectedCategory === cat.id ? '#fff' : PALETTE.text, fontWeight: '600' }}>
                      {cat.label}
                    </Text>
                    <Text style={{ color: selectedCategory === cat.id ? '#ffffff80' : PALETTE.textMuted, fontSize: 12 }}>
                      {cat.description}
                    </Text>
                  </View>
                  {selectedCategory === cat.id && <Ionicons name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Personality Modal */}
      <Modal
        visible={showPersonalityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPersonalityModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderRadius: 24,
            padding: 24,
          }}>
            <Text style={{ color: PALETTE.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
              Choose Personality
            </Text>
            <Text style={{ color: PALETTE.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              Affects how your dog "speaks"
            </Text>
            
            {PERSONALITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => changePersonality(p)}
                style={{
                  backgroundColor: personality.id === p.id ? `${PALETTE.primary}30` : PALETTE.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: personality.id === p.id ? PALETTE.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 12 }}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: PALETTE.text, fontWeight: '600', fontSize: 16 }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: PALETTE.textMuted, fontSize: 12 }}>
                    {p.description}
                  </Text>
                </View>
                {personality.id === p.id && (
                  <Ionicons name="checkmark-circle" size={24} color={PALETTE.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={() => setShowPersonalityModal(false)}
              style={{
                backgroundColor: PALETTE.surface,
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: PALETTE.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={showFavoritesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: height * 0.8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: PALETTE.text, fontSize: 20, fontWeight: '700' }}>❤️ Favorites</Text>
              <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
                <Ionicons name="close" size={28} color={PALETTE.textMuted} />
              </TouchableOpacity>
            </View>
            
            {favorites.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🐕</Text>
                <Text style={{ color: PALETTE.textMuted, fontSize: 16 }}>No favorites yet!</Text>
                <Text style={{ color: PALETTE.textMuted, fontSize: 14, marginTop: 4 }}>
                  Tap the heart on any bark to save it
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {favorites.map((fav, index) => (
                  <View
                    key={fav.id}
                    style={{
                      backgroundColor: PALETTE.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: PALETTE.text, fontSize: 14, marginBottom: 8 }}>
                      "{fav.text}"
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{
                        backgroundColor: fav.isRare ? PALETTE.rare : PALETTE.surfaceHighlight,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>
                          {fav.isRare ? 'RARE' : CATEGORIES.find(c => c.id === fav.category)?.label || 'BARK'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFavorite(fav.text)}>
                        <Ionicons name="trash-outline" size={20} color={PALETTE.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: height * 0.8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: PALETTE.text, fontSize: 20, fontWeight: '700' }}>🕐 History</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={{ color: PALETTE.accent, fontWeight: '600' }}>Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                  <Ionicons name="close" size={28} color={PALETTE.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            
            {history.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🐕</Text>
                <Text style={{ color: PALETTE.textMuted, fontSize: 16 }}>No history yet!</Text>
                <Text style={{ color: PALETTE.textMuted, fontSize: 14, marginTop: 4 }}>
                  Start translating to build your history
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {history.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => { setCurrentBark(item); setShowHistoryModal(false); speakBark(item.text); }}
                    style={{
                      backgroundColor: PALETTE.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: PALETTE.text, fontSize: 14 }}>
                      "{item.text}"
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <View style={{
                        backgroundColor: item.isRare ? PALETTE.rare : PALETTE.surfaceHighlight,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>
                          {item.isRare ? 'RARE' : CATEGORIES.find(c => c.id === item.category)?.label || 'BARK'}
                        </Text>
                      </View>
                      <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievementsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAchievementsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderRadius: 24,
            padding: 24,
            maxHeight: height * 0.8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: PALETTE.text, fontSize: 22, fontWeight: '700' }}>🏆 Achievements</Text>
              <TouchableOpacity onPress={() => setShowAchievementsModal(false)}>
                <Ionicons name="close" size={28} color={PALETTE.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: PALETTE.textMuted, textAlign: 'center', marginBottom: 20 }}>
              {unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                return (
                  <View
                    key={achievement.id}
                    style={{
                      backgroundColor: isUnlocked ? `${PALETTE.success}20` : PALETTE.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      opacity: isUnlocked ? 1 : 0.6,
                      borderWidth: 1,
                      borderColor: isUnlocked ? PALETTE.success : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 28, marginRight: 12 }}>
                      {isUnlocked ? achievement.icon : '🔒'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        color: isUnlocked ? PALETTE.text : PALETTE.textMuted, 
                        fontWeight: '600', 
                        fontSize: 16 
                      }}>
                        {achievement.name}
                      </Text>
                      <Text style={{ color: PALETTE.textMuted, fontSize: 12 }}>
                        {achievement.desc}
                      </Text>
                    </View>
                    {isUnlocked && (
                      <Ionicons name="checkmark-circle" size={24} color={PALETTE.success} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: PALETTE.bgTop,
            borderRadius: 24,
            padding: 24,
          }}>
            <Text style={{ color: PALETTE.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>
              ⚙️ Settings
            </Text>
            
            {/* Sound Toggle */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: PALETTE.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={24} color={PALETTE.text} />
                <Text style={{ color: PALETTE.text, marginLeft: 12, fontWeight: '600' }}>
                  Text-to-Speech
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleSound}
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: soundEnabled ? PALETTE.primary : PALETTE.surfaceHighlight,
                  justifyContent: soundEnabled ? 'flex-end' : 'flex-start',
                  padding: 2,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                }} />
              </TouchableOpacity>
            </View>
            
            {/* Haptics Toggle */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: PALETTE.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="phone-portrait" size={24} color={PALETTE.text} />
                <Text style={{ color: PALETTE.text, marginLeft: 12, fontWeight: '600' }}>
                  Haptic Feedback
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleHaptics}
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: hapticsEnabled ? PALETTE.primary : PALETTE.surfaceHighlight,
                  justifyContent: hapticsEnabled ? 'flex-end' : 'flex-start',
                  padding: 2,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                }} />
              </TouchableOpacity>
            </View>
            
            {/* Info Section */}
            <View style={{
              backgroundColor: PALETTE.surface,
              borderRadius: 12,
              padding: 16,
              marginTop: 8,
            }}>
              <Text style={{ color: PALETTE.textMuted, fontSize: 12, textAlign: 'center' }}>
                Barky Talk v3.0{'\n'}
                300+ barks • 6 personalities • 7 achievements{'\n'}
                Made with 🐾 by Marisombra
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowSettingsModal(false)}
              style={{
                backgroundColor: PALETTE.surface,
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: PALETTE.text, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
