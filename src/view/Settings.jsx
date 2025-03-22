import { Box, Container, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { getUserDocument, updateUserDocument } from '../Utils/users';
import './styles/Settings.css';

export default function Settings() {
    const userUID = localStorage.getItem('userUID');
    const [userSettings, setUserSettings] = React.useState({});

    const fetchUserSettings = async () => {
        const res = await getUserDocument(userUID);
        if (res?.settings === undefined) {
            updateUserDocument(userUID, { settings: {} });
            res.settings = {};
        }
        setUserSettings(res.settings);
    };

    useEffect(() => {
        console.log(userSettings);
    }, [userSettings]);

    useEffect(() => {
        fetchUserSettings();
    }, []);

    return (
        <Container>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Typography variant="h6" sx={{ textAlign: 'center' }} gutterBottom>Paramètres</Typography>
                <Box className="settings-wrapper">
                    <Typography variant="body1" gutterBottom>Couleur sur le calendrier:</Typography>
                    <Typography variant="body1" gutterBottom>Langue</Typography>
                </Box>
            </Box>
        </Container>
    )
}
