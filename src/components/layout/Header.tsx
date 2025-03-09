
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../theme/ThemeToggle';

const Header = () => {
  const location = useLocation();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/invoices':
        return 'Invoices';
      case '/clients':
        return 'Clients';
      case '/settings':
        return 'Settings';
      default:
        if (location.pathname.startsWith('/invoices/')) {
          return 'Invoice Details';
        }
        if (location.pathname.startsWith('/clients/')) {
          return 'Client Details';
        }
        return 'Invoice App';
    }
  };
  
  const isCreatePage = location.pathname === '/invoices/new';

  return (
    <header className="w-full h-16 border-b border-border/40 backdrop-blur-apple bg-background/80 sticky top-0 z-30 flex items-center px-6">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight animate-fade-in">{getTitle()}</h1>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
