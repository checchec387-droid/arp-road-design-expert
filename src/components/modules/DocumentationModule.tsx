import React from 'react';
import { ARP_GLOSSARY } from '../../data/arpReferenceData';
import { BookOpen, Scale, FileText, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const DocumentationModule: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-sky-900" />
          <span>Documentation Technique & Lexique Officiel ARP</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Principes directeurs du guide Cerema ARP (Édition Août 2022), méthodologie d'utilisation et glossaire.
        </p>
      </div>

      {/* Guide Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Scale className="w-4 h-4 text-sky-900" />
          <span>1. Objet et Champ d'Application du Guide ARP (Cerema 2022)</span>
        </h2>

        <div className="text-xs text-slate-700 leading-relaxed space-y-3">
          <p>
            Le guide <strong>Aménagement des routes principales (ARP)</strong> publié par le Cerema en <strong>Août 2022</strong> (ISBN 978-2-37180-564-4) constitue le document de référence national pour la conception géométrique et l'aménagement des routes hors agglomération :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Routes ordinaires bidirectionnelles (Type 4.1) :</strong> 1 chaussée à 2 voies.</li>
            <li><strong>Routes à 3 voies affectées (Type 4.2) :</strong> 1 chaussée avec créneaux alternés (2+1).</li>
            <li><strong>Artères interurbaines (Type 3.1) :</strong> 2 chaussées séparées par un terre-plein central (TPC).</li>
          </ul>
          <p>
            Il consacre les principes du <em>« Système Sûr »</em> : intégration de l'erreur humaine, limitation de la gravité des chocs (zones de sécurité sans obstacle agressif), cohérence dynamique de la géométrie avec la vitesse V85 pratiquée, et prise en compte de tous les usagers (notamment les cyclistes et piétons selon la loi LOM).
          </p>
        </div>
      </div>

      {/* Glossary of Terms */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-900" />
          <span>2. Glossaire des Définitions Techniques du Guide</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARP_GLOSSARY.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 space-y-1">
              <span className="font-bold text-slate-900 text-xs block">
                {item.term}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bibliography & Standards */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-900" />
          <span>3. Références Réglementaires & Textes Associés</span>
        </h2>

        <div className="text-xs text-slate-700 space-y-2">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <strong>Cerema 2022 :</strong> Aménagement des routes principales (ARP) — Chapitres 1, 2, 3, 4, 5, 6, 7, 8 et Annexes A à F.
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <strong>Cerema 2018 :</strong> Guide Révision des règles sur la visibilité et sur les rayons en angle saillant du profil en long (Note technique du 1er octobre 2018).
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <strong>Sétra 1998 :</strong> Guide Aménagement des carrefours interurbains (ACI) sur les routes principales — Carrefours plans.
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <strong>Loi LOM (2019) :</strong> Loi d'orientation des mobilités n° 2019-1428 (Articles L.228-3 et L.228-3-1 du Code de l'environnement pour les mobilités cyclables et piétonnes).
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <strong>RNER :</strong> Arrêté du 2 mars 2009 modifié relatif aux performances des dispositifs de retenue routiers.
          </div>
        </div>
      </div>
    </div>
  );
};
