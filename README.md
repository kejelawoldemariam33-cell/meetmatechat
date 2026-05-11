# Chatterly — Real-time Chat + Video Calls

A full-stack chat and video call app built with **React**, **Firebase**, and **WebRTC (PeerJS)**.  
Deployable to the web (Firebase Hosting / Vercel) and the **Google Play Store** via Capacitor.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Auth | Firebase Authentication (Email + Google) |
| Database | Firestore (real-time) |
| File Storage | Firebase Storage |
| Video/Audio | WebRTC via PeerJS |
| Call Signaling | Firestore documents |
| Web Deploy | Firebase Hosting or Vercel |
| Android Deploy | Capacitor → Android Studio → Play Store |

---

## Project Structure

```
chatterly/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   ├── firebase.js          ← Firebase config (edit this)
│   │   └── AuthContext.jsx      ← Auth state provider
│   ├── hooks/
│   │   ├── useMessages.js       ← Firestore chat hooks
│   │   └── useVideoCall.js      ← WebRTC/PeerJS hook
│   ├── components/
│   │   ├── Sidebar.jsx          ← Contacts + search
│   │   ├── ChatWindow.jsx       ← Message UI
│   │   └── VideoCall.jsx        ← Video call overlay
│   ├── pages/
│   │   ├── AuthPage.jsx         ← Login / Signup
│   │   └── ChatPage.jsx         ← Main layout
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── index.js
├── firestore.rules              ← Security rules
├── firebase.json                ← Hosting config
├── capacitor.config.json        ← Android config
└── package.json
```

---

## Step 1 — Firebase Setup

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it "Chatterly" → continue
3. **Enable Authentication:**
   - Build → Authentication → Get started
   - Enable **Email/Password** and **Google** providers
4. **Enable Firestore:**
   - Build → Firestore Database → Create database
   - Start in **test mode** (we'll add rules in Step 4)
5. **Get your config:**
   - Project settings (gear icon) → Your apps → Add app → Web
   - Copy the `firebaseConfig` object
6. Paste it into `src/lib/firebase.js`

---

## Step 2 — Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start
# → Opens at http://localhost:3000
```

---

## Step 3 — Deploy to Web (Firebase Hosting)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Hosting, use "build" as public dir, SPA=yes)
firebase init

# Build the app
npm run build

# Deploy
firebase deploy
# → Live at https://YOUR_PROJECT_ID.web.app
```

### Alternative: Deploy to Vercel

```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## Step 4 — Firestore Security Rules

Deploy the included rules:

```bash
firebase deploy --only firestore:rules
```

This locks down Firestore so users can only read/write their own data.

---

## Step 5 — Deploy to Google Play Store (Android)

### 5a. Install Capacitor

```bash
npm install @capacitor/core @capacitor/android @capacitor/cli
npm install @capacitor/splash-screen @capacitor/status-bar

npx cap init
```

### 5b. Build and sync

```bash
npm run build
npx cap add android
npx cap sync android
```

### 5c. Open in Android Studio

```bash
npx cap open android
```

In Android Studio:
- Build → Generate Signed Bundle/APK
- Create a new keystore (save it securely!)
- Build the AAB (Android App Bundle)

### 5d. Upload to Play Store

1. Go to [https://play.google.com/console](https://play.google.com/console)
2. Create a new app
3. Upload your `.aab` file under **Production → Create new release**
4. Fill in store listing (title, description, screenshots)
5. Submit for review (~3-7 days)

### Update `capacitor.config.json`

Change `appId` to your unique reverse-domain ID:
```json
{
  "appId": "com.YOURCOMPANY.chatterly"
}
```

---

## Step 6 — Firestore Indexes

If you get "index required" errors, add these composite indexes in the Firebase Console:

| Collection | Fields | Order |
|-----------|--------|-------|
| `conversations` | `participants` (array) + `lastMessageAt` | Descending |

---

## Environment Variables (optional hardening)

Instead of putting keys directly in `firebase.js`, use a `.env` file:

```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
```

Then in `firebase.js`:
```js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  // ...
};
```

Add `.env` to `.gitignore`.

---

## Features

- ✅ Email + Google authentication
- ✅ Real-time messaging (Firestore)
- ✅ Video calls (WebRTC via PeerJS)
- ✅ Voice calls
- ✅ User search
- ✅ Online presence indicators
- ✅ Emoji picker
- ✅ File attachment UI (ready for Storage wiring)
- ✅ Mute / camera toggle during calls
- ✅ Responsive (mobile + desktop)
- ✅ Firestore security rules
- ✅ Play Store ready (Capacitor)

---

## WebRTC Notes

PeerJS uses `0.peerjs.com` as the free signaling server — fine for development.  
For production at scale, self-host the [PeerJS Server](https://github.com/peers/peerjs-server):

```bash
npm install -g peer
peerjs --port 9000 --key peerjs --path /
```

Then update `useVideoCall.js`:
```js
const peer = new Peer(currentUserId, {
  host: "your-server.com",
  port: 9000,
  path: "/",
  secure: true,
});
```

---

## License

MIT — free to use and modify.
