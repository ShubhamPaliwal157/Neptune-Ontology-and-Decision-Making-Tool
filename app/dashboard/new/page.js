'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/app/dashboard/withAuth'
import Link from 'next/link'

const DOMAINS = [
  { id: 'geopolitics', label: 'Geopolitics',  color: '#c94040', icon: '🌍' },
  { id: 'economics',   label: 'Economics',    color: '#c87c3a', icon: '📈' },
  { id: 'defense',     label: 'Defense',      color: '#b85a30', icon: '🛡' },
  { id: 'technology',  label: 'Technology',   color: '#3d7bd4', icon: '⚡' },
  { id: 'climate',     label: 'Climate',      color: '#2a9e58', icon: '🌱' },
  { id: 'society',     label: 'Society',      color: '#7050b8', icon: '◎' },
]

const STEPS_PERSONAL = ['BASICS', 'DOMAINS', 'SOURCES', 'STORAGE', 'REVIEW']
const STEPS_COLLABORATIVE = ['BASICS', 'MEMBERS', 'DOMAINS', 'SOURCES', 'STORAGE', 'REVIEW']

function StepIndicator({ current, isCollaborative }) {
  const STEPS = isCollaborative ? STEPS_COLLABORATIVE : STEPS_PERSONAL
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
      {STEPS.map((step, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                border: `2px solid ${done ? '#2a9e58' : active ? '#3d7bd4' : 'rgba(58,110,200,0.2)'}`,
                background: done ? 'rgba(42,158,88,0.15)' : active ? 'rgba(61,123,212,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: done ? '#2a9e58' : active ? '#7aaeee' : '#4a6b8a',
                fontWeight: 600, transition: 'all 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, letterSpacing: 2,
                color: active ? '#7aaeee' : done ? '#2a9e58' : '#4a6b8a',
              }}>{step}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 80, height: 1, margin: '0 8px', marginBottom: 24,
                background: i < current ? 'rgba(42,158,88,0.4)' : 'rgba(58,110,200,0.15)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepBasics({ data, onChange }) {
  const inp = {
    width: '100%', background: 'rgba(8,13,31,0.8)',
    border: '1px solid rgba(58,110,200,0.25)', borderRadius: 2,
    color: '#ddeeff', fontSize: 15, padding: '13px 16px',
    outline: 'none', fontFamily: 'var(--font-mono)', transition: 'border-color 0.2s',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>NAME YOUR WORKSPACE</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.6 }}>Give it a clear, memorable name. This is what you and collaborators will use to identify it.</div>
      </div>
      <div>
        <label style={{ fontSize: 12, letterSpacing: 2, color: '#6a9aba', display: 'block', marginBottom: 8 }}>WORKSPACE NAME *</label>
        <input type="text" value={data.name} onChange={e => onChange({ ...data, name: e.target.value })}
          placeholder="e.g. India Geopolitical Monitor, Climate Risk Q4..."
          maxLength={60} style={inp}
          onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.6)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.25)'}
        />
        <div style={{ fontSize: 11, color: '#4a6b8a', marginTop: 6, textAlign: 'right' }}>{data.name.length}/60</div>
      </div>
      <div>
        <label style={{ fontSize: 12, letterSpacing: 2, color: '#6a9aba', display: 'block', marginBottom: 8 }}>DESCRIPTION</label>
        <textarea value={data.description} onChange={e => onChange({ ...data, description: e.target.value })}
          placeholder="What decisions will this workspace help with? What's the context?"
          rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = 'rgba(61,123,212,0.6)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.25)'}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, letterSpacing: 2, color: '#6a9aba', display: 'block', marginBottom: 12 }}>COLLABORATION</label>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { val: false, label: 'Personal',       sub: 'Only you have access',            icon: '○' },
            { val: true,  label: 'Collaborative',  sub: 'Invite others to work together',  icon: '◈' },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => onChange({ ...data, isCollaborative: opt.val })} style={{
              flex: 1, padding: '18px',
              background: data.isCollaborative === opt.val ? 'rgba(61,123,212,0.12)' : 'rgba(8,13,31,0.6)',
              border: `1px solid ${data.isCollaborative === opt.val ? 'rgba(61,123,212,0.5)' : 'rgba(58,110,200,0.2)'}`,
              color: data.isCollaborative === opt.val ? '#7aaeee' : '#6a9aba',
              textAlign: 'left', fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: 'pointer',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{opt.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{opt.label}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepMembers({ data, onChange }) {
  const [inviteMethod, setInviteMethod] = useState(data.inviteMethod || null)
  const [memberCount, setMemberCount] = useState(data.memberCount || 2)
  const [customCount, setCustomCount] = useState('')
  const [members, setMembers] = useState(data.members || [])
  const [inviteLink, setInviteLink] = useState(data.inviteLink || '')
  
  const updateData = (updates) => {
    onChange({ ...data, ...updates })
  }

  const selectMethod = (method) => {
    setInviteMethod(method)
    updateData({ inviteMethod: method })
  }

  const selectCount = (count) => {
    setMemberCount(count)
    const newMembers = Array(count).fill(null).map((_, i) => 
      members[i] || { email: '', role: 'viewer' }
    )
    setMembers(newMembers)
    updateData({ memberCount: count, members: newMembers })
  }

  const updateMember = (index, field, value) => {
    const newMembers = [...members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setMembers(newMembers)
    updateData({ members: newMembers })
  }

  const generateInviteLink = () => {
    // Generate temporary link (will be replaced with real workspace ID after creation)
    const link = `${window.location.origin}/workspace/invite/pending`
    setInviteLink(link)
    updateData({ inviteLink: link })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>ADD MEMBERS</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.6 }}>Choose how you want to invite collaborators to this workspace.</div>
      </div>

      {/* Method Selection */}
      {!inviteMethod && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => selectMethod('link')} style={{
            flex: 1, padding: '22px 20px', textAlign: 'left',
            background: 'rgba(8,13,31,0.6)',
            border: '1px solid rgba(58,110,200,0.2)',
            color: '#ddeeff', fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'}
          >
            <div style={{ fontSize: 20, marginBottom: 10 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Invite via Link</div>
            <div style={{ fontSize: 12, color: '#6a9aba', lineHeight: 1.5 }}>
              Generate a shareable link. Anyone with the link can join as a viewer.
            </div>
          </button>

          <button onClick={() => selectMethod('manual')} style={{
            flex: 1, padding: '22px 20px', textAlign: 'left',
            background: 'rgba(8,13,31,0.6)',
            border: '1px solid rgba(58,110,200,0.2)',
            color: '#ddeeff', fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'}
          >
            <div style={{ fontSize: 20, marginBottom: 10 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Add Members Manually</div>
            <div style={{ fontSize: 12, color: '#6a9aba', lineHeight: 1.5 }}>
              Enter email addresses and assign roles (editor or viewer).
            </div>
          </button>
        </div>
      )}

      {/* Invite Link Method */}
      {inviteMethod === 'link' && (
        <div style={{ padding: '20px', border: '1px solid rgba(61,123,212,0.2)', background: 'rgba(61,123,212,0.04)' }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: '#7aaeee', marginBottom: 12 }}>INVITE LINK</div>
          <div style={{ fontSize: 12, color: '#6a9aba', marginBottom: 14, lineHeight: 1.6 }}>
            Share this link with anyone you want to invite. They'll be added as viewers and can be upgraded to editors later.
          </div>
          
          {!inviteLink ? (
            <button onClick={generateInviteLink} style={{
              padding: '10px 18px', background: 'rgba(61,123,212,0.12)',
              border: '1px solid rgba(61,123,212,0.5)', color: '#7aaeee',
              fontSize: 13, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,123,212,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(61,123,212,0.12)'}
            >
              Generate Invite Link
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  style={{
                    flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(58,110,200,0.25)', color: '#ddeeff',
                    fontSize: 12, fontFamily: 'var(--font-mono)',
                  }}
                />
                <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{
                  padding: '10px 18px', background: 'rgba(42,158,88,0.12)',
                  border: '1px solid rgba(42,158,88,0.5)', color: '#2a9e58',
                  fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                }}>
                  Copy
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#4a6b8a' }}>
                ℹ️ Link will be activated after workspace creation
              </div>
            </div>
          )}
          
          <button onClick={() => selectMethod(null)} style={{
            marginTop: 14, padding: '8px 14px', background: 'transparent',
            border: '1px solid rgba(58,110,200,0.2)', color: '#6a9aba',
            fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}>
            ← Change Method
          </button>
        </div>
      )}

      {/* Manual Method - Member Count */}
      {inviteMethod === 'manual' && members.length === 0 && (
        <div style={{ padding: '20px', border: '1px solid rgba(61,123,212,0.2)', background: 'rgba(61,123,212,0.04)' }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: '#7aaeee', marginBottom: 12 }}>HOW MANY MEMBERS?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            {[1, 2, 3, 4].map(count => (
              <button key={count} onClick={() => selectCount(count)} style={{
                padding: '14px', background: 'rgba(8,13,31,0.6)',
                border: '1px solid rgba(58,110,200,0.2)', color: '#ddeeff',
                fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(61,123,212,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'}
              >
                {count}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              type="number" 
              min="1" 
              max="20"
              placeholder="Custom..."
              value={customCount}
              onChange={e => setCustomCount(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', background: 'rgba(8,13,31,0.8)',
                border: '1px solid rgba(58,110,200,0.25)', color: '#ddeeff',
                fontSize: 13, fontFamily: 'var(--font-mono)',
              }}
            />
            <button onClick={() => customCount && selectCount(parseInt(customCount))} style={{
              padding: '10px 18px', background: 'rgba(61,123,212,0.12)',
              border: '1px solid rgba(61,123,212,0.5)', color: '#7aaeee',
              fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>
              Set
            </button>
          </div>
          
          <button onClick={() => selectMethod(null)} style={{
            marginTop: 14, padding: '8px 14px', background: 'transparent',
            border: '1px solid rgba(58,110,200,0.2)', color: '#6a9aba',
            fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}>
            ← Change Method
          </button>
        </div>
      )}

      {/* Manual Method - Member Details */}
      {inviteMethod === 'manual' && members.length > 0 && (
        <div style={{ padding: '20px', border: '1px solid rgba(61,123,212,0.2)', background: 'rgba(61,123,212,0.04)' }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: '#7aaeee', marginBottom: 12 }}>MEMBER DETAILS</div>
          <div style={{ fontSize: 12, color: '#6a9aba', marginBottom: 14, lineHeight: 1.6 }}>
            Enter email addresses (must match Google auth). You'll be added as owner automatically.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map((member, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#4a6b8a', width: 30 }}>{i + 1}.</span>
                <input 
                  type="email"
                  placeholder="email@example.com"
                  value={member.email}
                  onChange={e => updateMember(i, 'email', e.target.value)}
                  style={{
                    flex: 1, padding: '10px 12px', background: 'rgba(8,13,31,0.8)',
                    border: '1px solid rgba(58,110,200,0.25)', color: '#ddeeff',
                    fontSize: 13, fontFamily: 'var(--font-mono)',
                  }}
                />
                <select 
                  value={member.role}
                  onChange={e => updateMember(i, 'role', e.target.value)}
                  style={{
                    padding: '10px 12px', background: 'rgba(8,13,31,0.8)',
                    border: '1px solid rgba(58,110,200,0.25)', color: '#ddeeff',
                    fontSize: 13, fontFamily: 'var(--font-mono)',
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => selectCount(members.length + 1)} style={{
              padding: '8px 14px', background: 'rgba(42,158,88,0.12)',
              border: '1px solid rgba(42,158,88,0.5)', color: '#2a9e58',
              fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>
              + Add Another
            </button>
            <button onClick={() => { setMembers([]); updateData({ members: [], memberCount: 0 }) }} style={{
              padding: '8px 14px', background: 'transparent',
              border: '1px solid rgba(58,110,200,0.2)', color: '#6a9aba',
              fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}>
              ← Change Count
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDomains({ data, onChange }) {
  const toggle = id => {
    const next = (data.domains || []).includes(id)
      ? (data.domains || []).filter(d => d !== id)
      : [...(data.domains || []), id]
    onChange({ ...data, domains: next })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>SELECT DOMAINS</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.6 }}>Choose the intelligence domains relevant to your workspace. This shapes how data is categorised and analysed.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {DOMAINS.map(d => {
          const active = (data.domains || []).includes(d.id)
          return (
            <button key={d.id} onClick={() => toggle(d.id)} style={{
              padding: '22px 18px',
              background: active ? `${d.color}18` : 'rgba(8,13,31,0.6)',
              border: `1px solid ${active ? d.color + '66' : 'rgba(58,110,200,0.2)'}`,
              borderTop: `2px solid ${active ? d.color : 'rgba(58,110,200,0.15)'}`,
              color: active ? d.color : '#6a9aba',
              textAlign: 'left', fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = d.color + '44' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)' }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{d.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>{d.label}</div>
              {active && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>✓ Selected</div>}
            </button>
          )
        })}
      </div>
      {(data.domains || []).length === 0 && (
        <div style={{ fontSize: 13, color: '#c87c3a', letterSpacing: 1 }}>⚠ Select at least one domain to continue</div>
      )}
    </div>
  )
}

// ── These must be defined outside StepSources to prevent remount on every render ──
function SourceTagList({ items, onRemove, color }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {(items || []).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: `${color}12`, border: `1px solid ${color}33`, fontSize: 13, color }}>
          <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color, fontSize: 16, padding: 0, lineHeight: 1, cursor: 'pointer', opacity: 0.6 }}>×</button>
        </div>
      ))}
    </div>
  )
}

function SourceAddRow({ placeholder, value, onChange, onAdd, color }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder={placeholder} style={{ flex: 1, background: 'rgba(8,13,31,0.8)', border: '1px solid rgba(58,110,200,0.25)', borderRadius: 2, color: '#ddeeff', fontSize: 13, padding: '11px 14px', outline: 'none', fontFamily: 'var(--font-mono)' }}
        onFocus={e => e.target.style.borderColor = `${color}88`}
        onBlur={e  => e.target.style.borderColor = 'rgba(58,110,200,0.25)'}
      />
      <button onClick={onAdd} style={{ padding: '11px 18px', background: 'transparent', border: `1px solid ${color}44`, color, fontSize: 18, fontFamily: 'var(--font-mono)', transition: 'all 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >+</button>
    </div>
  )
}

function SourceSection({ title, sub, color, children }) {
  return (
    <div style={{ padding: '20px', border: '1px solid rgba(58,110,200,0.15)', background: 'rgba(8,13,31,0.4)' }}>
      <div style={{ fontSize: 13, letterSpacing: 2, color, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#4a6b8a', marginBottom: 14, lineHeight: 1.6 }}>{sub}</div>
      {children}
    </div>
  )
}

function StepSources({ data, onChange }) {
  const [newStatic,  setNewStatic]  = useState('')
  const [newDynamic, setNewDynamic] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const addItem    = (field, val, setter) => { if (!val.trim()) return; onChange({ ...data, [field]: [...(data[field] || []), val.trim()] }); setter('') }
  const removeItem = (field, idx) => onChange({ ...data, [field]: (data[field] || []).filter((_, i) => i !== idx) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>ADD DATA SOURCES</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.6 }}>You can always add or edit sources later. Start with what you have — even just a few keywords works.</div>
      </div>
      <SourceSection title="STATIC SOURCES" sub="Wikipedia, news articles, PDFs, reports — anything that doesn't change frequently." color="#7aaeee">
        <SourceAddRow placeholder="https://en.wikipedia.org/wiki/... or any URL" value={newStatic} onChange={setNewStatic} onAdd={() => addItem('staticSources', newStatic, setNewStatic)} color="#7aaeee" />
        <SourceTagList items={data.staticSources} onRemove={idx => removeItem('staticSources', idx)} color="#7aaeee" />
      </SourceSection>
      <SourceSection title="DYNAMIC SOURCES" sub="Twitter/X profiles, RSS feeds, live news — sources that update regularly." color="#2a9e58">
        <SourceAddRow placeholder="https://x.com/username or any live page URL" value={newDynamic} onChange={setNewDynamic} onAdd={() => addItem('dynamicSources', newDynamic, setNewDynamic)} color="#2a9e58" />
        <SourceTagList items={data.dynamicSources} onRemove={idx => removeItem('dynamicSources', idx)} color="#2a9e58" />
      </SourceSection>
      <SourceSection title="KEYWORDS & TOPICS" sub='Key entities or terms to monitor — e.g. "India-China border", "semiconductor supply chain".' color="#c87c3a">
        <SourceAddRow placeholder="Type a keyword or topic and press Enter" value={newKeyword} onChange={setNewKeyword} onAdd={() => addItem('keywords', newKeyword, setNewKeyword)} color="#c87c3a" />
        <SourceTagList items={data.keywords} onRemove={idx => removeItem('keywords', idx)} color="#c87c3a" />
      </SourceSection>
    </div>
  )
}

function StepReview({ data }) {
  const selectedDomains = DOMAINS.filter(d => (data.domains || []).includes(d.id))
  const storageLabel = data.storageBackend === 'drive' ? 'Google Drive' : data.storageBackend === 'neptune' ? 'Neptune Servers' : '—'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>REVIEW & CREATE</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.6 }}>Everything looks good? Hit create — Neptune will begin processing your sources and building the graph.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { label: 'Name',            value: data.name || '—' },
          { label: 'Description',     value: data.description || '—' },
          { label: 'Type',            value: data.isCollaborative ? 'Collaborative' : 'Personal' },
          { label: 'Domains',         value: selectedDomains.map(d => d.label).join(', ') || '—' },
          { label: 'Static sources',  value: `${(data.staticSources  || []).length} added` },
          { label: 'Dynamic sources', value: `${(data.dynamicSources || []).length} added` },
          { label: 'Keywords',        value: `${(data.keywords       || []).length} added` },
          { label: 'Output storage',  value: storageLabel },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', gap: 16, padding: '14px 18px', background: 'rgba(8,13,31,0.5)', border: '1px solid rgba(58,110,200,0.1)' }}>
            <span style={{ fontSize: 12, letterSpacing: 1, color: '#4a6b8a', width: 150, flexShrink: 0 }}>{row.label.toUpperCase()}</span>
            <span style={{ fontSize: 14, color: row.label === 'Output storage' ? '#7aaeee' : '#c8e4ff' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 18px', background: 'rgba(42,158,88,0.05)', border: '1px solid rgba(42,158,88,0.18)', fontSize: 13, color: '#6a9aba', lineHeight: 1.7 }}>
        🗑 Raw input files are deleted after processing. Only <strong style={{ color: '#c8e4ff' }}>graph.json</strong> and <strong style={{ color: '#c8e4ff' }}>context.json</strong> are kept in your chosen storage.
      </div>
    </div>
  )
}

// ── Step 4: Storage ───────────────────────────────────────────────────────────
function StepStorage({ data, onChange, workspaceId, userId, driveConnected, driveError, onCreateWorkspace }) {
  const [creating, setCreating] = useState(false)

  const initiateOAuth = async () => {
    let wsId = workspaceId
    // If workspace not yet created, create it now before redirecting to Google
    if (!wsId) {
      setCreating(true)
      wsId = await onCreateWorkspace()
      setCreating(false)
      if (!wsId) return // creation failed, error shown by parent
    }
    const origin = window.location.origin
    const params = new URLSearchParams({
      client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri:  `${origin}/api/auth/google/callback`,
      response_type: 'code',
      scope:         'https://www.googleapis.com/auth/drive.file',
      access_type:   'offline',
      prompt:        'consent',
      state:         `${wsId}:${userId}`,
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  const OPTIONS = [
    {
      id: 'drive',
      title: 'Google Drive',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
      tagline: 'Your data, your Drive',
      bullets: [
        'Files saved to a Neptune folder in your Google Drive',
        'You own the data — delete your workspace, files stay',
        'Accessible outside Neptune anytime',
        'Requires one-time Google authorisation',
      ],
      color: '#4285F4',
      note: '🔒 Neptune requests drive.file only — it can never see your existing files.',
    },
    {
      id: 'neptune',
      title: 'Neptune Servers',
      icon: <span style={{ fontSize: 22, color: '#3d7bd4' }}>◈</span>,
      tagline: 'Simple, no setup needed',
      bullets: [
        'Files stored securely on Neptune\'s servers',
        'No third-party authorisation required',
        'Accessible instantly within Neptune',
        'Files are deleted if you delete the workspace',
      ],
      color: '#3d7bd4',
      note: '🗑 Raw input files are always deleted after processing on both options.',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', letterSpacing: 4, color: '#ddeeff', marginBottom: 8 }}>WHERE TO STORE YOUR DATA</div>
        <div style={{ fontSize: 14, color: '#6a9aba', lineHeight: 1.7 }}>
          After Neptune processes your sources it saves two output files — <strong style={{ color: '#c8e4ff' }}>graph.json</strong> (nodes + edges) and <strong style={{ color: '#c8e4ff' }}>context.json</strong> (links, summaries, source metadata). Choose where those live.
        </div>
      </div>

      {/* Choice cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {OPTIONS.map(opt => {
          const selected = data.storageBackend === opt.id
          return (
            <button key={opt.id} onClick={() => onChange({ ...data, storageBackend: opt.id })}
              style={{
                padding: '22px 20px', textAlign: 'left',
                background: selected ? `${opt.color}0f` : 'rgba(8,13,31,0.6)',
                border: `1px solid ${selected ? opt.color + '55' : 'rgba(58,110,200,0.18)'}`,
                borderTop: `2px solid ${selected ? opt.color : 'rgba(58,110,200,0.15)'}`,
                color: '#ddeeff', fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = opt.color + '33' }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(58,110,200,0.18)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {opt.icon}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: selected ? '#ddeeff' : '#c8e4ff' }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: selected ? opt.color : '#4a6b8a', marginTop: 1 }}>{opt.tagline}</div>
                </div>
                {selected && <span style={{ marginLeft: 'auto', fontSize: 16, color: opt.color }}>✓</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {opt.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6a9aba', lineHeight: 1.5 }}>
                    <span style={{ color: opt.color, flexShrink: 0 }}>·</span>
                    {b}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: '#4a6b8a', lineHeight: 1.5, borderTop: '1px solid rgba(58,110,200,0.1)', paddingTop: 12 }}>
                {opt.note}
              </div>
            </button>
          )
        })}
      </div>

      {/* Drive connect — only shown after Drive is selected */}
      {data.storageBackend === 'drive' && (
        <div style={{ padding: '20px', border: '1px solid rgba(66,133,244,0.2)', background: 'rgba(66,133,244,0.04)' }}>
          {driveConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, color: '#2a9e58' }}>✓</span>
              <div>
                <div style={{ fontSize: 14, color: '#2a9e58', fontWeight: 600, marginBottom: 2 }}>Google Drive Connected</div>
                <div style={{ fontSize: 13, color: '#6a9aba' }}>A Neptune folder has been created. Your output files will save there automatically.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {driveError && (
                <div style={{ padding: '10px 14px', background: 'rgba(201,64,64,0.08)', border: '1px solid rgba(201,64,64,0.25)', fontSize: 13, color: '#c94040' }}>
                  ⚠ {driveError} — try again or switch to Neptune servers.
                </div>
              )}
              <div style={{ fontSize: 13, color: '#6a9aba', lineHeight: 1.6 }}>
                Authorise Neptune to create files in your Drive. You'll be redirected to Google and back.
              </div>
              <button onClick={initiateOAuth} disabled={creating} style={{
                padding: '13px 22px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.18)', color: '#ddeeff',
                fontSize: 14, fontFamily: 'var(--font-mono)',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                cursor: creating ? 'default' : 'pointer', transition: 'all 0.2s', width: 'fit-content',
                opacity: creating ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!creating) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {creating ? 'Creating workspace...' : 'Authorise Google Drive'}
              </button>
            </div>
          )}
        </div>
      )}

      {!data.storageBackend && (
        <div style={{ fontSize: 13, color: '#c87c3a' }}>⚠ Choose a storage option to continue</div>
      )}
    </div>
  )
}

// ── Search params wrapper (Next.js 16 requires Suspense) ──────────────────────
function NewWorkspaceInner() {
  const { user }  = useAuth()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(() => {
    // After OAuth redirect, jump back to storage step (3)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('drive_connected') || params.get('drive_error')) return 3
    }
    return 0
  })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('workspace_id') || null
    }
    return null
  })
  const [formData, setFormData] = useState(() => {
    // Restore saved form data after OAuth redirect
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('neptune_new_ws')
      if (saved) return JSON.parse(saved)
    }
    return {
      name: '', description: '', isCollaborative: false,
      domains: [], staticSources: [], dynamicSources: [], keywords: [],
      storageBackend: '',
      // Collaboration fields
      inviteMethod: null, // 'link' or 'manual'
      inviteLink: '',
      memberCount: 0,
      members: [], // [{ email, role }]
    }
  })

  // Persist form data across OAuth redirect
  useEffect(() => {
    sessionStorage.setItem('neptune_new_ws', JSON.stringify(formData))
  }, [formData])
  const driveConnected = searchParams.get('drive_connected') === '1'
  const driveError     = searchParams.get('drive_error')

  const STEPS = formData.isCollaborative ? STEPS_COLLABORATIVE : STEPS_PERSONAL
  
  const getStepIndex = (stepName) => STEPS.indexOf(stepName)
  const getCurrentStepName = () => STEPS[step]

  const canNext = () => {
    const currentStepName = getCurrentStepName()
    if (currentStepName === 'BASICS') return formData.name.trim().length >= 2
    if (currentStepName === 'MEMBERS') {
      if (!formData.inviteMethod) return false
      if (formData.inviteMethod === 'manual') {
        return (formData.members || []).length > 0 && (formData.members || []).every(m => m?.email?.trim())
      }
      return true // Link method is always valid once selected
    }
    if (currentStepName === 'DOMAINS') return (formData.domains || []).length > 0
    if (currentStepName === 'STORAGE') return !!formData.storageBackend && (formData.storageBackend !== 'drive' || driveConnected)
    return true
  }

  // Creates workspace and returns its ID, or null on failure
  const createWorkspaceNow = async () => {
    if (workspaceId) return workspaceId // already created
    setSaving(true); setError('')
    const { data, error } = await supabase.from('workspaces').insert({
      owner_id: user.id, name: formData.name.trim(),
      description: formData.description.trim(),
      is_collaborative: formData.isCollaborative,
      domains: formData.domains,
      storage_backend: formData.storageBackend || 'drive',
      is_active: true, member_count: 1, node_count: 0, edge_count: 0,
    }).select().single()
    
    if (error) { 
      setSaving(false)
      setError(error.message)
      return null 
    }
    
    // Fallback: Ensure owner is added as member if trigger didn't fire
    const { data: memberCheck } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', data.id)
      .eq('user_id', user.id)
      .single()
    
    if (!memberCheck) {
      await supabase.from('workspace_members').insert({
        workspace_id: data.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
    }
    
    // Handle member invites if collaborative
    if (formData.isCollaborative && formData.inviteMethod === 'manual' && (formData.members || []).length > 0) {
      for (const member of formData.members || []) {
        if (member?.email?.trim()) {
          await fetch(`/api/workspace/${data.id}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              email: member.email.trim(),
              role: member.role || 'viewer',
            }),
          })
        }
      }
    }
    
    setSaving(false)
    setWorkspaceId(data.id)
    return data.id
  }

  // Clear saved form data once workspace is successfully created
  const handleContinueFromReview = async () => {
    const wsId = await createWorkspaceNow()
    if (!wsId) return

    // Save sources to DB
    await fetch('/api/process/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id:   wsId,
        user_id:        user.id,
        staticSources:  formData.staticSources,
        dynamicSources: formData.dynamicSources,
        keywords:       formData.keywords,
      }),
    })

    // Kick off processing pipeline
    await fetch('/api/process/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: wsId, user_id: user.id }),
    })

    sessionStorage.removeItem('neptune_new_ws')
    window.location.href = `/dashboard?processing=${wsId}`
  }

  const isLastStep   = step === STEPS.length - 1
  const isReviewStep = step === STEPS.length - 1

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#03050c', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <style>{`html, body { overflow: auto !important; height: auto !important; }`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid rgba(58,110,200,0.12)', background: 'rgba(3,5,12,0.75)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2558b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, color: '#c8e4ff', boxShadow: '0 0 10px rgba(61,123,212,0.4)' }}>N</div>
          <span style={{ fontSize: 13, letterSpacing: 3, color: '#7aaeee', fontWeight: 600 }}>NEPTUNE</span>
          <span style={{ color: '#3a5878', fontSize: 16 }}>/</span>
          <span style={{ fontSize: 13, color: '#6a9aba' }}>New Workspace</span>
        </div>
        {step < 4 && (
          <Link href="/dashboard" style={{ fontSize: 13, color: '#4a6b8a', textDecoration: 'none', letterSpacing: 1, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7aaeee'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a6b8a'}
          >← Back to Dashboard</Link>
        )}
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '52px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          <StepIndicator current={step} isCollaborative={formData.isCollaborative} />

          <div style={{ minHeight: 420 }}>
            {getCurrentStepName() === 'BASICS' && <StepBasics data={formData} onChange={setFormData} />}
            {getCurrentStepName() === 'MEMBERS' && <StepMembers data={formData} onChange={setFormData} />}
            {getCurrentStepName() === 'DOMAINS' && <StepDomains data={formData} onChange={setFormData} />}
            {getCurrentStepName() === 'SOURCES' && <StepSources data={formData} onChange={setFormData} />}
            {getCurrentStepName() === 'STORAGE' && <StepStorage data={formData} onChange={setFormData} workspaceId={workspaceId} userId={user?.id} driveConnected={driveConnected} driveError={driveError} onCreateWorkspace={createWorkspaceNow} />}
            {getCurrentStepName() === 'REVIEW' && <StepReview data={formData} />}
          </div>

          {error && (
            <div style={{ marginTop: 20, padding: '12px 16px', fontSize: 13, color: '#c94040', background: 'rgba(201,64,64,0.08)', border: '1px solid rgba(201,64,64,0.25)' }}>
              ⚠ {error}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(58,110,200,0.12)' }}>
            {/* Back */}
            {step < 4 ? (
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(58,110,200,0.2)', color: step === 0 ? '#2a3a50' : '#6a9aba', fontSize: 13, letterSpacing: 1, fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: step === 0 ? 'default' : 'pointer' }}
                onMouseEnter={e => { if (step > 0) e.currentTarget.style.borderColor = 'rgba(61,123,212,0.4)' }}
                onMouseLeave={e => { if (step > 0) e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)' }}
              >← Back</button>
            ) : (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(58,110,200,0.2)', color: '#6a9aba', fontSize: 13, letterSpacing: 1, fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(61,123,212,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(58,110,200,0.2)'}
              >← Back</button>
            )}

            <span style={{ fontSize: 12, color: '#4a6b8a' }}>Step {step + 1} of {STEPS.length}</span>

            {/* Forward / create */}
            {!isReviewStep ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                style={{ padding: '12px 28px', background: canNext() ? 'rgba(61,123,212,0.12)' : 'transparent', border: `1px solid ${canNext() ? 'rgba(61,123,212,0.5)' : 'rgba(58,110,200,0.15)'}`, color: canNext() ? '#7aaeee' : '#2a3a50', fontSize: 13, letterSpacing: 1, fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: canNext() ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (canNext()) e.currentTarget.style.background = 'rgba(61,123,212,0.2)' }}
                onMouseLeave={e => { if (canNext()) e.currentTarget.style.background = 'rgba(61,123,212,0.12)' }}
              >Continue →</button>
            ) : (
              <button onClick={handleContinueFromReview} disabled={saving}
                style={{ padding: '12px 32px', background: saving ? 'transparent' : 'rgba(42,158,88,0.12)', border: `1px solid ${saving ? 'rgba(58,110,200,0.15)' : 'rgba(42,158,88,0.5)'}`, color: saving ? '#4a6b8a' : '#2a9e58', fontSize: 13, fontWeight: 600, letterSpacing: 1, fontFamily: 'var(--font-mono)', transition: 'all 0.2s', cursor: saving ? 'default' : 'pointer' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'rgba(42,158,88,0.2)' }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'rgba(42,158,88,0.12)' }}
              >{saving ? 'CREATING...' : 'CREATE WORKSPACE →'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NewWorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{ width: '100vw', height: '100vh', background: '#03050c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 8, color: '#3d7bd4' }}>NEPTUNE</div>
      </div>
    }>
      <NewWorkspaceInner />
    </Suspense>
  )
}

export default withAuth(NewWorkspacePage)