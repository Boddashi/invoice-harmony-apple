
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Index';
import NotFound from './pages/NotFound';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import EditInvoice from './pages/EditInvoice';
import Login from './pages/Login';
import Items from './pages/Products';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <CurrencyProvider>
        <BrowserRouter>
          <AuthProvider>
            <div className="w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<NewInvoice />} />
                <Route path="/invoices/edit/:invoiceId" element={<EditInvoice />} />
                <Route path="/products" element={<Items />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
        <Toaster />
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
