import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <img src={user.picture} 
          alt={user.name}
          className="w-8 h-8 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <Link to="/privacy">
          <DropdownMenuItem>
            Privacidad
          </DropdownMenuItem>
        </Link>
        <Link to="/tos">
          <DropdownMenuItem>
            Términos
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}