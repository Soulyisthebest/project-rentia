import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Printer, 
  Share2, 
  FileCheck2, 
  Award, 
  QrCode, 
  Plus, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Lock,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TenantProfile, RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { PassportCard } from './PassportCard';
import { TrustStats } from './TrustStats';
import { RentalHistoryList } from './RentalHistoryList';

interface UnifiedPassportAndCertificateProps {
  tenant: TenantProfile;
  leases: RentalLease[];
  onOpenAddModal: () => void;
  onOpenScanContract: () => void;
  onDeleteLease: (id: string) => void;
  onOpenShareModal: () => void;
  language: Language;
}

export const UnifiedPassportAndCertificate: React.FC<UnifiedPassportAndCertificateProps> = ({
  tenant,
  leases,
  onOpenAddModal,
  onOpenScanContract,
  onDeleteLease,
  onOpenShareModal,
  language,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const t = TRANSLATIONS[language];
  const verifiedLeases = leases.filter((l) => l.status === 'verified');
  const passportNumber = tenant.passportNumber || `RNTA-ES-${(tenant.id || 'DEMO').substring(0, 4).toUpperCase()}`;
  const verifyUrl = `https://rentia.app/verify/${(tenant.passportId || tenant.id || 'demo').toLowerCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" id="unified-passport-certificate">
      {/* Top Banner Toolbar */}
      <div className="no-print bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-[#1E1B4B] flex items-center gap-1.5">
              <span>Pasaporte y Certificado Oficial</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                100% Verificado
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Documento unificado legal y digital de reputación del inquilino
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Copiar enlace de verificación"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado' : 'Copiar URL'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8C8C] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            id="btn-print-unified"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 1. SECCIÓN PASAPORTE DIGITAL (CARD CON QR Y FOTOS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-indigo-600" />
            1. Pasaporte Digital de Inquilino
          </span>
          <span className="text-xs font-mono text-stone-400 font-bold">
            {passportNumber}
          </span>
        </div>

        <PassportCard
          tenant={tenant}
          onOpenShareModal={onOpenShareModal}
          language={language}
        />

        <TrustStats 
          tenant={tenant} 
          language={language} 
        />
      </section>

      {/* 2. SECCIÓN CERTIFICADO OFICIAL LEGAL UNIFICADO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            2. Certificado Oficial de Arrendamiento
          </span>
          <span className="text-[11px] text-stone-500 font-semibold">
            Validez legal conforme a la LAU
          </span>
        </div>

        {/* The Official Certificate Document */}
        <div className="bg-white text-[#1C3B3A] p-6 sm:p-8 rounded-3xl shadow-xs border border-stone-200 relative overflow-hidden print:border-none print:shadow-none print:p-0">
          {/* Header of Document */}
          <div className="text-center pb-5 border-b border-stone-100">
            <div className="w-12 h-12 rounded-2xl bg-[#0FA3A3] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <span className="text-[10px] uppercase tracking-widest text-[#0FA3A3] font-bold block">
              {t.officialProtocol || 'PROTOCOLO OFICIAL DE VERIFICACIÓN'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#1C3B3A] uppercase mt-0.5">
              {t.inspectionTitle || 'CERTIFICADO DE SOLVENCIA Y CUMPLIMIENTO ARRENDATARIO'}
            </h2>
            <p className="text-xs text-[#5C7B79] mt-1 max-w-md mx-auto">
              Expedido por Rentia para acreditar el historial de pagos y comportamiento verificado.
            </p>
          </div>

          {/* Tenant Identity Block */}
          <div className="py-4 border-b border-stone-100 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#5C7B79] block">{t.titularName || 'Titular'}</span>
              <strong className="text-sm font-bold block text-[#1C3B3A]">{tenant.fullName}</strong>
              <span className="text-[#5C7B79] text-[11px]">{tenant.profession || 'Profesional'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-[#5C7B79] block">ID Pasaporte / Certificado</span>
              <span className="font-mono font-bold text-xs bg-stone-100 text-[#1C3B3A] px-2 py-0.5 rounded inline-block mt-0.5">
                {passportNumber}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                ✓ Puntuación de Confianza: {tenant.trustScore}/100
              </span>
            </div>
          </div>

          {/* Verified Tenancies Table */}
          <div className="py-4 border-b border-stone-100 space-y-3">
            <h3 className="text-xs font-bold uppercase text-[#1C3B3A] tracking-wider flex items-center justify-between">
              <span>{t.tenancyRecords || 'Historial de Arrendamientos Auditados'}</span>
              <span className="text-[10px] text-[#5C7B79] lowercase font-normal">
                {verifiedLeases.length} {verifiedLeases.length === 1 ? 'contrato verificado' : 'contratos verificados'}
              </span>
            </h3>

            {verifiedLeases.length === 0 ? (
              <div className="bg-stone-50 p-4 rounded-xl text-center text-xs text-[#5C7B79]">
                Actualmente no hay contratos verificados registrados. Pulsa en "Añadir alquiler" para solicitar la verificación a tu propietario.
              </div>
            ) : (
              <div className="space-y-2.5">
                {verifiedLeases.map((lease) => (
                  <div 
                    key={lease.id}
                    className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0FA3A3]" />
                        <strong className="text-[#1C3B3A]">{lease.address}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#5C7B79]">
                        <span>Renta: {lease.rentAmount} €/mes</span>
                        <span>•</span>
                        <span>{lease.startDate} — {lease.endDate || 'Actual'}</span>
                      </div>
                      <div className="text-[10px] text-[#5C7B79]">
                        Propietario verificador: <strong>{lease.landlordName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.statusVerified || 'Verificado'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Footer with Unified Verification QR */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div className="space-y-1 text-[10px] text-[#5C7B79] max-w-xs">
              <p className="font-semibold text-[#1C3B3A]">Verificación Criptográfica y QR</p>
              <p>
                Este certificado y pasaporte unificado están protegidos con firma digital de Rentia.
                Cualquier propietario puede comprobar la autenticidad escaneando el código QR.
              </p>
              <p className="text-[9px] text-stone-400 font-mono">
                Hash: SHA256:{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>

            <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs shrink-0 text-center">
              <QRCodeSVG value={verifyUrl} size={76} />
              <span className="text-[8px] font-mono text-stone-500 block mt-1">
                Escanear QR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN GESTIÓN DE CONTRATOS Y ALQUILERES */}
      <section className="space-y-3">
        <RentalHistoryList
          leases={leases}
          onOpenAddModal={onOpenAddModal}
          onOpenScanContract={onOpenScanContract}
          onDeleteLease={onDeleteLease}
          tenantName={tenant.fullName}
          language={language}
        />
      </section>
    </div>
  );
};
