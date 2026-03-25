'use client'

const SEV_COLORS = {
  CRITICAL: '#c94040',
  HIGH:     '#c87c3a',
  MEDIUM:   '#b89a30',
  LOW:      '#2a9e58',
}

/**
 * AlertBadge — severity badge for feed items and decision briefs.
 * Props:
 *   severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
 *   size:     'sm' (default) | 'md'
 */
export default function AlertBadge({ severity, size = 'sm' }) {
  const color = SEV_COLORS[severity] || '#4a6b8a'
  const fontSize = size === 'md' ? 8 : 7

  return (
    <span style={{
      fontSize,
      letterSpacing: 1,
      padding: size === 'md' ? '2px 7px' : '1px 5px',
      border: `1px solid ${color}44`,
      color,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {severity}
    </span>
  )
}
