import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * Chapter 20 – Revision & Editing (CUPS Checklist)
 * C: Capitalization, U: Understanding, P: Punctuation, S: Spelling
 */

interface ErrorItem {
  text: string;
  errors: { word: string; type: 'capital' | 'punctuation' | 'spelling' | 'meaning'; correction: string }[];
}

const TEXTS: ErrorItem[] = [
  {
    text: 'ali dün okula gitti çok mutluydu',
    errors: [
      { word: 'ali', type: 'capital', correction: 'Ali' },
      { word: 'gitti', type: 'punctuation', correction: 'gitti.' },
    ],
  },
  {
    text: 'ankara büyük bir şehirdir türkiyenin başkentidir',
    errors: [
      { word: 'ankara', type: 'capital', correction: 'Ankara' },
      { word: 'şehirdir', type: 'punctuation', correction: 'şehirdir.' },
      { word: 'türkiyenin', type: 'spelling', correction: "Türkiye'nin" },
    ],
  },
  {
    text: 'bugün hava çok güzeldi parkda oyun oynadık',
    errors: [
      { word: 'parkda', type: 'spelling', correction: 'parkta' },
      { word: 'oynadık', type: 'punctuation', correction: 'oynadık.' },
    ],
  },
  {
    text: 'annem yemek pişirdi babam geldi hep birlikde yedik.',
    errors: [
      { word: 'pişirdi', type: 'punctuation', correction: 'pişirdi.' },
      { word: 'birlikde', type: 'spelling', correction: 'birlikte' },
    ],
  },
  {
    text: 'ayşenin kedisi çok tatli küçük ve beyaz',
    errors: [
      { word: 'ayşenin', type: 'capital', correction: "Ayşe'nin" },
      { word: 'tatli', type: 'spelling', correction: 'tatlı' },
      { word: 'beyaz', type: 'punctuation', correction: 'beyaz.' },
    ],
  },
];

const TYPE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  capital: { label: 'Büyük Harf (C)', color: 'bg-blue-100 text-blue-700', emoji: '🔤' },
  punctuation: { label: 'Noktalama (P)', color: 'bg-purple-100 text-purple-700', emoji: '✏️' },
  spelling: { label: 'Yazım (S)', color: 'bg-orange-100 text-orange-700', emoji: '📝' },
  meaning: { label: 'Anlam (U)', color: 'bg-green-100 text-green-700', emoji: '💡' },
};

export default function RevisionEditingGame({ onComplete }: GameProps) {
  const [idx, setIdx] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const text = TEXTS[idx];
  const words = text.text.split(/\s+/);
  const errorWords = new Set(text.errors.map(e => e.word));

  const toggleWord = (word: string) => {
    if (submitted) return;
    const copy = new Set(found);
    if (copy.has(word)) copy.delete(word);
    else copy.add(word);
    setFound(copy);
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const correctlyFound = text.errors.filter(e => found.has(e.word)).length;
    const extraClicks = [...found].filter(w => !errorWords.has(w)).length;
    const pts = Math.max(0, Math.round(((correctlyFound - extraClicks * 0.5) / text.errors.length) * (100 / TEXTS.length)));
    setScore(prev => prev + pts);

    if (correctlyFound > 0) playSound('correct');
    else playSound('wrong');
  }, [text.errors, found, errorWords]);

  const handleNext = useCallback(() => {
    if (idx < TEXTS.length - 1) {
      setIdx(prev => prev + 1);
      setFound(new Set());
      setSubmitted(false);
    } else {
      onComplete(Math.min(100, score));
    }
  }, [idx, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Metin {idx + 1} / {TEXTS.length}</span>
        <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-5">
        <h3 className="text-lg font-bold text-red-800 text-center mb-1">
          <Search className="inline w-5 h-5 mr-1" /> Hataları Bul (CUPS)
        </h3>
        <p className="text-sm text-red-600 text-center mb-4">Hatalı kelimelere tıkla</p>

        {/* CUPS legend */}
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {Object.entries(TYPE_LABELS).map(([key, val]) => (
            <span key={key} className={`text-xs px-2 py-0.5 rounded-full ${val.color} font-bold`}>
              {val.emoji} {val.label}
            </span>
          ))}
        </div>

        {/* Text with clickable words */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 leading-loose">
          {words.map((word, i) => {
            const isError = errorWords.has(word);
            const isSelected = found.has(word);
            const error = text.errors.find(e => e.word === word);

            let cls = 'inline-block px-1 py-0.5 mx-0.5 rounded cursor-pointer transition-all text-lg ';
            if (submitted) {
              if (isError && isSelected) cls += 'bg-green-200 text-green-800 font-bold line-through';
              else if (isError && !isSelected) cls += 'bg-red-200 text-red-800 font-bold underline';
              else if (!isError && isSelected) cls += 'bg-orange-200 text-orange-800';
              else cls += 'text-gray-700';
            } else {
              if (isSelected) cls += 'bg-yellow-200 text-yellow-800 font-bold ring-2 ring-yellow-400';
              else cls += 'text-gray-700 hover:bg-gray-200';
            }

            return (
              <motion.span key={i} whileTap={!submitted ? { scale: 0.9 } : {}}
                onClick={() => toggleWord(word)} className={cls}
              >
                {word}
                {submitted && isError && error && (
                  <span className="text-xs block text-green-600">→ {error.correction}</span>
                )}
              </motion.span>
            );
          })}
        </div>

        {/* Results */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-1">
            {text.errors.map((err, i) => {
              const wasFound = found.has(err.word);
              const info = TYPE_LABELS[err.type];
              return (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${wasFound ? 'bg-green-50' : 'bg-red-50'}`}>
                  {wasFound ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${info.color}`}>{info.emoji}</span>
                  <span className="text-sm">
                    <span className="line-through text-gray-400">{err.word}</span>
                    {' → '}
                    <span className="font-bold text-green-700">{err.correction}</span>
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}

        {!submitted ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Kontrol Et
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> {idx < TEXTS.length - 1 ? 'Sonraki Metin' : 'Bitir'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
