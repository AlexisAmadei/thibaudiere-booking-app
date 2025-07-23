import Container from '@mui/material/Container';
import { ThemeProvider } from '@mui/material/styles';
import Header from '../components/Header/Header';
import { theme } from '../theme/mui';
import './DefaultLayout.css';
import { Box } from '@mui/material';

export default function DefaultLayout({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Container className='default-layout' maxWidth='100%'>
                <Header />
                {children}
                <Box className='kiwi-dev'>
                    <p>by <a href="https://github.com/AlexisAmadei">Kiwi Dev</a></p>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
