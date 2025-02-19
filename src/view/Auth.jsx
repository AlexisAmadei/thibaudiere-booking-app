import { Box, Container } from '@mui/material';
import React, { useState } from 'react';
import './styles/Auth.css';
import Button from '../components/Button/Button';
import { signIn } from '../Utils/auth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
            if (signin === 'Invalid email address') {
                setError('Invalid credentials');
            } else {
                setError('');
            }
        }
    }

    return (
        <Container maxWidth='sm' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Box className='auth-box'>
                <form onSubmit={handleSignIn} className='auth-form'>
                    <div className='form-group'>
                        <label htmlFor='username'>Email</label>
                        <input
                            type='text'
                            id='username'
                            name='username'
                            className='form-control'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='password'>Mot de passe</label>
                        <div className='password-input-container'>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id='password'
                                name='password'
                                className='form-control'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <span
                                type='button'
                                className='password-toggle-button'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </span>
                        </div>
                    </div>
                    <Button type='submit' className='btn btn-primary'>Se connecter</Button>
                </form>
                {error && <div className='error'>{error}</div>}
            </Box>
        </Container>
    );
}
