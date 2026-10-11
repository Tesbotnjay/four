'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './JurnCat.module.css'
import CatData from '@/lib/pixel-cat/CatData'
import drawCat from '@/lib/pixel-cat/drawCat'

const APPEARANCES = [
  {
    pelt_name: 'Agouti',
    pelt_color: 'LILAC',
    eye_colour: 'GREY',
    eye_colour2: null,
    reverse: true,
    white_patches: 'MIA',
    vitiligo: 'KARPATI',
    points: null,
    white_patches_tint: 'gray',
    tortie_marking: null,
    tortie_base: null,
    tortie_pattern: null,
    tortie_color: null,
    skin: 'BLUE',
    tint: 'orange',
    scars: [],
    accessory: ['BOW_pink'],
  }
]

const SCALE = 3 // floating mascot size
const CAT_SPRITE = 7 // adolescent_short0 pose (index 7 dalam pose_sprite_data.json)

export default function JurnCat({ appearanceIndex = 0, interactive = true }) {
  const canvasRef = useRef(null)
  const animId = useRef(null)
  const catData = useRef(null)
  const [activeIndex, setActiveIndex] = useState(appearanceIndex)
  const appearances = APPEARANCES
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const offscreenRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const render = async () => {
      try {
        const cat = CatData.fromJSONData(appearances[activeIndex])
        const offscreen = new OffscreenCanvas(50, 50)

        await drawCat(
          offscreen,
          cat.pelt,
          CAT_SPRITE,
          false,
          undefined,
          true,
          false,
        )

        if (cancelled) return
        offscreenRef.current = offscreen
        setLoading(false)

        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = 50 * SCALE * dpr
        canvas.height = 50 * SCALE * dpr
        canvas.style.width = `${50 * SCALE}px`
        canvas.style.height = `${50 * SCALE}px`

        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, 50 * SCALE, 50 * SCALE)
        ctx.drawImage(offscreen, 0, 0, 50 * SCALE, 50 * SCALE)
      } catch (err) {
        console.error('Failed to render cat:', err)
        if (!cancelled) {
          setError('Gagal memuat maskot')
          setLoading(false)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [activeIndex, appearances])

  useEffect(() => {
    if (loading || error || !offscreenRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    const animate = (now) => {
      const bob = Math.round(Math.sin(now / 330) * 3)
      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, 50 * SCALE, 50 * SCALE)
      ctx.drawImage(offscreenRef.current, 0, bob, 50 * SCALE, 50 * SCALE)
      ctx.restore()
      animId.current = requestAnimationFrame(animate)
    }
    animId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId.current)
  }, [loading, error])

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % appearances.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + appearances.length) % appearances.length)
  }

  const current = appearances[activeIndex]

  return (
    <aside className={styles.container} aria-label="Maskot JurnFourteen">
      <div className={styles.bubble}>standby!</div>
      <div className={styles.canvasWrapper} onClick={interactive ? handleNext : undefined} title="Maskot JurnFourteen standby">
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={`Pixel cat ${current.pelt_name} ${current.pelt_color}`}
        />
        {loading && <div className={styles.loader}>Memuat...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </aside>
  )
}
