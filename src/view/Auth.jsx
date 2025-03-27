import { Box, Container } from '@mui/material';
import React, { useState } from 'react';
import { signIn } from '../Utils/auth';
import AuthForm from '../components/AuthForm';
import './styles/Auth.css';

export default function Auth() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const validateCredentials = () => {
        if (username === '' || password === '') {
            alert('Please fill in both username and password fields.');
            return false;
        }
        return true;
    }

    /**
     * @param {*} event # event triggered by the form submit
     * @param {boolean} isReadOnly # if the user must log in as read-only
     * @returns {Promise<void>} # sign in the user
     */
    const handleSignIn = async (event, isReadOnly) => {
        event.preventDefault();
        const ro_email = import.meta.env.VITE_READONLY_EMAIL;
        const ro_password = import.meta.env.VITE_READONLY_PASSWORD;

        const signin = await signIn(isReadOnly ? ro_email : username, isReadOnly ? ro_password : password);
        if (signin === 'Identifiants invalides') {
            setError('Identifiants invalides');
        } else if (signin === 'Erreur inconnue') {
            setError('Erreur inconnue');
        }
    }

    return (
        <Container maxWidth='sm' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Box className='auth-box'>
                <AuthForm
                    handleSignIn={handleSignIn}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                />
                {error && <div className='error'>{error}</div>}
            </Box>
        </Container>
    );
}
