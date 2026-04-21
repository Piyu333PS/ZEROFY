# ⚡ Zerofy — Zero Limits. Infinite Tools.

> 70+ free tools: PDF, Video, Audio, Image, Developer, aur bahut kuch.

---

## 🚀 Quick Start (5 minutes mein run karo)

### Prerequisites
- **Node.js 18+** install karo: https://nodejs.org
- **VS Code** (recommended): https://code.visualstudio.com

### Setup
```bash
# 1. Project folder mein jao
cd zerofy

# 2. Dependencies install karo
npm install

# 3. Development server start karo
npm run dev
```

Browser mein khulega: **http://localhost:5173**

---

## 📁 Project Structure

```
zerofy/
├── src/
│   ├── App.jsx              ← Main app + all routes
│   ├── main.jsx             ← Entry point
│   ├── index.css            ← Global styles
│   │
│   ├── components/          ← Reusable components
│   │   ├── Navbar.jsx       ← Search + navigation
│   │   ├── FileUpload.jsx   ← Drag & drop uploader
│   │   └── ToolLayout.jsx   ← Tool page wrapper
│   │
│   ├── pages/               ← All pages
│   │   ├── HomePage.jsx     ← Main page with all tools
│   │   └── tools/           ← Individual tool pages
│   │       ├── MergePDF.jsx
│   │       ├── ImageCompressor.jsx
│   │       ├── Mp3Trimmer.jsx
│   │       ├── WordCounter.jsx
│   │       └── ... (aur bahut)
│   │
│   └── tools/
│       └── toolsData.js     ← Sabhi tools ki list
│
├── index.html
├── package.json
└── vite.config.js
```

---

## ✅ Abhi Working Tools

| Tool | Category | Status |
|------|----------|--------|
| Merge PDF | PDF | ✅ Working |
| PDF → JPG | PDF | ✅ Working |
| Image Compressor | Image | ✅ Working |
| MP3 Trimmer | Audio | ✅ Working |
| Word Counter | Document | ✅ Working |
| Text to Speech | Document | ✅ Working |
| Speech to Text | Document | ✅ Working |
| Diff Checker | Document | ✅ Working |
| JSON Formatter | Developer | ✅ Working |
| Password Generator | Developer | ✅ Working |
| Color Picker | Developer | ✅ Working |
| QR Code Maker | Developer | ✅ Working |
| Unit Converter | Converter | ✅ Working |

---

## ➕ Naya Tool Kaise Add Karo

### Step 1: Tool file banao
```jsx
// src/pages/tools/MyNewTool.jsx
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function MyNewTool() {
  return (
    <ToolLayout icon="🔧" name="My New Tool" desc="Tool ka description">
      {/* Yahan apna tool ka UI banao */}
    </ToolLayout>
  )
}
```

### Step 2: toolsData.js mein add karo
```js
// src/tools/toolsData.js mein TOOLS array mein add karo:
{ 
  id: 'my-new-tool', 
  cat: 'developer',          // category
  name: 'My New Tool', 
  desc: 'Kya karta hai ye tool', 
  icon: '🔧', 
  status: 'ready',           // 'ready' ya 'coming'
  route: '/tools/my-new-tool' 
}
```

### Step 3: App.jsx mein route add karo
```jsx
// src/App.jsx mein:
import MyNewTool from './pages/tools/MyNewTool'
// ...Routes ke andar:
<Route path="/tools/my-new-tool" element={<MyNewTool />} />
```

**Bas! Tool ready.**

---

## 🎨 Design System

```css
/* Color Variables */
--accent: #6c63ff        /* Purple - primary */
--green: #00d4aa         /* Green - success */
--orange: #ff6b35        /* Orange */
--pink: #ff4d9e          /* Pink */
--blue: #4d9eff          /* Blue */

/* Typography */
--font-display: 'Syne'   /* Headings ke liye */
--font-body: 'DM Sans'   /* Body text ke liye */

/* Spacing */
--radius: 12px
--radius-lg: 20px
```

---

## 📱 Android App Kaise Banao

Isi React codebase se Android app banane ke 2 aasaan tarike hain:

### Option 1: Capacitor (Recommended)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Zerofy com.zerofy.app
npm run build
npx cap add android
npx cap sync
npx cap open android  # Android Studio mein khulega
```

### Option 2: PWA (Progressive Web App)
```bash
npm install vite-plugin-pwa
# vite.config.js mein PWA plugin add karo
# Users "Install App" button se install kar sakte hain
```

---

## 🚀 Deploy Kaise Karo (Free)

### Vercel (Sabse Aasaan)
```bash
npm install -g vercel
vercel
# Bas! URL mil jayega
```

### Netlify
```bash
npm run build
# dist/ folder netlify.com pe drag & drop karo
```

---

## 🔮 Aage Kya Banana Hai (Priority List)

1. **Video Tools** — FFmpeg.wasm integrate karo (browser mein video processing)
2. **PDF Compress** — pdf-lib se optimize karo  
3. **Image Resizer/Cropper** — Canvas API se
4. **Base64 / URL Encoder** — Pure JS, easy to build
5. **Markdown Editor** — marked.js library use karo
6. **Currency Converter** — Free exchange rate API
7. **Audio Recorder** — MediaRecorder API (browser built-in)

---

## 📦 Key Libraries

| Library | Use |
|---------|-----|
| `react-router-dom` | Page routing |
| `react-dropzone` | File drag & drop |
| `pdf-lib` | PDF manipulation |
| `browser-image-compression` | Image compress |
| `lucide-react` | Icons |

---

## 💡 Video Tools ke liye (Advanced)

Video processing ke liye **server-side** ya **FFmpeg.wasm** chahiye:

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

```js
import { FFmpeg } from '@ffmpeg/ffmpeg'
const ffmpeg = new FFmpeg()
await ffmpeg.load()
// Ab video convert/cut/compress kar sako ge browser mein hi
```

---

Made with ❤️ | Zerofy v1.0
