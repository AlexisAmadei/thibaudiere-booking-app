import { Box } from '@chakra-ui/react';
import Loading from '../components/Custom/Loading';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../views/AuthForm';

export default function SecurityLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
      >
        <Loading />
      </Box>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <>{children}</>;
}
