import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email, purpose: 'login' });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter the OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp, purpose: 'login' });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-grid-dark flex items-center justify-center p-4">
      {/* Background glow */}
     {/*<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-400/8 rounded-full blur-3xl" />
      </div>*/}

      <div className="w-full max-w-md animate-fade-in relative z-50">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-display font-bold text-gradient">CryptoNex</span>
          </div>
          <p className="text-slate-400 font-body">AI-Powered Trading Intelligence</p>
        </div>

        {/* Card */}
       <div className="card gradient-border relative z-50">
          <h2 className="text-xl font-display font-bold mb-2">
            {step === 'email' ? 'Sign In' : 'Enter OTP'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {step === 'email'
              ? 'Enter your email to receive a one-time password'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="label">One-Time Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input pl-10 font-mono tracking-[0.3em] text-lg text-center"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify & Login</span><ArrowRight className="w-4 h-4" /></>}
              </button>
              <button type="button" onClick={() => { setStep('email'); setOtp(''); }} className="text-slate-400 hover:text-white text-sm w-full text-center transition-colors">
                ← Change email
              </button>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-accent-400 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}