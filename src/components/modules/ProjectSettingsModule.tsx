import React, { useRef } from 'react';
import { ProjectMetadata, RoadCategory, RoadType, FunctionLevel } from '../../types/arp';
import { Save, Upload, Download, RotateCcw, Building2, UserCheck, Calendar, Info } from 'lucide-react';

interface Props {
  metadata: ProjectMetadata;
  onChange: (meta: ProjectMetadata) => void;
  onSave: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetToDefault: () => void;
}

export const ProjectSettingsModule: React.FC<Props> = ({
  metadata,
  onChange,
  onSave,
  onExportJson,
  onImportJson,
  onResetToDefault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProjectMetadata, val: any) => {
    onChange({
      ...metadata,
      [field]: val
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportJson(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Paramètres Généraux du Projet Routier
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définition du cadre réglementaire, classification fonctionnelle (ARP Chapitre 1) et données administratives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
          <button
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser toutes les données aux valeurs par défaut du classeur ARP ?')) {
                onResetToDefault();
              }
            }}
            title="Réinitialiser aux valeurs initiales"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Administrative Information */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Identification du Projet & Bureau d'Études
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nom du projet d’aménagement <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Numéro de dossier technique <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.dossierNumber}
              onChange={(e) => handleInputChange('dossierNumber', e.target.value)}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Maître d'ouvrage (Client)
            </label>
            <input
              type="text"
              value={metadata.client}
              onChange={(e) => handleInputChange('client', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bureau d'études spécialisé
            </label>
            <input
              type="text"
              value={metadata.consultingFirm}
              onChange={(e) => handleInputChange('consultingFirm', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ingénieur responsable de l’étude
            </label>
            <input
              type="text"
              value={metadata.leadEngineer}
              onChange={(e) => handleInputChange('leadEngineer', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date de l'étude
              </label>
              <input
                type="date"
                value={metadata.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Indice / Version
              </label>
              <input
                type="text"
                value={metadata.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description et objectifs du projet
          </label>
          <textarea
            rows={2}
            value={metadata.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Observations techniques particulières
          </label>
          <textarea
            rows={2}
            value={metadata.technicalNotes}
            onChange={(e) => handleInputChange('technicalNotes', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
          />
        </div>
      </div>

      {/* Classification Technique Guide ARP */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          2. Classification Technique selon le Guide ARP (Cerema 2022)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catégorie de route (§3.4, p.19)
            </label>
            <select
              value={metadata.category}
              onChange={(e) => handleInputChange('category', e.target.value as RoadCategory)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 bg-white"
            >
              <option value="R1">R1 — Relief faible, VMA permise en tout point (Rm=240m, Rdn=400m)</option>
              <option value="R2">R2 — Relief vallonné / contraintes, vitesse adaptée (Rm=125m, Rdn=400m)</option>
              <option value="RD">RD — Relief difficile ou site contraint (Chapitre 6 ARP)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              R1 autorise 80 ou 90 km/h en tout point ; R2 requiert une modération en points contraints.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Type de route (§3.3.1, Tableau 1)
            </label>
            <select
              value={metadata.roadType}
              onChange={(e) => handleInputChange('roadType', e.target.value as RoadType)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 bg-white"
            >
              <option value="4.1">Type 4.1 — Route ordinaire (1 chaussée, 2 voies)</option>
              <option value="4.2">Type 4.2 — Route à trois voies affectées</option>
              <option value="3.1">Type 3.1 — Artère interurbaine (2 chaussées, TPC, 2x2)</option>
              <option value="3.2">Type 3.2 — Route à 2 x 1 voie à carrefours plans</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Définit le profil en travers type et les modalités de raccordement.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Niveau de fonctions (§3.5, Tableau 2)
            </label>
            <select
              value={metadata.functionLevel}
              onChange={(e) => handleInputChange('functionLevel', e.target.value as FunctionLevel)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 bg-white"
            >
              <option value="eleve">Élevé (TMJA &gt; 10 000 ou PL &gt; 500/j)</option>
              <option value="intermediaire">Intermédiaire (TMJA 4 000 à 10 000 ou PL 300 à 500)</option>
              <option value="modere">Modéré (TMJA &lt; 4 000 et PL &lt; 300/j)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Conditionne la largeur des voies (3,00m, 3,25m, 3,50m) et des accotements BDD.
            </p>
          </div>
        </div>

        {/* Traffic and Environment */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              TMJA projet (véh./j)
            </label>
            <input
              type="number"
              value={metadata.tmja}
              onChange={(e) => handleInputChange('tmja', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Trafic Poids Lourds (PL/j)
            </label>
            <input
              type="number"
              value={metadata.plDaily}
              onChange={(e) => handleInputChange('plDaily', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vitesse Max. Autorisée (VMA)
            </label>
            <select
              value={metadata.speedLimitKmh}
              onChange={(e) => handleInputChange('speedLimitKmh', parseInt(e.target.value))}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800 bg-white"
            >
              <option value={70}>70 km/h (Approche agglomération / contrainte)</option>
              <option value={80}>80 km/h (Règle générale route bidirectionnelle)</option>
              <option value={90}>90 km/h (Créneau ou dérogation CDSR)</option>
              <option value={110}>110 km/h (Artère interurbaine type 3.1)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={metadata.isWinterSnowFrostZone}
                onChange={(e) => handleInputChange('isWinterSnowFrostZone', e.target.checked)}
                className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
              />
              <span>Zone soumise à neige / verglas</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={metadata.isDifficultReliefSite}
                onChange={(e) => handleInputChange('isDifficultReliefSite', e.target.checked)}
                className="rounded border-slate-300 text-sky-900 focus:ring-sky-800"
              />
              <span>Relief difficile / site contraint</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
