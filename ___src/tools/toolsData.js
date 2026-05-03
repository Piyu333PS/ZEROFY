export const CATEGORIES = [
  { id: 'pdf',       label: 'PDF',       icon: '📄', color: '#63b3ed', dim: 'rgba(99,179,237,0.12)' },
  { id: 'video',     label: 'Video',     icon: '🎬', color: '#9f7aea', dim: 'rgba(159,122,234,0.12)' },
  { id: 'audio',     label: 'Audio',     icon: '🎵', color: '#90cdf4', dim: 'rgba(144,205,244,0.12)' },
  { id: 'image',     label: 'Image',     icon: '🖼️', color: '#b794f4', dim: 'rgba(183,148,244,0.12)' },
  { id: 'document',  label: 'Document',  icon: '📝', color: '#a3bffa', dim: 'rgba(163,191,250,0.12)' },
  { id: 'converter', label: 'Converter', icon: '🔄', color: '#7f9cf5', dim: 'rgba(127,156,245,0.12)' },
  { id: 'developer', label: 'Developer', icon: '⚙️', color: '#9f7aea', dim: 'rgba(159,122,234,0.12)' },
  { id: 'security',  label: 'Security',  icon: '🔒', color: '#63b3ed', dim: 'rgba(99,179,237,0.12)' },
]

