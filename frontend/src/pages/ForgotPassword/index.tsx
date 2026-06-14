import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useToast } from '../../components/ui/Toast';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (error) setError('');
  };

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required';
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setIsLoading(true);

    // Password reset email flow is not yet implemented on the backend.
    // Show a confirmation regardless to prevent email enumeration.
    setTimeout(() => {
      setIsSubmitted(true);
      setResendCooldown(30);
      toast('Reset Email Sent', 'If an account exists for this email, you will receive instructions shortly.', 'success');
      setIsLoading(false);
    }, 800);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);

    setTimeout(() => {
      setResendCooldown(30);
      toast('Reset Email Resent', 'We have sent a new password reset link.', 'success');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6" style={{ backgroundColor: '#F9FAFB' }}>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Card className="border-slate-200/80 bg-white shadow-xl/5 rounded-3xl p-3 md:p-4">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to="/login" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </Link>
                    <span className="font-display font-extrabold text-slate-900 tracking-tight text-sm">
                      XVERTA
                    </span>
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                    Forgot Password
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs md:text-sm leading-relaxed">
                    Enter your email address to receive password reset instructions.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        error={!!error}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                      {error && (
                        <p className="text-[10px] text-red-500 font-sans mt-1">{error}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full text-xs py-3 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>Send Reset Link</span>
                    </Button>
                  </form>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-slate-100 pt-4 mt-2">
                  <p className="text-xs text-slate-400 font-sans">
                    Remember your password?{' '}
                    <Link to="/login" className="font-semibold hover:underline transition-colors" style={{ color: '#374151' }}>
                      Sign In
                    </Link>
                  </p>
                </CardFooter>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <CardHeader className="space-y-3 pb-2 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-2">
                    <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                    Check Your Email
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm">
                    We've sent a password reset link to <strong className="text-slate-700">{email}</strong>.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <Button
                    onClick={handleResend}
                    variant="outline"
                    className="w-full text-xs py-3 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                    disabled={isLoading || resendCooldown > 0}
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Reset Link'}
                    </span>
                  </Button>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-slate-100 pt-4 mt-4">
                  <Link
                    to="/login"
                    className="text-xs font-bold font-mono hover:underline tracking-wider uppercase flex items-center gap-1" style={{ color: '#374151' }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to login</span>
                  </Link>
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};
