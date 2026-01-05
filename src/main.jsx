import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Provider } from './components/ui/provider.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { BookingProvider } from './contexts/BookingContext.jsx'
import './index.css'
import SecurityLayout from './Layout/SecurityLayout.jsx'
import App from './views/App.jsx'
import Profile from './views/Profile.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Provider>
        <AuthProvider>
          <BookingProvider>
            <SecurityLayout>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path='/profile' element={<Profile />} />
              </Routes>
            </SecurityLayout>
          </BookingProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>,
)
