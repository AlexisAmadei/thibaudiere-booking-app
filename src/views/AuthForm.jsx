import { Box, Button, Card, Field, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { PasswordInput } from '../components/ui/password-input'
import { Toaster, toaster } from '../components/ui/toaster'
import { useAuth } from '../contexts/AuthContext'

export default function AuthForm() {
  const { signIn, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateLogin = () => {
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

  const validateEmail = () => {
    const newErrors = {}
    if (!email) {
      newErrors.email = 'Email est requis'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validateLogin()) return
    setIsLoading(true)
    try {
      await signIn(email, password)
      toaster.create({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté',
        type: 'success',
      })
      setEmail('')
      setPassword('')
      setErrors({})
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!validateEmail()) return
    setIsLoading(true)
    try {
      await resetPassword(email)
      toaster.create({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.',
        type: 'success',
      })
      setEmail('')
      setErrors({})
      setMode('login')
    } catch (error) {
      toaster.create({
        title: 'Erreur',
        description: error.message,
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
            {mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
          </Heading>
          <Text textAlign="center" color="gray.600" mt={2}>
            {mode === 'login'
              ? 'Connectez-vous à votre compte'
              : 'Entrez votre email pour recevoir un lien de réinitialisation'}
          </Text>
        </Card.Header>

        <Card.Body>
          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <Stack gap={4}>
                <Field.Root invalid={!!errors.email} required>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    placeholder="Email"
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
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <Field.ErrorText>{errors.password}</Field.ErrorText>
                  )}
                </Field.Root>

                <Text
                  fontSize="sm"
                  color="teal"
                  cursor="pointer"
                  textAlign="right"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => { setMode('forgot'); setErrors({}) }}
                >
                  Mot de passe oublié ?
                </Text>

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
          ) : (
            <form onSubmit={handleForgotPassword}>
              <Stack gap={4}>
                <Field.Root invalid={!!errors.email} required>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <Field.ErrorText>{errors.email}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  colorPalette="brand"
                  width="100%"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Envoyer le lien
                </Button>

                <Text
                  fontSize="sm"
                  color="blue.500"
                  cursor="pointer"
                  textAlign="center"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => { setMode('login'); setErrors({}) }}
                >
                  Retour à la connexion
                </Text>
              </Stack>
            </form>
          )}
        </Card.Body>
      </Card.Root>
      <Toaster />
    </Box>
  )
}
