import { Text, Heading, AbsoluteCenter, Highlight } from "@chakra-ui/react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <AbsoluteCenter flexDirection="column" gap={4} color="fg.muted" width={'90%'}>
      <Heading as="h1" size="2xl" textAlign={'center'}>
        <Highlight query={'404'} styles={{ color: 'teal' }}>
          404 - Page Not Found
        </Highlight>
      </Heading>
      <Text fontSize={'xl'} textAlign={'center'}>La page que vous recherchez n'existe pas.</Text>
      <Link
        to="/"
        style={{ color: 'var(--chakra-colors-teal-600)', textDecoration: 'underline', fontSize: '1.2rem' }}
      >
        Retour à l'accueil
      </Link>
    </AbsoluteCenter>
  );
}