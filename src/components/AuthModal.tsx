import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Building2, KeyRound, ArrowLeft } from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api, setAuthToken } from '../api/client';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
  currentTenant?: { name: string; email: string; role?: UserRole } | null;
  onLogout?: () => void;
  onOpenPrivacyPolicy?: () => void;
  language: Language;
  initialMode?: 'login' | 'register';
  selectedRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentTenant,
  onLogout,
  onOpenPrivacyPolicy,
  language,
  initialMode = 'login',
  selectedRole = 'tenant',
}) => {
  const t = TRANSLATIONS[language];
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP Verification state (Prioridad 1-BIS.2)
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpDemoHint, setOtpDemoHint] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
    setIsPhoneVerified(false);
    setIsOtpSent(false);
    setOtpCode('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 6) {
      setError(language === 'es' ? 'Introduce un número de teléfono válido antes de solicitar el código SMS.' : 'Veuillez saisir un numéro de téléphone valide.');
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await api.auth.requestPhoneOtp({ phone: phone.trim(), lang: language });
      setIsOtpSent(true);
      if (res.demoCode) {
        setOtpDemoHint(res.demoCode);
      }
      setSuccessMessage(res.message || (language === 'es' ? 'Código SMS enviado. Revisa tu teléfono.' : 'Code SMS envoyé.'));
    } catch (err: any) {
      setError(err.message || 'Error al enviar código SMS');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setError(language === 'es' ? 'Introduce el código de verificación recibido.' : 'Veuillez saisir le code reçu.');
      return;
    }
    setError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await api.auth.verifyPhoneOtp({ phone: phone.trim(), otp: otpCode.trim(), lang: language });
      if (res.verified) {
        setIsPhoneVerified(true);
        setSuccessMessage(res.message || (language === 'es' ? 'Teléfono verificado con éxito ✓' : 'Téléphone vérifié avec succès ✓'));
      }
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError(language === 'es' ? 'Introduce tu correo electrónico.' : 'Veuillez renseigner votre email.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword({ email: email.trim().toLowerCase(), preferred_lang: language });
      setSuccessMessage(res.message || (language === 'es' ? 'Te hemos enviado las instrucciones a tu correo.' : 'Instructions envoyées par email.'));
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el restablecimiento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'register') {
      if (!privacyAccepted) {
        setError(t.mustAcceptPrivacyError);
        return;
      }
      if (!phone || !phone.trim()) {
        setError(t.phoneRequiredError || 'Le numéro de téléphone est obligatoire.');
        return;
      }
      if (!isPhoneVerified) {
        setError(language === 'es' 
          ? 'Debes verificar tu número de teléfono por SMS antes de registrarte.' 
          : 'Veuillez vérifier votre numéro de téléphone par SMS avant de finaliser votre inscription.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Login via backend API (sets httpOnly cookie + enforces account suspension and account rate limiting)
        const loginRes = await api.auth.login(email.trim().toLowerCase(), password, language);

        if (loginRes.sessionId) {
          localStorage.setItem('rentia_session_id', loginRes.sessionId);
        }

        if (loginRes.token) {
          setAuthToken(loginRes.token);
          await supabase.auth.setSession({
            access_token: loginRes.token,
            refresh_token: loginRes.token,
          }).catch(() => {});
        }

        onAuthSuccess(loginRes.tenant);
        onClose();
      } else {
        // Registration with mandatory phone and strictly verified role
        const res = await api.auth.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          role: selectedRole === 'landlord' ? 'landlord' : 'tenant',
          preferred_lang: language,
          privacy_policy_accepted: privacyAccepted,
          otp: otpCode.trim(),
        });

        if (res.token) {
          setAuthToken(res.token);
          await supabase.auth.setSession({
            access_token: res.token,
            refresh_token: res.token,
          }).catch(() => {});
        }

        onAuthSuccess(res.tenant);
        onClose();
      }
    } catch (err: any) {
      if (
        err.message?.includes('PHONE_ALREADY_EXISTS') || 
        err.message?.includes('déjà associé') || 
        err.message?.includes('already associated') || 
        err.message?.includes('ya está asociado') || 
        err.message?.includes('unique') || 
        err.message?.includes('idx_profiles_phone_unique')
      ) {
        setError(t.phoneAlreadyExistsError || 'Ce numéro de téléphone est déjà associé à un compte.');
      } else if (err.message?.includes('ACCOUNT_SUSPENDED') || err.message?.includes('suspendida') || err.message?.includes('suspendu')) {
        setError(language === 'es' 
          ? 'Tu cuenta ha sido suspendida. Por favor, contacta con el soporte de Rentia.' 
          : 'Votre compte a été suspendu. Veuillez contacter le support.');
      } else {
        setError(err.message || (language === 'es' ? 'Error al autenticar.' : 'Erreur d\'authentification.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 relative animate-fade-in"
        id="auth-modal"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          id="btn-close-auth-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xs ${
            mode === 'register' && selectedRole === 'landlord'
              ? 'bg-teal-50 text-[#0FA3A3]'
              : 'bg-[#1E1B4B] text-white'
          }`}>
            {mode === 'forgot_password' ? (
              <KeyRound className="w-6 h-6 text-[#D97706]" />
            ) : mode === 'register' && selectedRole === 'landlord' ? (
              <Building2 className="w-6 h-6 text-[#0FA3A3]" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#D97706]" />
            )}
          </div>
          <h2 className="text-xl font-black text-[#1E1B4B]">
            {mode === 'login' ? t.login : mode === 'register' ? t.register : (language === 'es' ? 'Recuperar contraseña' : 'Mot de passe oublié')}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'login' 
              ? t.authLoginSubtitle 
              : mode === 'register' 
              ? t.authRegisterSubtitle 
              : (language === 'es' ? 'Introduce tu correo para recibir las instrucciones.' : 'Entrez votre email pour recevoir le lien.')}
          </p>
        </div>

        {/* Selected Role Pill in Register mode */}
        {mode === 'register' && (
          <div className="mb-4 p-2.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                selectedRole === 'landlord' ? 'bg-teal-100 text-[#0FA3A3]' : 'bg-indigo-100 text-[#1E1B4B]'
              }`}>
                {selectedRole === 'landlord' ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-stone-400 leading-none">
                  {language === 'es' ? 'Tipo de cuenta' : 'Rôle assigné'}
                </span>
                <span className="text-xs font-black text-[#1E1B4B]">
                  {selectedRole === 'landlord' ? t.roleBadgeLandlord : t.roleBadgeTenant}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
              Exclusivo
            </span>
          </div>
        )}

        {/* Tab switcher */}
        {mode !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1 bg-stone-100/70 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-white text-[#1E1B4B] shadow-xs' 
                  : 'text-stone-500 hover:text-[#1E1B4B]'
              }`}
              id="tab-auth-login"
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMessage(null); }}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'register' 
                  ? 'bg-white text-[#1E1B4B] shadow-xs' 
                  : 'text-stone-500 hover:text-[#1E1B4B]'
              }`}
              id="tab-auth-register"
            >
              {t.register}
            </button>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success notice */}
        {successMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot_password' ? (
          <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#1E1B4B] mb-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'es' ? 'Enviar enlace de recuperación' : 'Envoyer le lien')}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
              className="w-full text-center text-xs text-stone-500 font-semibold hover:text-[#1E1B4B] flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{language === 'es' ? 'Volver al inicio de sesión' : 'Retour à la connexion'}</span>
            </button>
          </form>
        ) : (
          /* Form Login / Register */
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            
            {mode === 'register' && (
              <div>
                <label className="block font-bold text-[#1E1B4B] mb-1">{t.fullNameLabel}</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder={t.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#1E1B4B] mb-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-[#1E1B4B]">{t.passwordLabel}</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); setError(null); setSuccessMessage(null); }}
                    className="text-[11px] text-[#D97706] hover:underline font-semibold"
                  >
                    {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Mot de passe oublié ?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B]"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                {/* Mandatory Phone Field & SMS OTP Verification (Prioridad 1-BIS.2) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#1E1B4B] flex items-center gap-1">
                      <span>{t.phoneLabel}</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    {isPhoneVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verificado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded">
                        SMS requerido
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="tel"
                        required
                        disabled={isPhoneVerified}
                        placeholder={t.phonePlaceholder}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setIsPhoneVerified(false);
                          setIsOtpSent(false);
                        }}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] disabled:bg-stone-100"
                      />
                    </div>
                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !phone}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-[11px] shrink-0 transition-colors disabled:opacity-50"
                      >
                        {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : isOtpSent ? 'Reenviar SMS' : 'Verificar SMS'}
                      </button>
                    )}
                  </div>

                  {/* OTP code input block */}
                  {isOtpSent && !isPhoneVerified && (
                    <div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-amber-900">Código de 6 dígitos SMS:</span>
                        {otpDemoHint && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Demo: {otpDemoHint}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-amber-300 font-mono text-center tracking-widest text-xs font-bold text-[#1E1B4B] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || !otpCode}
                          className="px-3 py-1.5 bg-[#1E1B4B] text-white rounded-lg font-bold text-xs hover:bg-[#28235C] transition-colors disabled:opacity-50"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400 mt-1">
                    1 número = 1 cuenta verificada (garantiza baux y reputación seguras).
                  </p>
                </div>

                {/* RGPD Mandatory Consent */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-[#1E1B4B]">
                    <input
                      type="checkbox"
                      required
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-[#1E1B4B] focus:ring-[#1E1B4B] w-4 h-4 cursor-pointer shrink-0"
                      id="checkbox-privacy-consent"
                    />
                    <span className="leading-tight text-stone-600">
                      {t.privacyConsentLabel}{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                        }}
                        className="text-[#1E1B4B] font-bold underline hover:text-[#28235C]"
                      >
                        {t.viewPrivacyPolicyLink}
                      </button>
                      .
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && !isPhoneVerified)}
              className="w-full py-3 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              id="btn-submit-auth"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{t.login}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>
                    {selectedRole === 'landlord' ? 'Crear mi cuenta de Propietario' : 'Crear mi cuenta de Inquilino'}
                  </span>
                </>
              )}
            </button>

            {mode === 'login' && (
              <div className="pt-2 pb-1 border-t border-stone-100">
                <span className="block text-[11px] font-bold text-stone-400 mb-1.5">
                  {language === 'es' ? 'Acceso rápido de prueba (Demo):' : 'Accès rapide de test (Démo) :'}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('inquilino@rentia.com');
                      setPassword('password123');
                    }}
                    className="py-1 px-2 text-[11px] rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#1E1B4B] font-bold text-center transition-colors"
                    id="btn-quick-login-tenant"
                  >
                    Inquilino
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('propietario@rentia.com');
                      setPassword('password123');
                    }}
                    className="py-1 px-2 text-[11px] rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0FA3A3] font-bold text-center transition-colors"
                    id="btn-quick-login-landlord"
                  >
                    Propietario
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@rentia.com');
                      setPassword('password123');
                    }}
                    className="py-1 px-2 text-[11px] rounded-lg bg-amber-50 hover:bg-amber-100 text-[#D97706] font-bold text-center transition-colors"
                    id="btn-quick-login-admin"
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Privacy Center & Account Management */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-2">
          {onOpenPrivacyPolicy && (
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="w-full py-1.5 text-center text-xs text-stone-500 font-semibold hover:underline flex items-center justify-center gap-1"
              id="btn-modal-privacy-center"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>{t.privacyCenterBtn}</span>
            </button>
          )}

          {onLogout && currentTenant && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-1.5 text-center text-xs text-red-600 font-semibold hover:underline"
              id="btn-modal-logout"
            >
              {t.logout}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
