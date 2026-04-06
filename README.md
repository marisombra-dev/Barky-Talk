# 🐾 Barky Talk v3.0

**The ultimate dog bark translator with 300+ hilarious phrases, personalities, and achievements!**

What if you could *actually* understand what your dog is thinking? Barky Talk translates your pup's barks into hilarious, surprisingly accurate thoughts — from sweet and wholesome to spicy and chaotic.

---

## ✨ Features

### 🗣️ **300+ Unique Barks**
No more repetition! Every tap reveals a new bark across 13 hilarious categories:
- 🥺 **Soft** — Sweet, wholesome thoughts
- 🔥 **Spicy** — Bold opinions
- 🍖 **Food Begging** — Snack-related desperation
- 🦮 **Walk Desperation** — Exercise urgency  
- 📬 **Mail Trauma** — Postal service PTSD
- 💤 **Nap Interruptions** — Sleep violation grievances
- 🌌 **Existential** — Deep dog philosophy
- 🥺 **Guilt Trips** — Emotional manipulation
- 💨 **Zoomies** — Chaos energy unleashed
- 🐦 **Window Patrol** — Bird surveillance
- 🛋️ **Furniture Crimes** — Interior design opinions
- 🛁 **Bath Betrayal** — Aquatic trauma
- ⛈️ **Thunder Fear** — Sky anger responses

### 🎭 **6 Dog Personalities**
Choose your translator's personality — affects voice and delivery:
- ⚡ **Chihuahua Energy** — Fast and intense
- 🌞 **Golden Optimism** — Slow and cheerful
- 🎭 **Husky Drama** — Deep and theatrical
- 🧠 **Pug Wisdom** — Thoughtful snorts
- 🎾 **Lab Enthusiasm** — Friendly excitement
- 🔍 **Beagle Determination** — Persistent and curious

### 🌀 **Chaos Mode**
Combines two random categories for absolutely unhinged results. You never know what you'll get!

### 💎 **Rare Barks**
1% chance of discovering ultra-rare "forbidden knowledge" barks. Can you collect them all?

### 🏆 **Achievements**
7 achievements to unlock:
- 🎤 First Translation
- 💎 Rare Discovery
- 🌶️ Spicy Aficionado
- 🌀 Chaos Theorist
- 🏆 Collector (get barks from every category!)
- 🔥 3-Day Streak
- 💯 Century Mark (100 barks!)

### 💾 **Full Persistence**
- ❤️ **Favorites** — Save your best barks
- 🕐 **History** — Browse your last 100 translations
- 📊 **Stats** — Track your progress, streaks, and rare finds
- ⚙️ **Settings** — Toggle TTS and haptics

### 🎨 **Beautiful Design**
- Warm, dog-friendly color palette (amber, brown, golden tones)
- Smooth animations and haptic feedback
- Clean, intuitive interface
- Dark mode optimized

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android builds) or Xcode (for iOS)

### Installation

```bash
# Clone the repo
git clone https://github.com/marisombra-dev/Barky-Talk.git
cd Barky-Talk

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then:
- **Android**: Press `a` or scan the QR code with the Expo Go app
- **iOS**: Press `i` or scan the QR code with the Expo Go app
- **Web**: Press `w`

---

## 📱 Building for Production

### Android (APK/AAB)

```bash
# Build APK for testing
npx expo build:android -t apk

# Build AAB for Play Store
npx expo build:android -t app-bundle
```

### iOS (requires Mac + Xcode)

```bash
npx expo build:ios
```

### EAS Build (Recommended)

```bash
# Configure EAS
npx eas-cli build:configure

# Build for Android
npx eas-cli build --platform android

# Build for iOS
npx eas-cli build --platform ios
```

---

## 📋 Play Store Submission Checklist

- [ ] Update `app.json` with your EAS project ID
- [ ] Create high-quality screenshots (phone + tablet)
- [ ] Write Play Store description (see `play-store-assets/`)
- [ ] Create feature graphic (1024x500)
- [ ] Set up privacy policy
- [ ] Configure app signing
- [ ] Test on multiple Android versions
- [ ] Upload to Google Play Console

---

## 🎨 Assets Included

All app icons and splash screens are included in `/assets/`:
- `icon.png` — App icon (1024x1024)
- `adaptive-icon.png` — Android adaptive icon
- `splash-icon.png` — Splash screen
- `favicon.png` — Web favicon

---

## 🛠️ Tech Stack

- **React Native** 0.79.5
- **Expo** ~53.0.20
- **TypeScript** 5.8.3
- **AsyncStorage** — Local persistence
- **Expo Speech** — Text-to-speech
- **Expo Haptics** — Vibration feedback
- **Expo Linear Gradient** — Beautiful backgrounds

---

## 📄 License

MIT License © 2025 marisombra-dev

---

## ⚠️ Disclaimer

No dogs were harmed in the making of this app. We can't promise your dog's actual thoughts aren't spicier.

---

Made with 🐾 by **Marisombra** (Patricia Purtill)

Check out my other projects at [github.com/marisombra-dev](https://github.com/marisombra-dev)
