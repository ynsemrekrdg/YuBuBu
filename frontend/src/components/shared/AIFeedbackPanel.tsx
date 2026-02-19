/**
 * AIFeedbackPanel — Aktivite/oturum sonrası AI geri bildirim paneli.
 * Otomatik oturum analizi tetikler ve sonuçları gösterir.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { useSessionAnalysis, useNextSteps } from '../../hooks/useAIActivity';
import type { SessionAnalysisResponse, NextStepsResponse } from '../../services/ai-activity.service';

interface AIFeedbackPanelProps {
  /** Bölüm bilgileri */
  chapterId: string;
  chapterTitle: string;
  activityType: string;
  /** Oturum verileri */
  scores: number[];
  timeSpent: number;
  hintsUsed: number;
  errors?: { type: string; count: number }[];
  /** Ekstra bağlam */
  learningDifficulty?: string;
  /** Paneli otomatik tetikle */
  autoAnalyze?: boolean;
  /** Analiz sonucu callback */
  onAnalysisComplete?: (analysis: SessionAnalysisResponse, nextSteps: NextStepsResponse) => void;
  /** Kompakt mod */
  compact?: boolean;
}

export default function AIFeedbackPanel({
  chapterId,
  chapterTitle,
  activityType,
  scores,
  timeSpent,
  hintsUsed,
  errors = [],
  autoAnalyze = true,
  onAnalysisComplete,
  compact = false,
}: AIFeedbackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [analysis, setAnalysis] = useState<SessionAnalysisResponse | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStepsResponse | null>(null);

  const sessionMutation = useSessionAnalysis();
  const nextStepsMutation = useNextSteps();

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const isLoading = sessionMutation.isPending || nextStepsMutation.isPending;

  // Otomatik analiz tetikleme
  useEffect(() => {
    if (!autoAnalyze || analysis) return;

    const runAnalysis = async () => {
      try {
        // Katman 2: Oturum analizi
        const sessionResult = await sessionMutation.mutateAsync({
          session_data: {
            chapter_id: chapterId,
            chapter_title: chapterTitle,
            activity_type: activityType,
            activities_completed: scores.length,
            time_spent: timeSpent,
            hints_used: hintsUsed,
            errors,
            scores,
          },
        });
        setAnalysis(sessionResult);

        // Katman 2: Sonraki adım
        const nextResult = await nextStepsMutation.mutateAsync({
          current_chapter_id: chapterId,
          performance_summary: {
            chapter_title: chapterTitle,
            average_score: avgScore,
            dominant_error: sessionResult.dominant_error,
            severity: sessionResult.severity,
            intervention_needed: sessionResult.intervention_needed,
          },
        });
        setNextSteps(nextResult);

        onAnalysisComplete?.(sessionResult, nextResult);
      } catch {
        // Sessizce hata yönet — fallback göster
      }
    };

    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze]);

  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'high':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Dikkat Gerekli' };
      case 'medium':
        return { icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50', label: 'İzlenmeli' };
      default:
        return { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', label: 'İyi Gidiyor' };
    }
  };

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'advance':
        return { icon: TrendingUp, color: 'text-green-600', label: 'Sonraki Bölüme Geç!' };
      case 'review':
        return { icon: BookOpen, color: 'text-amber-600', label: 'Tekrar Et' };
      case 'intervene':
        return { icon: AlertTriangle, color: 'text-red-600', label: 'Özel Destek' };
      default:
        return { icon: Minus, color: 'text-blue-600', label: 'Devam Et' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors"
      >
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-gray-800 text-sm">AI Analiz Raporu</h3>
          {isLoading && (
            <p className="text-xs text-gray-500">Analiz ediliyor...</p>
          )}
          {analysis && !isLoading && (
            <p className="text-xs text-gray-500">
              {analysis.session_summary.slice(0, 60)}...
            </p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-6 gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </motion.div>
                  <span className="text-sm text-gray-500">AI analiz yapıyor...</span>
                </div>
              )}

              {/* Oturum Analizi */}
              {analysis && !isLoading && (
                <>
                  {/* Ciddiyet göstergesi */}
                  {(() => {
                    const info = getSeverityInfo(analysis.severity);
                    const Icon = info.icon;
                    return (
                      <div className={`flex items-center gap-2 px-3 py-2 ${info.bg} rounded-xl`}>
                        <Icon className={`w-5 h-5 ${info.color}`} />
                        <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
                        {analysis.dominant_error !== 'none' && (
                          <span className="text-xs text-gray-500 ml-auto">
                            Baskın hata: {analysis.dominant_error}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Pozitif gözlemler */}
                  {analysis.positive_observations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-green-600 mb-1">✅ Güçlü Yönler</h4>
                      <ul className="space-y-1">
                        {analysis.positive_observations.map((obs, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 shrink-0">•</span>
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Öğretmen notu */}
                  {analysis.teacher_note && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <h4 className="text-xs font-bold text-blue-600 mb-1">👩‍🏫 Öğretmen Notu</h4>
                      <p className="text-sm text-blue-800">{analysis.teacher_note}</p>
                    </div>
                  )}

                  {/* Veli notu */}
                  {analysis.parent_note && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <h4 className="text-xs font-bold text-emerald-600 mb-1">👨‍👩‍👧 Veli Notu</h4>
                      <p className="text-sm text-emerald-800">{analysis.parent_note}</p>
                    </div>
                  )}

                  {/* Müdahale uyarısı */}
                  {analysis.intervention_needed && analysis.intervention_type && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <h4 className="text-xs font-bold text-red-600 mb-1">⚠️ Ek Destek Önerilir</h4>
                      <p className="text-sm text-red-800">
                        Önerilen müdahale: <strong>{analysis.intervention_type}</strong>
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Sonraki Adım */}
              {nextSteps && !isLoading && (
                <div className="border-t pt-3">
                  {(() => {
                    const info = getActionInfo(nextSteps.next_action);
                    const Icon = info.icon;
                    return (
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${info.color}`} />
                        <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
                      </div>
                    );
                  })()}
                  <p className="text-sm text-gray-600">{nextSteps.reason}</p>
                  {nextSteps.encouragement && (
                    <p className="text-sm font-medium text-purple-600 mt-2">
                      {nextSteps.encouragement}
                    </p>
                  )}
                </div>
              )}

              {/* Fallback — analiz edilemedi */}
              {!isLoading && !analysis && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Puan: <strong>{avgScore}</strong> | Süre: {Math.round(timeSpent / 60)}dk | İpucu: {hintsUsed}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
