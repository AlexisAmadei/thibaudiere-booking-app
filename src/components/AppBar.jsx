import { Box, Flex, Heading, Highlight, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router"
import { useAuth } from "../contexts/AuthContext"
import useIsMobile from "../hooks/useIsMobile"
import NavMenu from "./NavMenu"
import { ColorModeButton } from "./ui/color-mode"

export default function AppBar() {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <Flex direction={'row'} gap={4} width="100%" alignItems="center" justifyContent={'space-between'} mb={4}>
      <Heading as="h1" onClick={() => navigate('/')} cursor="pointer">
        <Highlight query={'Thibaudiere'} styles={{ color: 'brand.solid' }}>
          La Thibaudiere
        </Highlight>
      </Heading>

      <Box display="flex" alignItems="center" gap={1}>
        {isMobile ? null : (
          <Text>
            Connecté en tant que{' '}
            <Highlight query={profile?.name || user?.email} styles={{ color: 'teal' }}>
              {profile?.name || user?.email}
            </Highlight>
          </Text>
        )}

        <ColorModeButton />
        <NavMenu />
      </Box>
    </Flex>
  )
}