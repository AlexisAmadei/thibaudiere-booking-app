import { IconButton, Menu, Portal } from '@chakra-ui/react'
import { LogOut, MenuIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

const MENU_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Profil', href: '/profile' },
  // { label: 'Settings', href: '/settings' },
]

export default function NavMenu() {
  const { signOut } = useAuth()
  const location = useLocation();
  const [activeMenus, setActiveMenus] = useState([]);

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    const currentActiveMenus = MENU_ITEMS.filter(item => item.href !== location.pathname);
    setActiveMenus(currentActiveMenus);
  }, [location]);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton aria-label="Menu" variant="ghost">
          <MenuIcon strokeWidth={'1.5px'} />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {activeMenus.map((item) => (
              <Menu.Item key={item.label} as="a" href={item.href}>
                {item.label}
              </Menu.Item>
            ))}
            <Menu.Separator />
            <Menu.Item color="red.500" onClick={() => handleSignOut()}>
              <LogOut size={16} />
              Se déconnecter
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
