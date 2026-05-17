import { Avatar, AvatarGroup, Box, Field, Flex, Heading, IconButton, Input, Stack } from "@chakra-ui/react";
import { Send, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import AppBar from "../components/AppBar";
import { PasswordInput } from "../components/ui/password-input";
import { Toaster, toaster } from "../components/ui/toaster";
import { useAuth } from "../contexts/AuthContext";
import useIsMobile from "../hooks/useIsMobile";
import { editDisplayName, getCurrentUserProfile } from "../supabase/user";

export default function Profile() {
  const { user, updatePassword } = useAuth();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState(null);
  const [editField, setEditField] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = () => {
    const errors = {};
    if (!newPassword) {
      errors.newPassword = 'Le mot de passe est requis';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Au moins 6 caractères';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    switch (editField) {
      case 'displayName':
        await editDisplayName(newDisplayName);
        setEditField("");
        setNewDisplayName("");
        if (user) {
          const profileData = await getCurrentUserProfile();
          setProfile(profileData);
        }
        break;

      case 'password':
        if (!validatePassword()) return;
        setIsLoading(true);
        try {
          await updatePassword(newPassword);
          toaster.create({
            title: 'Mot de passe mis à jour',
            description: 'Votre mot de passe a été modifié avec succès.',
            type: 'success',
          });
          setEditField("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordErrors({});
        } catch (error) {
          toaster.create({
            title: 'Erreur',
            description: error.message,
            type: 'error',
          });
        } finally {
          setIsLoading(false);
        }
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const profileData = await getCurrentUserProfile();
      setProfile(profileData);
    };

    fetchProfile();
  }, [user]);

  return (
    <Box
      px={5}
      py={5}
      height="100%"
      maxHeight="100vh"
      boxSizing="border-box"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <AppBar />

      <Flex
        direction={"column"}
        alignItems="center"
        width={"100%"}
        height={'100%'}
        p={isMobile ? 2 : 6}
        borderRadius="lg"
        gap={2}
      >
        <AvatarGroup>
          <Avatar.Root size="2xl">
            <Avatar.Fallback name={user.email.charAt(0)} />
            {/* <Avatar.Image /> */}
          </Avatar.Root>
        </AvatarGroup>

        <Heading as="h2" size="2xl" mt={4} mb={2} fontWeight={'bold'}>{profile?.display_name || '...'}</Heading>

        <Flex width={!isMobile ? '500px' : '100%'} direction={'column'} gap={1} alignItems="flex-start">
          <Heading as="h3" size="lg" mt={4} fontWeight={'bold'}>Connexion</Heading>

          <Box display="inline-flex" width={'100%'} justifyContent={'center'} gap={4} alignItems="center" mb={2}>
            <Input
              placeholder="Email"
              value={user.email}
              onChange={(e) => {
                console.log(e.target.value);
              }}
              disabled={editField !== 'email'}
            />
            {/* {editField === 'email' ? (
              <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={handleSaveProfile}>
                <Send />
              </IconButton>
            ) : (
              <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={() => setEditField(editField === 'email' ? '' : 'email')}>
                <SquarePen />
              </IconButton>
            )} */}
          </Box>

          {editField === 'password' ? (
            <Stack width={'100%'} gap={2}>
              <Field.Root invalid={!!passwordErrors.newPassword}>
                <PasswordInput
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                {passwordErrors.newPassword && (
                  <Field.ErrorText>{passwordErrors.newPassword}</Field.ErrorText>
                )}
              </Field.Root>
              <Field.Root invalid={!!passwordErrors.confirmPassword}>
                <Box display="inline-flex" width={'100%'} gap={4} alignItems="center">
                  <PasswordInput
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={handleSaveProfile} loading={isLoading}>
                    <Send />
                  </IconButton>
                </Box>
                {passwordErrors.confirmPassword && (
                  <Field.ErrorText>{passwordErrors.confirmPassword}</Field.ErrorText>
                )}
              </Field.Root>
            </Stack>
          ) : (
            <Box display="inline-flex" width={'100%'} justifyContent={'center'} gap={4} alignItems="center">
              <Input placeholder="Mot de passe" value="" onChange={() => {}} disabled type="password" />
              <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={() => setEditField('password')}>
                <SquarePen />
              </IconButton>
            </Box>
          )}
        </Flex>

        <Flex width={!isMobile ? '500px' : '100%'} direction={'column'} gap={1} alignItems="flex-start">
          <Heading as="h3" size="lg" mt={4} fontWeight={'bold'}>Profil</Heading>

          <Box display="inline-flex" width={'100%'} justifyContent={'center'} gap={4} alignItems="center" mb={2}>
            <Input
              placeholder={"Nom d'affichage"}
              value={newDisplayName || profile?.display_name || ''}
              onChange={(e) => {
                setNewDisplayName(e.target.value);
              }}
              disabled={editField !== 'displayName'}
            />

            {editField === 'displayName' ? (
              <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={handleSaveProfile}>
                <Send />
              </IconButton>
            ) : (
              <IconButton colorPalette={'teal'} borderRadius={"full"} onClick={() => setEditField(editField === 'displayName' ? '' : 'displayName')}>
                <SquarePen />
              </IconButton>
            )}
          </Box>
        </Flex>

      </Flex>
      <Toaster />
    </Box>
  )
}
