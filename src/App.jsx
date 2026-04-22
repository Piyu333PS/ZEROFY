import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import { useBackButton } from './hooks/useBackButton'

// PDF Tools
import MergePDF from './pages/tools/MergePDF'
import PdfToJpg from './pages/tools/PdfToJpg'

// Image Tools
import ImageCompressor from './pages/tools/ImageCompressor'
import ImageResizer from './pages/tools/ImageResizer'
import ImageCropper from './pages/tools/ImageCropper'
import ImageConverter from './pages/tools/ImageConverter'
import ColorAdjuster from './pages/tools/ColorAdjuster'
import RotateFlip from './pages/tools/RotateFlip'
import WatermarkImage from './pages/tools/WatermarkImage'
import ImageCollage from './pages/tools/ImageCollage'
import ImageToText from './pages/tools/ImageToText'

// Video Tools
import VideoToAudio from './pages/tools/VideoToAudio'
import VideoCutter from './pages/tools/VideoCutter'

// Audio Tools
import Mp3Trimmer from './pages/tools/Mp3Trimmer'
import AudioRecorder from './pages/tools/AudioRecorder'
import VolumeBooster from './pages/tools/VolumeBooster'
import RingtoneMaker from './pages/tools/RingtoneMaker'

// Document Tools
import ResumeBuilder from './pages/tools/ResumeBuilder'
import WordCounter from './pages/tools/WordCounter'
import TextToSpeech from './pages/tools/TextToSpeech'
import SpeechToText from './pages/tools/SpeechToText'
import DiffChecker from './pages/tools/DiffChecker'
import CaseConverter from './pages/tools/CaseConverter'
import LoremIpsum from './pages/tools/LoremIpsum'
import MarkdownEditor from './pages/tools/MarkdownEditor'

// Developer Tools
import JsonFormatter from './pages/tools/JsonFormatter'
import PasswordGenerator from './pages/tools/PasswordGenerator'
import ColorPicker from './pages/tools/ColorPicker'
import QRGenerator from './pages/tools/QRGenerator'
import UnitConverter from './pages/tools/UnitConverter'
import Base64Tool from './pages/tools/Base64Tool'
import UrlEncoder from './pages/tools/UrlEncoder'
import HashGenerator from './pages/tools/HashGenerator'
import RegexTester from './pages/tools/RegexTester'
import CssMinifier from './pages/tools/CssMinifier'
import NumberBase from './pages/tools/NumberBase'

// New Tools
import ImagesToPdf from './pages/tools/ImagesToPdf'
import MetadataRemover from './pages/tools/MetadataRemover'
import HeicConverter from './pages/tools/HeicConverter'
import DocumentScanner from './pages/tools/DocumentScanner'

// Security Tools
import SecureNotes from './pages/tools/SecureNotes'
import ChecksumVerifier from './pages/tools/ChecksumVerifier'
import IpLookup from './pages/tools/IpLookup'

// Converter Tools
import CurrencyConverter from './pages/tools/CurrencyConverter'
import BarcodeGenerator from './pages/tools/BarcodeGenerator'

function ComingSoon({ name }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🚧</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10, color: 'var(--text)' }}>{name}</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 14 }}>
        Ye tool jald aa raha hai! Hum ise develop kar rahe hain.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => window.history.back()} style={{
          background: 'var(--surface)', color: 'var(--text2)', padding: '10px 22px',
          borderRadius: 100, border: '1px solid var(--border2)', cursor: 'pointer', fontWeight: 500, fontSize: 14
        }}>← Back</button>
        <a href="/" style={{
          background: 'var(--accent)', color: '#fff', padding: '10px 22px',
          borderRadius: 100, textDecoration: 'none', fontWeight: 500, fontSize: 14,
          display: 'inline-flex', alignItems: 'center'
        }}>🏠 Home</a>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{
      background: 'var(--bg2)',
      borderTop: '1px solid rgba(59,130,246,0.12)',
      padding: '36px 24px',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 6,
          background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>
          ⚡ Zerofy
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 4 }}>
          Zero Limits. Infinite Tools.
        </p>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 14 }}>
          © 2025 Zerofy — Made with ❤️ for everyone
        </p>
      </div>
    </footer>
  )
}

