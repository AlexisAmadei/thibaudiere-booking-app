import { Box, Container, ThemeProvider } from '@mui/material'
import React from 'react'
import Header from '../components/Header/Header'
import { theme } from '../theme/mui'
import './DefaultLayout.css'

export default function DefaultLayout({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Container className='default-layout'>
                <Box>
                    <Header />
                    {children}
                </Box>
            </Container>
        </ThemeProvider>
    )
}
