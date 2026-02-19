import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * Chapter 19 – SRSD Story Writing
 * Self-Regulated Strategy Development: character, setting, problem, events, solution, ending
 */

const STORY_MAP_FIELDS = [
  { key: 'character', label: 'Karakter 👤', hint: 'Ana karakter kim?', emoji: '👤', color: 'border-blue-300 bg-blue-50' },
  { key: 'setting', label: 'Mekan 📍', hint: 'Hikaye nerede geçiyor?', emoji: '📍', color: 'border-green-300 bg-green-50' },
  { key: 'problem', label: 'Problem ⚡', hint: 'Karakter ne sorunla karşılaşıyor?', emoji: '⚡', color: 'border-red-300 bg-red-50' },
  { key: 'events', label: 'Olaylar 🎭', hint: 'Neler yaşanıyor? (en az 2 olay)', emoji: '🎭', color: 'border-purple-300 bg-purple-50' },
  { key: 'solution', label: 'Çözüm 💡', hint: 'Problem nasıl çözülüyor?', emoji: '💡', color: 'border-yellow-300 bg-yellow-50' },
  { key: 'ending', label: 'Son 🎬', hint: 'Hikaye nasıl bitiyor?', emoji: '🎬', color: 'border-pink-300 bg-pink-50' },
];

type Phase = 'plan' | 'write' | 'review';

export default function StoryWritingGame({ onComplete }: GameProps) {
  const [phase, setPhase] = useState<Phase>('plan');
  const [map, setMap] = useState<Record<string, string>>(
    Object.fromEntries(STORY_MAP_FIELDS.map(f => [f.key, '']))
  );
  const [story, setStory] = useState('');
  const [score, setScore] = useState(0);

  // Plan phase: Fill story map
  const handleFinishPlan = useCallback(() => {
    const filled = Object.values(map).filter(v => v.trim().length > 0).length;
    if (filled < 4) {
      playSound('wrong');
      return;
    }
    playSound('correct');
    setScore(30);
    setPhase('write');
  }, [map]);

  // Write phase: Compose story
  const handleFinishWrite = useCallback(() => {
    if (story.trim().split(/\s+/).length < 10) {
      playSound('wrong');
      return;
    }
    playSound('correct');
    setScore(prev => prev + 40);
    setPhase('review');
  }, [story]);

  // Review: Simple self-check
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const reviewItems = [
    'Karakterimi tanıttım mı?',
    'Problemi açıkça yazdım mı?',
    'Olayları sırayla anlattım mı?',
    'Hikayenin sonu var mı?',
  ];

  const handleFinishReview = useCallback(() => {
    const checked = checks.filter(Boolean).length;
    setScore(prev => prev + checked * 7 + 2);
    playSound('complete');
    onComplete(Math.min(100, score + checked * 7 + 2));
  }, [checks, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Phase indicator */}
      <div className="flex justify-center gap-2 mb-4">
        {[
          { key: 'plan', label: 'Planla', emoji: '🗺️' },
          { key: 'write', label: 'Yaz', emoji: '✏️' },
          { key: 'review', label: 'Kontrol Et', emoji: '🔍' },
        ].map((p) => (
          <div key={p.key}
            className={`px-3 py-1 rounded-full text-sm font-bold ${phase === p.key ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
          >
            {p.emoji} {p.label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-5">
        <AnimatePresence mode="wait">
          {/* PLAN PHASE */}
          {phase === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-lg font-bold text-red-800 text-center mb-1">
                <BookOpen className="inline w-5 h-5 mr-1" /> Hikaye Haritası (SRSD)
              </h3>
              <p className="text-sm text-red-600 text-center mb-4">Her alanı doldurarak hikayeni planla</p>

              <div className="space-y-2">
                {STORY_MAP_FIELDS.map((field) => (
                  <div key={field.key} className={`rounded-xl border-2 p-3 ${field.color}`}>
                    <label className="text-sm font-bold flex items-center gap-1 mb-1">
                      <span>{field.emoji}</span> {field.label}
                    </label>
                    <input
                      type="text"
                      value={map[field.key]}
                      onChange={(e) => setMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-300"
                      placeholder={field.hint}
                    />
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinishPlan}
                className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
              >
                Planım Tamam, Yazmaya Geç! ✏️
              </motion.button>
            </motion.div>
          )}

          {/* WRITE PHASE */}
          {phase === 'write' && (
            <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-lg font-bold text-red-800 text-center mb-1">Hikayeni Yaz ✏️</h3>

              {/* Mini story map reference */}
              <div className="flex flex-wrap gap-1 mb-3 justify-center">
                {STORY_MAP_FIELDS.filter(f => map[f.key].trim()).map(f => (
                  <span key={f.key} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {f.emoji} {map[f.key].substring(0, 20)}
                  </span>
                ))}
              </div>

              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="w-full p-3 border-2 border-red-200 rounded-xl bg-red-50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={10}
                placeholder="Hikayeni buraya yaz... Plan haritandaki bilgileri kullan!"
              />

              <p className="text-xs text-gray-400 text-right mt-1">
                {story.trim().split(/\s+/).filter(Boolean).length} kelime (en az 10)
              </p>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinishWrite}
                className="w-full mt-3 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
              >
                Hikayemi Kontrol Et 🔍
              </motion.button>
            </motion.div>
          )}

          {/* REVIEW PHASE */}
          {phase === 'review' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-lg font-bold text-red-800 text-center mb-1">
                <Sparkles className="inline w-5 h-5 mr-1" /> Kendini Değerlendir
              </h3>
              <p className="text-sm text-red-600 text-center mb-4">Hikayeni kontrol et</p>

              {/* Story preview */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto text-sm border">
                {story}
              </div>

              {/* Self-check */}
              <div className="space-y-2 mb-4">
                {reviewItems.map((item, i) => (
                  <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={() => {
                        const copy = [...checks];
                        copy[i] = !copy[i];
                        setChecks(copy);
                      }}
                      className="w-5 h-5 rounded accent-red-500"
                    />
                    <span className={`text-sm ${checks[i] ? 'text-green-700 font-bold' : 'text-gray-700'}`}>{item}</span>
                  </label>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinishReview}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
              >
                Tamamla! 🎉
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center mt-3 text-sm text-gray-500">
        Puan: <span className="font-bold text-red-600">{score}</span>
      </div>
    </div>
  );
}
