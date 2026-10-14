import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  FullProjectState,
  INITIAL_PROJECT_STATE,
  loadProjectState,
  saveProjectState,
  exportProjectToJson
} from './utils/storage';
import { runGlobalProjectAudit, calculateDeversNormal, calculateDeversReliefDifficile, calculateClothoideNormal } from './utils/arpCalculations';

// Layout & Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthPortal } from './components/auth/AuthPortal';
import { AdminConsoleModule } from './components/admin/AdminConsoleModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { ProjectSettingsModule } from './components/modules/ProjectSettingsModule';
import { ReferenceDataModule } from './components/modules/ReferenceDataModule';
import { DeversNormalModule } from './components/modules/DeversNormalModule';
import { DeversReliefDifficileModule } from './components/modules/DeversReliefDifficileModule';
import { ClothoideNormalModule } from './components/modules/ClothoideNormalModule';
import { ClothoideReliefDifficileModule } from './components/modules/ClothoideReliefDifficileModule';
import { SurlargeurLacetModule } from './components/modules/SurlargeurLacetModule';
import { LargeurRoulableModule } from './components/modules/LargeurRoulableModule';
import { TraceEnPlanModule } from './components/modules/TraceEnPlanModule';
import { ProfilEnLongModule } from './components/modules/ProfilEnLongModule';
import { ProfilEnTraversModule } from './components/modules/ProfilEnTraversModule';
import { GlobalComplianceModule } from './components/modules/GlobalComplianceModule';
import { VisualizationsModule } from './components/modules/VisualizationsModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { DocumentationModule } from './components/modules/DocumentationModule';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();

  const [projectState, setProjectState] = useState<FullProjectState>(loadProjectState);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Check URL query params for reset token or specific module
  const [resetToken, setResetToken] = useState<string>('');
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'register' | 'forgot' | 'reset' | 'admin-login'>('login');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tokenParam = params.get('token');
    const moduleParam = params.get('module');

    if (viewParam === 'reset-password' && tokenParam) {
      setResetToken(tokenParam);
      setInitialAuthView('reset');
    }

    if (viewParam === 'admin' || viewParam === 'admin-login') {
      setInitialAuthView('admin-login');
    }

    if (moduleParam === 'admin-users' || moduleParam === 'admin' || moduleParam === 'admin-console') {
      setActiveModule('admin-console');
    }
  }, []);

  // Poll for pending users if admin
  useEffect(() => {
    if (!isAdmin) return;
    const checkPending = async () => {
      try {
        const storedToken = localStorage.getItem('arp_token');
        const headers: Record<string, string> = {};
        if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
        const res = await fetch('/api/admin/users', { headers, credentials: 'include' });
        const data = await res.json();
        if (data.success && data.users) {
          const count = (data.users as any[]).filter(u => u.status === 'PENDING').length;
          setPendingRequestsCount(count);
        }
      } catch {
        // ignore
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 8000);
    return () => clearInterval(interval);
  }, [isAdmin, activeModule]);

  // Auto-save on state change
  useEffect(() => {
    saveProjectState(projectState);
  }, [projectState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleManualSave = () => {
    saveProjectState(projectState);
    showToast('Projet enregistré avec succès dans le stockage local');
  };

  const handleExportJson = () => {
    exportProjectToJson(projectState);
    showToast('Fichier JSON du projet exporté');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.metadata && parsed.deversNormal) {
          setProjectState(parsed);
          showToast(`Projet "${parsed.metadata.name}" importé avec succès`);
        } else {
          alert("Format JSON non reconnu. Le fichier doit être une sauvegarde valide de l'outil ARP.");
        }
      } catch {
        alert("Erreur lors de la lecture du fichier JSON : format invalide.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    setProjectState(INITIAL_PROJECT_STATE);
    showToast('Toutes les données ont été réinitialisées aux valeurs initiales');
  };

  const recordHistory = (moduleName: string, summary: string, params: any, results: any) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry = {
      id: `hist-${Date.now()}`,
      timestamp,
      moduleName,
      summary,
      paramsSnapshot: params,
      resultsSnapshot: results
    };
    setProjectState(prev => ({
      ...prev,
      history: [newEntry, ...prev.history.slice(0, 49)]
    }));
  };

  // Compute alerts for counters
  const resDeversNormal = calculateDeversNormal(projectState.deversNormal);
  const resDeversRD = calculateDeversReliefDifficile(projectState.deversRD);
  const resClothNormal = calculateClothoideNormal(projectState.clothoideNormal);

  const alerts = runGlobalProjectAudit({
    category: projectState.metadata.category,
    isInterurbaine110: projectState.deversNormal.isInterurbaine110,
    radiusNormal: projectState.deversNormal.radiusR,
    radiusRD: projectState.deversRD.radiusR,
    deversNormal: resDeversNormal.calculatedDevers,
    deversRD: resDeversRD.adoptedDevers,
    longitudinalSlopeRD: projectState.deversRD.longitudinalSlopeP,
    clothoideNormalLength: resClothNormal.lengthL,
    clothoideRDLength: projectState.clothoideRD.proposedReducedLength,
    minShiftRDLength: 31.5,
    tmja: projectState.metadata.tmja,
    plDaily: projectState.metadata.plDaily,
    traceElements: projectState.traceEnPlan.elements,
    profilElements: projectState.profilEnLong.elements
  });

  const criticalCount = alerts.filter(a => a.level === 'CRITIQUE').length;
  const warningCount = alerts.filter(a => a.level === 'MAJEUR' || a.level === 'AVERTISSEMENT').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement de la session sécurisée ARP...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not approved, shield the entire application behind AuthPortal!
  if (!user || user.status !== 'APPROVED') {
    return (
      <AuthPortal
        initialView={initialAuthView}
        resetToken={resetToken}
        onAdminLogin={() => setActiveModule('admin-console')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          metadata={projectState.metadata}
          onSave={handleManualSave}
          onExportJson={handleExportJson}
          openReports={() => setActiveModule('reports')}
          pendingCount={pendingRequestsCount}
        />
      </div>

      {/* Admin Pending Requests Alert Banner */}
      {isAdmin && pendingRequestsCount > 0 && activeModule !== 'admin-console' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 border-b border-amber-600 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <UserCheck className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="font-bold">
              {pendingRequestsCount === 1
                ? "1 nouvelle demande d'inscription est en attente d'approbation dans l'espace administratif !"
                : `${pendingRequestsCount} nouvelles demandes d'inscription sont en attente d'approbation dans l'espace administratif !`}
            </span>
          </div>
          <button
            onClick={() => setActiveModule('admin-console')}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer text-xs"
          >
            <span>Accéder aux demandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="no-print">
          <Sidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            alertCount={{ critical: criticalCount, warning: warningCount }}
            pendingAdminCount={pendingRequestsCount}
          />
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Admin console module */}
          {activeModule === 'admin-console' && isAdmin && (
            <AdminConsoleModule />
          )}

          {activeModule === 'dashboard' && (
            <DashboardModule
              projectState={projectState}
              setActiveModule={setActiveModule}
              openReports={() => setActiveModule('reports')}
            />
          )}

          {activeModule === 'project-settings' && (
            <ProjectSettingsModule
              metadata={projectState.metadata}
              onChange={(newMeta) => setProjectState(prev => ({ ...prev, metadata: newMeta }))}
              onSave={handleManualSave}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onResetToDefault={handleResetToDefault}
            />
          )}

          {activeModule === 'reference-data' && (
            <ReferenceDataModule />
          )}

          {activeModule === 'devers-normal' && (
            <DeversNormalModule
              data={projectState.deversNormal}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, deversNormal: newD }));
                recordHistory('Dévers normal', `Mise à jour R = ${newD.radiusR} m, Catégorie ${newD.category}`, newD, {});
              }}
            />
          )}

          {activeModule === 'devers-rd' && (
            <DeversReliefDifficileModule
              data={projectState.deversRD}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, deversRD: newD }));
                recordHistory('Dévers relief difficile', `Mise à jour R = ${newD.radiusR} m, pente ${newD.longitudinalSlopeP}%`, newD, {});
              }}
            />
          )}

          {activeModule === 'clothoide-normal' && (
            <ClothoideNormalModule
              data={projectState.clothoideNormal}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, clothoideNormal: newD }));
                recordHistory('Clothoïde normale', `Mise à jour ${newD.crossSectionType}, R = ${newD.radiusR} m`, newD, {});
              }}
            />
          )}

          {activeModule === 'clothoide-rd' && (
            <ClothoideReliefDifficileModule
              data={projectState.clothoideRD}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, clothoideRD: newD }));
                recordHistory('Clothoïde relief difficile', `Mise à jour R = ${newD.radiusR} m`, newD, {});
              }}
            />
          )}

          {activeModule === 'surlargeur-lacet' && (
            <SurlargeurLacetModule
              data={projectState.surlargeur}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, surlargeur: newD }));
                recordHistory('Surlargeur en courbe', `Mise à jour R = ${newD.innerRadiusR} m`, newD, {});
              }}
            />
          )}

          {activeModule === 'largeur-roulable' && (
            <LargeurRoulableModule
              data={projectState.largeurRoulable}
              onChange={(newD) => {
                setProjectState(prev => ({ ...prev, largeurRoulable: newD }));
                recordHistory('Largeur roulable RD', `Niveau ${newD.functionLevel}`, newD, {});
              }}
            />
          )}

          {activeModule === 'trace-en-plan' && (
            <TraceEnPlanModule
              category={projectState.metadata.category}
              isInterurbaine110={projectState.deversNormal.isInterurbaine110}
              data={projectState.traceEnPlan}
              onChange={(newD) => setProjectState(prev => ({ ...prev, traceEnPlan: newD }))}
            />
          )}

          {activeModule === 'profil-en-long' && (
            <ProfilEnLongModule
              category={projectState.metadata.category}
              isInterurbaine110={projectState.deversNormal.isInterurbaine110}
              data={projectState.profilEnLong}
              onChange={(newD) => setProjectState(prev => ({ ...prev, profilEnLong: newD }))}
              radiusHorizontalContext={projectState.deversNormal.radiusR}
            />
          )}

          {activeModule === 'profil-en-travers' && (
            <ProfilEnTraversModule
              roadType={projectState.metadata.roadType}
              functionLevel={projectState.metadata.functionLevel}
            />
          )}

          {activeModule === 'compliance' && (
            <GlobalComplianceModule
              projectState={projectState}
              setActiveModule={setActiveModule}
            />
          )}

          {activeModule === 'visualizations' && (
            <VisualizationsModule
              projectState={projectState}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              projectState={projectState}
            />
          )}

          {activeModule === 'history' && (
            <HistoryModule
              history={projectState.history}
              onClearHistory={() => setProjectState(prev => ({ ...prev, history: [] }))}
            />
          )}

          {activeModule === 'documentation' && (
            <DocumentationModule />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
