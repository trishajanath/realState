import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../hooks/useApi';
import { GoogleIcon } from '../../components/shared/GoogleIcon';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = password ? '' : 'Password is required';
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.detail || 'Invalid credentials. Please try again.');
        return;
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_name', data.user?.name || email.split('@')[0]);
      localStorage.setItem('user_email', data.user?.email || email);
      navigate('/');
    } catch {
      setFormError('Unable to reach the server. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/google/config`);
      if (!res.ok) throw new Error('Failed to load Google configuration.');
      const config = await res.json();
      if (!config.client_id || !config.callback_url) {
        throw new Error('Google OAuth is not configured on the server.');
      }
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.client_id}&redirect_uri=${encodeURIComponent(config.callback_url)}&response_type=code&scope=${encodeURIComponent('openid email profile')}`;
    } catch (err: any) {
      setFormError(err.message || 'Failed to initiate Google sign in.');
      setIsGoogleLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '9px',
    color: '#000000',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 150ms',
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{
          width: '420px',
          flexShrink: 0,
          backgroundColor: '#000000',
          borderRight: '1px solid #1a1a1a',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 className="w-4 h-4" style={{ color: '#000000' }} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
            XVERTA
          </span>
        </div>

        <div>
          <blockquote
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.35,
              marginBottom: '20px',
            }}
          >
            "The most complete real estate intelligence platform for Coimbatore."
          </blockquote>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { value: '715+', label: 'Properties' },
              { value: '24', label: 'Micro-sectors' },
              { value: 'A−', label: 'Market Grade' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div style={{ width: '30px', height: '30px', backgroundColor: '#000000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em' }}>XVERTA</span>
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '-0.04em',
              marginBottom: '6px',
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>
            Sign in to your intelligence dashboard.
          </p>

          {formError && (
            <div
              className="flex items-start gap-2.5 p-3 rounded-lg mb-5 text-sm"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-2.5 w-full rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              height: '42px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#374151',
              opacity: isGoogleLoading ? 0.6 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isGoogleLoading)
                (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            {isGoogleLoading ? (
              <span
                className="inline-block rounded-full border-2 animate-spin"
                style={{ width: '14px', height: '14px', borderColor: '#374151', borderTopColor: 'transparent' }}
              />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setFormError(null); }}
                disabled={isLoading || isGoogleLoading}
                style={{ ...inputStyle, borderColor: emailError ? '#FCA5A5' : '#E5E7EB' }}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#000000')}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = emailError ? '#FCA5A5' : '#E5E7EB')}
              />
              {emailError && <p className="text-xs mt-1.5 font-medium" style={{ color: '#DC2626' }}>{emailError}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: '#374151' }}>Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium transition-colors"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6B7280')}
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
                style={{ ...inputStyle, borderColor: passwordError ? '#FCA5A5' : '#E5E7EB' }}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#000000')}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = passwordError ? '#FCA5A5' : '#E5E7EB')}
              />
              {passwordError && <p className="text-xs mt-1.5 font-medium" style={{ color: '#DC2626' }}>{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="flex items-center justify-center gap-2 w-full rounded-lg text-sm font-semibold transition-colors duration-150"
              style={{
                height: '42px',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                opacity: isLoading ? 0.7 : 1,
                marginTop: '8px',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !isGoogleLoading)
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#000000';
              }}
            >
              {isLoading && (
                <span
                  className="inline-block rounded-full border-2 animate-spin"
                  style={{ width: '14px', height: '14px', borderColor: '#FFFFFF', borderTopColor: 'transparent' }}
                />
              )}
              Sign in
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: '#9CA3AF' }}>
            No account?{' '}
            <Link
              to="/signup"
              className="font-semibold transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#374151')}
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};
