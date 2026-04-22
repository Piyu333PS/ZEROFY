const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const logoPath = path.join(__dirname, 'src/assets/logo.png')

// Android icon sizes
const icons = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

// Round icon sizes (same)
const roundIcons = icons.map(i => ({ ...i, round: true }))

const androidResPath = path.join(__dirname, 'android/app/src/main/res')

async function generate() {
  console.log('🚀 Android icons generate ho rahe hain...\n')

  for (const icon of icons) {
    const outDir = path.join(androidResPath, icon.dir)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    // ic_launcher.png
    await sharp(logoPath)
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 1 } })
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'))
    console.log(`✅ ${icon.dir}/ic_launcher.png (${icon.size}x${icon.size})`)

    // ic_launcher_round.png
    const circleSvg = Buffer.from(
      `<svg width="${icon.size}" height="${icon.size}">
        <circle cx="${icon.size/2}" cy="${icon.size/2}" r="${icon.size/2}" fill="white"/>
      </svg>`
    )
    await sharp(logoPath)
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 1 } })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'))
    console.log(`✅ ${icon.dir}/ic_launcher_round.png (${icon.size}x${icon.size})`)

    // ic_launcher_foreground.png (larger, 108dp)
    const fgSize = Math.round(icon.size * 1.5)
    await sharp(logoPath)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'))
    console.log(`✅ ${icon.dir}/ic_launcher_foreground.png (${fgSize}x${fgSize})`)
  }

  console.log('\n🎉 Sab icons ban gaye!')
  console.log('📱 Ab Android Studio mein Build → Generate APKs karo')
}

generate().catch(console.error)
