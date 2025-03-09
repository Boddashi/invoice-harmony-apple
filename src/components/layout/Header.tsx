
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../theme/ThemeToggle';
import { toast } from 'sonner';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
      case '/login':
        return 'Sign In';
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
  const isLoginPage = location.pathname === '/login';

  const handleLogout = () => {
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (isLoginPage) {
    return null; // Don't show header on login page
  }

  return (
    <header className="w-full h-16 border-b border-border/40 backdrop-blur-apple bg-background/80 sticky top-0 z-30 flex items-center px-6">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight animate-fade-in">{getTitle()}</h1>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          <button 
            onClick={handleLogout}
            className="ghost-button flex items-center gap-1.5 text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
