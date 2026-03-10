'use client'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

// Reusable auth guard — import this in any protected page
export function withAuth(Component) {
  return function ProtectedPage(props) {
    const { user, loading } = useAuth()
    useEffect(() => {
      if (!loading && !user) {
        window.location.replace('/login?next=' + window.location.pathname)
      }
    }, [user, loading])
    if (loading || !user) return (
      <div style={{ width:'100vw',height:'100vh',background:'#03050c',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)' }}>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:28,letterSpacing:8,color:'#3d7bd4' }}>NEPTUNE</div>
          <div style={{ display:'flex',gap:5 }}>
            {[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:'50%',background:'#3d7bd4',animation:`pulse-dot 0.8s ${i*0.18}s infinite` }}/>)}
          </div>
        </div>
      </div>
    )
    return <Component {...props} />
  }
}

export { default } from '@/app/dashboard/home'