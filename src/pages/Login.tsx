
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Apple className="h-10 w-10 mx-auto mb-4 text-gray-900 dark:text-white" />
          <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
            {isRegister ? 'Create an account' : 'Sign in with your ID'}
          </h1>
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
                {!isRegister && (
                  <a 
                    href="#" 
                    className="text-sm font-medium text-apple-blue dark:text-neon-purple hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      // Password reset would go here in a real implementation
                    }}
                  >
                    Forgot password?
                  </a>
                )}
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
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a 
              href="#" 
              className="font-medium text-apple-blue dark:text-neon-purple hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setIsRegister(!isRegister);
              }}
            >
              {isRegister ? 'Sign in' : 'Create one now'}
            </a>
          </p>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This app is protected by secure authentication. Your data is safe with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
