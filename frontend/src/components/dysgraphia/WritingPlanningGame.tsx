import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Map, Lightbulb, HelpCircle } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

type OrganizerType = 'mindmap' | '5w1h' | 'bme';

interface Step {
  type: OrganizerType;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { type: 'mindmap', title: 'Zihin Haritası', description: 'Ana fikir etrafında alt fikirler oluştur' },
  { type: '5w1h', title: '5N1K Planlayıcı', description: 'Yazının planını 5N1K soruları ile kur' },
  { type: 'bme', title: 'Başlangıç-Gelişme-Sonuç', description: 'Yazını 3 bölüme ayır' },
];

const TOPICS = ['Okuldaki En Güzel Günüm', 'Hayalimdeki Tatil', 'En Sevdiğim Hayvan'];

export default function WritingPlanningGame({ onComplete }: GameProps) {
  const [step, setStep] = useState(0);
  const [topicIdx, setTopicIdx] = useState(0);
  const [score, setScore] = useState(0);

  // Mind map state
  const [mainIdea, setMainIdea] = useState('');
  const [branches, setBranches] = useState(['', '', '']);

  // 5W1H state
  const [w5h1, setW5h1] = useState({ kim: '', ne: '', nerede: '', nezaman: '', neden: '', nasil: '' });

  // BME state
  const [bme, setBme] = useState({ baslangic: '', gelisme: '', sonuc: '' });

  const currentStep = STEPS[step];

  const validateAndScore = useCallback(() => {
    let valid = false;
    switch (currentStep.type) {
      case 'mindmap':
        valid = mainIdea.trim().length > 0 && branches.filter(b => b.trim().length > 0).length >= 2;
        break;
      case '5w1h':
        valid = Object.values(w5h1).filter(v => v.trim().length > 0).length >= 4;
        break;
      case 'bme':
        valid = Object.values(bme).every(v => v.trim().length > 2);
        break;
    }

    if (valid) {
      playSound('correct');
      setScore(prev => prev + 33);
    } else {
      playSound('wrong');
    }

    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete(Math.min(100, score + 34));
    }
  }, [currentStep.type, mainIdea, branches, w5h1, bme, step, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Adım {step + 1} / {STEPS.length}</span>
        <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-5">
        {/* Topic */}
        <div className="bg-red-50 rounded-xl p-3 text-center mb-4">
          <p className="text-sm text-red-500">Konu:</p>
          <p className="text-lg font-bold text-red-800">{TOPICS[topicIdx]}</p>
        </div>

        <h3 className="text-lg font-bold text-red-800 text-center mb-1">
          <Map className="inline w-5 h-5 mr-1" /> {currentStep.title}
        </h3>
        <p className="text-sm text-red-600 text-center mb-4">{currentStep.description}</p>

        <AnimatePresence mode="wait">
          {/* Mind Map */}
          {currentStep.type === 'mindmap' && (
            <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-center">
                <label className="text-sm text-red-600 font-bold">Ana Fikir</label>
                <input
                  type="text"
                  value={mainIdea}
                  onChange={(e) => setMainIdea(e.target.value)}
                  className="w-full text-center p-3 border-2 border-red-300 rounded-xl text-xl font-bold bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Ana fikir..."
                />
              </div>

              <div className="flex justify-center">
                <div className="w-0.5 h-6 bg-red-300" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {branches.map((b, i) => (
                  <div key={i}>
                    <div className="w-0.5 h-4 bg-red-200 mx-auto" />
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => {
                        const copy = [...branches];
                        copy[i] = e.target.value;
                        setBranches(copy);
                      }}
                      className="w-full text-center p-2 border-2 border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-300"
                      placeholder={`Dal ${i + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <p className="text-xs text-yellow-700">Ana fikri ve en az 2 dal yaz</p>
              </div>
            </motion.div>
          )}

          {/* 5W1H */}
          {currentStep.type === '5w1h' && (
            <motion.div key="5w1h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {[
                { key: 'kim', label: 'Kim?', emoji: '👤' },
                { key: 'ne', label: 'Ne?', emoji: '❓' },
                { key: 'nerede', label: 'Nerede?', emoji: '📍' },
                { key: 'nezaman', label: 'Ne zaman?', emoji: '🕐' },
                { key: 'neden', label: 'Neden?', emoji: '💡' },
                { key: 'nasil', label: 'Nasıl?', emoji: '🔧' },
              ].map(({ key, label, emoji }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-bold text-red-700 w-20">{label}</span>
                  <input
                    type="text"
                    value={w5h1[key as keyof typeof w5h1]}
                    onChange={(e) => setW5h1(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 p-2 border-2 border-red-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                    placeholder="..."
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <p className="text-xs text-yellow-700">En az 4 soruyu doldur</p>
              </div>
            </motion.div>
          )}

          {/* BME */}
          {currentStep.type === 'bme' && (
            <motion.div key="bme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[
                { key: 'baslangic', label: 'Başlangıç 🟢', color: 'border-green-300 bg-green-50', placeholder: 'Hikaye nasıl başlıyor?' },
                { key: 'gelisme', label: 'Gelişme 🟡', color: 'border-yellow-300 bg-yellow-50', placeholder: 'Neler oluyor?' },
                { key: 'sonuc', label: 'Sonuç 🔴', color: 'border-red-300 bg-red-50', placeholder: 'Nasıl bitiyor?' },
              ].map(({ key, label, color, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">{label}</label>
                  <textarea
                    value={bme[key as keyof typeof bme]}
                    onChange={(e) => setBme(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`w-full p-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-300 ${color}`}
                    rows={2}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button whileTap={{ scale: 0.95 }} onClick={validateAndScore}
          className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> {step < STEPS.length - 1 ? 'Kaydet ve Devam Et' : 'Tamamla'}
        </motion.button>
      </div>
    </div>
  );
}
