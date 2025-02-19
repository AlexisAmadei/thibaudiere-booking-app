import React, { useEffect } from 'react'
import { AuthContext } from '../Context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ProtectedLayout({ children }) {
    const { user } = React.useContext(AuthContext)
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/auth');
        }
    }, [user])

    return children
}
