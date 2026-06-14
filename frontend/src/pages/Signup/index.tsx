import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../hooks/useApi';
import { GoogleIcon } from '../../components/shared/GoogleIcon';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) { setFormError('Enter a valid email address.'); return; }
    if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.detail || 'Registration failed.'); return; }
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_name', name.split(' ')[0]);
      localStorage.setItem('user_email', email.trim().toLowerCase());
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
      if (!config.client_id || !config.callback_url) throw new Error('Google OAuth not configured on server.');
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
    <div className="min-h-screen flex" style={{ backgroundColor: '#F9FAFB' }}>

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
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.6 }}>
            Get instant access to live market data, investment scoring, and geospatial property intelligence for Coimbatore.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Live property price indices',
              'AI-powered investment scores',
              'Locality micro-sector rankings',
              'Infrastructure impact forecasting',
            ].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>{f}</span>
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
            Create account
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>
            Start your real estate intelligence journey.
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

          <button
            onClick={handleGoogle}
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-2.5 w-full rounded-lg text-sm font-medium transition-colors"
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
            ) : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setFormError(null); }}
                style={inputStyle}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#000000')}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                style={inputStyle}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#000000')}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                style={inputStyle}
                onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#000000')}
                onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="flex items-center justify-center gap-2 w-full rounded-lg text-sm font-semibold transition-colors"
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
              Create Account
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: '#9CA3AF' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#374151')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};
