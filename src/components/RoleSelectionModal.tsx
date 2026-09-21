import React, { useState } from 'react';
import { X, User, Building2, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
  language: Language;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [selected, setSelected] = useState<UserRole | null>(null);

  if (!isOpen) return null;

  const handleContinue = (role: UserRole) => {
    setSelected(role);
    onSelectRole(role);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-fade-in"
        id="role-selection-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          id="btn-close-role-modal"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
            <span>{t.selectProfileTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
            {t.selectProfileTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {t.selectProfileSubtitle}
          </p>
        </div>

        {/* 2 Exclusive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          
          {/* Card 1: TENANT */}
          <button
            type="button"
            onClick={() => handleContinue('tenant')}
            className={`group text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              selected === 'tenant'
                ? 'border-[#1E1B4B] bg-[#1E1B4B]/5 shadow-md ring-2 ring-[#1E1B4B]/20'
                : 'border-stone-200 bg-white hover:border-[#1E1B4B] hover:bg-stone-50/80 shadow-2xs'
            }`}
            id="btn-choose-tenant"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#1E1B4B] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base text-[#1E1B4B]">
                  {t.roleTenantTitle}
                </h3>
                {selected === 'tenant' && (
                  <CheckCircle2 className="w-4 h-4 text-[#1E1B4B]" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.roleTenantDesc}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1E1B4B]">
              <span>{t.getStartedBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: LANDLORD */}
          <button
            type="button"
            onClick={() => handleContinue('landlord')}
            className={`group text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              selected === 'landlord'
                ? 'border-[#0FA3A3] bg-[#0FA3A3]/5 shadow-md ring-2 ring-[#0FA3A3]/20'
                : 'border-stone-200 bg-white hover:border-[#0FA3A3] hover:bg-stone-50/80 shadow-2xs'
            }`}
            id="btn-choose-landlord"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#0FA3A3] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-base text-[#1C3B3A]">
                  {t.roleLandlordTitle}
                </h3>
                {selected === 'landlord' && (
                  <CheckCircle2 className="w-4 h-4 text-[#0FA3A3]" />
                )}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {t.roleLandlordDesc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#0FA3A3]">
              <span>{t.getStartedBtn}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* Notice of exclusivity */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
          <p className="text-[11px] text-stone-500 font-medium">
            🔒 <strong className="text-stone-700">{t.roleLockedNotice}</strong> — Chaque compte est strictement réservé à un rôle unique pour prévenir les conflits d'intérêts et garantir l'authenticité des certifications.
          </p>
        </div>

      </div>
    </div>
  );
};
