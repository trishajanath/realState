import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
      navigate('/');
    } else if (oauthError) {
      setFormError(decodeURIComponent(oauthError));
    }
  }, [searchParams, navigate]);

  const validateEmail = (val: string) => {
    if (!val) return 'Email is required';
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(val)) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = password ? '' : 'Password is required';
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    setFormError(null);
    setTimeout(() => {
      if (email.toLowerCase() === 'error@example.com') {
        setFormError('Invalid credentials. Check your email and password.');
        setIsLoading(false);
      } else {
        localStorage.setItem('auth_token', 'mock_jwt_token_123');
        localStorage.setItem('user_name', email.split('@')[0]);
        navigate('/');
      }
    }, 1200);
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/google/config');
      if (!res.ok) throw new Error('Failed to load Google configuration.');
      const config = await res.json();
      if (!config.client_id || !config.callback_url) throw new Error('Google OAuth not configured on server.');
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(config.callback_url)}&response_type=code&scope=${encodeURIComponent('openid email profile')}`;
    } catch (err: any) {
      setFormError(err.message || 'Failed to initiate Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    backgroundColor: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 150ms',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div
            className="flex items-center justify-center rounded"
            style={{ width: '28px', height: '28px', backgroundColor: '#FFFFFF' }}
          >
            <Building2 className="w-4 h-4" style={{ color: '#000000' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
            CoimbatoreREI
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
          Sign in
        </h1>
        <p className="text-sm mb-8" style={{ color: '#71717A' }}>
          Access your property intelligence dashboard.
        </p>

        {/* Error banner */}
        {formError && (
          <div
            className="flex items-start gap-2.5 p-3 rounded mb-6 text-sm"
            style={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', color: '#A1A1AA' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {formError}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={isLoading || isGoogleLoading}
          className="flex items-center justify-center gap-2.5 w-full h-10 rounded text-sm font-medium transition-colors duration-150"
          style={{
            backgroundColor: '#0A0A0A',
            border: '1px solid #2A2A2A',
            color: '#FFFFFF',
            opacity: isGoogleLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isGoogleLoading)
              (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#0A0A0A';
          }}
        >
          {isGoogleLoading ? (
            <span
              className="inline-block rounded-full border-2"
              style={{
                width: '14px', height: '14px',
                borderColor: '#FFFFFF', borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1F1F1F' }} />
          <span className="text-xs" style={{ color: '#52525B' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1F1F1F' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#A1A1AA' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); setFormError(null); }}
              disabled={isLoading || isGoogleLoading}
              style={{
                ...inputStyle,
                borderColor: emailError ? '#52525B' : '#2A2A2A',
              }}
              onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#3F3F46')}
              onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = emailError ? '#52525B' : '#2A2A2A')}
            />
            {emailError && (
              <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>{emailError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: '#A1A1AA' }}>
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: '#71717A' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717A')}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setFormError(null); }}
              disabled={isLoading || isGoogleLoading}
              style={{
                ...inputStyle,
                borderColor: passwordError ? '#52525B' : '#2A2A2A',
              }}
              onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#3F3F46')}
              onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = passwordError ? '#52525B' : '#2A2A2A')}
            />
            {passwordError && (
              <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-2 w-full h-10 rounded text-sm font-medium transition-colors duration-150"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#000000',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isGoogleLoading)
                (e.currentTarget as HTMLElement).style.backgroundColor = '#D4D4D4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            {isLoading && (
              <span
                className="inline-block rounded-full border-2"
                style={{
                  width: '14px', height: '14px',
                  borderColor: '#000000', borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            )}
            Sign in
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: '#71717A' }}>
          No account?{' '}
          <Link
            to="/signup"
            className="font-medium transition-colors"
            style={{ color: '#A1A1AA' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#A1A1AA')}
          >
            Create one
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
