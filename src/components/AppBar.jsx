import { Box, Flex, Heading, Highlight } from "@chakra-ui/react"
import NavMenu from "./NavMenu"
import { ColorModeButton } from "./ui/color-mode"
import { Text } from "@chakra-ui/react"
import { useAuth } from "../contexts/AuthContext"
import useIsMobile from "../hooks/useIsMobile"

export default function AppBar() {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  return (
    <Flex direction={'row'} gap={4} width="100%" alignItems="center" justifyContent={'space-between'} mb={8}>
      <Heading>
        <Highlight query={'Thibaudiere'} styles={{ color: 'brand.solid' }}>
          La Thibaudiere
        </Highlight>
      </Heading>

      <Box display="flex" alignItems="center" gap={1}>
        {isMobile ? null : (
          <Text>
            Connecté en tant que{' '}
            <Highlight query={profile?.display_name || user?.email} styles={{ color: 'teal' }}>
              {profile?.display_name || user?.email}
            </Highlight>
          </Text>
        )}

        <ColorModeButton />
        <NavMenu />
      </Box>
    </Flex>
  )
}