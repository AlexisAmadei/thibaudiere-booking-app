import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toaster } from '../components/ui/toaster';
import { supabase } from '../supabase/client';
import { checkIfDisplayNameExists } from '../supabase/user';

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
  const hasCheckedDisplayName = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
        }
      }
    };
    checkDisplayName();
  }, [user]);

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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
