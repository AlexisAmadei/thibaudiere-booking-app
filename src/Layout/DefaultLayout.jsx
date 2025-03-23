import Container from '@mui/material/Container';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import Header from '../components/Header/Header';
import { theme } from '../theme/mui';
import './DefaultLayout.css';
import { Box } from '@mui/material';

export default function DefaultLayout({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Container className='default-layout'>
                <Header />
                {children}
                <Box className='kiwi-dev'>
                    <p>by <a href="https://github.com/AlexisAmadei">Kiwi Dev</a></p>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
