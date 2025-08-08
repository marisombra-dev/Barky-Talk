import React, { useRef, useState, useEffect } from "react";
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
  BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

const { width, height } = Dimensions.get("window");
const PALETTE = {
  bgTop: "#141a1f",
  bgBottom: "#0b0f12",
  glow1: "#35baf6",
  glow2: "#a78bfa",
  text: "#e6f1ff",
  sub: "#9bb0c9",
};

const RADIUS = Math.floor(Math.min(width, height) * 0.28);

const TRANSLATIONS = {
  soft: ["Hi. Nose boops please.", "Just checking the perimeter… of the kitchen.", "Is that cheese I smell? For me?", "I have brought you a sock. Do I get a treat?", "I am small. I am powerful. I require cuddles."],
  medium: ["Someone is outside. Could be friend. Could be squirrel.", "Doorbell demon approaches! Stand firm, human!", "This toy must perish. It squeaks with defiance.", "Walk o'clock has arrived. Leash me, beloved.", "I have eaten the thing. I regret nothing."],
  spicy: ["INTRUDER ALERT. OBJECT: LEAF. VERY SUSPICIOUS.", "The void has stared back. I have opinions.", "Release the snacks or face consequences.", "I require immediate zoomies authorization.", "Cat is plotting. I am onto them."],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [lastPhrase, setLastPhrase] = useState(null);
  const [flash, setFlash] = useState(null);
  const pulse = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function triggerTranslation(bucket) {
    if (Platform.OS !== "web") Vibration.vibrate(35);
    const chosenBucket = bucket || pick(["soft", "medium", "spicy"]);
    const phrase = pick(TRANSLATIONS[chosenBucket]);
    setLastPhrase(phrase);
    setFlash(phrase);
    setTimeout(() => setFlash(null), 2000);
    Speech.speak(phrase, { rate: 1.0, pitch: 1.0 });
  }

  function exitApp() {
    Speech.stop();
    setLastPhrase(null);
    setFlash(null);
    BackHandler.exitApp();
  }

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] });

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0 }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[PALETTE.bgTop, PALETTE.bgBottom]} style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={exitApp}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          style={{ position: "absolute", top: 16, right: 16, backgroundColor: "#1f1414", borderWidth: 1, borderColor: "#5a2b3f", padding: 10, borderRadius: 999, zIndex: 10 }}
        >
          <Ionicons name="close" size={18} color={PALETTE.text} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "space-between" }}>
          <View style={{ gap: 6, paddingTop: 8, alignItems: "center" }}>
            <Text style={{ color: PALETTE.text, fontSize: 28, fontWeight: "800" }}>Barky‑Talk v2</Text>
            <Text style={{ color: PALETTE.sub, fontSize: 14 }}>Tap the mic or buttons for translation.</Text>
          </View>

          {flash && (
            <View style={{ marginTop: 20, padding: 12, borderRadius: 12, backgroundColor: "#0f151b", borderWidth: 1, borderColor: "#1e2a33" }}>
              <Text style={{ color: PALETTE.text, fontSize: 16, textAlign: "center" }}>{flash}</Text>
            </View>
          )}

          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <RNAnimated.View style={{
              width: RADIUS * 2,
              height: RADIUS * 2,
              borderRadius: RADIUS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0e141a",
              shadowColor: PALETTE.glow1,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
              elevation: 16,
              transform: [{ scale: ringScale }],
            }}>
              <RNAnimated.View style={{
                position: "absolute",
                width: RADIUS * 1.9,
                height: RADIUS * 1.9,
                borderRadius: RADIUS * 0.95,
                backgroundColor: PALETTE.glow1,
                opacity: glowOpacity,
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
              }} />

              <Pressable onPress={() => triggerTranslation()} style={({ pressed }) => ({
                width: RADIUS * 1.4,
                height: RADIUS * 1.4,
                borderRadius: RADIUS * 0.7,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "#1a2630" : "#162129",
                borderWidth: 2,
                borderColor: pressed ? PALETTE.glow2 : "#24313b",
              })}>
                <Ionicons name="mic" size={56} color={PALETTE.text} />
                <Text style={{ color: PALETTE.sub, marginTop: 8 }}>Tap to Translate</Text>
              </Pressable>
            </RNAnimated.View>
          </View>

          <View style={{ backgroundColor: "#0f151b", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1e2a33", minHeight: 88, justifyContent: "center", marginTop: 20 }}>
            {lastPhrase ? (
              <Text style={{ color: PALETTE.text, fontSize: 18 }}>{lastPhrase}</Text>
            ) : (
              <Text style={{ color: PALETTE.sub }}>Waiting for a woof…</Text>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "nowrap", justifyContent: "space-between", marginTop: 14 }}>
            <Pressable onPress={() => setLastPhrase(null)} style={({ pressed }) => ({ flex: 1, marginHorizontal: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, backgroundColor: pressed ? "#172027" : "#121a21", borderWidth: 1, borderColor: "#21303a", alignItems: "center", justifyContent: "center" })}>
              <Text style={{ color: PALETTE.sub, fontSize: 17 }} numberOfLines={1} adjustsFontSizeToFit>Clear</Text>
            </Pressable>

            <Pressable onPress={() => triggerTranslation()} style={({ pressed }) => ({ flex: 1, marginHorizontal: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, backgroundColor: pressed ? "#1f2a33" : "#162129", borderWidth: 1, borderColor: "#2a3b47", alignItems: "center", justifyContent: "center" })}>
              <Text style={{ color: PALETTE.text, fontSize: 17 }} numberOfLines={1} adjustsFontSizeToFit>Random</Text>
            </Pressable>

            <Pressable onPress={() => triggerTranslation("spicy")} style={({ pressed }) => ({ flex: 1, marginHorizontal: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, backgroundColor: pressed ? "#3a1f2f" : "#2a1522", borderWidth: 1, borderColor: "#5a2b3f", alignItems: "center", justifyContent: "center" })}>
              <Text style={{ color: PALETTE.text, fontSize: 17 }} numberOfLines={1} adjustsFontSizeToFit>Spicy</Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
