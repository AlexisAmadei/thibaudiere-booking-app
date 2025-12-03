import React, { useState } from 'react'
import { Box, Button, Card, Field, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { PasswordInput } from '../components/ui/password-input'
import { LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toaster } from '../components/ui/toaster'

export default function AuthForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email est requis'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide'
    }

    if (!password) {
      newErrors.password = 'Mot de passe est requis'
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      await signIn(email, password)
      toaster.create({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté',
        type: 'success',
      })

      // Reset form after successful submission
      setEmail('')
      setPassword('')
      setErrors({})
    } catch (error) {
      console.error('Authentication error:', error)
      toaster.create({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      p={4}
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      <Card.Root maxW="md" width="100%">
        <Card.Header>
          <Heading size="lg" textAlign="center">
            Connexion
          </Heading>
          <Text textAlign="center" color="gray.600" mt={2}>
              Connectez-vous à votre compte
          </Text>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field.Root invalid={!!errors.email} required>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                {errors.email && (
                  <Field.ErrorText>{errors.email}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.password} required>
                <Field.Label>Mot de passe</Field.Label>
                <PasswordInput
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {errors.password && (
                  <Field.ErrorText>{errors.password}</Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                width="100%"
                mt={2}
                loading={isLoading}
                disabled={isLoading}
                display={'inline-flex'}
                alignItems={'center'}
              >
                <LogIn size={20} />
                Se connecter
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  )
}
