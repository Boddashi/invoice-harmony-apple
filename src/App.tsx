
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './components/theme/ThemeProvider';
import Index from './pages/Index';
import Login from './pages/Login';
import Clients from './pages/Clients';
import Items from './pages/Items';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import CreditNotes from './pages/CreditNotes';
import NewCreditNote from './pages/NewCreditNote';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import ViewInvoice from './pages/ViewInvoice';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <CurrencyProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/items" element={<Items />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<NewInvoice />} />
                <Route path="/invoices/edit/:id" element={<NewInvoice />} />
                <Route path="/invoices/:id" element={<ViewInvoice />} />
                <Route path="/creditnotes" element={<CreditNotes />} />
                <Route path="/creditnotes/new" element={<NewCreditNote />} />
                <Route path="/creditnotes/edit/:id" element={<NewCreditNote />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
