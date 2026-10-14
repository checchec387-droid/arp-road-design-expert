import React from 'react';
import { ProjectMetadata } from '../../types/arp';
import { useAuth } from '../../context/AuthContext';
import { FileText, Save, ShieldCheck, LogOut, User } from 'lucide-react';

interface Props {
  activeModule: string;
  setActiveModule: (m: string) => void;
  metadata: ProjectMetadata;
  onSave: () => void;
  onExportJson: () => void;
  openReports: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<Props> = ({
  activeModule,
  setActiveModule,
  metadata,
  onSave,
  onExportJson,
  openReports,
  pendingCount = 0
}) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-8 px-6 py-3.5 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              ARP
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                ARP Cerema Ingénierie
              </span>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block">
                Guide Août 2022 · Bureau d'études
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <button
            onClick={() => setActiveModule('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-900 pb-0.5 ${
              activeModule === 'dashboard' ? 'text-sky-900 border-b-2 border-sky-900' : ''
            }`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveModule('devers-normal')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-900 pb-0.5 ${
              activeModule === 'devers-normal' || activeModule === 'devers-rd' ? 'text-sky-900 border-b-2 border-sky-900' : ''
            }`}
          >
            Dévers
          </button>
          <button
            onClick={() => setActiveModule('clothoide-normal')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-900 pb-0.5 ${
              activeModule === 'clothoide-normal' || activeModule === 'clothoide-rd' ? 'text-sky-900 border-b-2 border-sky-900' : ''
            }`}
          >
            Clothoïdes
          </button>
          <button
            onClick={() => setActiveModule('trace-en-plan')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-900 pb-0.5 ${
              activeModule === 'trace-en-plan' || activeModule === 'profil-en-long' || activeModule === 'profil-en-travers' ? 'text-sky-900 border-b-2 border-sky-900' : ''
            }`}
          >
            Profils
          </button>
          <button
            onClick={() => setActiveModule('compliance')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-900 pb-0.5 ${
              activeModule === 'compliance' ? 'text-sky-900 border-b-2 border-sky-900' : ''
            }`}
          >
            Conformité
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveModule('admin-console')}
              className={`transition-colors whitespace-nowrap shrink-0 text-rose-700 hover:text-rose-900 pb-0.5 flex items-center gap-1.5 cursor-pointer ${
                activeModule === 'admin-console' ? 'border-b-2 border-rose-700 font-bold' : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Espace Admin</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action button + user profile and logout */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSave}
            title="Sauvegarder dans le navigateur"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </button>

          <button
            onClick={openReports}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-900 hover:bg-sky-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rapport</span>
          </button>

          {/* User badge and logout */}
          {user && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden lg:block text-right">
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {user.role === 'SUPERADMIN' ? 'Superadmin' : user.role === 'ADMIN' ? 'Admin' : 'Ingénieur'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                title="Déconnexion"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
