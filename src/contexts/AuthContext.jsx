import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toaster } from '../components/ui/toaster';
import { supabase } from '../supabase/client';
import { checkIfDisplayNameExists, getCurrentUserProfile } from '../supabase/user';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const hasCheckedDisplayName = useRef(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkDisplayName = async () => {
      if (user && !hasCheckedDisplayName.current) {
        hasCheckedDisplayName.current = true;
        const exists = await checkIfDisplayNameExists(user.id);
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
  }, [user, navigate]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toaster.create({
        title: 'Erreur de connexion',
        description: error.message,
        type: 'error',
      });
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const response = await fetch('/api/send-reset-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error || 'Échec de l\'envoi de l\'email');
    }
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    setIsPasswordRecovery(false);
    return data;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isPasswordRecovery,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
