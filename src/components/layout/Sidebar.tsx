import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Settings,
  Database,
  Compass,
  Mountain,
  Spline,
  GitCommit,
  Maximize2,
  Columns3,
  Route,
  Activity,
  Layers,
  ShieldAlert,
  BarChart3,
  FileCheck2,
  History,
  BookOpen,
  Search,
  ShieldCheck
} from 'lucide-react';

interface Props {
  activeModule: string;
  setActiveModule: (m: string) => void;
  alertCount: { critical: number; warning: number };
  pendingAdminCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeModule,
  setActiveModule,
  alertCount,
  pendingAdminCount = 0
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const navGroups = [
    ...(isAdmin ? [{
      group: 'Administration & Sécurité',
      items: [
        {
          id: 'admin-console',
          label: 'Espace Administrateur',
          icon: ShieldCheck,
          badge: pendingAdminCount > 0 ? `${pendingAdminCount} en attente` : 'Admin',
          badgeColor: pendingAdminCount > 0 ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-rose-700 text-white'
        }
      ]
    }] : []),
    {
      group: 'Général',
      items: [
        { id: 'dashboard', label: '1. Tableau de bord', icon: LayoutDashboard },
        { id: 'project-settings', label: '2. Paramètres du projet', icon: Settings },
        { id: 'reference-data', label: '3. Données de référence ARP', icon: Database }
      ]
    },
    {
      group: 'Calculs Hydrauliques & Dévers',
      items: [
        { id: 'devers-normal', label: '4. Calcul des dévers (Normal)', icon: Compass },
        { id: 'devers-rd', label: '5. Dévers en relief difficile', icon: Mountain }
      ]
    },
    {
      group: 'Raccordements & Plateforme',
      items: [
        { id: 'clothoide-normal', label: '6. Calcul des clothoïdes', icon: Spline },
        { id: 'clothoide-rd', label: '7. Clothoïdes en relief difficile', icon: GitCommit },
        { id: 'surlargeur-lacet', label: '8. Surlargeurs et lacets', icon: Maximize2 },
        { id: 'largeur-roulable', label: '9. Largeur roulable RD', icon: Columns3 }
      ]
    },
    {
      group: 'Géométrie Routière Complète',
      items: [
        { id: 'trace-en-plan', label: '10. Tracé en plan (Éléments)', icon: Route },
        { id: 'profil-en-long', label: '11. Profil en long (Pentes & Z)', icon: Activity },
        { id: 'profil-en-travers', label: '12. Profil en travers (Modèle)', icon: Layers }
      ]
    },
    {
      group: 'Validation & Livrables',
      items: [
        {
          id: 'compliance',
          label: '13. Vérifications & conformité',
          icon: ShieldAlert,
          badge: alertCount.critical > 0 ? `${alertCount.critical}` : undefined,
          badgeColor: 'bg-rose-600 text-white'
        },
        { id: 'visualizations', label: '14. Profils & graphiques', icon: BarChart3 },
        { id: 'reports', label: '15. Rapports et exports', icon: FileCheck2 },
        { id: 'history', label: '16. Historique des calculs', icon: History },
        { id: 'documentation', label: '17. Documentation & lexique', icon: BookOpen }
      ]
    }
  ];

  return (
    <aside className="w-68 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-65px)] flex flex-col p-4">
      {/* Search Bar in modules */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un module..."
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-800 focus:bg-white transition-colors"
        />
      </div>

      <nav className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
        {navGroups.map((group, gIdx) => {
          const filteredItems = group.items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.group}
              </div>
              {filteredItems.map(item => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-sky-50 text-sky-950 font-semibold border-l-2 border-sky-900 pl-2'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-900' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-400 font-mono">
        Guide Cerema ARP 2022<br />
        <span className="text-slate-500 font-sans">Référentiel vérifié</span>
      </div>
    </aside>
  );
};
