import { useState, type FormEvent } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export function LoginPage() {
  const { signIn } = useAuth();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold">EstateHub</p>
            <p className="text-xs text-white/70">Rental Management System</p>
          </div>
        </div>
        <div className="relative text-white">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Manage your entire<br />rental portfolio<br />in one place.
          </h1>
          <p className="mt-4 text-white/70 max-w-md">
            Properties, tenants, leases, payments, maintenance — all organized and accessible from a single, beautiful dashboard.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="text-3xl font-bold">8</p>
              <p className="text-xs text-white/60">Properties</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-3xl font-bold">8</p>
              <p className="text-xs text-white/60">Tenants</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-3xl font-bold">₹2.5L</p>
              <p className="text-xs text-white/60">Monthly</p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-white/50">© 2026 EstateHub. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-bold">EstateHub</span>
            </div>
            <button
              onClick={toggle}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to access your dashboard.' : 'Sign up to get started with EstateHub.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger-50 dark:bg-danger-50/10 px-3 py-2.5 text-sm text-danger-700 dark:text-danger-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-soft hover:bg-primary-700 transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
