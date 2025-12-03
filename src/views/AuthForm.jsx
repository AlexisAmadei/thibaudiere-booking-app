import React, { useState } from 'react'
import { Box, Button, Card, Field, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { PasswordInput } from '../components/ui/password-input'
import { LogIn, UserPlus } from 'lucide-react'

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    
    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // TODO: Add your authentication logic here
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(isLogin ? 'Logging in...' : 'Signing up...', { email, password })
      
      // Reset form after successful submission
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setErrors({})
    setPassword('')
    setConfirmPassword('')
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
            {isLogin ? 'Connexion' : 'Inscription'}
          </Heading>
          <Text textAlign="center" color="gray.600" mt={2}>
            {isLogin 
              ? 'Connectez-vous à votre compte' 
              : 'Créez votre compte'}
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

              {!isLogin && (
                <Field.Root invalid={!!errors.confirmPassword} required>
                  <Field.Label>Confirmer le mot de passe</Field.Label>
                  <PasswordInput
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
                  )}
                </Field.Root>
              )}

              <Button
                type="submit"
                colorPalette="brand"
                width="100%"
                mt={2}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLogin ? (
                  <>
                    <LogIn size={20} />
                    Se connecter
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    S'inscrire
                  </>
                )}
              </Button>
            </Stack>
          </form>
        </Card.Body>

        <Card.Footer>
          <Text textAlign="center" width="100%">
            {isLogin ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}{' '}
            <Button
              variant="plain"
              colorPalette="brand"
              onClick={toggleMode}
              disabled={isLoading}
              size="sm"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </Button>
          </Text>
        </Card.Footer>
      </Card.Root>
    </Box>
  )
}
