import { Text } from '@chakra-ui/react'
import { AbsoluteCenter, Spinner } from '@chakra-ui/react'
import React from 'react'

export default function Loading() {
  return (
    <AbsoluteCenter flexDirection="column" gap={4} textAlign={'center'}>
      <Spinner size="xl" color={'teal.400'} borderWidth={'thick'} />
      <Text color="colorPalette.600">Chargement des réservations...</Text>
    </AbsoluteCenter>
  )
}
