import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Social icons as inline SVGs matching the Figma placeholders
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      if (!name.trim()) { toast.error('Please enter your name'); return; }
      result = await signup(name, email, password);
    }
    if (result.success) {
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#ffffff' }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: '1px solid #222' }} className="flex items-center justify-between px-10 py-4">
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '18px', letterSpacing: '0.15em', fontWeight: 700 }}>
          METRICSFLOW
        </span>
        <div className="flex items-center gap-8">
          {['MODELS', 'API', 'ABOUT'].map(item => (
            <a key={item} href="#" style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#888', fontWeight: 500 }}
              className="hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
        <button
          style={{ fontSize: '11px', letterSpacing: '0.15em', border: '1px solid #444', padding: '8px 20px', borderRadius: '4px', color: '#ccc', fontWeight: 500 }}
          className="hover:border-white hover:text-white transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          DASHBOARD →
        </button>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4" style={{ paddingTop: '60px', paddingBottom: '80px' }}>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(48px, 8vw, 72px)',
          fontWeight: 400,
          letterSpacing: '0.08em',
          marginBottom: '10px',
          color: '#ffffff'
        }}>
          {isLogin ? 'LOGIN' : 'SIGN UP'}
        </h1>
        <p style={{ fontSize: '10px', letterSpacing: '0.25em', color: '#555', marginBottom: '44px', fontWeight: 500 }}>
          {isLogin ? 'ACCESS THE FRONTIER OF INTELLIGENCE' : 'JOIN THE FRONTIER OF INTELLIGENCE'}
        </p>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '380px', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '32px', backgroundColor: '#111' }}>
          <form onSubmit={handleSubmit}>

            {/* Name field (signup only) */}
            {!isLogin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.18em', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    width: '100%', background: 'transparent',
                    border: '1px solid #2e2e2e', borderRadius: '4px',
                    padding: '10px 12px', fontSize: '13px', color: '#ddd',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#555'}
                  onBlur={e => e.target.style.borderColor = '#2e2e2e'}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.18em', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="username@domain.com"
                required
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid #2e2e2e', borderRadius: '4px',
                  padding: '10px 12px', fontSize: '13px', color: '#ddd',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#555'}
                onBlur={e => e.target.style.borderColor = '#2e2e2e'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#666', fontWeight: 600 }}>
                  PASSWORD
                </label>
                {isLogin && (
                  <a href="#" style={{ fontSize: '10px', color: '#555', letterSpacing: '0.08em' }}
                    className="hover:text-white transition-colors"
                  >
                    Forgot?
                  </a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid #2e2e2e', borderRadius: '4px',
                  padding: '10px 12px', fontSize: '13px', color: '#ddd',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#555'}
                onBlur={e => e.target.style.borderColor = '#2e2e2e'}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', background: '#ffffff', color: '#000000',
                border: 'none', borderRadius: '4px', padding: '12px',
                fontSize: '11px', letterSpacing: '0.2em', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.2s, background 0.2s'
              }}
              onMouseEnter={e => { if (!isLoading) e.target.style.background = '#e8e8e8'; }}
              onMouseLeave={e => { if (!isLoading) e.target.style.background = '#ffffff'; }}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Sign up link */}
          <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '20px', letterSpacing: '0.04em' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setName(''); setEmail(''); setPassword(''); }}
              style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = '#aaa'}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Social sign-in icons */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '28px', alignItems: 'center' }}>
          {[
            { Icon: GoogleIcon, label: 'Google' },
            { Icon: AppleIcon,  label: 'Apple'  },
            { Icon: XIcon,      label: 'X'      },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              title={`Sign in with ${label}`}
              onClick={() => toast('Social login coming soon!', { icon: '🔗' })}
              style={{
                width: '40px', height: '40px',
                background: 'transparent',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#777',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#777'; }}
            >
              <Icon />
            </button>
          ))}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '20px 40px' }}
        className="flex items-center justify-between"
      >
        <span style={{ fontSize: '11px', color: '#333', letterSpacing: '0.08em' }}>© 2024 MetricsFlow</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Security'].map(link => (
            <a key={link} href="#"
              style={{ fontSize: '11px', color: '#444', letterSpacing: '0.12em' }}
              className="hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
