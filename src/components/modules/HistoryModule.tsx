import React from 'react';
import { CalculationHistoryEntry } from '../../types/arp';
import { History, Trash2, Clock, RotateCcw } from 'lucide-react';

interface Props {
  history: CalculationHistoryEntry[];
  onClearHistory: () => void;
  onRestoreSnapshot?: (entry: CalculationHistoryEntry) => void;
}

export const HistoryModule: React.FC<Props> = ({
  history,
  onClearHistory,
  onRestoreSnapshot
}) => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-sky-900" />
            <span>Historique des Calculs et Itérations du Projet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité des modifications, dates, paramètres d'entrée et valeurs numériques obtenues.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer l'historique</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-xs text-center text-slate-500 text-xs">
          Aucun historique enregistré pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500">{entry.timestamp}</span>
                  <span className="font-bold text-slate-900">· {entry.moduleName}</span>
                </div>

                {onRestoreSnapshot && (
                  <button
                    onClick={() => onRestoreSnapshot(entry)}
                    className="text-xs text-sky-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurer ces paramètres</span>
                  </button>
                )}
              </div>

              <p className="text-slate-700 font-medium">
                {entry.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100 font-mono text-[11px]">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-400 block font-sans font-semibold mb-0.5">Paramètres :</span>
                  {JSON.stringify(entry.paramsSnapshot)}
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-400 block font-sans font-semibold mb-0.5">Résultats :</span>
                  {JSON.stringify(entry.resultsSnapshot)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