// Inner component so hooks can use router context
function AppInner() {
  useBackButton()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/all-tools" element={<HomePage />} />

          {/* Pricing */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* PDF */}
          <Route path="/tools/merge-pdf" element={<MergePDF />} />
          <Route path="/tools/pdf-to-jpg" element={<PdfToJpg />} />
          <Route path="/tools/jpg-to-pdf" element={<ImagesToPdf />} />
          <Route path="/tools/split-pdf" element={<ComingSoon name="Split PDF" />} />
          <Route path="/tools/compress-pdf" element={<ComingSoon name="Compress PDF" />} />
          <Route path="/tools/rotate-pdf" element={<ComingSoon name="Rotate PDF" />} />
          <Route path="/tools/watermark-pdf" element={<ComingSoon name="Watermark PDF" />} />
          <Route path="/tools/pdf-to-word" element={<ComingSoon name="PDF → Word" />} />
          <Route path="/tools/pdf-to-excel" element={<ComingSoon name="PDF → Excel" />} />
          <Route path="/tools/pdf-to-ppt" element={<ComingSoon name="PDF → PowerPoint" />} />
          <Route path="/tools/protect-pdf" element={<ComingSoon name="Protect PDF" />} />
          <Route path="/tools/unlock-pdf" element={<ComingSoon name="Unlock PDF" />} />
          <Route path="/tools/ocr-pdf" element={<ComingSoon name="OCR PDF" />} />
          <Route path="/tools/sign-pdf" element={<ComingSoon name="Sign PDF" />} />
          <Route path="/tools/organize-pdf" element={<ComingSoon name="Organize PDF" />} />
          <Route path="/tools/redact-pdf" element={<ComingSoon name="Redact PDF" />} />

          {/* Image */}
          <Route path="/tools/image-compressor" element={<ImageCompressor />} />
          <Route path="/tools/image-converter" element={<ImageConverter />} />
          <Route path="/tools/image-resizer" element={<ImageResizer />} />
          <Route path="/tools/image-cropper" element={<ImageCropper />} />
          <Route path="/tools/rotate-flip" element={<RotateFlip />} />
          <Route path="/tools/color-adjuster" element={<ColorAdjuster />} />
          <Route path="/tools/watermark-image" element={<WatermarkImage />} />
          <Route path="/tools/image-merger" element={<ImageCollage />} />
          <Route path="/tools/screenshot-to-text" element={<ImageToText />} />
          <Route path="/tools/heic-converter" element={<HeicConverter />} />
          <Route path="/tools/document-scanner" element={<DocumentScanner />} />
          <Route path="/tools/bg-remover" element={<ComingSoon name="BG Remover (AI)" />} />
          <Route path="/tools/meme-maker" element={<ComingSoon name="Meme Maker" />} />

          {/* Audio */}
          <Route path="/tools/mp3-trimmer" element={<Mp3Trimmer />} />
          <Route path="/tools/mp3-merger" element={<ComingSoon name="MP3 Merger" />} />
          <Route path="/tools/audio-recorder" element={<AudioRecorder />} />
          <Route path="/tools/volume-booster" element={<VolumeBooster />} />
          <Route path="/tools/ringtone-maker" element={<RingtoneMaker />} />
          <Route path="/tools/audio-converter" element={<ComingSoon name="Audio Converter" />} />
          <Route path="/tools/audio-compressor" element={<ComingSoon name="Audio Compressor" />} />
          <Route path="/tools/noise-remover" element={<ComingSoon name="Noise Remover (AI)" />} />

          {/* Video */}
          <Route path="/tools/video-to-audio" element={<VideoToAudio />} />
          <Route path="/tools/video-cutter" element={<VideoCutter />} />
          <Route path="/tools/video-merger" element={<ComingSoon name="Video Merger" />} />
          <Route path="/tools/video-compressor" element={<ComingSoon name="Video Compressor" />} />
          <Route path="/tools/video-converter" element={<ComingSoon name="Video Converter" />} />
          <Route path="/tools/video-to-gif" element={<ComingSoon name="Video → GIF" />} />
          <Route path="/tools/add-subtitles" element={<ComingSoon name="Add Subtitles" />} />
          <Route path="/tools/video-watermark" element={<ComingSoon name="Video Watermark" />} />
          <Route path="/tools/change-speed" element={<ComingSoon name="Change Speed" />} />
          <Route path="/tools/resize-video" element={<ComingSoon name="Resize Video" />} />
          <Route path="/tools/remove-audio" element={<ComingSoon name="Remove Audio" />} />

          {/* Document */}
          <Route path="/tools/resume-builder" element={<ResumeBuilder />} />
          <Route path="/tools/word-counter" element={<WordCounter />} />
          <Route path="/tools/case-converter" element={<CaseConverter />} />
          <Route path="/tools/text-to-speech" element={<TextToSpeech />} />
          <Route path="/tools/speech-to-text" element={<SpeechToText />} />
          <Route path="/tools/diff-checker" element={<DiffChecker />} />
          <Route path="/tools/markdown-editor" element={<MarkdownEditor />} />
          <Route path="/tools/lorem-ipsum" element={<LoremIpsum />} />
          <Route path="/tools/translator" element={<ComingSoon name="Translator" />} />

          {/* Developer */}
          <Route path="/tools/json-formatter" element={<JsonFormatter />} />
          <Route path="/tools/password-generator" element={<PasswordGenerator />} />
          <Route path="/tools/color-picker" element={<ColorPicker />} />
          <Route path="/tools/qr-generator" element={<QRGenerator />} />
          <Route path="/tools/unit-converter" element={<UnitConverter />} />
          <Route path="/tools/base64" element={<Base64Tool />} />
          <Route path="/tools/url-encoder" element={<UrlEncoder />} />
          <Route path="/tools/hash-generator" element={<HashGenerator />} />
          <Route path="/tools/regex-tester" element={<RegexTester />} />
          <Route path="/tools/css-minifier" element={<CssMinifier />} />
          <Route path="/tools/number-base" element={<NumberBase />} />

          {/* Security */}
          <Route path="/tools/secure-notes" element={<SecureNotes />} />
          <Route path="/tools/checksum" element={<ChecksumVerifier />} />
          <Route path="/tools/metadata-remover" element={<MetadataRemover />} />
          <Route path="/tools/ip-lookup" element={<IpLookup />} />

          {/* Converter */}
          <Route path="/tools/currency-converter" element={<CurrencyConverter />} />
          <Route path="/tools/barcode-generator" element={<BarcodeGenerator />} />

          <Route path="*" element={<ComingSoon name="Page Not Found" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
