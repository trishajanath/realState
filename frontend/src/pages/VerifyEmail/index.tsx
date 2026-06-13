import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle2, XCircle, Clock, Send, ArrowLeft, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const statusParam = searchParams.get('status'); // 'success' | 'expired' | 'error' | null
  const emailParam = searchParams.get('email') || 'your email';

  const [isLoading, setIsLoading] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Simulate initial verification checking delay (e.g., calling token verification API)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setIsResending(true);

    setTimeout(() => {
      setResendCooldown(30);
      toast('Verification Sent', `We have sent a new verification link to ${emailParam}.`, 'success');
      setIsResending(false);
    }, 1200);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 text-center py-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-60 mx-auto rounded-lg" />
          </div>
        </div>
      );
    }

    // Success State
    if (statusParam === 'success') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </motion.div>
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping pointer-events-none" />
            </div>
          </div>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm max-w-xs mx-auto">
              Your email has been successfully verified. You are ready to start analyzing micro-sectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button
              onClick={() => {
                localStorage.setItem('auth_token', 'mock_jwt_token_123');
                navigate('/');
              }}
              className="w-full text-xs py-3 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </motion.div>
      );
    }

    // Expired State
    if (statusParam === 'expired') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm">
              <Clock className="h-7 w-7 stroke-[2]" />
            </div>
          </div>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Link Expired
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm max-w-xs mx-auto">
              The verification link has expired for security reasons. Please request a new link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Button
              onClick={handleResend}
              className="w-full text-xs py-3 font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Request New Link'}
              </span>
            </Button>
          </CardContent>
        </motion.div>
      );
    }

    // Error State
    if (statusParam === 'error') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
              <XCircle className="h-7 w-7 stroke-[2]" />
            </div>
          </div>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm max-w-xs mx-auto">
              We encountered a technical error verifying this email. The link may be invalid or broken.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full text-xs py-3 font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </motion.div>
      );
    }

    // Default Email Sent Landing State
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <Send className="h-6 w-6 stroke-[2]" />
          </div>
        </div>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs md:text-sm max-w-xs mx-auto">
            We have sent a verification link to <strong className="text-slate-700">{emailParam}</strong>. Please click the link to confirm your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full text-xs py-3 font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </span>
          </Button>
        </CardContent>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6 relative">
      {/* Background visual blobs */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-blue-600/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-indigo-600/5 blur-[80px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Card className="border-slate-200/80 bg-white shadow-xl/5 rounded-3xl p-3 md:p-4">
          {renderContent()}

          {!isLoading && (
            <CardFooter className="flex justify-center border-t border-slate-100 pt-4 mt-2">
              <Link
                to="/login"
                className="text-xs font-bold font-mono text-slate-400 hover:text-slate-600 hover:underline tracking-wider uppercase flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to login</span>
              </Link>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      {/* State simulation triggers at bottom for testing */}
      {!isLoading && (
        <div className="mt-8 flex flex-wrap gap-2 max-w-md justify-center relative z-10">
          <span className="text-[9px] font-mono text-slate-400 uppercase w-full text-center mb-1">
            Simulate Verification States:
          </span>
          <button
            onClick={() => navigate('/verify-email')}
            className={`px-2 py-1 rounded-lg border text-[9px] font-mono font-bold cursor-pointer ${
              !statusParam ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            1. Email Sent
          </button>
          <button
            onClick={() => navigate('/verify-email?status=success')}
            className={`px-2 py-1 rounded-lg border text-[9px] font-mono font-bold cursor-pointer ${
              statusParam === 'success' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            2. Verified Success
          </button>
          <button
            onClick={() => navigate('/verify-email?status=expired')}
            className={`px-2 py-1 rounded-lg border text-[9px] font-mono font-bold cursor-pointer ${
              statusParam === 'expired' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            3. Link Expired
          </button>
          <button
            onClick={() => navigate('/verify-email?status=error')}
            className={`px-2 py-1 rounded-lg border text-[9px] font-mono font-bold cursor-pointer ${
              statusParam === 'error' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            4. Error
          </button>
        </div>
      )}
    </div>
  );
};
