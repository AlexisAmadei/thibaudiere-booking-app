import Container from '@mui/material/Container';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import Header from '../components/Header/Header';
import { theme } from '../theme/mui';
import './DefaultLayout.css';

export default function DefaultLayout({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Container className='default-layout'>
                <Header />
                {children}
            </Container>
        </ThemeProvider>
    );
}
