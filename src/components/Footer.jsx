import { Box, Highlight, Link } from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box position={'fixed'} bottom={3} textAlign="center" fontSize="sm" color="gray.500">
      <Link href="https://alexisamadei.fr" isExternal>
        <Highlight query={'Kiwi'} styles={{ color: 'brand.solid' }}>
          by Kiwi Dev
        </Highlight>
      </Link>
    </Box>
  )
}
