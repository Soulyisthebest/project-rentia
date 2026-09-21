import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Share2, 
  Lock,
  CheckCircle2,
  Clock,
  Briefcase,
  Euro,
  Users,
  PawPrint,
  Edit3,
  Camera
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface PassportCardProps {
  tenant: TenantProfile;
  language: Language;
  onOpenShareModal: () => void;
  onOpenSimulatorModal?: () => void;
  onOpenKycModal?: () => void;
  onOpenOnboardingModal?: () => void;
}

export const PassportCard: React.FC<PassportCardProps> = ({
  tenant,
  language,
  onOpenShareModal,
  onOpenKycModal,
  onOpenOnboardingModal,
}) => {
  const t = TRANSLATIONS[language];
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);

  const passportNumber = tenant.passportNumber || (tenant.id ? `RNTA-ES-${tenant.id.substring(0, 4).toUpperCase()}` : '—');
  const qrVerificationUrl = tenant.passportNumber || tenant.id
    ? `https://rentiapassport.org/verify/${passportNumber}`
    : 'https://rentiapassport.org';

  const initialLetter = (tenant.fullName || tenant.firstName || t.guestUser).charAt(0).toUpperCase();

  const isVerified = tenant.isVerified || tenant.verificationStatus === 'verified';
  const isPendingKyc = tenant.verificationStatus === 'pending_admin';

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
      
      {/* Passport Header with Rentia Indigo Identity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 relative">
            {initialLetter}
            {isVerified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1E1B4B]">
                {tenant.fullName || t.guestUser}
              </h2>

              {/* Check Verde oficial verificado por admin */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black" title="Perfil verificado por la administración con DNI cotejado">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Check Verde Oficial</span>
                </span>
              ) : isPendingKyc ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                  <span>DNI en revisión por Admin</span>
                </span>
              ) : (
                onOpenKycModal && (
                  <button
                    onClick={onOpenKycModal}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-300 hover:border-emerald-300 text-stone-600 text-[10px] font-bold transition-colors"
                    title="Sube tu DNI y fotografía para obtener el Check Verde validado por el administrador"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Verificar con DNI</span>
                  </button>
                )
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              {tenant.passportNumber || tenant.id ? `N° ${passportNumber}` : t.noActiveSessionDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {!isVerified && !isPendingKyc && onOpenKycModal && (
            <button
              onClick={onOpenKycModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Conseguir Check Verde</span>
            </button>
          )}

          <button
            onClick={onOpenShareModal}
            className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-[#1E1B4B] transition-colors"
            title={t.shareBtn}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Score & Metrics Panel */}
      <div className="grid grid-cols-3 gap-3">
        {/* Metric 1: Trust Score */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.trustScore ?? tenant.trustScore ?? 0}
            <span className="text-xs text-stone-400 font-normal">/100</span>
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.scoreLabel}</p>
        </div>

        {/* Metric 2: On-time Payments */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.onTimePaymentRate ?? tenant.onTimePaymentRate ?? 0}%
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.onTimePayments}</p>
        </div>

        {/* Metric 3: Verified Leases */}
        <div className="bg-[#FAF9F6] rounded-2xl p-3.5 text-center border border-stone-200/60">
          <p className="text-2xl font-black text-[#1E1B4B] leading-none">
            {tenant.stats?.verifiedLandlordsCount ?? tenant.verifiedLeasesCount ?? 0}
          </p>
          <p className="text-[11px] font-semibold text-stone-600 mt-1 truncate">{t.verifiedLandlords}</p>
        </div>
      </div>

      {/* Laboral & Solvencia Panel (Editable por el inquilino) */}
      <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#1E1B4B]" />
            <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
              Datos Laborales & Solvencia de Alquiler
            </h3>
          </div>
          {onOpenOnboardingModal && (
            <button
              onClick={onOpenOnboardingModal}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3 h-3" />
              <span>Modificar datos</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <span className="block text-[10px] text-stone-400 font-bold uppercase">Nómina mensual</span>
            <span className="font-black text-[#1E1B4B]">
              {tenant.monthlyIncome || tenant.monthlySalary ? `${tenant.monthlyIncome || tenant.monthlySalary} €/mes` : 'Por indicar'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <span className="block text-[10px] text-stone-400 font-bold uppercase">Trabajo / Contrato</span>
            <span className="font-bold text-[#1E1B4B] truncate block capitalize">
              {tenant.employmentType || tenant.profession || 'No especificado'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <span className="block text-[10px] text-stone-400 font-bold uppercase">Avalista</span>
            <span className="font-bold text-[#1E1B4B]">
              {tenant.hasGuarantor ? `Sí (${tenant.guarantorIncome || 0} €)` : 'Sin avalista'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-stone-200/60">
            <span className="block text-[10px] text-stone-400 font-bold uppercase">Mascotas</span>
            <span className="font-bold text-[#1E1B4B] truncate block">
              {tenant.hasPets ? (tenant.petDetails ? `Sí (${tenant.petDetails})` : 'Sí tiene') : 'Sin mascotas'}
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED QR CODE SPACE */}
      <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-stone-200/80 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#1E1B4B]" />
            <h3 className="text-xs font-bold text-[#1E1B4B]">{t.qrVerifiedTitle}</h3>
          </div>
          <p className="text-[11px] text-stone-500 max-w-xs leading-relaxed">
            {t.qrVerifiedDesc}
          </p>
        </div>

        <div 
          onClick={() => setShowQrFullscreen(true)}
          className="bg-white p-2 rounded-xl border border-stone-200 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrVerificationUrl)}`}
            alt="QR Code Passport"
            className="w-16 h-16"
          />
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showQrFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-[#1E1B4B]">{t.qrVerifiedTitle}</h3>
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrVerificationUrl)}`}
                alt="QR Code Enlarge"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-[11px] text-stone-500 font-mono">{qrVerificationUrl}</p>
            <button
              onClick={() => setShowQrFullscreen(false)}
              className="w-full py-2.5 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