export const TOOLS = [
  // ─── PDF ────────────────────────────────
  { id: 'merge-pdf',        cat: 'pdf', name: 'Merge PDF',          desc: 'Combine multiple PDFs into one file',                        icon: '📄', status: 'ready',  route: '/tools/merge-pdf' },
  { id: 'split-pdf',        cat: 'pdf', name: 'Split PDF',           desc: 'Split a PDF into separate pages or sections',               icon: '✂️', status: 'coming',  route: '/tools/split-pdf' },
  { id: 'compress-pdf',     cat: 'pdf', name: 'Compress PDF',        desc: 'Reduce file size while keeping quality',                    icon: '🗜️', status: 'coming',  route: '/tools/compress-pdf' },
  { id: 'pdf-to-word',      cat: 'pdf', name: 'PDF → Word',          desc: 'Convert PDF to an editable DOCX file',                     icon: '📝', status: 'coming', route: '/tools/pdf-to-word' },
  { id: 'pdf-to-excel',     cat: 'pdf', name: 'PDF → Excel',         desc: 'Extract tables into a spreadsheet',                        icon: '📊', status: 'coming', route: '/tools/pdf-to-excel' },
  { id: 'pdf-to-ppt',       cat: 'pdf', name: 'PDF → PowerPoint',    desc: 'Convert to presentation format',                           icon: '📋', status: 'coming', route: '/tools/pdf-to-ppt' },
  { id: 'pdf-to-jpg',       cat: 'pdf', name: 'PDF → JPG',           desc: 'Convert each page to an image',                           icon: '🖼️', status: 'ready',  route: '/tools/pdf-to-jpg' },
  { id: 'jpg-to-pdf',       cat: 'pdf', name: 'Images → PDF',        desc: 'Create a PDF from multiple images',                        icon: '📷', status: 'ready',  route: '/tools/jpg-to-pdf' },
  { id: 'rotate-pdf',       cat: 'pdf', name: 'Rotate PDF',          desc: 'Rotate pages to the correct orientation',                  icon: '🔄', status: 'coming',  route: '/tools/rotate-pdf' },
  { id: 'watermark-pdf',    cat: 'pdf', name: 'Watermark PDF',       desc: 'Add a text or image watermark',                           icon: '💧', status: 'coming',  route: '/tools/watermark-pdf' },
  { id: 'protect-pdf',      cat: 'pdf', name: 'Protect PDF',         desc: 'Lock your PDF with a password',                           icon: '🔐', status: 'coming', route: '/tools/protect-pdf' },
  { id: 'unlock-pdf',       cat: 'pdf', name: 'Unlock PDF',          desc: 'Remove password protection from a PDF',                   icon: '🔓', status: 'coming', route: '/tools/unlock-pdf' },
  { id: 'ocr-pdf',          cat: 'pdf', name: 'OCR PDF',             desc: 'Make scanned PDFs searchable and selectable',             icon: '🔍', status: 'coming', route: '/tools/ocr-pdf' },
  { id: 'sign-pdf',         cat: 'pdf', name: 'Sign PDF',            desc: 'Add a digital signature to your PDF',                     icon: '✍️', status: 'coming', route: '/tools/sign-pdf' },
  { id: 'organize-pdf',     cat: 'pdf', name: 'Organize PDF',        desc: 'Reorder, delete, or rearrange pages',                     icon: '📑', status: 'coming', route: '/tools/organize-pdf' },
  { id: 'redact-pdf',       cat: 'pdf', name: 'Redact PDF',          desc: 'Permanently remove sensitive information',                 icon: '⬛', status: 'coming', route: '/tools/redact-pdf' },
  { id: 'pdf-text-editor', cat: 'pdf', name: 'PDF Text Editor',     desc: 'Add and edit text directly on any PDF page',               icon: '✏️', status: 'ready',  route: '/tools/pdf-text-editor' },

  // ─── VIDEO ──────────────────────────────
  { id: 'video-to-audio',   cat: 'video', name: 'Video → Audio',     desc: 'Extract MP3 or AAC audio from any video',                 icon: '🎵', status: 'ready',  route: '/tools/video-to-audio' },
  { id: 'video-cutter',     cat: 'video', name: 'Video Cutter',      desc: 'Trim and cut video clips with precision',                 icon: '✂️', status: 'ready',  route: '/tools/video-cutter' },
  { id: 'video-merger',     cat: 'video', name: 'Video Merger',      desc: 'Join multiple video clips into one',                      icon: '🔗', status: 'coming', route: '/tools/video-merger' },
  { id: 'video-compressor', cat: 'video', name: 'Video Compressor',  desc: 'Reduce video size without losing quality',                icon: '🗜️', status: 'ready',  route: '/tools/video-compressor' },
  { id: 'video-converter',  cat: 'video', name: 'Video Converter',   desc: 'Convert between MP4, AVI, MOV, MKV and more',            icon: '🔄', status: 'coming', route: '/tools/video-converter' },
  { id: 'video-to-gif',     cat: 'video', name: 'Video → GIF',       desc: 'Turn short video clips into animated GIFs',              icon: '🎞️', status: 'coming', route: '/tools/video-to-gif' },
  { id: 'add-subtitles',    cat: 'video', name: 'Add Subtitles',     desc: 'Burn subtitles from an SRT file into your video',        icon: '💬', status: 'coming', route: '/tools/add-subtitles' },
  { id: 'video-watermark',  cat: 'video', name: 'Video Watermark',   desc: 'Overlay a logo or text on your video',                   icon: '💧', status: 'coming', route: '/tools/video-watermark' },
  { id: 'change-speed',     cat: 'video', name: 'Change Speed',      desc: 'Create fast-forward or slow motion effects',             icon: '⏩', status: 'coming', route: '/tools/change-speed' },
  { id: 'resize-video',     cat: 'video', name: 'Resize Video',      desc: 'Change resolution and aspect ratio',                     icon: '📐', status: 'coming', route: '/tools/resize-video' },
  { id: 'remove-audio',     cat: 'video', name: 'Remove Audio',      desc: 'Mute a video by stripping its audio track',              icon: '🔇', status: 'coming', route: '/tools/remove-audio' },

  // ─── AUDIO ──────────────────────────────
  { id: 'mp3-merger',       cat: 'audio', name: 'MP3 Merger',        desc: 'Join multiple audio files into one',                     icon: '🔗', status: 'coming',  route: '/tools/mp3-merger' },
  { id: 'mp3-trimmer',      cat: 'audio', name: 'MP3 Trimmer',       desc: 'Cut and trim audio to the exact length you need',        icon: '✂️', status: 'ready',  route: '/tools/mp3-trimmer' },
  { id: 'audio-converter',  cat: 'audio', name: 'Audio Converter',   desc: 'Convert between MP3, WAV, AAC, FLAC, OGG',              icon: '🔄', status: 'coming', route: '/tools/audio-converter' },
  { id: 'audio-compressor', cat: 'audio', name: 'Audio Compressor',  desc: 'Shrink audio file size for easy sharing',                icon: '🗜️', status: 'coming', route: '/tools/audio-compressor' },
  { id: 'volume-booster',   cat: 'audio', name: 'Volume Booster',    desc: 'Increase the loudness of any audio file',                icon: '🔊', status: 'ready',  route: '/tools/volume-booster' },
  { id: 'noise-remover',    cat: 'audio', name: 'Noise Remover',     desc: 'AI-powered background noise elimination',                icon: '🤫', status: 'coming', route: '/tools/noise-remover' },
  { id: 'audio-recorder',   cat: 'audio', name: 'Audio Recorder',    desc: 'Record directly from your microphone',                   icon: '🎤', status: 'ready',  route: '/tools/audio-recorder' },
  { id: 'ringtone-maker',   cat: 'audio', name: 'Ringtone Maker',    desc: 'Clip any MP3 into a perfect ringtone',                  icon: '📱', status: 'ready',  route: '/tools/ringtone-maker' },

  // ─── IMAGE ──────────────────────────────
  { id: 'image-compressor', cat: 'image', name: 'Image Compressor',  desc: 'Compress JPG, PNG, and WebP images',                    icon: '🗜️', status: 'ready',  route: '/tools/image-compressor' },
  { id: 'image-converter',  cat: 'image', name: 'Image Converter',   desc: 'Convert between JPG, PNG, WebP, and AVIF',              icon: '🔄', status: 'ready',  route: '/tools/image-converter' },
  { id: 'image-resizer',    cat: 'image', name: 'Image Resizer',     desc: 'Set a custom width and height for any image',           icon: '📐', status: 'ready',  route: '/tools/image-resizer' },
  { id: 'image-cropper',    cat: 'image', name: 'Image Cropper',     desc: 'Select an area and crop with precision',                icon: '✂️', status: 'ready',  route: '/tools/image-cropper' },
  { id: 'bg-remover',       cat: 'image', name: 'BG Remover',        desc: 'AI-powered background removal in seconds',              icon: '🪄', status: 'coming', route: '/tools/bg-remover' },
  { id: 'watermark-image',  cat: 'image', name: 'Watermark Image',   desc: 'Add a logo or text overlay to your image',              icon: '💧', status: 'ready',  route: '/tools/watermark-image' },
  { id: 'rotate-flip',      cat: 'image', name: 'Rotate & Flip',     desc: 'Rotate 90°, 180°, or mirror your image',               icon: '🔄', status: 'ready',  route: '/tools/rotate-flip' },
  { id: 'color-adjuster',   cat: 'image', name: 'Color Adjuster',    desc: 'Adjust brightness, contrast, and saturation',          icon: '🎨', status: 'ready',  route: '/tools/color-adjuster' },
  { id: 'heic-converter',   cat: 'image', name: 'HEIC Converter',    desc: 'Convert iPhone HEIC photos to JPG instantly',           icon: '📷', status: 'ready',  route: '/tools/heic-converter' },
  { id: 'document-scanner', cat: 'image', name: 'Document Scanner',  desc: 'Scan physical documents to high-quality PDF or JPG',   icon: '🔍', status: 'ready',  route: '/tools/document-scanner' },
  { id: 'meme-maker',       cat: 'image', name: 'Meme Maker',        desc: 'Add captions and text to create memes',                icon: '😂', status: 'coming',  route: '/tools/meme-maker' },
  { id: 'screenshot-to-text', cat: 'image', name: 'Image → Text (OCR)', desc: 'Extract text from any image or screenshot',        icon: '🔤', status: 'ready',  route: '/tools/screenshot-to-text' },
  { id: 'image-merger',     cat: 'image', name: 'Image Collage',     desc: 'Combine multiple images into one collage',              icon: '🖼️', status: 'ready',  route: '/tools/image-merger' },

  // ─── DOCUMENT ───────────────────────────
  { id: 'invoice-maker',    cat: 'document', name: 'Invoice Generator',    desc: 'Create professional invoices with PDF export',    icon: '🧾', status: 'ready',  route: '/tools/invoice-maker' },
  { id: 'resume-builder',   cat: 'document', name: 'AI Resume Builder',    desc: 'Build a professional CV with AI assistance',      icon: '📋', status: 'coming',  route: '/tools/resume-builder' },
  { id: 'word-counter',     cat: 'document', name: 'Word Counter',         desc: 'Count words, characters, and sentences',          icon: '🔢', status: 'ready',  route: '/tools/word-counter' },
  { id: 'case-converter',   cat: 'document', name: 'Case Converter',       desc: 'Switch between UPPER, lower, and Title Case',     icon: 'Aa', status: 'ready',  route: '/tools/case-converter' },
  { id: 'text-to-speech',   cat: 'document', name: 'Text to Speech',       desc: 'Convert written text into natural audio',         icon: '🔊', status: 'ready',  route: '/tools/text-to-speech' },
  { id: 'speech-to-text',   cat: 'document', name: 'Speech to Text',       desc: 'Transcribe spoken words into written text',       icon: '🎤', status: 'ready',  route: '/tools/speech-to-text' },
  { id: 'diff-checker',     cat: 'document', name: 'Diff Checker',         desc: 'Compare two texts and highlight differences',     icon: '🔍', status: 'ready',  route: '/tools/diff-checker' },
  { id: 'markdown-editor',  cat: 'document', name: 'Markdown Editor',      desc: 'Write Markdown and preview it in real time',      icon: '✍️', status: 'ready',  route: '/tools/markdown-editor' },
  { id: 'lorem-ipsum',      cat: 'document', name: 'Lorem Ipsum',          desc: 'Generate placeholder text for your designs',      icon: '📄', status: 'ready',  route: '/tools/lorem-ipsum' },
  { id: 'translator',       cat: 'document', name: 'Translator',           desc: 'Translate text into 100+ languages',              icon: '🌍', status: 'coming', route: '/tools/translator' },

  // ─── CONVERTER ──────────────────────────
  { id: 'unit-converter',    cat: 'converter', name: 'Unit Converter',     desc: 'Convert length, weight, temperature, and area',   icon: '📏', status: 'ready',  route: '/tools/unit-converter' },
  { id: 'currency-converter',cat: 'converter', name: 'Currency Converter', desc: 'Live exchange rates for any currency pair',       icon: '💱', status: 'ready',  route: '/tools/currency-converter' },
  { id: 'color-picker',      cat: 'converter', name: 'Color Picker',       desc: 'Pick colors and get HEX, RGB, and HSL values',   icon: '🎨', status: 'ready',  route: '/tools/color-picker' },
  { id: 'qr-generator',      cat: 'converter', name: 'QR Code Maker',      desc: 'Generate a QR code from any URL or text',        icon: '📱', status: 'ready',  route: '/tools/qr-generator' },
  { id: 'barcode-generator', cat: 'converter', name: 'Barcode Generator',  desc: 'Create EAN and Code128 barcodes instantly',      icon: '📊', status: 'ready',  route: '/tools/barcode-generator' },
  { id: 'number-base',       cat: 'converter', name: 'Number Base Converter', desc: 'Convert between Binary, Hex, Decimal, and Octal', icon: '🔢', status: 'ready', route: '/tools/number-base' },

  // ─── DEVELOPER ──────────────────────────
  { id: 'json-formatter',    cat: 'developer', name: 'JSON Formatter',     desc: 'Beautify, minify, and validate JSON',             icon: '{ }', status: 'ready', route: '/tools/json-formatter' },
  { id: 'base64',            cat: 'developer', name: 'Base64 Encode/Decode', desc: 'Encode and decode text or images in Base64',   icon: '🔡', status: 'ready',  route: '/tools/base64' },
  { id: 'url-encoder',       cat: 'developer', name: 'URL Encoder/Decoder', desc: 'Encode and decode URLs into safe format',       icon: '🔗', status: 'coming',  route: '/tools/url-encoder' },
  { id: 'hash-generator',    cat: 'developer', name: 'Hash Generator',     desc: 'Generate MD5, SHA1, and SHA256 hashes',          icon: '#',  status: 'ready',  route: '/tools/hash-generator' },
  { id: 'password-generator',cat: 'developer', name: 'Password Generator', desc: 'Create strong, random passwords instantly',      icon: '🔑', status: 'ready',  route: '/tools/password-generator' },
  { id: 'regex-tester',      cat: 'developer', name: 'Regex Tester',       desc: 'Test and debug regular expressions live',        icon: '.*', status: 'ready',  route: '/tools/regex-tester' },
  { id: 'css-minifier',      cat: 'developer', name: 'CSS/JS Minifier',    desc: 'Minify code to reduce file size',                icon: '🗜️', status: 'ready',  route: '/tools/css-minifier' },

  // ─── SECURITY ───────────────────────────
  { id: 'metadata-remover',  cat: 'security', name: 'Metadata Remover',   desc: 'Strip EXIF data from images and documents',      icon: '🧹', status: 'ready',  route: '/tools/metadata-remover' },
  { id: 'secure-notes',      cat: 'security', name: 'Secure Notes',       desc: 'Write and store encrypted private notes',        icon: '🔐', status: 'ready',  route: '/tools/secure-notes' },
  { id: 'checksum',          cat: 'security', name: 'Checksum Verifier',  desc: 'Verify file integrity with hash comparison',     icon: '✅', status: 'ready',  route: '/tools/checksum' },
  { id: 'ip-lookup',         cat: 'security', name: 'IP Lookup',          desc: 'Look up the location of any IP address',        icon: '🌐', status: 'ready',  route: '/tools/ip-lookup' },
]

export const POPULAR_TOOLS = ['merge-pdf', 'image-compressor', 'video-to-audio', 'word-counter', 'qr-generator', 'json-formatter', 'mp3-trimmer', 'password-generator']
