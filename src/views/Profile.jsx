import { Avatar, AvatarGroup, Box, Flex, Heading, IconButton, Input } from "@chakra-ui/react";
import { Send, SquarePen } from "lucide-react";
import { useState } from "react";
import AppBar from "../components/AppBar";
import { useAuth } from "../contexts/AuthContext";
import useIsMobile from "../hooks/useIsMobile";
import { editDisplayName } from "../supabase/user";

export default function Profile() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [editField, setEditField] = useState("");
  const [newDisplayName, setNewDisplayName] = useState(user.user_metadata?.display_name || "");

  const handleSaveProfile = async () => {
    switch (editField) {
      case 'displayName':
        await editDisplayName(newDisplayName);
        setEditField("");
        break;

      default:
        break;
    }
  };

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

        <Heading as="h2" size="2xl" mt={4} mb={2} fontWeight={'bold'}>{user.user_metadata?.display_name || 'Utilisateur'}</Heading>

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

          <Box display="inline-flex" width={'100%'} justifyContent={'center'} gap={4} alignItems="center">
            <Input
              placeholder="****"
              value={''}
              onChange={(e) => {
                console.log(e.target.value);
              }}
              disabled
            />
            {/* <IconButton colorPalette={'teal'} disabled borderRadius={"full"}>
              <SquarePen />
            </IconButton> */}
          </Box>
        </Flex>

        <Flex width={!isMobile ? '500px' : '100%'} direction={'column'} gap={1} alignItems="flex-start">
          <Heading as="h3" size="lg" mt={4} fontWeight={'bold'}>Profil</Heading>

          <Box display="inline-flex" width={'100%'} justifyContent={'center'} gap={4} alignItems="center" mb={2}>
            <Input
              placeholder={user.user_metadata?.display_name}
              value={newDisplayName}
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
    </Box >
  )
}
