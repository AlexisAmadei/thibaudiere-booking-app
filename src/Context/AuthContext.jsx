import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../Utils/users';

export const AuthContext = React.createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const navigate = useNavigate();

    const auth = getAuth();

    async function checkAdminStatus(uid, email) {
        const adminStatus = await isAdmin(uid, email);
        setIsUserAdmin(adminStatus);
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userUID', user.uid);
                checkAdminStatus(user.uid, user.email);
            } else {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userUID');
            }
        });

        return unsubscribe;
    }, [auth]);

    useEffect(() => {
        navigate(user ? '/' : '/auth');
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, firebaseAuth: auth, isUserAdmin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}