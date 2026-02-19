import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Sparkles, Plus, Copy, Check, School, GraduationCap } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import type { LearningDifficulty, School as SchoolType, TeacherInfo, StudentRegisterResponse } from '../types';

const DIFFICULTIES: { value: LearningDifficulty; label: string; emoji: string; desc: string }[] = [
  { value: 'dyslexia', label: 'Disleksi', emoji: '📖', desc: 'Okuma güçlüğü' },
  { value: 'dysgraphia', label: 'Disgrafi', emoji: '✍️', desc: 'Yazma güçlüğü' },
  { value: 'dyscalculia', label: 'Diskalkuli', emoji: '🔢', desc: 'Matematik güçlüğü' },
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth, token } = useAuthStore();

  // ─── Step management ───
  // Step 1: Parent info → Step 2: Success + Add child prompt
  // Step 3: Child info → Step 4: School/teacher select → Step 5: Credential display
  const [step, setStep] = useState(1);

  // ─── Parent form ───
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ─── Child form ───
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(7);
  const [childGrade, setChildGrade] = useState(1);
  const [difficulty, setDifficulty] = useState<LearningDifficulty>('dyslexia');

  // ─── School/Teacher ───
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // ─── Result ───
  const [childResult, setChildResult] = useState<StudentRegisterResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [addedChildren, setAddedChildren] = useState<StudentRegisterResponse[]>([]);

  // ─── General ───
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load schools when entering step 4
  useEffect(() => {
    if (step === 4 && schools.length === 0) {
      setLoadingSchools(true);
      authService.getSchools()
        .then(setSchools)
        .catch(() => {})
        .finally(() => setLoadingSchools(false));
    }
  }, [step]);

  // Load teachers when school changes
  useEffect(() => {
    if (selectedSchool) {
      setLoadingTeachers(true);
      setSelectedTeacher('');
      authService.getTeachersBySchool(selectedSchool)
        .then(setTeachers)
        .catch(() => {})
        .finally(() => setLoadingTeachers(false));
    } else {
      setTeachers([]);
    }
  }, [selectedSchool]);

  const handleParentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.registerParent({
        name: parentName,
        email,
        password,
        phone: phone || undefined,
      });
      // registerParent returns TokenResponse (auto-login)
      await setAuth(res);
      setStep(2);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.detail || 'Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.registerStudent({
        name: childName,
        age: childAge,
        grade: childGrade,
        learning_difficulty: difficulty,
        school_id: selectedSchool || undefined,
        teacher_id: selectedTeacher || undefined,
      });
      setChildResult(res);
      setAddedChildren(prev => [...prev, res]);
      setStep(5);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.detail || 'Çocuk kaydı başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetChildForm = () => {
    setChildName('');
    setChildAge(7);
    setChildGrade(1);
    setDifficulty('dyslexia');
    setSelectedSchool('');
    setSelectedTeacher('');
    setChildResult(null);
    setError('');
    setStep(3);
  };

  const totalSteps = 5;
  const currentProgress = step;

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
          <p className="text-white/80 mt-1">
            {step <= 2 ? 'Veli Kaydı 👨‍👩‍👧' : 'Çocuk Kaydı 🎮'}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= currentProgress ? 'bg-white w-8' : 'bg-white/30 w-4'
              }`}
              animate={s === currentProgress ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          ))}
        </div>

        {/* Form Card */}
        <motion.div className="bg-white rounded-3xl shadow-2xl p-8" layout>
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

          <AnimatePresence mode="wait">
            {/* ═══════ STEP 1: Parent Registration ═══════ */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex items-center gap-2 mb-6">
                  <UserPlus className="w-6 h-6 text-yub-secondary" />
                  <h2 className="text-2xl font-bold text-gray-800">Veli Kaydı</h2>
                </div>

                <form onSubmit={handleParentRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-secondary focus:ring-2 focus:ring-yub-secondary/20 outline-none transition-all text-lg"
                      placeholder="Adınız Soyadınız"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">E-posta</label>
                    <input
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
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Şifre</label>
                    <div className="relative">
                      <input
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon <span className="text-gray-400 font-normal">(opsiyonel)</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-secondary focus:ring-2 focus:ring-yub-secondary/20 outline-none transition-all text-lg"
                      placeholder="05XX XXX XX XX"
                    />
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
                        Kayıt Ol
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Zaten hesabınız var mı?{' '}
                    <Link to="/login" className="text-yub-secondary font-bold hover:underline">
                      Giriş Yap
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══════ STEP 2: Registration Success ═══════ */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: 3, duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoş Geldiniz!</h2>
                <p className="text-gray-600 mb-6">
                  Kayıt başarılı, <strong>{parentName}</strong>!<br />
                  Şimdi çocuğunuzu ekleyerek başlayabilirsiniz.
                </p>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(3)}
                    className="w-full py-3.5 bg-gradient-to-r from-yub-primary to-yub-secondary text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Çocuk Ekle
                  </motion.button>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Sonra eklerim, panele git →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════ STEP 3: Child Info ═══════ */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap className="w-6 h-6 text-yub-primary" />
                  <h2 className="text-xl font-bold text-gray-800">Çocuk Bilgileri</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Çocuğun Adı Soyadı</label>
                    <input
                      type="text"
                      required
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary focus:ring-2 focus:ring-yub-primary/20 outline-none transition-all"
                      placeholder="Çocuğunuzun adı soyadı"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Yaş</label>
                      <select
                        value={childAge}
                        onChange={(e) => setChildAge(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary outline-none"
                      >
                        {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(a => (
                          <option key={a} value={a}>{a} yaş</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Sınıf</label>
                      <select
                        value={childGrade}
                        onChange={(e) => setChildGrade(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary outline-none"
                      >
                        {GRADES.map(g => (
                          <option key={g} value={g}>{g}. Sınıf</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Difficulty selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Öğrenme Güçlüğü Türü</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map((d) => (
                        <motion.button
                          key={d.value}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDifficulty(d.value)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                            difficulty === d.value ? 'border-yub-primary bg-yub-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl">{d.emoji}</span>
                          <span className="font-bold text-xs text-gray-700">{d.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-3 text-gray-500 hover:text-gray-700 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                    >
                      ← Geri
                    </button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!childName.trim()}
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-gradient-to-r from-yub-primary to-yub-secondary text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Okul Seçimi →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════ STEP 4: School & Teacher Selection ═══════ */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex items-center gap-2 mb-5">
                  <School className="w-6 h-6 text-yub-primary" />
                  <h2 className="text-xl font-bold text-gray-800">Okul & Öğretmen</h2>
                </div>

                <p className="text-sm text-gray-500 mb-4">Bu adım opsiyoneldir. İsterseniz atlayabilirsiniz.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Okul</label>
                    {loadingSchools ? (
                      <div className="flex items-center gap-2 py-3 text-gray-400">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-gray-300 border-t-yub-primary rounded-full" />
                        Okullar yükleniyor...
                      </div>
                    ) : (
                      <select
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary outline-none"
                      >
                        <option value="">Okul seçin (opsiyonel)</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name} - {s.city}/{s.district}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedSchool && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Öğretmen</label>
                      {loadingTeachers ? (
                        <div className="flex items-center gap-2 py-3 text-gray-400">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-gray-300 border-t-yub-primary rounded-full" />
                          Öğretmenler yükleniyor...
                        </div>
                      ) : (
                        <select
                          value={selectedTeacher}
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yub-primary outline-none"
                        >
                          <option value="">Öğretmen seçin (opsiyonel)</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                          ))}
                        </select>
                      )}
                    </motion.div>
                  )}

                  <form onSubmit={handleAddChild} className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-3 text-gray-500 hover:text-gray-700 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all"
                    >
                      ← Geri
                    </button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 bg-gradient-to-r from-yub-primary to-yub-accent text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Çocuğu Kaydet
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ═══════ STEP 5: Credential Display ═══════ */}
            {step === 5 && childResult && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: 2, duration: 0.5 }}
                    className="text-5xl mb-3"
                  >
                    🎮
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-800">{childResult.student_name} Kaydedildi!</h2>
                  <p className="text-sm text-gray-500 mt-1">{childResult.message}</p>
                </div>

                {/* Credential Card */}
                <div className="bg-gradient-to-br from-yub-primary/10 to-yub-secondary/10 rounded-2xl p-5 mb-5 border-2 border-yub-primary/20">
                  <p className="text-sm font-semibold text-gray-600 mb-3 text-center">
                    🔑 Çocuğunuzun giriş bilgileri:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                      <div>
                        <div className="text-xs text-gray-500">Kullanıcı Adı</div>
                        <div className="font-bold text-lg text-gray-800 font-mono">{childResult.username}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(childResult.username, 'username')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'username' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                      <div>
                        <div className="text-xs text-gray-500">Şifre</div>
                        <div className="font-bold text-lg text-gray-800 font-mono">{childResult.plain_password}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(childResult.plain_password, 'password')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'password' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center"
                  >
                    ⚠️ Bu bilgileri kaydedin! Şifre tekrar gösterilmeyecektir.
                  </motion.div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetChildForm}
                    className="w-full py-3 bg-gradient-to-r from-yub-primary to-yub-secondary text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Başka Çocuk Ekle
                  </motion.button>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm"
                  >
                    Panele Git →
                  </button>
                </div>

                {/* Added children summary */}
                {addedChildren.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Eklenen çocuklar ({addedChildren.length}):</p>
                    <div className="space-y-1">
                      {addedChildren.map((c, i) => (
                        <div key={i} className="text-xs text-gray-600 flex justify-between">
                          <span>{c.student_name}</span>
                          <span className="font-mono text-gray-400">{c.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
