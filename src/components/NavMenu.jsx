import { Menu, Portal } from '@chakra-ui/react'
import { LogOut, Settings } from 'lucide-react'

const MENU_ITEMS = [
  { label: 'Profile', href: '/' },
  { label: 'Settings', href: '/settings' },
]

export default function NavMenu() {
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  return (
    <Menu.Root>
      <Menu.Trigger>
        <Settings strokeWidth={'1.5px'} />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {MENU_ITEMS.map((item) => (
              <Menu.Item key={item.href} as="a" href={item.href}>
                {item.label}
              </Menu.Item>
            ))}
            <Menu.Separator />
            <Menu.Item color="red.500" onClick={handleSignOut}>
              <LogOut size={16} />
              Se déconnecter
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
