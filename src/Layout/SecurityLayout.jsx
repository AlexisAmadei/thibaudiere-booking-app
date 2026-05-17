import { Box } from '@chakra-ui/react';
import { useLocation } from 'react-router';
import Loading from '../components/Custom/Loading';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../views/AuthForm';

export default function SecurityLayout({ children }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

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

  if (!user && pathname !== '/reset-password') {
    return <AuthForm />;
  }

  return <>{children}</>;
}
