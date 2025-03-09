
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      setIsLoading(false);
      // For demo purposes, any login works
      toast.success('Login successful');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Apple className="h-10 w-10 mx-auto mb-4 text-gray-900 dark:text-white" />
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white">Sign in with your ID</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-apple-md p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="input-field w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <a 
                  href="#" 
                  className="text-sm font-medium text-apple-blue dark:text-neon-purple hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Password reset functionality would go here');
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="apple-button w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an Apple ID?{' '}
            <a 
              href="#" 
              className="font-medium text-apple-blue dark:text-neon-purple hover:underline"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Create account functionality would go here');
              }}
            >
              Create one now
            </a>
          </p>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This app and your Apple ID are protected by Apple's security terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
