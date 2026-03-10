'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setConfirmationSent(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl font-serif font-bold text-gray-700/20 mb-3">W</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">Wiki</span>
            <span className="text-2xl font-bold text-yellow-500 tracking-tight">Pull</span>
          </div>
          <p className="text-gray-600 text-xs mt-2 tracking-widest">THE ENCYCLOPEDIA TCG</p>
        </div>

        {confirmationSent ? (
          <div className="text-center">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-semibold mb-2">Check your email</p>
              <p className="text-gray-400 text-sm">
                We sent a confirmation link to <span className="text-white">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
            </div>
            <button
              onClick={() => { setConfirmationSent(false); setIsSignUp(false); }}
              className="mt-6 text-yellow-500 text-sm hover:text-yellow-400 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 text-black font-bold rounded-lg transition-colors text-sm"
              >
                {loading ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
