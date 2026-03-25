import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, User, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email, name: form.name, purpose: 'register' });
      toast.success('OTP sent! Check your email.');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: form.email, otp, name: form.name,
        password: form.password, purpose: 'register',
      });
      login(data.token, data.user);
      toast.success(`Welcome to CryptoNex, ${data.user.name}! 🚀`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-grid-dark flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-display font-bold text-gradient">CryptoNex</span>
          </div>
          <p className="text-slate-400">Create your trading account</p>
        </div>

        <div className="card gradient-border">
          <h2 className="text-xl font-display font-bold mb-6">
            {step === 'form' ? 'Create Account' : 'Verify Email'}
          </h2>

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', type: 'text', icon: User, placeholder: 'Satoshi Nakamoto' },
                { label: 'Email Address', key: 'email', type: 'email', icon: Mail, placeholder: 'you@example.com' },
                { label: 'Password (optional)', key: 'password', type: 'password', icon: KeyRound, placeholder: 'Min 6 characters' },
              ].map(({ label, key, type, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input pl-10"
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send Verification OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-slate-400 text-sm">Code sent to <span className="text-white">{form.email}</span></p>
              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input font-mono tracking-[0.3em] text-lg text-center"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-accent-400 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}