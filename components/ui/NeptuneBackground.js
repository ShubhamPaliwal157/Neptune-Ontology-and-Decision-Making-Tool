'use client'

export default function NeptuneBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.35,
        }}
      >
        <source src="/videos/neptune-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay so the modal card stays readable over the video */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(3,5,14,0.72) 0%, rgba(3,5,14,0.40) 50%, rgba(3,5,14,0.55) 100%)',
      }} />
    </div>
  )
}