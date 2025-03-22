import React from 'react'
import Button from './Button/Button'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import '../view/styles/Auth.css'

/**
 * @param {Function} handleSignIn
 * @param {String} username
 * @param {Function} setUsername
 * @param {String} password
 * @param {Function} setPassword
 * @param {Boolean} showPassword
 * @param {Function} setShowPassword
 * @returns
 */
export default function AuthForm({ handleSignIn, username, setUsername, password, setPassword, showPassword, setShowPassword }) {
    return (
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
    );
}
