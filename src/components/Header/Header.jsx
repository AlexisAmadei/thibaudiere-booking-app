import React from 'react'
import { Box, IconButton } from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import './Header.css'

export default function Header() {
    return (
        <div className="header-wrapper">
            <Box>
                <span id='title'>Thibaudière</span>
            </Box>
            <Box>
                <IconButton>
                    <SettingsRoundedIcon />
                </IconButton>
            </Box>
        </div>
    )
}
