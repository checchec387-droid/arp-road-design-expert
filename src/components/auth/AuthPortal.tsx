import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Mail,
  User,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Copy,
  Sparkles,
  Briefcase,
  Award,
  GraduationCap
} from 'lucide-react';

interface Props {
  initialView?: 'login' | 'register' | 'forgot' | 'reset' | 'admin-login';
  resetToken?: string;
  onAdminLogin?: () => void;
}

export const AuthPortal: React.FC<Props> = ({
  initialView = 'login',
  resetToken = '',
  onAdminLogin
}) => {
  const { login, register, forgotPassword, resetPassword } = useAuth();

  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset' | 'pending' | 'admin-login'>(initialView);
  const [token, setToken] = useState(resetToken);

  // Form states - Regular User
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Form states - Dedicated Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Form states - Registration (Identifiant removed, Emploi with choice between Ingénieur, Expert, Étudiant)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regJobTitle, setRegJobTitle] = useState<'Ingénieur' | 'Expert' | 'Étudiant'>('Ingénieur');
  const [regPassword, setRegPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');

  // Password reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fromAdminView, setFromAdminView] = useState(false);

  // Recovery info
  const [recoveryInfo, setRecoveryInfo] = useState<{
    directResetUrl?: string;
    resetToken?: string;
    resetCode?: string;
    isSmtpConfigured?: boolean;
    userFound?: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status & feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password, false);
      if (!res.success) {
        if (res.status === 'PENDING') {
          setView('pending');
        } else {
          setErrorMsg(res.error || 'Identifiants invalides.');
        }
      } else if (res.isAdminLogin && onAdminLogin) {
        onAdminLogin();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      // Pass requireAdmin = true to enforce backend validation of admin role
      const res = await login(adminEmail, adminPassword, true);
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants administrateur incorrects ou compte non autorisé.');
      } else {
        if (onAdminLogin) {
          onAdminLogin();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        jobTitle: regJobTitle,
        password: regPassword,
        organization: regOrg
      });

      if (res.success) {
        if (res.status === 'PENDING') {
          setView('pending');
        } else {
          setSuccessMsg(res.message || 'Compte activé avec succès.');
        }
      } else {
        setErrorMsg(res.error || 'Erreur lors de l’inscription.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const res = await forgotPassword(forgotEmail);
      if (res.success) {
        setSuccessMsg(res.message || 'Demande de réinitialisation traitée.');
        if (res.resetToken) {
          setRecoveryInfo({
            directResetUrl: res.directResetUrl,
            resetToken: res.resetToken,
            resetCode: res.resetCode,
            isSmtpConfigured: res.isSmtpConfigured,
            userFound: res.userFound
          });
          setToken(res.resetToken);
        }
      } else {
        setErrorMsg(res.error || 'Erreur lors de l’envoi de la réinitialisation.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(token, newPassword, forgotEmail || adminEmail);
      if (res.success) {
        setSuccessMsg(res.message || 'Mot de passe mis à jour avec succès ! Connexion en cours...');
        if (onAdminLogin && (res.user?.role === 'SUPERADMIN' || res.user?.role === 'ADMIN')) {
          setTimeout(() => {
            onAdminLogin();
          }, 600);
        }
      } else {
        setErrorMsg(res.error || 'Échec de la réinitialisation. Veuillez vérifier le code ou l’adresse e-mail.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative">
          {/* Discreet Admin icon button in top-right corner */}
          <button
            type="button"
            onClick={() => {
              if (view === 'admin-login') {
                setView('login');
              } else {
                setView('admin-login');
              }
              clearMessages();
            }}
            title={view === 'admin-login' ? "Revenir à la connexion ingénieur" : "Accès réservé Administrateur"}
            className={`absolute top-4 right-4 py-1 px-2.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
              view === 'admin-login'
                ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
            aria-label="Espace Administrateur"
          >
            <Shield className={`w-3.5 h-3.5 ${view === 'admin-login' ? 'text-rose-400' : 'text-slate-400'}`} />
            <span className="text-[11px] font-medium hidden sm:inline">
              {view === 'admin-login' ? 'Mode Normal' : 'Admin'}
            </span>
          </button>

          <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-900 font-bold text-lg shadow-sm">
            ARP
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Plateforme Routière ARP Cerema
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logiciel d'Ingénierie Géométrique & Bureau d'Études Routières (2022)
          </p>
        </div>

        {/* Content Form Body */}
        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: DEDICATED ADMIN LOGIN */}
          {view === 'admin-login' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    Connexion Espace Administrateur
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded font-mono">
                    Accès Réservé
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Authentification sécurisée du superviseur. Saisissez votre adresse e-mail administrateur et votre mot de passe.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail ou Identifiant administrateur
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="votre.email@domaine.fr ou identifiant"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe administrateur
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(adminEmail);
                      setFromAdminView(true);
                      setView('forgot');
                      clearMessages();
                    }}
                    className="text-xs text-rose-700 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>{isSubmitting ? 'Vérification sécurisée...' : 'Accéder à l’Espace Administrateur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion ordinaire</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: NORMAL LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="votre.email@domaine.fr"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFromAdminView(false);
                      setForgotEmail(identifier.includes('@') ? identifier : '');
                      setView('forgot');
                      clearMessages();
                    }}
                    className="text-xs text-sky-800 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">Nouveau sur l'outil ? </span>
                <button
                  type="button"
                  onClick={() => { setView('register'); clearMessages(); }}
                  className="text-xs font-semibold text-sky-900 hover:underline cursor-pointer"
                >
                  Créer un compte (Demande d'accès)
                </button>
              </div>

              {/* Discreet Administrator Access Link */}
              <div className="pt-2 text-center border-t border-slate-100 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('admin-login');
                    clearMessages();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span className="font-medium">Espace administrateur</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="text-xs text-slate-600 bg-sky-50 border border-sky-100 p-3 rounded-lg leading-relaxed">
                <strong className="text-sky-900 block mb-0.5">Validation par l'administrateur :</strong>
                Après votre inscription, une demande d'accès est automatiquement transmise à l'administrateur principal. L'accès aux calculs routiers ARP sera débloqué dès son approbation.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom et Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ing. Jean Dupont"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail professionnelle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jean.dupont@bureau-etudes.fr"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                />
              </div>

              {/* Emploi / Profil : Choix entre Ingénieur, Expert et Étudiant */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emploi / Profil <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Ingénieur', label: 'Ingénieur', icon: Briefcase, desc: 'Bureau d’études' },
                    { id: 'Expert', label: 'Expert', icon: Award, desc: 'Consultant / Audit' },
                    { id: 'Étudiant', label: 'Étudiant', icon: GraduationCap, desc: 'Génie civil' }
                  ].map(item => {
                    const isSelected = regJobTitle === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRegJobTitle(item.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center sm:items-start ${
                          isSelected
                            ? 'bg-sky-50 border-sky-600 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-700' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 hidden sm:inline leading-tight">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisme / BET / Université <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="ex : Cerema, INGEROUTE, Université..."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe sécurisé (min. 6 caractères) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Envoi de la demande...' : 'Soumettre ma demande d’accès'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  Déjà inscrit ? Retour à la connexion
                </button>
              </div>
            </form>
          )}

          {/* VIEW: PENDING ACCESS NOTICE */}
          {view === 'pending' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Compte en Attente de Validation
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Votre inscription a bien été enregistrée. Conformément à la politique de sécurité du bureau d'études, votre demande d'accès doit être <strong>approuvée par l'administrateur</strong>.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">
                Vous recevrez une notification dès que l'administrateur aura examiné et validé votre profil.
              </div>
              <button
                type="button"
                onClick={() => { setView('login'); clearMessages(); }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Retour à la page de connexion
              </button>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Récupération de mot de passe
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Saisissez votre adresse e-mail. Vous pourrez réinitialiser immédiatement votre mot de passe en toute sécurité.
                </p>
              </div>

              {/* Direct recovery action if token was generated */}
              {recoveryInfo?.resetToken && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-sky-950">
                        Lien direct de réinitialisation disponible !
                      </h3>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        Aucun besoin d'attendre un e-mail dans votre boîte : vous pouvez définir votre nouveau mot de passe directement ci-dessous.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (recoveryInfo.resetToken) {
                          setToken(recoveryInfo.resetToken);
                        }
                        setView('reset');
                        clearMessages();
                      }}
                      className="w-full py-2 px-3 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Définir mon nouveau mot de passe maintenant</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {recoveryInfo.directResetUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (recoveryInfo.directResetUrl) {
                            navigator.clipboard.writeText(recoveryInfo.directResetUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }
                        }}
                        className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedLink ? 'Lien sécurisé copié !' : 'Copier le lien sécurisé'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail du compte
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="votre.email@domaine.fr"
                      className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Traitement en cours...' : 'Générer le lien de réinitialisation'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setView(fromAdminView ? 'admin-login' : 'login');
                      clearMessages();
                    }}
                    className="text-xs text-slate-600 hover:underline cursor-pointer"
                  >
                    {fromAdminView ? '← Retour à l’espace administrateur' : '← Retour à la connexion'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Définir un nouveau mot de passe
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  Saisissez votre nouveau mot de passe sécurisé. Après validation, vous serez automatiquement connecté.
                </p>

                {token ? (
                  <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">Jeton de réinitialisation actif</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {token.slice(0, 8)}...
                    </span>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse e-mail ou Clé de réinitialisation
                    </label>
                    <input
                      type="text"
                      required
                      value={token || forgotEmail}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val.includes('@')) {
                          setForgotEmail(val);
                        } else {
                          setToken(val);
                        }
                      }}
                      placeholder="Votre adresse e-mail ou code"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                    />
                  </div>
                )}

                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe (min. 6 car.)
                </label>
                <div className="relative mb-2">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer et me connecter'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  Annuler et revenir à la connexion
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
