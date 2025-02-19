import { Box, Container, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { getUserDocument, updateUserDocument } from '../Utils/db';

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
        fetchUserSettings();
    }, []);

    useEffect(() => {
        console.log(userSettings);
    }, [userSettings]);

    return (
        <Container>
            <Box>
                <Typography variant="h6" sx={{ textAlign: 'center' }} gutterBottom>Paramètres</Typography>

            </Box>
        </Container>
    )
}
