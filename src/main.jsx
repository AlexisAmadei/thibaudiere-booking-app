import './index.css'
import { BrowserRouter } from 'react-router'
import { Provider } from './components/ui/provider.jsx'
import App from './views/App.jsx'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { AuthProvider } from './contexts/AuthContext.jsx'
import SecurityLayout from './Layout/SecurityLayout.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Provider>
        <AuthProvider>
          <SecurityLayout>
            <App />
          </SecurityLayout>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>,
)
