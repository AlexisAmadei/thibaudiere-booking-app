import { Box, Flex, Heading, Highlight } from "@chakra-ui/react"
import NavMenu from "./NavMenu"
import { ColorModeButton } from "./ui/color-mode"

export default function AppBar() {
  return (
    <Flex direction={'row'} gap={4} width="100%" alignItems="center" justifyContent={'space-between'} mb={8}>
      <Heading>
        <Highlight query={'Thibaudiere'} styles={{ color: 'brand.solid' }}>
          La Thibaudiere
        </Highlight>
      </Heading>

      <Box display="flex" alignItems="center" gap={1}>
        <ColorModeButton />
        <NavMenu />
      </Box>
    </Flex>
  )
}