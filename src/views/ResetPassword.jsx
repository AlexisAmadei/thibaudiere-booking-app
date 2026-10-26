import { Box, Button, Card, Field, Heading, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PasswordInput } from '../components/ui/password-input'
import { Toaster, toaster } from '../components/ui/toaster'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const { user, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // The emailed link is /reset-password?token=…, with &type=invite for a new member.
  const token = searchParams.get('token') ?? ''
  const isInvite = searchParams.get('type') === 'invite'

  const validate = () => {
    const newErrors = {}
    if (!password) {
      newErrors.password = 'Mot de passe est requis'
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }
    if (!confirm) {
      newErrors.confirm = 'Veuillez confirmer le mot de passe'
    } else if (password !== confirm) {
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
      await updatePassword(password, { token })
      // The link does not sign the member in.
      toaster.create({
        title: 'Mot de passe mis à jour',
        description: user
          ? 'Votre mot de passe a été modifié avec succès.'
          : 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.',
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
          <Heading size="lg" textAlign="center">
            {isInvite ? 'Bienvenue !' : 'Nouveau mot de passe'}
          </Heading>
          <Text textAlign="center" color="gray.600" mt={2}>
            {isInvite
              ? 'Créez un mot de passe pour accéder à votre compte'
              : 'Choisissez un nouveau mot de passe'}
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
                {errors.password && (
                  <Field.ErrorText>{errors.password}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.confirm} required>
                <Field.Label>Confirmer le mot de passe</Field.Label>
                <PasswordInput
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={isLoading}
                />
                {errors.confirm && (
                  <Field.ErrorText>{errors.confirm}</Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                width="100%"
                mt={2}
                loading={isLoading}
                disabled={isLoading}
              >
                {isInvite ? 'Créer mon mot de passe' : 'Mettre à jour le mot de passe'}
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
      <Toaster />
    </Box>
  )
}
