import React from 'react'
import { Box, IconButton, Menu, MenuItem } from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import './Header.css'
import { logout } from '../../Utils/auth';
import { useNavigate } from 'react-router-dom';


export default function Header() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const MenuElements = [
        // { name: 'Theme', action: () => console.log('switch theme') },
        { name: 'Paramètres', action: () => navigate('/settings') },
        { name: 'Déconnexion', action: () => logout() },
    ];

    return (
        <div className="header-wrapper">
            <Box>
                <span id='title' onClick={() => navigate('/')}>Thibaudière</span>
            </Box>
            <Box>
                <IconButton
                    onClick={handleClick}
                    sx={{ color: 'white' }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <SettingsRoundedIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    id='account-menu'
                    open={open}
                    onClose={() => setAnchorEl(null)}
                    onClick={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    {MenuElements.map((element, index) => (
                        <MenuItem key={index} onClick={element.action}>{element.name}</MenuItem>
                    ))}
                </Menu>
            </Box>
        </div>
    )
}
