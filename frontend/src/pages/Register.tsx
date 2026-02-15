import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole, LearningDifficulty } from '../types';

const ROLES: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  { value: 'student', label: 'Öğrenci', emoji: '🎮', desc: 'Oyun oyna & öğren' },
  { value: 'parent', label: 'Veli', emoji: '👨‍👩‍👧', desc: 'Çocuğunun ilerlemesini takip et' },
  { value: 'teacher', label: 'Öğretmen', emoji: '👩‍🏫', desc: 'Öğrencilerin analiziyle ilgilen' },
];

const DIFFICULTIES: { value: LearningDifficulty; label: string; emoji: string; color: string }[] = [
  { value: 'dyslexia', label: 'Disleksi', emoji: '📖', color: 'bg-dyslexia-primary' },
  { value: 'dysgraphia', label: 'Disgrafi', emoji: '✍️', color: 'bg-dysgraphia-primary' },
  { value: 'dyscalculia', label: 'Diskalkuli', emoji: '🔢', color: 'bg-dyscalculia-primary' },
];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [difficulty, setDifficulty] = useState<LearningDifficulty>('dyslexia');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.register({
        name,
        email,
        password,
        role,
      });
      await setAuth(res);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.errors?.map((e: any) => e.message).join(', ') || data?.detail || 'Kayıt başarısız. Lütfen tekrar deneyin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yub-accent via-yub-secondary to-yub-primary flex items-center justify-center p-4">
      {/* Floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🌈', '🦋', '🎨', '🎵', '🌻', '🚀'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-30"
            style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4 + i * 0.5, delay: i * 0.3 }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <motion.div className="text-center mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <h1 className="text-5xl font-fun font-bold text-white drop-shadow-lg">YuBuBu</h1>
          <p className="text-white/80 mt-1">Hadi birlikte başlayalım! 🌟</p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`w-3 h-3 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'}`}
              animate={s === step ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          ))}
        </div>

        {/* Form Card */}
        <motion.div className="bg-white rounded-3xl shadow-2xl p-8" layout>
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-6 h-6 text-yub-secondary" />
            <h2 className="text-2xl font-bold text-gray-800">Kayıt Ol</h2>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Role selection */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Sen kimsin?</p>
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <motion.button
                        key={r.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setRole(r.value); setStep(2); }}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          role === r.value ? 'border-yub-primary bg-yub-primary/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-3xl">{r.emoji}</span>
                        <div>
                          <div className="font-bold text-gray-800">{r.label}</div>
                          <div className="text-xs text-gray-500">{r.desc}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Difficulty (only for students) or skip */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                  {role === 'student' ? (
                    <>
                      <p className="text-sm font-semibold text-gray-600 mb-3">Öğrenme tipini seç:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DIFFICULTIES.map((d) => (
                          <motion.button
                            key={d.value}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setDifficulty(d.value); setStep(3); }}
                            className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                              difficulty === d.value ? 'border-yub-primary shadow-md' : 'border-gray-200'
                            }`}
                          >
                            <span className="text-3xl">{d.emoji}</span>
                            <span className="font-bold text-sm text-gray-700">{d.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    // Auto-skip for non-students
                    (() => { setStep(3); return null; })()
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Geri
                  </button>
                </motion.div>
              )}

              {/* Step 3: Credentials */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-600 mb-1">İsim</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-secondary focus:ring-2 focus:ring-yub-secondary/20 outline-none transition-all text-lg"
                      placeholder="Adın"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-600 mb-1">E-posta</label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-secondary focus:ring-2 focus:ring-yub-secondary/20 outline-none transition-all text-lg"
                      placeholder="ornek@email.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-600 mb-1">Şifre</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-secondary focus:ring-2 focus:ring-yub-secondary/20 outline-none transition-all text-lg pr-12"
                        placeholder="En az 6 karakter"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-yub-secondary to-yub-accent text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Hesap Oluştur
                      </>
                    )}
                  </motion.button>

                  <button type="button" onClick={() => setStep(role === 'student' ? 2 : 1)} className="text-sm text-gray-500 hover:text-gray-700">
                    ← Geri
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Zaten hesabın var mı?{' '}
              <Link to="/login" className="text-yub-secondary font-bold hover:underline">
                Giriş Yap
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
