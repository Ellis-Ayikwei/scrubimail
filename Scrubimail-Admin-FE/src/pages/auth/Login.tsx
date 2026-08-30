import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Github, Gitlab, Chrome } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { LoginUser } from '../../store/authSlice';
import { RootState } from '../../store/index';
import ssoService, { ProviderId, OAUTH_ERROR_MESSAGES } from '../../services/ssoService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Icons are presentation; which providers are offered comes from the server.
const SSO_PROVIDERS: { id: ProviderId; label: string; Icon: typeof Github }[] = [
  { id: 'github', label: 'GitHub', Icon: Github },
  { id: 'gitlab', label: 'GitLab', Icon: Gitlab },
  { id: 'google', label: 'Google', Icon: Chrome },
];

const Login = () => {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => !!localStorage.getItem('rememberedEmail'));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [ssoLoading, setSsoLoading] = useState<ProviderId | null>(null);
  const [availableProviders, setAvailableProviders] = useState<ProviderId[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/';

  const dispatch = useDispatch();
  const signIn = useSignIn();
  const { loading, error: authError } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    let cancelled = false;
    ssoService.getAvailableProviders().then((ids) => {
      if (!cancelled) setAvailableProviders(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Surfaced by ProtectedRoute when a signed-in non-staff user hits an admin route.
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) setError(OAUTH_ERROR_MESSAGES[errorParam] || errorParam);
  }, [searchParams]);

  const handleSSO = async (providerId: ProviderId) => {
    try {
      setError(null);
      setSsoLoading(providerId);
      await ssoService.startLogin(providerId);
    } catch (err: any) {
      console.error('OAuth login error:', err);
      setError(err?.message || 'Could not start sign-in with that provider.');
      setSsoLoading(null);
    }
  };

  const visibleProviders = SSO_PROVIDERS.filter((p) => availableProviders.includes(p.id));

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return 'Email address is required';
    if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    return undefined;
  };

  const runValidation = () => {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const isFormValid = !validateEmail(email) && !validatePassword(password);

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: field === 'email' ? validateEmail(email) : validatePassword(password),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ email: true, password: true });

    if (!runValidation()) {
      return;
    }

    try {
      const resultAction = await dispatch(
        LoginUser({
          email: email.trim(),
          password,
          extra: {
            signIn: signIn,
          },
        }) as any
      ).unwrap();

      // Persist (or clear) the "remember me" email preference.
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (resultAction) {
        navigate(from);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  // Show auth error from Redux if it exists
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const showEmailError = touched.email && fieldErrors.email;
  const showPasswordError = touched.password && fieldErrors.password;

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/assets/images/scrubi.png" alt="Scrubimail" className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">Scrubimail</span>
          </Link>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            {visibleProviders.length > 0 && (
              <div className="mb-5 flex flex-col gap-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {visibleProviders.map(({ id, label, Icon }) => (
                    <Button
                      key={id}
                      type="button"
                      variant="outline"
                      onClick={() => handleSSO(id)}
                      disabled={loading || ssoLoading !== null}
                    >
                      {ssoLoading === id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                      {label}
                    </Button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={loading}
                  aria-invalid={!!showEmailError}
                  aria-describedby={showEmailError ? 'email-error' : undefined}
                />
                {showEmailError && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    aria-invalid={!!showPasswordError}
                    aria-describedby={showPasswordError ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {showPasswordError && (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                />
                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">
                  Remember me
                </Label>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading || !isFormValid}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data is protected with enterprise-grade security
        </p>
      </div>
    </div>
  );
};

export default Login;
