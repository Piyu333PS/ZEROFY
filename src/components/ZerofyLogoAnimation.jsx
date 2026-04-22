import { useEffect, useRef, useState } from 'react'
import styles from './ZerofyLogoAnimation.module.css'

const stories = [
  { name:'Image → PDF',      cat:'PDF',       icon:'📑', inIcon:'🖼️', inLabel:'IMAGE',   inValue:'photo.jpg',   inTag:'drop image',  outIcon:'📑', outLabel:'PDF',     outValue:'document.pdf', outTag:'ready ✓',       color:'#ef4444', particle:'#ef4444' },
  { name:'Video → Audio',    cat:'VIDEO',      icon:'🎬', inIcon:'🎬', inLabel:'VIDEO',   inValue:'movie.mp4',   inTag:'drop video',  outIcon:'🎵', outLabel:'AUDIO',   outValue:'audio.mp3',    outTag:'extracted ✓',   color:'#f97316', particle:'#f97316' },
  { name:'Currency Convert', cat:'CONVERTER',  icon:'💱', inIcon:'₹',  inLabel:'RUPEES',  inValue:'₹ 10,000',   inTag:'enter amount',outIcon:'💵', outLabel:'DOLLAR',  outValue:'$ 119.80',     outTag:'converted ✓',   color:'#4ade80', particle:'#4ade80' },
  { name:'PDF Merge',        cat:'PDF',        icon:'🗂️', inIcon:'📄', inLabel:'FILES',   inValue:'3 PDFs',      inTag:'select files',outIcon:'📑', outLabel:'MERGED',  outValue:'merged.pdf',   outTag:'merged ✓',      color:'#38bdf8', particle:'#38bdf8' },
  { name:'Bill Generator',   cat:'UTILITY',    icon:'🧾', inIcon:'📋', inLabel:'DETAILS', inValue:'Item + GST',  inTag:'fill form',   outIcon:'🧾', outLabel:'INVOICE', outValue:'bill.pdf',     outTag:'generated ✓',   color:'#fbbf24', particle:'#fbbf24' },
  { name:'Doc Scanner',      cat:'DOCUMENT',   icon:'📝', inIcon:'📷', inLabel:'CAMERA',  inValue:'scan.jpg',    inTag:'take photo',  outIcon:'📝', outLabel:'TEXT',    outValue:'text.docx',    outTag:'scanned ✓',     color:'#a78bfa', particle:'#a78bfa' },
  { name:'Compress PDF',     cat:'PDF',        icon:'🗜️', inIcon:'📑', inLabel:'PDF',     inValue:'10 MB file',  inTag:'drop pdf',    outIcon:'🗜️', outLabel:'SMALL',   outValue:'1.2 MB ↓',     outTag:'compressed ✓',  color:'#fb7185', particle:'#fb7185' },
  { name:'QR Generator',     cat:'DEVELOPER',  icon:'◼',  inIcon:'🔗', inLabel:'URL',     inValue:'zerofy.co',   inTag:'enter link',  outIcon:'◼',  outLabel:'QR CODE', outValue:'qr.png',       outTag:'generated ✓',   color:'#c084fc', particle:'#c084fc' },
  { name:'Image Compress',   cat:'IMAGE',      icon:'🖼️', inIcon:'🖼️', inLabel:'IMAGE',   inValue:'5 MB photo',  inTag:'drop image',  outIcon:'⚡', outLabel:'SMALL',   outValue:'420 KB ↓',     outTag:'compressed ✓',  color:'#22d3ee', particle:'#22d3ee' },
  { name:'MP3 Trimmer',      cat:'AUDIO',      icon:'🎵', inIcon:'🎵', inLabel:'AUDIO',   inValue:'song.mp3',    inTag:'drop audio',  outIcon:'✂️', outLabel:'CLIP',    outValue:'clip.mp3',     outTag:'trimmed ✓',     color:'#34d399', particle:'#34d399' },
  { name:'Watermark PDF',    cat:'PDF',        icon:'💧', inIcon:'📑', inLabel:'PDF',     inValue:'report.pdf',  inTag:'drop pdf',    outIcon:'💧', outLabel:'BRANDED', outValue:'branded.pdf',  outTag:'stamped ✓',     color:'#60a5fa', particle:'#60a5fa' },
  { name:'Word Counter',     cat:'TEXT',       icon:'📊', inIcon:'✍️', inLabel:'TEXT',    inValue:'paste text',  inTag:'enter text',  outIcon:'📊', outLabel:'STATS',   outValue:'342 words',    outTag:'counted ✓',     color:'#818cf8', particle:'#818cf8' },
]

