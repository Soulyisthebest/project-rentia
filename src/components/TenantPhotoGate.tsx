import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Plus, 
  AlertCircle,
  Link,
  ShieldCheck
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language } from '../i18n/translations';
import { api } from '../api/client';

interface TenantPhotoGateProps {
  tenant: TenantProfile;
  language: Language;
  onPhotosUpdated: (photos: string[]) => void;
  onOpenQuiz?: () => void;
}

const SAMPLE_VERIFIED_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
];

export const TenantPhotoGate: React.FC<TenantPhotoGateProps> = ({
  tenant,
  language,
  onPhotosUpdated,
  onOpenQuiz,
}) => {
  const initialPhotos = Array.isArray(tenant.photos) && tenant.photos.length > 0
    ? tenant.photos
    : (tenant.avatarUrl ? [tenant.avatarUrl] : []);

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [urlInput, setUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => {
            const next = [...prev, event.target!.result as string];
            return next.slice(0, 6); // Max 6 photos
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setPhotos(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
    setErrorMessage(null);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const handleLoadSamplePhotos = () => {
    setPhotos(SAMPLE_VERIFIED_PHOTOS);
    setErrorMessage(null);
  };

  const handleSaveAndUnlock = async () => {
    if (photos.length < 3) {
      setErrorMessage(
        language === 'es'
          ? 'Para poder ver propiedades tienes que subir al menos 3 fotos suyas.'
          : language === 'en'
          ? 'To view properties you must upload at least 3 photos of yourself.'
          : 'Pour voir les propriétés, vous devez importer au moins 3 photos de vous.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Guardar en backend
      await api.tenant.updateFinancialProfile({
        userId: tenant.id,
        email: tenant.email,
        photos,
        bio: tenant.bio,
      } as any);

      // Guardar en localStorage para persistencia
      localStorage.setItem(`rentia_tenant_photos_${tenant.id || 'current'}`, JSON.stringify(photos));
      localStorage.setItem('rentia_tenant_photos_current', JSON.stringify(photos));

      // Actualizar estado del padre
      onPhotosUpdated(photos);
    } catch (err: any) {
      console.warn('Error al guardar fotos en servidor, aplicando fallback local:', err);
      // Fallback local seguro
      localStorage.setItem(`rentia_tenant_photos_${tenant.id || 'current'}`, JSON.stringify(photos));
      localStorage.setItem('rentia_tenant_photos_current', JSON.stringify(photos));
      onPhotosUpdated(photos);
    } finally {
      setIsSaving(false);
    }
  };

  const remainingNeeded = Math.max(0, 3 - photos.length);
  const isUnlocked = photos.length >= 3;

  return (
    <div className="w-full max-w-xl mx-auto my-4 bg-white rounded-3xl shadow-xl border-2 border-amber-200/80 overflow-hidden">
      {/* Header con advertencia estricta */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 px-6 py-8 text-white text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/10 blur-xl pointer-events-none" />
        
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner mb-4">
          <Lock className="w-7 h-7 text-white" />
        </div>

        {/* Mensaje exacto solicitado por el usuario */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug max-w-md mx-auto">
          {language === 'es' ? (
            <>Para poder ver propiedades tienes que subir 3 fotos suyas</>
          ) : language === 'en' ? (
            <>To view properties you must upload 3 photos of yourself</>
          ) : (
            <>Pour voir les propriétés, vous devez importer 3 photos de vous</>
          )}
        </h2>

        <p className="text-xs sm:text-sm text-amber-100 mt-2.5 max-w-md mx-auto font-medium leading-relaxed">
          {language === 'es'
            ? 'Por seguridad, verificación y reciprocidad de la comunidad de Rentia, cada inquilino debe contar con al menos 3 fotografías antes de desbloquear los anuncios de viviendas.'
            : language === 'en'
            ? 'For community safety, verification, and reciprocity on Rentia, every tenant must have at least 3 photos before unlocking property listings.'
            : 'Pour la sécurité, la vérification et la réciprocité de la communauté Rentia, chaque locataire doit disposer d\'au moins 3 photos avant de débloquer les annonces immobilières.'}
        </p>

        {/* Contador de progreso */}
        <div className="mt-5 inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold">
          <Camera className="w-4 h-4 text-amber-300" />
          <span>
            {photos.length} / 3 {language === 'es' ? 'fotos requeridas' : language === 'en' ? 'required photos' : 'photos requises'}
          </span>
          {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-300 ml-1" />}
        </div>
      </div>

      {/* Cuerpo interactivo con los 3 slots */}
      <div className="p-6 space-y-6">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Rejilla de los 3 slots de fotos obligatorias */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              {language === 'es' ? 'Tus 3 Fotografías Obligatorias' : language === 'en' ? 'Your 3 Required Photos' : 'Vos 3 photos obligatoires'}
            </span>
            <span className={`text-xs font-bold ${isUnlocked ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isUnlocked
                ? (language === 'es' ? '¡Requisito cumplido!' : 'Requirement met!')
                : (language === 'es' ? `Faltan ${remainingNeeded} foto${remainingNeeded > 1 ? 's' : ''}` : `${remainingNeeded} photo(s) left`)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((slotIndex) => {
              const photoUrl = photos[slotIndex];
              return (
                <div
                  key={slotIndex}
                  className={`relative aspect-3/4 rounded-2xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center p-2 text-center ${
                    photoUrl
                      ? 'border-emerald-500 bg-stone-900 shadow-md'
                      : 'border-dashed border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!photoUrl && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt={`Foto ${slotIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(slotIndex);
                        }}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1.5 inset-x-1.5 text-center text-[10px] font-bold text-white truncate">
                        Foto {slotIndex + 1}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-stone-400">
                      <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
                        <Plus className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-[11px] font-bold text-stone-600">
                        Foto {slotIndex + 1}
                      </span>
                      <span className="text-[9px] text-stone-400 font-medium">
                        {slotIndex === 0 ? 'Principal' : slotIndex === 1 ? 'Segunda' : 'Tercera'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles de Subida */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-3">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            {language === 'es' ? 'Cómo añadir tus fotos' : 'How to add your photos'}
          </span>

          {/* Botón subir archivo */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <Upload className="w-4 h-4 text-[#1E1B4B]" />
              <span>{language === 'es' ? 'Subir desde dispositivo' : 'Upload from device'}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSamplePhotos}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{language === 'es' ? 'Usar fotos de muestra' : 'Use sample photos'}</span>
            </button>
          </div>

          {/* Añadir por URL */}
          <form onSubmit={handleAddUrl} className="flex gap-2">
            <div className="relative flex-1">
              <Link className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/mi-foto.jpg"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-3 py-2 text-xs font-bold bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              Añadir
            </button>
          </form>
        </div>

        {/* Acciones principales */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleSaveAndUnlock}
            disabled={!isUnlocked || isSaving}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              isUnlocked
                ? 'bg-[#1E1B4B] hover:bg-[#2A2663] text-white cursor-pointer active:scale-[0.99]'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span>Guardando fotos...</span>
            ) : isUnlocked ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Guardar y desbloquear propiedades</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  {language === 'es'
                    ? `Sube ${remainingNeeded} foto${remainingNeeded > 1 ? 's' : ''} más para ver propiedades`
                    : `Upload ${remainingNeeded} more photo(s) to view properties`}
                </span>
              </>
            )}
          </button>

          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Abrir Cuestionario Completo de Matching</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
