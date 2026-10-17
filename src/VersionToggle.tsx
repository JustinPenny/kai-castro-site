import './VersionToggle.css'

export type Version = 'handheld' | 'original'

// Demo-only control: switches between the two builds of the site. A full
// page load (not in-place state) keeps the two versions' global CSS apart.
export default function VersionToggle({ version }: { version: Version }) {
  const next: Version = version === 'handheld' ? 'original' : 'handheld'
  const href = next === 'handheld' ? window.location.pathname : `?version=${next}`
  return (
    <a className="version-toggle" href={href}>
      {version === 'handheld' ? 'View original' : 'View handheld'}
    </a>
  )
}
