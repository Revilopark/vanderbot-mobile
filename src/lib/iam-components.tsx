"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  User,
  LogOut,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  iamLogin,
  iamSignup,
  iamLogout,
  iamGetUser,
  iamIsAuthenticated,
  iamMockLogin,
  iamMockGetContext,
  type IAMUser,
  type IAMContext,
} from "./iam";

// ─── Auth Context ──────────────────────────────────────────────────

interface AuthState {
  user: IAMUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IAMUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = iamGetUser();
    setUser(user);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Use mock for demo — swap to iamLogin() for real API
    const session = iamMockLogin(email, password);
    setUser(session.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup same as login for demo
    const session = iamMockLogin(email, password);
    setUser({ ...session.user, name });
  };

  const logout = () => {
    iamLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────

export function LoginScreen({ onClose }: { onClose: () => void }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (isSignup) {
        await auth.signup(email, password, name);
      } else {
        await auth.login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-background-tertiary rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isSignup ? "Create Account" : "Sign In"}
            </h2>
            <p className="text-xs text-text-muted">Vanderbot Identity</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 mb-4">
            <AlertCircle className="w-4 h-4 text-status-danger flex-shrink-0" />
            <span className="text-xs text-status-danger">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-text-muted" />
                ) : (
                  <Eye className="w-4 h-4 text-text-muted" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : isSignup ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-2xs text-text-muted text-center">
            Secured by Vanderbot IAM. Private by default.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── IAM Awareness Panel (Connected) ───────────────────────────────

export function IAMAwarenessPanel({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const [context, setContext] = useState<IAMContext | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      setContext(iamMockGetContext());
    }
  }, [auth.isAuthenticated]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-background-tertiary rounded-t-2xl border-t border-border z-50 max-h-[70vh] overflow-y-auto"
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">IAM Awareness</h3>
            </div>
            {auth.isAuthenticated ? (
              <button
                onClick={() => {
                  auth.logout();
                  onClose();
                }}
                className="flex items-center gap-1 text-xs text-status-danger hover:text-status-danger/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Auth State */}
          {!auth.isAuthenticated ? (
            <div className="p-4 rounded-xl bg-surface border border-border text-center">
              <Shield className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary mb-3">
                Not authenticated. Sign in to access your projects and data.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
              >
                Sign In to Vanderbot
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {auth.user?.name}
                  </p>
                  <p className="text-xs text-text-muted">{auth.user?.email}</p>
                </div>
                <span className="text-2xs px-2 py-1 rounded bg-accent/20 text-accent capitalize">
                  {auth.user?.role}
                </span>
              </div>

              {/* Context Items */}
              {context && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-xs text-text-secondary">Project</span>
                    <span className="text-xs font-medium text-text-primary">
                      {context.project?.name || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-xs text-text-secondary">Visibility</span>
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-accent/20 text-accent capitalize">
                      {context.project?.visibility || "private"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-xs text-text-secondary">Mode</span>
                    <span className="text-xs font-medium text-accent capitalize">
                      {context.mode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-xs text-text-secondary">Memory Scope</span>
                    <span className="text-xs font-medium text-text-primary">
                      {context.memoryScope}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                    <span className="text-xs text-text-secondary">Confidence</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-status-success rounded-full"
                          style={{ width: `${context.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-status-success">
                        {Math.round(context.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-text-secondary">Rights Risk</span>
                    <span
                      className={`text-xs font-medium capitalize ${
                        context.rightsRisk === "low"
                          ? "text-status-success"
                          : context.rightsRisk === "medium"
                          ? "text-status-warning"
                          : "text-status-danger"
                      }`}
                    >
                      {context.rightsRisk}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showLogin && <LoginScreen onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  );
}
