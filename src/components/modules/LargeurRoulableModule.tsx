import React from 'react';
import { FunctionLevel } from '../../types/arp';
import { calculateLargeurRoulable } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Columns3, CheckCircle2, Bike, Info } from 'lucide-react';

interface Props {
  data: {
    functionLevel: FunctionLevel;
    tmja: number;
    heavyVehiclesPL: number;
  };
  onChange: (d: {
    functionLevel: FunctionLevel;
    tmja: number;
    heavyVehiclesPL: number;
  }) => void;
}

export const LargeurRoulableModule: React.FC<Props> = ({
  data,
  onChange
}) => {
  const result = calculateLargeurRoulable(data);

  const handleFunctionChange = (lvl: FunctionLevel) => {
    onChange({ ...data, functionLevel: lvl });
  };

  const handleNumberChange = (field: 'tmja' | 'heavyVehiclesPL', valStr: string) => {
    const val = parseInt(valStr);
    if (!isNaN(val) && val >= 0) {
      onChange({ ...data, [field]: val });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-800 mb-1">
            <span>Guide ARP 2022 · Chapitre 6 §2.1 (Tableau 14, p.90)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Columns3 className="w-5 h-5 text-amber-800" />
            <span>Largeur Roulable Réduite — Relief Difficile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dimensionnement minimal de la chaussée et de la bande dérasée de droite (BDD) selon le niveau de fonctions.
          </p>
        </div>
      </div>

      {/* Input parameters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Paramètres de Trafic et Niveau de Fonctions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Function level */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Niveau de fonctions de la route (Tableau 14)
            </label>
            <div className="flex flex-col gap-1.5">
              {(['eleve', 'intermediaire', 'modere'] as FunctionLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleFunctionChange(lvl)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-all ${
                    data.functionLevel === lvl
                      ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Niveau {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* TMJA */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              TMJA du projet (véh./j)
            </label>
            <input
              type="number"
              step="100"
              min="0"
              max="50000"
              value={data.tmja}
              onChange={(e) => handleNumberChange('tmja', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-amber-800 mb-2"
            />
            <p className="text-[11px] text-slate-500">
              Seuil dérogation : TMJA &lt; 2 000 véh./j.
            </p>
          </div>

          {/* Heavy vehicles */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Trafic poids lourds (PL/j)
            </label>
            <input
              type="number"
              step="10"
              min="0"
              max="5000"
              value={data.heavyVehiclesPL}
              onChange={(e) => handleNumberChange('heavyVehiclesPL', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-amber-800 mb-2"
            />
            <p className="text-[11px] text-slate-500">
              Seuil dérogation : PL &lt; 100 PL/j.
            </p>
          </div>
        </div>
      </div>

      {/* Results Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Largeurs Retenues (Tableau 14, p.90)
          </span>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 block">Largeur de chaussée</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {result.recommendedRoadwayWidth.toFixed(2)} m
              </div>
              <span className="text-[11px] text-slate-500">2 voies de circulation</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-xs text-amber-900 font-semibold block">Largeur BDD (chaque rive)</span>
              <div className="text-2xl font-bold font-mono text-amber-950 mt-0.5">
                {result.recommendedBDDWidth.toFixed(2)} m
              </div>
              <span className="text-[11px] text-amber-800">Bande dérasée droite</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500">Largeur roulable totale (Chaussée + 2 BDD)</span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
                {result.totalRoulableWidth.toFixed(2)} m
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              Plateforme compacte
            </div>
          </div>

          {result.isReducedTrafficCondition && data.functionLevel === 'modere' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Condition trafic réduit remplie (TMJA &lt; 2 000 et PL &lt; 100)
              </div>
              <p>
                Le guide autorise de ramener la BDD à 1,25 m, voire exceptionnellement à 1,00 m (avec chaussée de 5,50 m).
              </p>
            </div>
          )}
        </div>

        {/* Bicycle & Asymmetry Notice */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-900" />
              <span>Prise en Compte des Cycles & Dissymétrie de BDD</span>
            </h3>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                En relief difficile, une <strong>dissymétrie de largeur des BDD</strong>, au bénéfice du sens de circulation montant (rampe), peut s’envisager pour favoriser la circulation des cyclistes qui évoluent à vitesse réduite et ont besoin d'un couloir de dégagement élargi.
              </p>
              <p>
                Par exemple : BDD montante de <strong>1,75 m à 2,00 m</strong> et BDD descendante de <strong>1,25 m à 1,50 m</strong>, tout en conservant une largeur roulable globale constante.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500">
            Source : Chapitre 6 §2.1 (p.90) · Recommandation Cerema mobilités actives
          </div>
        </div>
      </div>

      {/* Step card */}
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={true}
      />
    </div>
  );
};
