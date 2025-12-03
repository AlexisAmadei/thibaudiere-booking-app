import './index.css'
import { BrowserRouter } from 'react-router'
import { Provider } from './components/ui/provider.jsx'
import App from './views/App.jsx'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Provider>
                <App />
            </Provider>
        </BrowserRouter>
    </StrictMode>,
)
