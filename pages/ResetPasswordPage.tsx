import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicButton } from '../components/public/PublicButton';
import { PublicCard } from '../components/public/PublicCard';
import { useUsers } from '../UserContext';

const passwordStrengthLabel = (value: string) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return 'Weak';
  if (score <= 3) return 'Moderate';
  return 'Strong';
};

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isReady, updatePassword } = useUsers();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!currentUser) {
      setError('Sign in first, or ask a Super Admin to reset your password.');
    }
  }, [currentUser, isReady]);

  const strength = useMemo(() => passwordStrengthLabel(password), [password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess('Password updated. You can continue to the dashboard now.');
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 900);
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to update your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-100 to-white dark:from-[#030303] dark:via-[#050505] dark:to-[#030303] text-slate-800 dark:text-slate-100 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <PublicCard elevated className="w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-[0_24px_54px_rgba(0,51,102,0.14)] dark:shadow-[0_28px_60px_rgba(0,0,0,0.46)]">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-psa-blue text-white shadow-lg shadow-blue-500/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">PocketBase Password Change</p>
              <h1 className="font-serif text-3xl text-psa-navy dark:text-slate-100">Set a new password</h1>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-psa-blue/20 dark:border-zinc-700 dark:bg-[#0f0f0f] dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Create a new password"
                />
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" strokeWidth={1.7} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">At least 8 characters. Current strength: {strength}.</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-psa-blue/20 dark:border-zinc-700 dark:bg-[#0f0f0f] dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Repeat your new password"
              />
            </div>

            <PublicButton type="submit" fullWidth size="lg" disabled={isSubmitting} className="font-bold">
              {isSubmitting ? 'Updating...' : (
                <>
                  Update Password <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </PublicButton>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="font-semibold text-psa-blue hover:text-psa-navy dark:text-slate-200 dark:hover:text-white">
              Back to sign in
            </Link>
          </div>
        </PublicCard>
      </div>
    </div>
  );
};
