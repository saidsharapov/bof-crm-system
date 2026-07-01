import { useEffect, useRef, memo } from 'react'
import { useThemeStore } from '@/store/themeStore'

// Isolated perpetual animation — never causes parent re-renders
const AnimatedBackground = memo(function AnimatedBackground() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const isDarkRef  = useRef(useThemeStore.getState().theme === 'dark')

  // Keep ref in sync without re-mounting the canvas effect
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => { isDarkRef.current = theme === 'dark' }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0

    function resize() {
      if (!canvas) return
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Orbs — speed is radians/frame (60fps → full cycle ≈ speed * 60 / 2π sec)
    // speed 0.008 → ~13 s/cycle; 0.012 → ~9 s/cycle
    const orbs = [
      { x: 0.15, y: 0.25, r: 0.38, color: [70, 80, 220],  speed: 0.008, phase: 0    },
      { x: 0.82, y: 0.70, r: 0.32, color: [40, 50, 180],  speed: 0.006, phase: 1.2  },
      { x: 0.50, y: 0.85, r: 0.25, color: [90, 60, 200],  speed: 0.010, phase: 2.4  },
      { x: 0.78, y: 0.18, r: 0.20, color: [50, 90, 240],  speed: 0.007, phase: 0.8  },
    ]

    let t = 0

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      // Base background — reads current theme via ref (no re-mount needed)
      ctx.fillStyle = isDarkRef.current ? '#0a0a14' : '#eef0fa'
      ctx.fillRect(0, 0, W, H)

      orbs.forEach((orb) => {
        const ox = (orb.x + Math.sin(t * orb.speed + orb.phase) * 0.08) * W
        const oy = (orb.y + Math.cos(t * orb.speed * 0.8  + orb.phase) * 0.06) * H
        const radius = orb.r * Math.min(W, H)

        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius)
        const [r, g, b] = orb.color
        grad.addColorStop(0,   `rgba(${r},${g},${b},0.22)`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.07)`)
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(ox, oy, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      t++
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
})

export default AnimatedBackground
