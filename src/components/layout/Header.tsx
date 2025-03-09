import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Settings } from 'lucide-react';
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
          {location.pathname === '/invoices' && (
            <Link 
              to="/invoices/new"
              className={cn(
                "apple-button flex items-center gap-2 animate-fade-in",
                isCreatePage && "opacity-50 pointer-events-none"
              )}
            >
              <PlusCircle size={18} />
              <span>New Invoice</span>
            </Link>
          )}
          
          <ThemeToggle />
          
          <Link 
            to="/settings"
            className={cn(
              "ghost-button",
              location.pathname === '/settings' && "bg-secondary/50"
            )}
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
