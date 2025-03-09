
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      toast.error('Please log in to access this page');
      navigate('/login');
    }
  }, [user, navigate]);

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', href: '/' },
    { icon: FileText, label: 'Invoices', href: '/invoices' },
    { icon: Users, label: 'Clients', href: '/clients' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => {
    signOut();
  };

  // If we're still checking authentication or user is not authenticated, don't render the layout
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex">
        {/* Navigation sidebar */}
        <nav className="hidden md:flex w-64 border-r border-border/40 h-[calc(100vh-4rem)] sticky top-16 flex-col justify-between">
          <div className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-apple-blue/10 text-apple-blue font-medium" 
                      : "text-foreground/70 hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <Icon size={20} className={cn(isActive ? "text-apple-blue" : "text-foreground/70")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Sign out button at bottom of sidebar */}
          <div className="p-4 mt-auto border-t border-border/40">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-foreground/70 hover:bg-secondary/80 hover:text-foreground transition-all duration-200"
            >
              <LogOut size={20} className="text-foreground/70" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
        
        {/* Mobile bottom navbar */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-apple border-t border-border/40 flex md:hidden z-30">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 transition-all",
                  isActive ? "text-apple-blue" : "text-foreground/70"
                )}
              >
                <Icon size={22} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Add sign out icon for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-foreground/70"
          >
            <LogOut size={22} />
            <span className="text-xs">Sign Out</span>
          </button>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6 md:px-8 pb-20 md:pb-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
