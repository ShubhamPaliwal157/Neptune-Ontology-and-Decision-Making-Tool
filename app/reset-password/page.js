'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function Stars() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const stars = Array.from({ length: 260 }, () => ({
      x:Math.random()*canvas.width,y:Math.random()*canvas.height,
      r:Math.random()*1.1+0.2,a:Math.random()*0.4+0.08,
      s:Math.random()*0.007+0.002,p:Math.random()*Math.PI*2,
    }))
    let t=0,frame
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height)
      ctx.fillStyle='#03050c';ctx.fillRect(0,0,canvas.width,canvas.height)
      stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(200,220,255,${Math.max(0,s.a+Math.sin(t*s.s+s.p)*0.12)})`;ctx.fill()})
      t++;frame=requestAnimationFrame(draw)
    }
    draw();return()=>cancelAnimationFrame(frame)
  },[])
  return <canvas ref={ref} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('PASSWORDS DO NOT MATCH'); return }
    if (password.length < 8)  { setError('MINIMUM 8 CHARACTERS'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message.toUpperCase()); setLoading(false) }
    else { setDone(true); setTimeout(() => router.push('/login'), 2500) }
  }

  const card = { position:'relative',zIndex:1,width:400,background:'linear-gradient(160deg,rgba(11,18,40,0.96),rgba(7,11,28,0.96))',border:'1px solid rgba(58,110,200,0.16)',borderTop:'2px solid rgba(61,123,212,0.55)',padding:'44px 44px 40px',backdropFilter:'blur(20px)',animation:'modal-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }
  const inp = { width:'100%',background:'rgba(8,13,31,0.8)',border:'1px solid rgba(58,110,200,0.2)',borderRadius:2,color:'#ddeeff',fontSize:12,padding:'11px 14px',outline:'none',fontFamily:'var(--font-mono)',transition:'border-color 0.2s' }

  return (
    <div style={{width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#03050c',fontFamily:'var(--font-mono)',position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={card}>
        <div style={{marginBottom:32,textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:38,letterSpacing:10,color:'#c8e4ff',lineHeight:1,marginBottom:5}}>NEPTUNE</div>
          <div style={{fontSize:8,letterSpacing:4,color:'#3d7bd4'}}>SET NEW PASSWORD</div>
        </div>
        <div style={{height:1,marginBottom:28,background:'linear-gradient(90deg,transparent,rgba(61,123,212,0.4),transparent)'}}/>
        {done ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:24,color:'#2a9e58',marginBottom:12}}>◈</div>
            <div style={{fontSize:10,color:'#7a9fbe',lineHeight:1.8}}>Password updated. Redirecting to login...</div>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:8,letterSpacing:2,color:'#3a5878',display:'block',marginBottom:6}}>NEW PASSWORD</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters" style={inp}
                onFocus={e=>e.target.style.borderColor='rgba(61,123,212,0.55)'} onBlur={e=>e.target.style.borderColor='rgba(58,110,200,0.2)'}/>
            </div>
            <div>
              <label style={{fontSize:8,letterSpacing:2,color:'#3a5878',display:'block',marginBottom:6}}>CONFIRM PASSWORD</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Repeat password" style={inp}
                onFocus={e=>e.target.style.borderColor='rgba(61,123,212,0.55)'} onBlur={e=>e.target.style.borderColor='rgba(58,110,200,0.2)'}/>
            </div>
            {error && <div style={{fontSize:9,color:'#c94040',letterSpacing:1,padding:'8px 12px',background:'rgba(201,64,64,0.08)',border:'1px solid rgba(201,64,64,0.2)'}}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={{width:'100%',marginTop:6,padding:'13px',background:'transparent',border:'1px solid rgba(100,160,240,0.35)',color:'#c8e4ff',fontSize:10,fontWeight:600,letterSpacing:4,transition:'all 0.2s',fontFamily:'var(--font-mono)',opacity:loading?0.7:1}}
              onMouseEnter={e=>{if(!loading)e.currentTarget.style.background='rgba(61,123,212,0.1)'}}
              onMouseLeave={e=>{if(!loading)e.currentTarget.style.background='transparent'}}
            >{loading?'UPDATING...':'UPDATE PASSWORD →'}</button>
          </form>
        )}
      </div>
    </div>
  )
}