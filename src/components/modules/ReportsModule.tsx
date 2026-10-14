import React, { useState } from 'react';
import { FullProjectState, exportProjectToJson, exportTableToCsv } from '../../utils/storage';
import {
  calculateDeversNormal,
  calculateClothoideNormal,
  calculateDeversReliefDifficile,
  calculateClothoideReliefDifficile,
  calculateSurlargeurLacet,
  calculateLargeurRoulable,
  runGlobalProjectAudit
} from '../../utils/arpCalculations';
import { FileCheck2, Printer, Download, CheckSquare, Square, Building2, UserCheck, Calendar, ShieldCheck } from 'lucide-react';

interface Props {
  projectState: FullProjectState;
}

export const ReportsModule: React.FC<Props> = ({ projectState }) => {
  const [includeDeversNormal, setIncludeDeversNormal] = useState(true);
  const [includeDeversRD, setIncludeDeversRD] = useState(true);
  const [includeClothoideNormal, setIncludeClothoideNormal] = useState(true);
  const [includeClothoideRD, setIncludeClothoideRD] = useState(true);
  const [includeSurlargeur, setIncludeSurlargeur] = useState(true);
  const [includeLargeur, setIncludeLargeur] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(true);
  const [includeTraceLong, setIncludeTraceLong] = useState(true);

  const { metadata, deversNormal, deversRD, clothoideNormal, clothoideRD, surlargeur, largeurRoulable, traceEnPlan, profilEnLong } = projectState;

  const resDeversNormal = calculateDeversNormal(deversNormal);
  const resDeversRD = calculateDeversReliefDifficile(deversRD);
  const resClothNormal = calculateClothoideNormal(clothoideNormal);
  const resClothRD = calculateClothoideReliefDifficile(clothoideRD);
  const resSurlargeur = calculateSurlargeurLacet(surlargeur);
  const resLargeur = calculateLargeurRoulable(largeurRoulable);

  const alerts = runGlobalProjectAudit({
    category: metadata.category,
    isInterurbaine110: deversNormal.isInterurbaine110,
    radiusNormal: deversNormal.radiusR,
    radiusRD: deversRD.radiusR,
    deversNormal: resDeversNormal.calculatedDevers,
    deversRD: resDeversRD.adoptedDevers,
    longitudinalSlopeRD: deversRD.longitudinalSlopeP,
    clothoideNormalLength: resClothNormal.lengthL,
    clothoideRDLength: clothoideRD.proposedReducedLength,
    minShiftRDLength: resClothRD.minShiftLength,
    tmja: metadata.tmja,
    plDaily: metadata.plDaily,
    traceElements: traceEnPlan.elements,
    profilElements: profilEnLong.elements
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportSynthesisCsv = () => {
    const headers = ['Paramètre', 'Valeur retenue', 'Unité', 'Référence ARP'];
    const rows = [
      ['Catégorie de route', metadata.category, '-', 'Chapitre 1 §3.4'],
      ['Type de route', metadata.roadType, '-', 'Tableau 1'],
      ['VMA', metadata.speedLimitKmh, 'km/h', 'Code de la route'],
      ['TMJA', metadata.tmja, 'véh./j', 'Tableau 2'],
      ['Trafic PL', metadata.plDaily, 'PL/j', 'Tableau 2'],
      ['Dévers cas normal', resDeversNormal.calculatedDevers, '%', 'Tableau 8 & Chap. 3 §4.2'],
      ['Clothoïde cas normal', resClothNormal.lengthL, 'm', 'Tableau 11'],
      ['Dévers relief difficile', resDeversRD.adoptedDevers, '%', 'Chapitre 6 §2.4'],
      ['Pente résultante RD', resDeversRD.resultantSlope, '%', 'Chapitre 6 §3.2 (<= 10%)'],
      ['Largeur chaussée RD', resLargeur.recommendedRoadwayWidth, 'm', 'Tableau 14'],
      ['Largeur BDD RD', resLargeur.recommendedBDDWidth, 'm', 'Tableau 14'],
      ['Surlargeur voie en courbe', resSurlargeur.wideningPerLane, 'm', 'Tableau 6 / §2.2']
    ];
    exportTableToCsv(`Synthese_Calculs_ARP_${metadata.dossierNumber}`, headers, rows);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Screen Controls Header (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-sky-900" />
              <span>Générateur de Rapport Technique & Export</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Édition du mémoire technique de dimensionnement géométrique selon le Guide ARP du Cerema (2022).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={handleExportSynthesisCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Synthèse (CSV)</span>
            </button>
            <button
              onClick={() => exportProjectToJson(projectState)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sauvegarde Complète (JSON)</span>
            </button>
          </div>
        </div>

        {/* Section Inclusion Checkboxes */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
            Sections à inclure dans le dossier technique :
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeDeversNormal} onChange={e => setIncludeDeversNormal(e.target.checked)} className="rounded text-sky-900" />
              <span>Dévers cas normal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeClothoideNormal} onChange={e => setIncludeClothoideNormal(e.target.checked)} className="rounded text-sky-900" />
              <span>Clothoïdes normales</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeDeversRD} onChange={e => setIncludeDeversRD(e.target.checked)} className="rounded text-sky-900" />
              <span>Dévers relief difficile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeClothoideRD} onChange={e => setIncludeClothoideRD(e.target.checked)} className="rounded text-sky-900" />
              <span>Clothoïdes relief difficile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeSurlargeur} onChange={e => setIncludeSurlargeur(e.target.checked)} className="rounded text-sky-900" />
              <span>Surlargeurs & lacets</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeLargeur} onChange={e => setIncludeLargeur(e.target.checked)} className="rounded text-sky-900" />
              <span>Largeur roulable RD</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeTraceLong} onChange={e => setIncludeTraceLong(e.target.checked)} className="rounded text-sky-900" />
              <span>Tracé en plan & profil</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" checked={includeAudit} onChange={e => setIncludeAudit(e.target.checked)} className="rounded text-sky-900" />
              <span>Audit de conformité</span>
            </label>
          </div>
        </div>
      </div>

      {/* PRINTABLE TECHNICAL MEMOIR (A4 / Report Layout) */}
      <div className="bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-sm text-slate-900 space-y-8">
        {/* Report Top Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
              MÉMOIRE TECHNIQUE DE DIMENSIONNEMENT GÉOMÉTRIQUE ROUTIER
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {metadata.name}
            </h1>
            <div className="text-xs font-mono text-slate-600 mt-1">
              Dossier N° : <span className="font-bold text-slate-900">{metadata.dossierNumber}</span> · Version : {metadata.version}
            </div>
          </div>

          <div className="text-left md:text-right text-xs space-y-1">
            <div><span className="text-slate-500">Maître d’ouvrage : </span><strong>{metadata.client}</strong></div>
            <div><span className="text-slate-500">Bureau d’études : </span><strong>{metadata.consultingFirm}</strong></div>
            <div><span className="text-slate-500">Ingénieur responsable : </span><strong>{metadata.leadEngineer}</strong></div>
            <div><span className="text-slate-500">Date d'émission : </span><strong>{metadata.date}</strong></div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            1. Hypothèses Générales & Contexte Réglementaire
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {metadata.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Catégorie</span>
              <strong>Catégorie {metadata.category}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Type de Route</span>
              <strong>Type {metadata.roadType}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Vitesse VMA</span>
              <strong>{metadata.speedLimitKmh} km/h</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Trafic Journalier</span>
              <strong>{metadata.tmja} véh/j ({metadata.plDaily} PL/j)</strong>
            </div>
          </div>
        </div>

        {/* Synthesis Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Synthèse des Résultats de Calculs Géométriques
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="py-2 px-3 border border-slate-200">Composante</th>
                  <th className="py-2 px-3 border border-slate-200">Paramètre d'entrée</th>
                  <th className="py-2 px-3 border border-slate-200 font-mono">Valeur Calculée / Retenue</th>
                  <th className="py-2 px-3 border border-slate-200">Contrôle Réglementaire</th>
                  <th className="py-2 px-3 border border-slate-200">Source ARP 2022</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {includeDeversNormal && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Dévers Cas Normal</td>
                    <td className="py-2 px-3 border border-slate-200">R = {deversNormal.radiusR} m</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">{resDeversNormal.calculatedDevers.toFixed(2)} %</td>
                    <td className="py-2 px-3 border border-slate-200">
                      {resDeversNormal.isRadiusValid ? 'R >= Rm (Conforme)' : 'R < Rm (Non-conforme)'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Chap. 3 §4.2 (p.45)</td>
                  </tr>
                )}
                {includeClothoideNormal && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Clothoïde Cas Normal</td>
                    <td className="py-2 px-3 border border-slate-200">{clothoideNormal.crossSectionType}, R = {clothoideNormal.radiusR} m</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">{resClothNormal.lengthL.toFixed(2)} m</td>
                    <td className="py-2 px-3 border border-slate-200">
                      Gouverné par : {resClothNormal.governingTerm}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Tableau 11 (p.58)</td>
                  </tr>
                )}
                {includeDeversRD && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Dévers Relief Difficile</td>
                    <td className="py-2 px-3 border border-slate-200">R = {deversRD.radiusR} m, p = {deversRD.longitudinalSlopeP}%</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">
                      d = {resDeversRD.adoptedDevers.toFixed(2)} % (P_rés = {resDeversRD.resultantSlope.toFixed(2)}%)
                    </td>
                    <td className="py-2 px-3 border border-slate-200">
                      {resDeversRD.isResultantSlopeCompliant ? 'P_rés <= 10% (Conforme)' : 'P_rés > 10% (Violation)'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Chap. 6 §2.4 (p.91)</td>
                  </tr>
                )}
                {includeClothoideRD && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Clothoïde Relief Difficile</td>
                    <td className="py-2 px-3 border border-slate-200">R = {clothoideRD.radiusR} m</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">
                      {clothoideRD.proposedReducedLength !== undefined ? `${clothoideRD.proposedReducedLength} m (réduite)` : `${resClothRD.normalLength} m (normale)`}
                    </td>
                    <td className="py-2 px-3 border border-slate-200">
                      Seuil Lg/2 = {resClothRD.minShiftLength.toFixed(1)} m ({resClothRD.allowsMinShift ? 'OK' : 'Clothoïde trop courte'})
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Chap. 6 §3.2 (p.92)</td>
                  </tr>
                )}
                {includeSurlargeur && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Surlargeur en Courbe</td>
                    <td className="py-2 px-3 border border-slate-200">R = {surlargeur.innerRadiusR} m</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">
                      +{resSurlargeur.wideningPerLane.toFixed(2)} m / voie (Total : {resSurlargeur.calculatedLaneWidth.toFixed(2)} m)
                    </td>
                    <td className="py-2 px-3 border border-slate-200">
                      {resSurlargeur.requiresSweptPathCheck ? 'Épures requises (R < 125m)' : 'Conforme'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Tableau 6 / p.90</td>
                  </tr>
                )}
                {includeLargeur && (
                  <tr>
                    <td className="py-2 px-3 font-semibold border border-slate-200">Largeur Roulable RD</td>
                    <td className="py-2 px-3 border border-slate-200">Fonction : {largeurRoulable.functionLevel}</td>
                    <td className="py-2 px-3 font-mono font-bold border border-slate-200">
                      Chaussée {resLargeur.recommendedRoadwayWidth} m + 2 BDD {resLargeur.recommendedBDDWidth} m
                    </td>
                    <td className="py-2 px-3 border border-slate-200">Total : {resLargeur.totalRoulableWidth.toFixed(2)} m</td>
                    <td className="py-2 px-3 font-mono text-[11px] border border-slate-200">Tableau 14 (p.90)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Compliance Audit in Report */}
        {includeAudit && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              3. Bilan des Contrôles & Traçabilité des Écarts
            </h2>

            {alerts.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                <strong>Conformité stricte :</strong> Aucun écart réglementaire ni violation de limite n'a été relevé pour les hypothèses renseignées.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {alerts.map(alt => (
                  <div key={alt.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">[{alt.level}] {alt.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">{alt.ruleCitation}</span>
                    </div>
                    <p className="mt-1 text-slate-700">{alt.message}</p>
                    <p className="mt-1 text-sky-950 font-medium">Recommandation : {alt.remedy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signature and Approval Block */}
        <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
              Pour le Bureau d'Études Routières
            </div>
            <div className="text-slate-600">
              {metadata.consultingFirm}<br />
              {metadata.leadEngineer}
            </div>
            <div className="mt-8 border-t border-slate-300 pt-1 text-[11px] text-slate-400">
              Visa et Signature de l'Ingénieur Responsable
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
              Pour le Maître d'Ouvrage
            </div>
            <div className="text-slate-600">
              {metadata.client}<br />
              Direction des Infrastructures & des Mobilités
            </div>
            <div className="mt-8 border-t border-slate-300 pt-1 text-[11px] text-slate-400">
              Bon pour accord / Validation
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-3 text-center leading-relaxed">
          Outil d’aide à la décision technique basé sur les recommandations d'aménagement des routes principales (Guide ARP - Cerema, édition août 2022). Le présent document technique engage la responsabilité du bureau d’études signataire et ne constitue pas une certification ou approbation directe par le Cerema.
        </div>
      </div>
    </div>
  );
};
