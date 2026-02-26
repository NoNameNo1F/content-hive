import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  username: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function UserAvatar({ username, avatarUrl, size = 'md' }: UserAvatarProps) {
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <Avatar className={sizeClasses[size]}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
