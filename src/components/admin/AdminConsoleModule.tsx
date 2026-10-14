import React, { useState, useEffect } from 'react';
import { AuthUser, EmailLogItem, ActivityLogItem } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Activity,
  LogIn,
  Clock,
  Ban,
  UserPlus,
  KeyRound,
  Briefcase,
  Award,
  GraduationCap
} from 'lucide-react';

export const AdminConsoleModule: React.FC = () => {
  const { user: currentAdmin, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'activity' | 'emails'>('pending');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);

  const [rejectModalUser, setRejectModalUser] = useState<AuthUser | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const renderJobBadge = (jobTitle?: string) => {
    const title = jobTitle || 'Ingénieur';
    if (title === 'Expert') {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
          <Award className="w-3 h-3 text-purple-600" />
          Expert
        </span>
      );
    }
    if (title === 'Étudiant') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
          <GraduationCap className="w-3 h-3 text-emerald-600" />
          Étudiant
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
        <Briefcase className="w-3 h-3 text-sky-600" />
        Ingénieur
      </span>
    );
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('arp_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [uRes, eRes, aRes] = await Promise.all([
        fetch('/api/admin/users', { headers, credentials: 'include' }),
        fetch('/api/admin/emails', { headers, credentials: 'include' }),
        fetch('/api/admin/activity', { headers, credentials: 'include' })
      ]);

      const uData = await uRes.json();
      const eData = await eRes.json();
      const aData = await aRes.json();

      if (uData.success) {
        setUsers(uData.users);
        const hasPending = (uData.users as AuthUser[]).some(u => u.status === 'PENDING');
        if (hasPending) {
          setActiveTab('pending');
        }
      }
      if (eData.success) setEmails(eData.emails);
      if (aData.success) setActivities(aData.activity || []);
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'DEACTIVATED' | 'PENDING', reason?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setRejectModalUser(null);
        setRejectReason('');
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      alert('Erreur serveur.');
    }
  };

  const handleUpdateRole = async (id: string, role: 'ADMIN' | 'ENGINEER') => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Erreur lors de la modification du rôle');
      }
    } catch {
      alert('Erreur serveur.');
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du compte ${email} ?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur serveur.');
    }
  };

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const approvedUsers = users.filter(u => u.status === 'APPROVED');
  const deactivatedUsers = users.filter(u => u.status === 'DEACTIVATED');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-800 mb-1">
            <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-bold">SUPERADMIN</span>
            <span>{currentAdmin?.email || 'Administrateur'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-700" />
            <span>Tableau de Bord & Espace d'Administration ARP</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Contrôle des accès, validation des demandes d'ingénieurs, gestion des comptes et audit des connexions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser les données</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            pendingUsers.length > 0
              ? 'bg-amber-50/70 border-amber-300 shadow-xs'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Demandes en attente
            </span>
            <UserCheck className={`w-4 h-4 ${pendingUsers.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900">
            {pendingUsers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {pendingUsers.length > 0 ? 'Validation requise' : 'Aucune en attente'}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('users')}
          className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Comptes approuvés
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900">
            {approvedUsers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Ingénieurs & admins actifs
          </div>
        </div>

        <div
          onClick={() => setActiveTab('users')}
          className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Total Utilisateurs
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900">
            {users.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {deactivatedUsers.length > 0 ? `${deactivatedUsers.length} désactivé(s)` : 'Tous répertoriés'}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('activity')}
          className="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Journal d'Activité
            </span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900">
            {activities.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Connexions & événements
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Demandes en attente</span>
          {pendingUsers.length > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Comptes utilisateurs ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activité & Connexions ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
            activeTab === 'emails'
              ? 'bg-rose-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Notifications E-mails ({emails.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING USERS */}
      {activeTab === 'pending' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Demandes d'accès soumises à votre validation
            </h2>
            <span className="text-xs text-slate-500">
              {pendingUsers.length} demande(s) en attente
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <span>Aucune demande d'inscription en attente. Tous les accès demandés ont été traités.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(u => (
                <div
                  key={u.id}
                  className="p-4 border border-amber-200 rounded-xl bg-amber-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                      {renderJobBadge(u.jobTitle)}
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                        En attente de votre validation
                      </span>
                    </div>
                    <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>E-mail : <strong className="text-slate-900">{u.email}</strong></span>
                      <span>·</span>
                      <span>Organisme : <strong className="text-slate-800">{u.organization || 'Non renseigné'}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Demande d'inscription reçue le : {new Date(u.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
                      title="Autoriser l'utilisateur à se connecter à l'application"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accepter l'accès</span>
                    </button>
                    <button
                      onClick={() => setRejectModalUser(u)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg border border-rose-200 transition-colors cursor-pointer text-xs"
                      title="Refuser cette demande d'accès"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Gestion des Comptes & Droits d'Accès
            </h2>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer nom, email, emploi..."
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-rose-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Utilisateur</th>
                  <th className="py-2.5 px-3 font-semibold">Emploi / Profil</th>
                  <th className="py-2.5 px-3 font-semibold">E-mail</th>
                  <th className="py-2.5 px-3 font-semibold">Rôle</th>
                  <th className="py-2.5 px-3 font-semibold">Statut</th>
                  <th className="py-2.5 px-3 font-semibold">Dernière Connexion</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions de Gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const adminEmails = ['youcefyoucefbelallia@gmail.com', 'checchec387@gmail.com'];
                  const isRoot = adminEmails.includes(u.email.toLowerCase()) || u.role === 'SUPERADMIN';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {u.name}
                        <div className="text-[11px] text-slate-400">{u.organization || 'Bureau d’Études'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderJobBadge(u.jobTitle)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'SUPERADMIN'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : u.role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : u.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : u.status === 'DEACTIVATED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {u.status === 'APPROVED' ? 'Approuvé' : u.status === 'PENDING' ? 'En attente' : u.status === 'DEACTIVATED' ? 'Désactivé' : 'Refusé'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                        {u.lastLoginAt ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(u.lastLoginAt).toLocaleString('fr-FR')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Jamais connecté</span>
                        )}
                        <div className="text-[10px] text-slate-400">Inscrit: {new Date(u.createdAt).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRoot ? (
                          <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Superadministrateur Protégé
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'APPROVED' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'DEACTIVATED')}
                                title="Désactiver l'accès au compte"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Ban className="w-3 h-3 text-slate-500" />
                                <span>Désactiver</span>
                              </button>
                            )}

                            {u.status === 'DEACTIVATED' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                title="Réactiver le compte utilisateur"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                <span>Réactiver</span>
                              </button>
                            )}

                            {u.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                title="Approuver l'accès"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                <span>Approuver</span>
                              </button>
                            )}

                            {u.status === 'REJECTED' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                title="Approuver après réexamen"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                <span>Approuver</span>
                              </button>
                            )}

                            {isSuperAdmin && (
                              <button
                                onClick={() => handleUpdateRole(u.id, u.role === 'ADMIN' ? 'ENGINEER' : 'ADMIN')}
                                title="Changer le rôle d'administration"
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 text-[11px] transition-colors cursor-pointer"
                              >
                                {u.role === 'ADMIN' ? 'Retirer Admin' : 'Nommer Admin'}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="Supprimer définitivement"
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY & CONNECTION AUDIT LOG */}
      {activeTab === 'activity' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Historique des Connexions & Journal d'Audit
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Suivi chronologique des événements de sécurité, connexions réussies, échecs et modifications de statuts.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {activities.length} événement(s)
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-slate-100">
              <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <span>Aucune activité enregistrée pour le moment. Les prochaines connexions apparaîtront ici.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Date & Heure</th>
                    <th className="py-2.5 px-3 font-semibold">Type d'Événement</th>
                    <th className="py-2.5 px-3 font-semibold">Compte Concerné</th>
                    <th className="py-2.5 px-3 font-semibold">Détails de l'Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                          act.type === 'LOGIN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.type === 'LOGIN_FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : act.type === 'REGISTER'
                            ? 'bg-sky-100 text-sky-800'
                            : act.type === 'STATUS_CHANGE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {act.type === 'LOGIN'
                            ? 'CONNEXION'
                            : act.type === 'LOGIN_FAILED'
                            ? 'ÉCHEC CONNEXION'
                            : act.type === 'REGISTER'
                            ? 'INSCRIPTION'
                            : act.type === 'STATUS_CHANGE'
                            ? 'STATUT MODIFIÉ'
                            : act.type === 'ROLE_CHANGE'
                            ? 'RÔLE MODIFIÉ'
                            : act.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {act.userName ? `${act.userName} (${act.userEmail})` : act.userEmail}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">
                        {act.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EMAIL OUTBOX */}
      {activeTab === 'emails' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Journal d'Envoi des Notifications E-mails (Traçabilité & Liens)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {emails.length} message(s) consigné(s)
            </span>
          </div>

          <div className="space-y-2">
            {emails.map(em => (
              <div
                key={em.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      em.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : em.status === 'OUTBOX_SIMULATED'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {em.status === 'DELIVERED' ? 'ENVOYÉ SMTP' : em.status === 'OUTBOX_SIMULATED' ? 'OUTBOX LOCAL' : 'ÉCHEC'}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{em.subject}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    Destinataire : <strong>{em.to}</strong> · {new Date(em.sentAt).toLocaleString('fr-FR')}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmail(em)}
                  className="px-2.5 py-1 text-xs font-medium text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Voir message</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Refuser la demande d'accès de {rejectModalUser.name}
            </h3>
            <p className="text-xs text-slate-600">
              Un e-mail de notification sera automatiquement envoyé à <strong>{rejectModalUser.email}</strong>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif du refus (Optionnel, transmis à l'utilisateur)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex : Informations incomplètes ou accès réservé aux ingénieurs du projet."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-rose-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalUser(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleUpdateStatus(rejectModalUser.id, 'REJECTED', rejectReason)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  {selectedEmail.actionType}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedEmail.subject}
                </h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  À : {selectedEmail.to} · {new Date(selectedEmail.sentAt).toLocaleString('fr-FR')}
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div
              className="border border-slate-100 rounded-lg p-4 bg-slate-50 text-xs overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
            />

            <div className="text-right">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
