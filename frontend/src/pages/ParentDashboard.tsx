import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trophy, Star, BookOpen, Copy, Check, X,
  GraduationCap, School, Sparkles, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth.service';
import type {
  ChildInfo, LearningDifficulty, School as SchoolType, TeacherInfo, StudentRegisterResponse,
} from '../types';
import { DIFFICULTY_THEMES } from '../types';

const DIFFICULTIES: { value: LearningDifficulty; label: string; emoji: string }[] = [
  { value: 'dyslexia', label: 'Disleksi', emoji: '📖' },
  { value: 'dysgraphia', label: 'Disgrafi', emoji: '✍️' },
  { value: 'dyscalculia', label: 'Diskalkuli', emoji: '🔢' },
];

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ParentDashboard() {
  const { user } = useAuthStore();

  // ─── Children state ───
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  // ─── Add child modal ───
  const [showAddChild, setShowAddChild] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2 | 3>(1); // 1=info, 2=school, 3=credentials

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

  // ─── General ───
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  // ─── Fetch children ───
  const fetchChildren = useCallback(async () => {
    try {
      setLoadingChildren(true);
      const res = await authService.getMyChildren();
      setChildren(res.children);
    } catch {
      // silent
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // ─── Load schools when step 2 ───
  useEffect(() => {
    if (addStep === 2 && schools.length === 0) {
      setLoadingSchools(true);
      authService.getSchools()
        .then(setSchools)
        .catch(() => {})
        .finally(() => setLoadingSchools(false));
    }
  }, [addStep]);

  // ─── Load teachers when school changes ───
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

  // ─── Submit child ───
  const handleAddChild = async () => {
    setError('');
    setSubmitting(true);
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
      setAddStep(3);
      // Refresh children list
      fetchChildren();
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.detail || 'Çocuk eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetAndCloseModal = () => {
    setShowAddChild(false);
    setAddStep(1);
    setChildName('');
    setChildAge(7);
    setChildGrade(1);
    setDifficulty('dyslexia');
    setSelectedSchool('');
    setSelectedTeacher('');
    setChildResult(null);
    setError('');
  };

  const resetForAnother = () => {
    setAddStep(1);
    setChildName('');
    setChildAge(7);
    setChildGrade(1);
    setDifficulty('dyslexia');
    setSelectedSchool('');
    setSelectedTeacher('');
    setChildResult(null);
    setError('');
  };

  // ─── Stats ───
  const totalChildren = children.length;
  const avgScore = totalChildren
    ? Math.round(children.reduce((sum, c) => sum + c.total_score, 0) / totalChildren)
    : 0;
  const totalStreak = children.reduce((sum, c) => sum + c.streak_days, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-fun font-bold text-gray-800">
              Hoş Geldiniz, {user?.name?.split(' ')[0]}! 👨‍👩‍👧
            </h1>
            <p className="text-gray-500 mt-1">Çocuklarınızın öğrenme yolculuğunu takip edin</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddChild(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Çocuk Ekle
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Users className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{totalChildren}</div>
            <div className="text-xs text-gray-500">Kayıtlı Çocuk</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Star className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{avgScore}</div>
            <div className="text-xs text-gray-500">Ort. Puan</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{totalStreak}</div>
            <div className="text-xs text-gray-500">Toplam Seri</div>
          </div>
        </motion.div>

        {/* Children List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Çocuklarım</h2>
          <button onClick={fetchChildren} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loadingChildren ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingChildren && children.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-3 border-gray-200 border-t-purple-500 rounded-full mx-auto mb-3" />
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        ) : children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm text-center"
          >
            <div className="text-5xl mb-4">👶</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Henüz Çocuk Eklenmemiş</h3>
            <p className="text-gray-500 text-sm mb-4">
              Çocuğunuzu ekleyerek öğrenme yolculuğuna başlayın!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddChild(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold shadow-lg"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              İlk Çocuğu Ekle
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {children.map((child, index) => {
              const theme = DIFFICULTY_THEMES[child.learning_difficulty];
              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Child header */}
                  <div className={`${theme.bg} px-5 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{theme.emoji}</span>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{child.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{child.age} yaş</span>
                          {child.grade && <span>• {child.grade}. sınıf</span>}
                          <span>• {theme.label}</span>
                        </div>
                      </div>
                    </div>
                    {child.username && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Kullanıcı adı</div>
                        <div className="font-mono text-sm font-bold text-gray-700">{child.username}</div>
                      </div>
                    )}
                  </div>

                  {/* Child stats */}
                  <div className="px-5 py-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-800">{child.current_level}</div>
                      <div className="text-xs text-gray-500">Seviye</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-800">{child.total_score}</div>
                      <div className="text-xs text-gray-500">Puan</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-800">{child.streak_days}</div>
                      <div className="text-xs text-gray-500">Seri Gün</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 mt-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🤖</span>
            <h3 className="font-bold text-gray-800">AI Önerileri</h3>
          </div>
          <p className="text-sm text-gray-600">
            Yapay zeka analizi, çocuğunuzun güçlü ve geliştirilmesi gereken
            alanlarını belirleyerek size özel öneriler sunacak.
          </p>
        </motion.div>
      </div>

      {/* ═══════ ADD CHILD MODAL ═══════ */}
      <AnimatePresence>
        {showAddChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) resetAndCloseModal(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 pb-0">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                  <h2 className="text-xl font-bold text-gray-800">
                    {addStep === 3 ? 'Kayıt Başarılı!' : 'Çocuk Ekle'}
                  </h2>
                </div>
                <button onClick={resetAndCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-1.5 px-5 pt-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${s <= addStep ? 'bg-purple-500' : 'bg-gray-200'}`} />
                ))}
              </div>

              <div className="p-5">
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
                  {/* ─── Step 1: Child info ─── */}
                  {addStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Çocuğun Adı Soyadı</label>
                        <input
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                          placeholder="Çocuğunuzun adı soyadı"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Yaş</label>
                          <select value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none">
                            {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(a => (
                              <option key={a} value={a}>{a} yaş</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Sınıf</label>
                          <select value={childGrade} onChange={(e) => setChildGrade(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none">
                            {GRADES.map(g => (
                              <option key={g} value={g}>{g}. Sınıf</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Öğrenme Güçlüğü</label>
                        <div className="grid grid-cols-3 gap-2">
                          {DIFFICULTIES.map((d) => (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => setDifficulty(d.value)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                                difficulty === d.value ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-2xl">{d.emoji}</span>
                              <span className="font-bold text-xs text-gray-700">{d.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!childName.trim()}
                        onClick={() => setAddStep(2)}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-opacity"
                      >
                        Okul Seçimi →
                      </button>
                    </motion.div>
                  )}

                  {/* ─── Step 2: School & teacher ─── */}
                  {addStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                      <p className="text-sm text-gray-500">Bu adım opsiyoneldir. İsterseniz atlayabilirsiniz.</p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                          <School className="w-4 h-4 inline mr-1" />
                          Okul
                        </label>
                        {loadingSchools ? (
                          <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full" />
                            Okullar yükleniyor...
                          </div>
                        ) : (
                          <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none">
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
                            <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full" />
                              Öğretmenler yükleniyor...
                            </div>
                          ) : (
                            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none">
                              <option value="">Öğretmen seçin (opsiyonel)</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.branch})</option>
                              ))}
                            </select>
                          )}
                        </motion.div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setAddStep(1)} className="px-4 py-3 text-gray-500 hover:text-gray-700 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all">
                          ← Geri
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleAddChild}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Çocuğu Kaydet
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── Step 3: Credentials display ─── */}
                  {addStep === 3 && childResult && (
                    <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <div className="text-center mb-4">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 2, duration: 0.5 }} className="text-5xl mb-2">🎉</motion.div>
                        <p className="font-bold text-gray-800">{childResult.student_name}</p>
                        <p className="text-sm text-gray-500">{childResult.message}</p>
                      </div>

                      {/* Credential card */}
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 mb-4 border-2 border-purple-100">
                        <p className="text-sm font-semibold text-gray-600 mb-3 text-center">🔑 Giriş Bilgileri</p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                            <div>
                              <div className="text-xs text-gray-500">Kullanıcı Adı</div>
                              <div className="font-bold text-gray-800 font-mono">{childResult.username}</div>
                            </div>
                            <button onClick={() => copyToClipboard(childResult.username, 'username')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              {copiedField === 'username' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                            <div>
                              <div className="text-xs text-gray-500">Şifre</div>
                              <div className="font-bold text-gray-800 font-mono">
                                {showPassword ? childResult.plain_password : '••••••••'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                              </button>
                              <button onClick={() => copyToClipboard(childResult.plain_password, 'password')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                {copiedField === 'password' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center">
                          ⚠️ Bu bilgileri kaydedin! Şifre tekrar gösterilmeyecektir.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button onClick={resetForAnother} className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" />
                          Başka Çocuk Ekle
                        </button>
                        <button onClick={resetAndCloseModal} className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
                          Kapat
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
