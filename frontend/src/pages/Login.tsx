import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles, User, Mail } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'student' | 'parent'>('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ identifier, password });
      await setAuth(res);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.errors?.map((e: any) => e.message).join(', ') || data?.detail || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yub-primary via-yub-secondary to-yub-accent flex items-center justify-center p-4">
      {/* Floating decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🌟', '📚', '🎮', '🧩', '🎯', '🏆'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-30"
            style={{ left: `${15 + i * 14}%`, top: `${10 + (i % 3) * 30}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.3 }}
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
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <h1 className="text-6xl font-fun font-bold text-white drop-shadow-lg">
            YuBuBu
          </h1>
          <p className="text-white/80 mt-2 text-lg">Öğrenmenin eğlenceli yolu! 🎉</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <LogIn className="w-6 h-6 text-yub-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Giriş Yap</h2>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode('student'); setIdentifier(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                loginMode === 'student'
                  ? 'bg-yub-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              Öğrenci
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('parent'); setIdentifier(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                loginMode === 'parent'
                  ? 'bg-yub-secondary text-white shadow-md'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Veli / Öğretmen
            </button>
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
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-gray-600 mb-1">
                {loginMode === 'student' ? 'Kullanıcı Adı' : 'E-posta'}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type={loginMode === 'parent' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary focus:ring-2 focus:ring-yub-primary/20 outline-none transition-all text-lg"
                  placeholder={loginMode === 'student' ? 'ali_yilmaz_1234' : 'ornek@email.com'}
                  autoComplete={loginMode === 'parent' ? 'email' : 'username'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                  {loginMode === 'student' ? <User className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-600 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary focus:ring-2 focus:ring-yub-primary/20 outline-none transition-all text-lg pr-12"
                  placeholder={loginMode === 'student' ? 'ali1234' : '••••••••'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
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
              className="w-full py-3.5 bg-gradient-to-r from-yub-primary to-yub-secondary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  Giriş Yap
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Hesabın yok mu?{' '}
              <Link to="/register" className="text-yub-primary font-bold hover:underline">
                Veli Kaydı Oluştur
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Demo hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/70 text-xs mt-4 space-y-1"
        >
          <p>Demo Öğrenci: ali_yilmaz_1234 / ali1234</p>
          <p>Demo Veli: selma.yilmaz@test.com / veli123</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
