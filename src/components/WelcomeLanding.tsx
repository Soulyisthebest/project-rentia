import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  FileCheck, 
  Lock, 
  KeyRound,
  Globe,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface WelcomeLandingProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onOpenAdmin?: () => void;
  onVerifyLeaseDirect?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  onGetStarted,
  onOpenLogin,
  onOpenAdmin,
  onVerifyLeaseDirect,
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];
  const [showLangMenu, setShowLangMenu] = React.useState(false);

  const availableLanguages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E1B4B] flex flex-col font-sans selection:bg-[#D97706] selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5 select-none" id="welcome-logo">
            <div className="w-9 h-9 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#1E1B4B] block leading-none">
                RENTIA
              </span>
              <span className="text-[9px] font-bold text-stone-400 tracking-wider uppercase">
                Passport & Verified Housing
              </span>
            </div>
          </div>

          {/* Right Action: Language Switcher & Quick Sign In */}
          <div className="flex items-center gap-2.5">
            {/* Language dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="px-2.5 py-1.5 text-stone-700 hover:text-[#1E1B4B] rounded-xl hover:bg-white transition-colors border border-stone-200 bg-white/80 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                id="btn-welcome-language"
              >
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                <span>{language.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 animate-scale-up">
                  {availableLanguages.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(item.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-stone-50 flex items-center justify-between transition-colors ${
                        language === item.code ? 'text-[#1E1B4B] font-bold bg-[#FAF9F6]' : 'text-stone-600'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-sm">{item.flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Dashboards Quick Access */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                id="btn-welcome-admin"
                title="Acceso al Panel de Control y Dashboards Rentia"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Admin Dashboards</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* Direct Login Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-800 hover:text-[#1E1B4B] text-xs font-bold transition-all shadow-2xs"
              id="btn-welcome-login"
            >
              {t.login}
            </button>
          </div>

        </div>
      </header>

      {/* Main Hero Showcase */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:py-16 max-w-4xl mx-auto w-full text-center">
        
        {/* Emblem & Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/90 shadow-2xs text-xs font-bold text-stone-600 mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Certificación Inmobiliaria & Transparencia en España</span>
        </div>

        {/* Large Visible Rentia Logo Badge */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-lg mb-4 ring-8 ring-indigo-50">
            <ShieldCheck className="w-11 h-11 sm:w-14 sm:h-14 text-[#D97706]" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1E1B4B]">
            RENTIA
          </h1>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#D97706] mt-1">
            El Pasaporte del Alquiler
          </span>
        </div>

        {/* Engaging Short Slogan */}
        <p className="text-base sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
          {t.welcomeSlogan}
        </p>

        {/* The ONLY Primary Button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs mb-10">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full py-4 px-6 rounded-2xl bg-[#1E1B4B] hover:bg-[#28235C] text-white font-black text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 group active:scale-98"
            id="btn-welcome-get-started"
          >
            <span>{t.getStartedBtn}</span>
            <ArrowRight className="w-5 h-5 text-[#D97706] group-hover:translate-x-1.5 transition-transform" />
          </button>

          {/* Subtle alternative link */}
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-xs font-bold text-stone-500 hover:text-[#1E1B4B] transition-colors underline decoration-stone-300 underline-offset-4"
            id="link-welcome-already-account"
          >
            {t.alreadyHaveAccount}
          </button>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mt-4">
          
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#1E1B4B] flex items-center justify-center mb-3">
              <FileCheck className="w-4 h-4 text-[#1E1B4B]" />
            </div>
            <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
              Pasaporte Infalsifiable
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Historique des loyers réglés à date certifié par les propriétaires précédents.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
            </div>
            <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
              Zéro Faux Dossiers
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Mise en relation directe avec des locataires certifiés et vérification de bail en 30 secondes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0FA3A3] flex items-center justify-center mb-3">
              <Lock className="w-4 h-4 text-[#0FA3A3]" />
            </div>
            <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
              100% Conforme RGPD
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Droit à l'oubli, minimisation des données et hébergement sécurisé en Union Européenne.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/70 py-6 px-4 text-center text-xs text-stone-400 bg-white/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-500 font-medium">
            Rentia © {new Date().getFullYear()} • El Pasaporte de Alquiler de Confianza en España
          </p>
          <div className="flex items-center gap-4 text-stone-500">
            {onVerifyLeaseDirect && (
              <button
                type="button"
                onClick={onVerifyLeaseDirect}
                className="hover:text-[#1E1B4B] font-bold flex items-center gap-1 transition-colors"
                id="footer-verify-direct-btn"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#0FA3A3]" />
                <span>{t.verifyLandlordBtn}</span>
              </button>
            )}
            <span>RGPD UE 2016/679</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