// Mobile-only: just the animated logo circle, no input/output panels
function MobileLogo() {
  return (
    <div className={styles.mobileLogoWrap}>
      <div className={styles.mobileLogoCircle}>
        <div className={styles.mobileLogoInner}>
          <svg className={styles.infSvg} viewBox="0 0 80 38">
            <defs>
              <linearGradient id="zla-g-m" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#00d2c8"/>
                <stop offset="50%"  stopColor="#7c6ef5"/>
                <stop offset="100%" stopColor="#00d2c8"/>
              </linearGradient>
            </defs>
            <path className={styles.infPath}
              d="M40,19 C40,19 34,7 24,7 C14,7 7,13 7,19 C7,25 14,31 24,31 C34,31 40,19 40,19 C40,19 46,7 56,7 C66,7 73,13 73,19 C73,25 66,31 56,31 C46,31 40,19 40,19 Z"
            />
          </svg>
          <span className={styles.logoText}>ZEROFY</span>
        </div>
      </div>
      <div className={styles.mobileBtmPill}>70+ Tools · 100% Free</div>
    </div>
  )
}

export default function ZerofyLogoAnimation() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const connSvgRef   = useRef(null)
  const particleRef  = useRef(null)
  const logoInnerRef = useRef(null)
  const fInputRef    = useRef(null)
  const fOutputRef   = useRef(null)
  const fInIconRef   = useRef(null)
  const fInLabelRef  = useRef(null)
  const fInValueRef  = useRef(null)
  const fInTagRef    = useRef(null)
  const fOutIconRef  = useRef(null)
  const fOutLabelRef = useRef(null)
  const fOutValueRef = useRef(null)
  const fOutTagRef   = useRef(null)
  const fInBubRef    = useRef(null)
  const fOutBubRef   = useRef(null)
  const toolStripRef = useRef(null)
  const sNameRef     = useRef(null)
  const sCatRef      = useRef(null)
  const sIconRef     = useRef(null)
  const animRef      = useRef(null)
  const idxRef       = useRef(0)

  useEffect(() => {
    if (isMobile) return // don't run animation on mobile

    const SW = 640, SH = 420
    const CX = SW/2, CY = SH/2
    const IX = 95,      IY = CY
    const OX = SW - 95, OY = CY

    const easeInOut = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2
    const easeOut   = t => 1-(1-t)*(1-t)
    const bezier    = (t,p0x,p0y,p1x,p1y,p2x,p2y) => ({
      x:(1-t)**2*p0x+2*(1-t)*t*p1x+t**2*p2x,
      y:(1-t)**2*p0y+2*(1-t)*t*p1y+t**2*p2y,
    })

    function drawConnector(color, progress) {
      const svg = connSvgRef.current; if(!svg) return
      svg.innerHTML = ''
      const mx=CX, my=CY-60
      if(progress<=0) return
      const ns = 'http://www.w3.org/2000/svg'
      const D  = `M${IX},${IY} Q${mx},${my} ${OX},${OY}`

      const base = document.createElementNS(ns,'path')
      base.setAttribute('d',D); base.setAttribute('fill','none')
      base.setAttribute('stroke','rgba(255,255,255,0.06)'); base.setAttribute('stroke-width','1.5')
      base.setAttribute('stroke-dasharray','5 5'); svg.appendChild(base)

      const full = document.createElementNS(ns,'path')
      full.setAttribute('d',D); full.setAttribute('fill','none')
      full.setAttribute('stroke',color); full.setAttribute('stroke-width','2')
      full.setAttribute('stroke-linecap','round'); full.setAttribute('opacity','0.8')
      const L=350; full.setAttribute('stroke-dasharray',`${L*progress} ${L}`)
      full.setAttribute('filter',`drop-shadow(0 0 6px ${color})`); svg.appendChild(full)

      if(progress>0.92){
        const c=document.createElementNS(ns,'circle')
        c.setAttribute('cx',String(OX-30)); c.setAttribute('cy',String(OY)); c.setAttribute('r','4')
        c.setAttribute('fill',color); c.setAttribute('opacity',String(Math.min(1,(progress-0.92)/0.08)))
        svg.appendChild(c)
      }
    }

    function animateStory(story) {
      const set = (ref,val) => { if(ref.current) ref.current.textContent=val }
      set(fInIconRef, story.inIcon); set(fInLabelRef, story.inLabel)
      set(fInValueRef, story.inValue); set(fInTagRef, story.inTag)
      set(fOutIconRef, story.outIcon); set(fOutLabelRef, story.outLabel)
      set(fOutValueRef, story.outValue); set(fOutTagRef, story.outTag)
      set(sIconRef, story.icon); set(sNameRef, story.name); set(sCatRef, story.cat)
      if(particleRef.current){
        particleRef.current.style.background = story.particle
        particleRef.current.style.boxShadow  = `0 0 12px ${story.particle},0 0 24px ${story.particle}`
      }
      if(fInBubRef.current)  fInBubRef.current.style.borderColor  = story.color+'33'
      if(fOutBubRef.current) fOutBubRef.current.style.borderColor = story.color+'33'

      const TOTAL=4200, start=performance.now()

      function tick(now){
        const t=Math.min((now-start)/TOTAL,1)

        const p1=Math.min(t/0.12,1)
        if(fInputRef.current){
          fInputRef.current.style.opacity  =easeOut(p1)
          fInputRef.current.style.transform=`translateY(calc(-50% + ${(1-easeOut(p1))*14}px))`
        }
        if(toolStripRef.current) toolStripRef.current.style.opacity=easeOut(p1)

        const p2=Math.max(0,Math.min((t-0.12)/0.43,1))
        drawConnector(story.color, easeInOut(p2))
        if(p2>0&&p2<1){
          const pt=bezier(easeInOut(p2),IX,IY,CX,CY-60,OX,OY)
          if(particleRef.current){
            particleRef.current.style.left   =pt.x+'px'
            particleRef.current.style.top    =pt.y+'px'
            particleRef.current.style.opacity=Math.sin(easeInOut(p2)*Math.PI)
          }
          if(logoInnerRef.current){
            const d=Math.abs(pt.x-CX)
            logoInnerRef.current.style.boxShadow = d<40
              ? `0 0 ${60+(40-d)*2}px ${story.color}44` : ''
          }
        } else if(particleRef.current) particleRef.current.style.opacity='0'

        const p3=Math.max(0,Math.min((t-0.5)/0.15,1))
        if(fOutputRef.current){
          fOutputRef.current.style.opacity  =easeOut(p3)
          fOutputRef.current.style.transform=`translateY(calc(-50% + ${(1-easeOut(p3))*14}px))`
        }

        if(t>0.82){
          const f=1-(t-0.82)/0.18
          if(fInputRef.current)   fInputRef.current.style.opacity  =f
          if(fOutputRef.current)  fOutputRef.current.style.opacity =f
          if(toolStripRef.current) toolStripRef.current.style.opacity=f
          if(connSvgRef.current)  connSvgRef.current.style.opacity =f
        } else if(connSvgRef.current) connSvgRef.current.style.opacity='1'

        if(t<1){
          animRef.current=requestAnimationFrame(tick)
        } else {
          if(fInputRef.current)   fInputRef.current.style.opacity  ='0'
          if(fOutputRef.current)  fOutputRef.current.style.opacity ='0'
          if(toolStripRef.current) toolStripRef.current.style.opacity='0'
          if(connSvgRef.current)  { connSvgRef.current.innerHTML=''; connSvgRef.current.style.opacity='1' }
          if(particleRef.current) particleRef.current.style.opacity='0'
          if(logoInnerRef.current) logoInnerRef.current.style.boxShadow=''
          idxRef.current=(idxRef.current+1)%stories.length
          setTimeout(()=>animateStory(stories[idxRef.current]),300)
        }
      }
      animRef.current=requestAnimationFrame(tick)
    }

    const t=setTimeout(()=>animateStory(stories[0]),800)
    return ()=>{ clearTimeout(t); if(animRef.current) cancelAnimationFrame(animRef.current) }
  },[isMobile])

  const or1Dots = [...Array(5)].map((_,i)=>{ const a=(i/5)*Math.PI*2,r=85,s=3.5; return {x:Math.cos(a)*r-s/2,y:Math.sin(a)*r-s/2,s,c:'rgba(0,210,200,0.4)'} })
  const or2Dots = [...Array(8)].map((_,i)=>{ const a=(i/8)*Math.PI*2,r=125,s=2.5; return {x:Math.cos(a)*r-s/2,y:Math.sin(a)*r-s/2,s,c:'rgba(124,110,245,0.35)'} })

  // Mobile: show only the clean logo
  if (isMobile) return <MobileLogo />

  // Desktop: full animation
  return (
    <div className={styles.stage}>

      <div className={`${styles.orbitRing} ${styles.or1}`}>
        {or1Dots.map((d,i)=>(
          <div key={i} className={styles.orbitDot} style={{width:d.s,height:d.s,background:d.c,marginLeft:d.x,marginTop:d.y}}/>
        ))}
      </div>

      <div className={`${styles.orbitRing} ${styles.or2}`}>
        {or2Dots.map((d,i)=>(
          <div key={i} className={styles.orbitDot} style={{width:d.s,height:d.s,background:d.c,marginLeft:d.x,marginTop:d.y}}/>
        ))}
      </div>

      <svg ref={connSvgRef} className={styles.connSvg} viewBox="0 0 640 420" preserveAspectRatio="xMidYMid meet"/>

      <div className={styles.fInput} ref={fInputRef}>
        <div className={styles.fBubble} ref={fInBubRef}>
          <div className={styles.fIcon}  ref={fInIconRef}>🖼️</div>
          <div className={styles.fLabel} ref={fInLabelRef}>IMAGE</div>
          <div className={styles.fValue} ref={fInValueRef}>photo.jpg</div>
        </div>
        <div className={styles.fTag} ref={fInTagRef}>DROP FILE</div>
      </div>

      <div className={styles.fOutput} ref={fOutputRef}>
        <div className={styles.fBubble} ref={fOutBubRef}>
          <div className={styles.fIcon}  ref={fOutIconRef}>📑</div>
          <div className={styles.fLabel} ref={fOutLabelRef}>PDF</div>
          <div className={styles.fValue} ref={fOutValueRef}>document.pdf</div>
        </div>
        <div className={styles.fTag} ref={fOutTagRef}>READY ✓</div>
      </div>

      <div className={styles.toolStrip} ref={toolStripRef}>
        <span className={styles.stripIcon} ref={sIconRef}>📑</span>
        <span className={styles.stripName} ref={sNameRef}>Image → PDF</span>
        <span className={styles.stripCat}  ref={sCatRef}>PDF</span>
      </div>

      <div className={styles.particle} ref={particleRef}/>

      <div className={styles.logoWrap}>
        <div className={styles.logoCircle}>
          <div className={styles.logoInner} ref={logoInnerRef}>
            <svg className={styles.infSvg} viewBox="0 0 80 38">
              <defs>
                <linearGradient id="zla-g" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#00d2c8"/>
                  <stop offset="50%"  stopColor="#7c6ef5"/>
                  <stop offset="100%" stopColor="#00d2c8"/>
                </linearGradient>
              </defs>
              <path className={styles.infPath}
                d="M40,19 C40,19 34,7 24,7 C14,7 7,13 7,19 C7,25 14,31 24,31 C34,31 40,19 40,19 C40,19 46,7 56,7 C66,7 73,13 73,19 C73,25 66,31 56,31 C46,31 40,19 40,19 Z"
              />
            </svg>
            <span className={styles.logoText}>ZEROFY</span>
          </div>
        </div>
      </div>

      <div className={styles.btmPill}>70+ Tools · 100% Free</div>
    </div>
  )
}
