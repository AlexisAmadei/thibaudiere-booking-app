import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toaster } from '../components/ui/toaster';
import * as auth from '../api/auth';
import { checkIfDisplayNameExists, getCurrentUserProfile } from '../api/user';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // The session lives in an httpOnly cookie; Better Auth's client reads it from the server and
  // refreshes it after signing in or out.
  const { data, isPending } = auth.authClient.useSession();
  const user = data?.user ?? null;
  const session = data?.session ?? null;
  // Only the first read counts as loading: the client goes back to pending while it rereads
  // the session after a sign-in, and the layout must not blank the form meanwhile.
  const [loading, setLoading] = useState(true);
  if (loading && !isPending) setLoading(false);
  const hasCheckedDisplayName = useRef(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const userId = user?.id;
  useEffect(() => {
    const checkDisplayName = async () => {
      if (userId && !hasCheckedDisplayName.current) {
        hasCheckedDisplayName.current = true;
        const exists = await checkIfDisplayNameExists();
        if (!exists) {
          toaster.create({
            title: 'Profil incomplet',
            description: 'Veuillez compléter votre profil en ajoutant un nom d\'affichage.',
            type: 'info',
            action: {
              label: 'Aller au profil',
              onClick: () => {
                navigate('/profile');
              },
            },
          });
        } else {
          setProfile(await getCurrentUserProfile());
        }
      }
    };
    checkDisplayName();
  }, [userId, navigate]);

  const signIn = async (email, password) => {
    try {
      return await auth.signIn(email, password);
    } catch (error) {
      toaster.create({
        title: 'Erreur de connexion',
        description: error.message,
        type: 'error',
      });
      throw error;
    }
  };

  const signOut = () => auth.signOut();

  // Emails a link to /reset-password (an invitation, to a member who has no password yet).
  const resetPassword = (email) => auth.requestPasswordReset(email);

  // From an emailed link, pass its `token`; signed in, pass the `currentPassword`.
  const updatePassword = (newPassword, { token, currentPassword } = {}) =>
    token !== undefined
      ? auth.resetPassword(token, newPassword)
      : auth.changePassword(currentPassword, newPassword);

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
