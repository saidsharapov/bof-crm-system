// Renders product photo or a deterministic gradient fallback
const GRADIENTS = [
  'from-brand-700 to-brand-500',
  'from-emerald-700 to-emerald-500',
  'from-amber-700 to-amber-500',
  'from-rose-700 to-rose-500',
  'from-purple-700 to-purple-500',
  'from-sky-700 to-sky-500',
]

function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

interface ProductAvatarProps {
  photo: string
  name: string
  className?: string
}

export function ProductAvatar({ photo, name, className = 'w-full h-full' }: ProductAvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${className} object-cover`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  const grad  = GRADIENTS[hashStr(name) % GRADIENTS.length]
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={`${className} bg-gradient-to-br ${grad} flex items-center justify-center`}>
      <span className="text-white font-bold text-lg select-none">{initials}</span>
    </div>
  )
}
