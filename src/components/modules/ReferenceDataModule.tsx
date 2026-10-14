import React, { useState } from 'react';
import { ARP_RULES_REGISTRY, ROAD_TYPES_DATA } from '../../data/arpReferenceData';
import { exportTableToCsv } from '../../utils/storage';
import { Search, Filter, ShieldCheck, Download, BookOpen, Layers } from 'lucide-react';

export const ReferenceDataModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');

  const chapters = [
    { id: 'all', label: 'Tous les chapitres' },
    { id: 'Chapitre 1', label: 'Chapitre 1 — Conception générale' },
    { id: 'Chapitre 2', label: 'Chapitre 2 — Visibilité' },
    { id: 'Chapitre 3', label: 'Chapitre 3 — Profil en travers' },
    { id: 'Chapitre 4', label: 'Chapitre 4 — Tracé en plan & profil en long' },
    { id: 'Chapitre 6', label: 'Chapitre 6 — Relief difficile & site contraint' }
  ];

  const filteredRules = ARP_RULES_REGISTRY.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.formula && r.formula.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.table && r.table.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesChapter =
      selectedChapter === 'all' || r.chapter.toLowerCase().includes(selectedChapter.toLowerCase());

    return matchesSearch && matchesChapter;
  });

  const handleExportCsv = () => {
    const headers = ['Identifiant', 'Titre', 'Chapitre', 'Section', 'Tableau', 'Page', 'Formule / Valeur', 'Statut', 'Description'];
    const rows = filteredRules.map(r => [
      r.id,
      r.title,
      r.chapter,
      r.section,
      r.table || '',
      r.page,
      r.formula || '',
      r.status,
      r.description
    ]);
    exportTableToCsv('Donnees_Reference_ARP_Cerema_2022', headers, rows);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bibliothèque des Données de Référence ARP (Cerema 2022)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tableaux normatifs officiels, formules littérales, seuils de sécurité et traçabilité réglementaire complète.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter les règles (CSV)</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par mot-clé, formule, tableau (ex: Tableau 10, Rm, 1/R, clothoïde)..."
            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-800"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-sky-800"
          >
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Registry Cards */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {rule.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {rule.title}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                  <span>{rule.chapter}</span>
                  <span>·</span>
                  <span>{rule.section}</span>
                  {rule.table && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{rule.table}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{rule.page}</span>
                </div>
              </div>

              <div className="shrink-0">
                {rule.status === 'CONFIRME_OFFICIEL' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Confirmé officiel Cerema 2022</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    <span>À confirmer dans le guide ARP</span>
                  </span>
                )}
              </div>
            </div>

            {rule.formula && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono text-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold mb-0.5">
                  Formule / Valeurs de référence
                </span>
                {rule.formula}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {rule.description}
            </p>
          </div>
        ))}
      </div>

      {/* Official Road Types Reference Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-900" />
          <span>Typologie des Routes Traitées par le Guide ARP (Tableau 1, p.19)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Désignation</th>
                <th className="py-2.5 px-3 font-semibold">Profil chaussée</th>
                <th className="py-2.5 px-3 font-semibold">VMA</th>
                <th className="py-2.5 px-3 font-semibold">Trafic indicatif</th>
                <th className="py-2.5 px-3 font-semibold">Carrefours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROAD_TYPES_DATA.map((rt) => (
                <tr key={rt.type} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-900">{rt.type}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{rt.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{rt.chaussees} · {rt.voies}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{rt.vma}</td>
                  <td className="py-2.5 px-3 text-slate-600">{rt.domainTrafic}</td>
                  <td className="py-2.5 px-3 text-slate-600">{rt.carrefours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
