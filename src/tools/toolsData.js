export const CATEGORIES = [
  { id: 'pdf',       label: 'PDF',       icon: '📄', color: '#3B82F6', dim: 'rgba(59,130,246,0.12)' },
  { id: 'video',     label: 'Video',     icon: '🎬', color: '#8B5CF6', dim: 'rgba(139,92,246,0.12)' },
  { id: 'audio',     label: 'Audio',     icon: '🎵', color: '#60A5FA', dim: 'rgba(96,165,250,0.12)' },
  { id: 'image',     label: 'Image',     icon: '🖼️', color: '#A78BFA', dim: 'rgba(167,139,250,0.12)' },
  { id: 'document',  label: 'Document',  icon: '📝', color: '#818CF8', dim: 'rgba(129,140,248,0.12)' },
  { id: 'converter', label: 'Converter', icon: '🔄', color: '#6366F1', dim: 'rgba(99,102,241,0.12)' },
  { id: 'developer', label: 'Developer', icon: '⚙️', color: '#7C3AED', dim: 'rgba(124,58,237,0.12)' },
  { id: 'security',  label: 'Security',  icon: '🔒', color: '#2563EB', dim: 'rgba(37,99,235,0.12)' },
]

export const TOOLS = [
  // ─── PDF ────────────────────────────────
  { id: 'merge-pdf', cat: 'pdf', name: 'Merge PDF', desc: 'Multiple PDFs ko ek mein jodon', icon: '📄', status: 'ready', route: '/tools/merge-pdf' },
  { id: 'split-pdf', cat: 'pdf', name: 'Split PDF', desc: 'PDF ko alag pages mein todon', icon: '✂️', status: 'ready', route: '/tools/split-pdf' },
  { id: 'compress-pdf', cat: 'pdf', name: 'Compress PDF', desc: 'File size kam karo quality rakhte hue', icon: '🗜️', status: 'ready', route: '/tools/compress-pdf' },
  { id: 'pdf-to-word', cat: 'pdf', name: 'PDF → Word', desc: 'PDF ko editable DOCX mein convert karo', icon: '📝', status: 'coming', route: '/tools/pdf-to-word' },
  { id: 'pdf-to-excel', cat: 'pdf', name: 'PDF → Excel', desc: 'Tables ko spreadsheet mein extract karo', icon: '📊', status: 'coming', route: '/tools/pdf-to-excel' },
  { id: 'pdf-to-ppt', cat: 'pdf', name: 'PDF → PowerPoint', desc: 'Presentation format mein convert karo', icon: '📋', status: 'coming', route: '/tools/pdf-to-ppt' },
  { id: 'pdf-to-jpg', cat: 'pdf', name: 'PDF → JPG', desc: 'Har page ko image mein convert karo', icon: '🖼️', status: 'ready', route: '/tools/pdf-to-jpg' },
  { id: 'jpg-to-pdf', cat: 'pdf', name: 'Images → PDF', desc: 'Multiple images se PDF banao', icon: '📷', status: 'ready', route: '/tools/jpg-to-pdf' },
  { id: 'rotate-pdf', cat: 'pdf', name: 'Rotate PDF', desc: 'Pages ko rotate karo', icon: '🔄', status: 'ready', route: '/tools/rotate-pdf' },
  { id: 'watermark-pdf', cat: 'pdf', name: 'Watermark PDF', desc: 'Text ya image watermark lagao', icon: '💧', status: 'ready', route: '/tools/watermark-pdf' },
  { id: 'protect-pdf', cat: 'pdf', name: 'Protect PDF', desc: 'Password se PDF lock karo', icon: '🔐', status: 'coming', route: '/tools/protect-pdf' },
  { id: 'unlock-pdf', cat: 'pdf', name: 'Unlock PDF', desc: 'PDF ka password hatao', icon: '🔓', status: 'coming', route: '/tools/unlock-pdf' },
  { id: 'ocr-pdf', cat: 'pdf', name: 'OCR PDF', desc: 'Scanned PDF ko searchable banao', icon: '🔍', status: 'coming', route: '/tools/ocr-pdf' },
  { id: 'sign-pdf', cat: 'pdf', name: 'Sign PDF', desc: 'Digital signature add karo', icon: '✍️', status: 'coming', route: '/tools/sign-pdf' },
  { id: 'organize-pdf', cat: 'pdf', name: 'Organize PDF', desc: 'Pages reorder karo', icon: '📑', status: 'coming', route: '/tools/organize-pdf' },
  { id: 'redact-pdf', cat: 'pdf', name: 'Redact PDF', desc: 'Sensitive info permanently hatao', icon: '⬛', status: 'coming', route: '/tools/redact-pdf' },

  // ─── VIDEO ──────────────────────────────
  { id: 'video-to-audio', cat: 'video', name: 'Video → Audio', desc: 'MP4 se MP3/AAC extract karo', icon: '🎵', status: 'ready', route: '/tools/video-to-audio' },
  { id: 'video-cutter', cat: 'video', name: 'Video Cutter', desc: 'Video clip trim/cut karo', icon: '✂️', status: 'ready', route: '/tools/video-cutter' },
  { id: 'video-merger', cat: 'video', name: 'Video Merger', desc: 'Multiple videos ko join karo', icon: '🔗', status: 'coming', route: '/tools/video-merger' },
  { id: 'video-compressor', cat: 'video', name: 'Video Compressor', desc: 'Size reduce karo quality rakhte hue', icon: '🗜️', status: 'coming', route: '/tools/video-compressor' },
  { id: 'video-converter', cat: 'video', name: 'Video Converter', desc: 'MP4, AVI, MOV, MKV formats', icon: '🔄', status: 'coming', route: '/tools/video-converter' },
  { id: 'video-to-gif', cat: 'video', name: 'Video → GIF', desc: 'Short clips ko GIF banao', icon: '🎞️', status: 'coming', route: '/tools/video-to-gif' },
  { id: 'add-subtitles', cat: 'video', name: 'Add Subtitles', desc: 'SRT file se subtitles add karo', icon: '💬', status: 'coming', route: '/tools/add-subtitles' },
  { id: 'video-watermark', cat: 'video', name: 'Video Watermark', desc: 'Logo ya text video pe lagao', icon: '💧', status: 'coming', route: '/tools/video-watermark' },
  { id: 'change-speed', cat: 'video', name: 'Change Speed', desc: 'Fast/slow motion banao', icon: '⏩', status: 'coming', route: '/tools/change-speed' },
  { id: 'resize-video', cat: 'video', name: 'Resize Video', desc: 'Resolution aur aspect ratio change', icon: '📐', status: 'coming', route: '/tools/resize-video' },
  { id: 'remove-audio', cat: 'video', name: 'Remove Audio', desc: 'Video se audio hatao (mute)', icon: '🔇', status: 'coming', route: '/tools/remove-audio' },

  // ─── AUDIO ──────────────────────────────
  { id: 'mp3-merger', cat: 'audio', name: 'MP3 Merger', desc: 'Multiple audio files join karo', icon: '🔗', status: 'ready', route: '/tools/mp3-merger' },
  { id: 'mp3-trimmer', cat: 'audio', name: 'MP3 Trimmer', desc: 'Audio ko cut/trim karo', icon: '✂️', status: 'ready', route: '/tools/mp3-trimmer' },
  { id: 'audio-converter', cat: 'audio', name: 'Audio Converter', desc: 'MP3, WAV, AAC, FLAC, OGG', icon: '🔄', status: 'coming', route: '/tools/audio-converter' },
  { id: 'audio-compressor', cat: 'audio', name: 'Audio Compressor', desc: 'File size kam karo', icon: '🗜️', status: 'coming', route: '/tools/audio-compressor' },
  { id: 'volume-booster', cat: 'audio', name: 'Volume Booster', desc: 'Audio loudness badhao', icon: '🔊', status: 'ready', route: '/tools/volume-booster' },
  { id: 'noise-remover', cat: 'audio', name: 'Noise Remover', desc: 'Background noise hatao (AI)', icon: '🤫', status: 'coming', route: '/tools/noise-remover' },
  { id: 'audio-recorder', cat: 'audio', name: 'Audio Recorder', desc: 'Mic se directly record karo', icon: '🎤', status: 'ready', route: '/tools/audio-recorder' },
  { id: 'ringtone-maker', cat: 'audio', name: 'Ringtone Maker', desc: 'MP3 se ringtone banao', icon: '📱', status: 'ready', route: '/tools/ringtone-maker' },

  // ─── IMAGE ──────────────────────────────
  { id: 'image-compressor', cat: 'image', name: 'Image Compressor', desc: 'JPG, PNG, WebP size reduce karo', icon: '🗜️', status: 'ready', route: '/tools/image-compressor' },
  { id: 'image-converter', cat: 'image', name: 'Image Converter', desc: 'JPG, PNG, WebP, AVIF convert karo', icon: '🔄', status: 'ready', route: '/tools/image-converter' },
  { id: 'image-resizer', cat: 'image', name: 'Image Resizer', desc: 'Custom width/height set karo', icon: '📐', status: 'ready', route: '/tools/image-resizer' },
  { id: 'image-cropper', cat: 'image', name: 'Image Cropper', desc: 'Area select karke crop karo', icon: '✂️', status: 'ready', route: '/tools/image-cropper' },
  { id: 'bg-remover', cat: 'image', name: 'BG Remover', desc: 'Background transparent karo (AI)', icon: '🪄', status: 'coming', route: '/tools/bg-remover' },
  { id: 'watermark-image', cat: 'image', name: 'Watermark Image', desc: 'Logo/text add karo image pe', icon: '💧', status: 'ready', route: '/tools/watermark-image' },
  { id: 'rotate-flip', cat: 'image', name: 'Rotate & Flip', desc: '90°, 180°, mirror effect', icon: '🔄', status: 'ready', route: '/tools/rotate-flip' },
  { id: 'color-adjuster', cat: 'image', name: 'Color Adjuster', desc: 'Brightness, contrast, saturation', icon: '🎨', status: 'ready', route: '/tools/color-adjuster' },
  { id: 'heic-converter', cat: 'image', name: 'HEIC Converter', desc: 'iPhone HEIC photos ko JPG mein convert', icon: '📷', status: 'ready', route: '/tools/heic-converter' },
  { id: 'document-scanner', cat: 'image', name: 'Document Scanner', desc: 'Hard copy ko high quality scan karo — PDF ya JPG', icon: '🔍', status: 'ready', route: '/tools/document-scanner' },
  { id: 'meme-maker', cat: 'image', name: 'Meme Maker', desc: 'Text add karke meme banao', icon: '😂', status: 'ready', route: '/tools/meme-maker' },
  { id: 'screenshot-to-text', cat: 'image', name: 'Image → Text (OCR)', desc: 'Image se text extract karo', icon: '🔤', status: 'ready', route: '/tools/screenshot-to-text' },
  { id: 'image-merger', cat: 'image', name: 'Image Collage', desc: 'Multiple images ko combine karo', icon: '🖼️', status: 'ready', route: '/tools/image-merger' },

  // ─── DOCUMENT ───────────────────────────
  { id: 'resume-builder', cat: 'document', name: 'AI Resume Builder', desc: 'OpenAI se professional CV/resume banao', icon: '📋', status: 'ready', route: '/tools/resume-builder' },
  { id: 'word-counter', cat: 'document', name: 'Word Counter', desc: 'Words, chars, sentences count karo', icon: '🔢', status: 'ready', route: '/tools/word-counter' },
  { id: 'case-converter', cat: 'document', name: 'Case Converter', desc: 'UPPER, lower, Title Case mein convert', icon: 'Aa', status: 'ready', route: '/tools/case-converter' },
  { id: 'text-to-speech', cat: 'document', name: 'Text to Speech', desc: 'Likha text bol ke sunao', icon: '🔊', status: 'ready', route: '/tools/text-to-speech' },
  { id: 'speech-to-text', cat: 'document', name: 'Speech to Text', desc: 'Boli baat ko text mein likho', icon: '🎤', status: 'ready', route: '/tools/speech-to-text' },
  { id: 'diff-checker', cat: 'document', name: 'Diff Checker', desc: 'Do texts mein differences dekho', icon: '🔍', status: 'ready', route: '/tools/diff-checker' },
  { id: 'markdown-editor', cat: 'document', name: 'Markdown Editor', desc: 'Markdown likhkar preview karo', icon: '✍️', status: 'ready', route: '/tools/markdown-editor' },
  { id: 'lorem-ipsum', cat: 'document', name: 'Lorem Ipsum', desc: 'Placeholder text generate karo', icon: '📄', status: 'ready', route: '/tools/lorem-ipsum' },
  { id: 'translator', cat: 'document', name: 'Translator', desc: '100+ languages mein translate karo', icon: '🌍', status: 'coming', route: '/tools/translator' },

  // ─── CONVERTER ──────────────────────────
  { id: 'unit-converter', cat: 'converter', name: 'Unit Converter', desc: 'Length, weight, temp, area convert', icon: '📏', status: 'ready', route: '/tools/unit-converter' },
  { id: 'currency-converter', cat: 'converter', name: 'Currency Converter', desc: 'Live exchange rates', icon: '💱', status: 'ready', route: '/tools/currency-converter' },
  { id: 'color-picker', cat: 'converter', name: 'Color Picker', desc: 'HEX, RGB, HSL values', icon: '🎨', status: 'ready', route: '/tools/color-picker' },
  { id: 'qr-generator', cat: 'converter', name: 'QR Code Maker', desc: 'URL/text ka QR banao', icon: '📱', status: 'ready', route: '/tools/qr-generator' },
  { id: 'barcode-generator', cat: 'converter', name: 'Barcode Generator', desc: 'EAN, Code128 barcodes banao', icon: '📊', status: 'ready', route: '/tools/barcode-generator' },
  { id: 'number-base', cat: 'converter', name: 'Number Base Converter', desc: 'Binary, Hex, Decimal, Octal', icon: '🔢', status: 'ready', route: '/tools/number-base' },

  // ─── DEVELOPER ──────────────────────────
  { id: 'json-formatter', cat: 'developer', name: 'JSON Formatter', desc: 'JSON beautify/minify/validate', icon: '{ }', status: 'ready', route: '/tools/json-formatter' },
  { id: 'base64', cat: 'developer', name: 'Base64 Encode/Decode', desc: 'Text aur image encode decode', icon: '🔡', status: 'ready', route: '/tools/base64' },
  { id: 'url-encoder', cat: 'developer', name: 'URL Encoder/Decoder', desc: 'URL safe format mein convert karo', icon: '🔗', status: 'ready', route: '/tools/url-encoder' },
  { id: 'hash-generator', cat: 'developer', name: 'Hash Generator', desc: 'MD5, SHA1, SHA256 hash generate', icon: '#', status: 'ready', route: '/tools/hash-generator' },
  { id: 'password-generator', cat: 'developer', name: 'Password Generator', desc: 'Strong random password banao', icon: '🔑', status: 'ready', route: '/tools/password-generator' },
  { id: 'regex-tester', cat: 'developer', name: 'Regex Tester', desc: 'Regular expressions test karo', icon: '.*', status: 'ready', route: '/tools/regex-tester' },
  { id: 'css-minifier', cat: 'developer', name: 'CSS/JS Minifier', desc: 'Code compress karke size kam karo', icon: '🗜️', status: 'ready', route: '/tools/css-minifier' },

  // ─── SECURITY ───────────────────────────
  { id: 'metadata-remover', cat: 'security', name: 'Metadata Remover', desc: 'Image/doc se EXIF data hatao', icon: '🧹', status: 'ready', route: '/tools/metadata-remover' },
  { id: 'secure-notes', cat: 'security', name: 'Secure Notes', desc: 'Encrypted private notes likhon', icon: '🔐', status: 'ready', route: '/tools/secure-notes' },
  { id: 'checksum', cat: 'security', name: 'Checksum Verifier', desc: 'File integrity check karo', icon: '✅', status: 'ready', route: '/tools/checksum' },
  { id: 'ip-lookup', cat: 'security', name: 'IP Lookup', desc: 'IP address ki location dekho', icon: '🌐', status: 'ready', route: '/tools/ip-lookup' },
]

export const POPULAR_TOOLS = ['merge-pdf', 'image-compressor', 'video-to-audio', 'word-counter', 'qr-generator', 'json-formatter', 'mp3-trimmer', 'password-generator']
