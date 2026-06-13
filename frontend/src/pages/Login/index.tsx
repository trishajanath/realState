import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthVisualPanel } from '../../components/shared/AuthVisualPanel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Checkbox } from '../../components/ui/Checkbox';
import { Separator } from '../../components/ui/Separator';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { useToast } from '../../components/ui/Toast';
import { AlertCircle } from 'lucide-react';

const GoogleIcon = ({ className = 'h-4.5 w-4.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const emailParam = searchParams.get('email');
    const oauthError = searchParams.get('error');

    if (token && username) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_name', username);
      if (emailParam) localStorage.setItem('user_email', emailParam);
      toast('Signed in successfully', `Logged in as ${username}.`, 'success');
      navigate('/');
    } else if (oauthError) {
      setFormError(decodeURIComponent(oauthError));
      toast('OAuth Failure', decodeURIComponent(oauthError), 'error');
    }
  }, [searchParams, navigate, toast]);

  // Real-time email validation
  const validateEmail = (val: string) => {
    if (!val) {
      return 'Email is required';
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(val)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const emailErr = validateEmail(val);
    setErrors((prev) => ({ ...prev, email: emailErr }));
    if (formError) setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setErrors((prev) => ({ ...prev, password: val ? '' : 'Password is required' }));
    if (formError) setFormError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = password ? '' : 'Password is required';

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setIsLoading(true);
    setFormError(null);

    // Simulate login API call
    setTimeout(() => {
      // Mock credentials check
      if (email.toLowerCase() === 'error@example.com') {
        setFormError('Invalid credentials. Please verify your email and password.');
        toast('Authentication Failed', 'Invalid credentials provided.', 'error');
        setIsLoading(false);
      } else {
        localStorage.setItem('auth_token', 'mock_jwt_token_123');
        localStorage.setItem('user_name', email.split('@')[0]);
        toast('Welcome Back', 'Successfully logged into CoimbatoreREI.', 'success');
        navigate('/');
      }
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setFormError(null);

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/google/config');
      if (!res.ok) throw new Error('Failed to load Google client configuration.');
      const config = await res.json();
      
      if (!config.client_id || !config.callback_url) {
        throw new Error('Google OAuth credentials not configured on server.');
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${config.client_id}` + 
        `&redirect_uri=${encodeURIComponent(config.callback_url)}` + 
        `&response_type=code` + 
        `&scope=${encodeURIComponent('openid email profile')}`;
      
      window.location.href = googleAuthUrl;
    } catch (err: any) {
      console.error("Error initiating Google OAuth login flow:", err);
      setFormError(err.message || 'Failed to initiate Google sign in. Please try again.');
      toast('OAuth Error', err.message || 'Failed to initiate Google sign in.', 'error');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 w-full overflow-x-hidden">
      {/* Left Visual Panel - Hidden on Mobile */}
      <AuthVisualPanel />

      {/* Right Form Card Panel */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center p-6 relative">
        
        {/* Mobile branding */}
        <div className="lg:hidden flex items-center gap-2 mb-8 absolute top-8 left-8">
          <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="font-extrabold text-sm">C</span>
          </div>
          <span className="font-display font-extrabold text-slate-900 tracking-tight text-sm">
            Coimbatore<span className="text-blue-600">REI</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <Card className="border-slate-200/80 bg-white shadow-xl/5 rounded-3xl p-3 md:p-4">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs md:text-sm">
                Continue your property intelligence journey.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {formError && (
                <Alert className="mb-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {/* Google Button */}
              <div className="relative">
                {isGoogleLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
                    <span className="h-4 w-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                  </div>
                )}
                <Button
                  variant="google"
                  className="w-full justify-center text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 transition-all font-semibold rounded-xl text-xs py-3"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                >
                  <GoogleIcon className="absolute left-4 h-4.5 w-4.5 shrink-0" />
                  <span>Continue with Google</span>
                </Button>
              </div>

              <div className="flex items-center gap-3 my-4">
                <Separator className="flex-grow bg-slate-200/60" />
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider shrink-0">
                  or continue with email
                </span>
                <Separator className="flex-grow bg-slate-200/60" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    error={!!errors.email}
                    disabled={isLoading || isGoogleLoading}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-500 font-sans mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-[10px] font-bold font-mono text-blue-600 hover:underline tracking-wider uppercase"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!errors.password}
                    disabled={isLoading || isGoogleLoading}
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="text-[10px] text-red-500 font-sans mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 select-none">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked)}
                      disabled={isLoading || isGoogleLoading}
                    />
                    <label
                      htmlFor="remember"
                      className="text-[11px] font-semibold text-slate-500 cursor-pointer"
                    >
                      Remember this device
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 text-xs py-3 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  isLoading={isLoading}
                  disabled={isLoading || isGoogleLoading}
                >
                  Sign In
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-slate-100 pt-4 mt-2">
              <p className="text-xs text-slate-400 font-sans">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:underline font-semibold transition-colors">
                  Create Account
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
