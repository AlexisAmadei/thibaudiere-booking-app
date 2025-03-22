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

    const handleSignIn = async (event) => {
        event.preventDefault();
        if (validateCredentials()) {
            const signin = await signIn(username, password);
            if (signin === 'Identifiants invalides') {
                setError('Identifiants invalides');
            } else if (signin === 'Erreur inconnue') {
                setError('Erreur inconnue');
            }
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
