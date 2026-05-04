import { Box, Button, Card, Field, Heading, Stack, Text } from '@chakra-ui/react'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PasswordInput } from '../components/ui/password-input'
import { Toaster, toaster } from '../components/ui/toaster'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!password) {
      newErrors.password = 'Mot de passe requis'
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (!confirm) {
      newErrors.confirm = 'Confirmation requise'
    } else if (confirm !== password) {
      newErrors.confirm = 'Les mots de passe ne correspondent pas'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await updatePassword(password)
      toaster.create({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été réinitialisé avec succès.',
        type: 'success',
      })
      navigate('/')
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
          <Heading size="lg" textAlign="center">Nouveau mot de passe</Heading>
          <Text textAlign="center" color="gray.600" mt={2}>
            Choisissez un nouveau mot de passe pour votre compte
          </Text>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field.Root invalid={!!errors.password} required>
                <Field.Label>Nouveau mot de passe</Field.Label>
                <PasswordInput
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {errors.password && <Field.ErrorText>{errors.password}</Field.ErrorText>}
              </Field.Root>

              <Field.Root invalid={!!errors.confirm} required>
                <Field.Label>Confirmer le mot de passe</Field.Label>
                <PasswordInput
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={isLoading}
                />
                {errors.confirm && <Field.ErrorText>{errors.confirm}</Field.ErrorText>}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                width="100%"
                mt={2}
                loading={isLoading}
                disabled={isLoading}
                display="inline-flex"
                alignItems="center"
              >
                <KeyRound size={20} />
                Réinitialiser le mot de passe
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
      <Toaster />
    </Box>
  )
}
