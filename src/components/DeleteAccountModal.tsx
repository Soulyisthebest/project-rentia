import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  PauseCircle, 
  Trash2, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2,
  Loader2,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import { api } from '../api/client';
import { TRANSLATIONS } from '../i18n/translations';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeactivated: () => void;
  onDeleted: () => void;
  isLandlord?: boolean;
  language?: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeactivated,
  onDeleted,
  isLandlord = false,
  language = 'fr',
}) => {
  const [step, setStep] = useState<'select' | 'confirm_delete'>('select');
  const [confirmInput, setConfirmInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language as 'fr' | 'es' | 'en'] || TRANSLATIONS.fr;

  const resetState = () => {
    setStep('select');
    setConfirmInput('');
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.tenant.deactivateAccount();
      resetState();
      onDeactivated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la désactivation du compte.');
      setIsLoading(false);
    }
  };

  const handleDeletePermanent = async () => {
    if (confirmInput.trim().toUpperCase() !== 'SUPPRIMER') {
      setErrorMessage('Veuillez saisir exactement le mot SUPPRIMER pour confirmer.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.tenant.deleteAccount();
      resetState();
      onDeleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la suppression définitive du compte.');
      setIsLoading(false);
    }
  };

  const isConfirmed = confirmInput.trim().toUpperCase() === 'SUPPRIMER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        id="modal-delete-account"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">
                {step === 'select' ? 'Gérer ou supprimer mon compte' : 'Confirmation de suppression définitive'}
              </h2>
              <p className="text-xs text-stone-500">
                {step === 'select' 
                  ? 'Choisissez entre une pause réversible ou une suppression définitive' 
                  : 'Action irréversible soumise à validation textuelle'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50"
            id="btn-close-delete-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'select' ? (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                Avant de continuer, veuillez lire attentivement la différence entre les deux options ci-dessous. L'une est <strong>temporaire et réversible</strong>, l'autre est <strong>définitive et irréversible</strong>.
              </div>

              {/* Option 1: Temporary Deactivation */}
              <div className="p-5 rounded-2xl border-2 border-stone-200 hover:border-amber-300 bg-white transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                      <PauseCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E1B4B]">
                        1. Désactiver temporairement mon compte
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Option réversible à tout moment
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="text-xs text-stone-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span><strong>Invisibilité immédiate :</strong> Votre profil n'apparaît plus dans le deck de découverte des {isLandlord ? 'locataires' : 'propriétaires'}, ni dans les recherches de candidats ou d'annonces.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zéro perte de données :</strong> Vos baux, attestations certifiées, réputation et documents restent intacts et en sécurité.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Réactivation instantanée :</strong> Il vous suffira de vous reconnecter avec vos identifiants habituels pour réactiver votre compte sans aucune démarche.</span>
                  </li>
                </ul>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleDeactivate}
                    disabled={isLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    id="btn-confirm-deactivate-account"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Désactivation en cours...</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Désactiver temporairement mon compte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: Permanent Deletion */}
              <div className="p-5 rounded-2xl border-2 border-stone-200 hover:border-rose-300 bg-white transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E1B4B]">
                        2. Supprimer définitivement mon compte
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        Action irréversible • RGPD Art. 17
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="text-xs text-stone-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Anonymisation stricte :</strong> Votre nom, email, téléphone et données personnelles sont définitivement anonymisés conformément au RGPD.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Purge intégrale du stockage :</strong> Tous vos fichiers de contrats et justificatifs hébergés sont purgés.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span><strong>Sceau anti-fraude :</strong> Seules les attestations déjà vérifiées par un tiers conservent leur empreinte cryptographique scellée.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Définitivement irrécupérable :</strong> Vous ne pourrez plus jamais vous connecter ni restaurer ce passeport.</span>
                  </li>
                </ul>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setStep('confirm_delete');
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-stone-100 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-stone-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    id="btn-start-permanent-delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer définitivement mon compte...</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Double Confirmation with explicit SUPPRIMER validation */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setStep('select');
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#1E1B4B] transition-colors"
                id="btn-back-to-options"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au choix des options</span>
              </button>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Double confirmation obligatoire</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">
                  Cette action est <strong>définitive et irréversible</strong>. Votre passeport locatif, vos coordonnées et tous vos fichiers de contrats stockés seront immédiatement purgés et anonymisés conformément à l'article 17 du RGPD.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-stone-700">
                  Pour confirmer, tapez <span className="text-rose-600 font-mono tracking-wider font-extrabold">SUPPRIMER</span> ci-dessous :
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="SUPPRIMER"
                  autoFocus
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm font-mono tracking-widest text-center uppercase"
                  id="input-confirm-delete-account"
                />
                <p className="text-[11px] text-stone-500 text-center">
                  Le bouton d'effacement définitif sera activé dès la saisie exacte du mot.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                  id="btn-cancel-delete-account"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeletePermanent}
                  disabled={!isConfirmed || isLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-execute-permanent-delete"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Suppression en cours...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmer la suppression définitive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
