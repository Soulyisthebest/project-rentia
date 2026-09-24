import React, { useState } from 'react';
import { X, Building2, Euro, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { Language, TRANSLATIONS } from '../i18n/translations';

export const ANDALUSIA_CITIES = [
  'Málaga',
  'Sevilla',
  'Granada',
  'Córdoba',
  'Cádiz',
  'Almería',
  'Huelva',
  'Jaén',
] as const;

interface CreateListingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onListingCreated: () => void;
  currentUserEmail?: string;
  currentUserId?: string;
  language: Language;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  currentUserEmail,
  currentUserId,
  language
}) => {
  if (isOpen !== undefined && !isOpen) return null;
  const t = TRANSLATIONS[language];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultSampleImages = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540518614846-7ede433c4ef2?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
  ];

  const [images, setImages] = useState<string[]>(defaultSampleImages);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [ownershipDocUrl, setOwnershipDocUrl] = useState('');
  const [cadastralRef, setCadastralRef] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: 'Málaga',
    neighborhood: 'Centro / Soho',
    address: '',
    address_exact: '',
    latitude: 36.7213,
    longitude: -4.4214,
    rent: 850,
    deposit: 850,
    currency: '€',
    property_type: 'apartment',
    rooms_count: 2,
    bathrooms_count: 1,
    surface_sqm: 55,
    available_from: '2026-09-01',
    pets_allowed: true,
    furnished: true,
    min_income_required: 2100,
  });

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (images.length < 10) {
      setError(`Se requiere un mínimo de 10 fotografías (actualmente: ${images.length}).`);
      setLoading(false);
      return;
    }

    try {
      // Whitelist stricte correspondant exactement aux colonnes de public.listings
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description || null,
        city: formData.city,
        neighborhood: formData.neighborhood || null,
        address: formData.address || null,
        address_exact: formData.address_exact || null,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        rent: Number(formData.rent),
        deposit: Number(formData.deposit),
        currency: formData.currency,
        property_type: formData.property_type,
        rooms_count: Number(formData.rooms_count),
        bathrooms_count: Number(formData.bathrooms_count),
        surface_sqm: Number(formData.surface_sqm),
        available_from: formData.available_from,
        pets_allowed: formData.pets_allowed,
        furnished: formData.furnished,
        min_income_required: Number(formData.min_income_required),
        images: images,
        ownership_document_url: ownershipDocUrl.trim() || null,
        cadastral_reference: cadastralRef.trim() || null,
      };

      if (currentUserId) {
        payload.landlord_id = currentUserId;
      }

      await api.matching.createListing(payload);
      setSuccess(true);
      setTimeout(() => {
        onListingCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('Seuls les propriétaires') || errMsg.includes('landlord') || errMsg.includes('interdite')) {
        setError(t.createListingLandlordOnlyError);
      } else {
        setError(errMsg || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F6] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 text-[#1E1B4B] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1E1B4B]" />
            <h3 className="text-base font-bold text-[#1E1B4B]">{t.publishModalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-[#1E1B4B]">{t.publishSuccessTitle}</h4>
            <p className="text-xs text-stone-500">{t.publishSuccessDesc}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-700 mb-1">{t.listingTitleLabel}</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={t.listingTitlePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.cityLabel} (Andalucía)</label>
                <select
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                >
                  {ANDALUSIA_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.neighborhoodLabel}</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder={t.neighborhoodPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.rentLabel}</label>
                <input
                  type="number"
                  required
                  value={formData.rent}
                  onChange={e => setFormData({ ...formData, rent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.surface} (m²)</label>
                <input
                  type="number"
                  value={formData.surface_sqm}
                  onChange={e => setFormData({ ...formData, surface_sqm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">{t.roomsCount}</label>
                <input
                  type="number"
                  value={formData.rooms_count}
                  onChange={e => setFormData({ ...formData, rooms_count: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
              </div>
            </div>

            {/* Fotos obligatorias (mínimo 10) */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-stone-700">
                  Fotos del inmueble ({images.length}/10 mínimo requeridas)
                </label>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${images.length >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {images.length >= 10 ? '✓ Requisito cumplido' : `Faltan ${10 - images.length}`}
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="Pegar URL de foto (ej. https://...)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3 py-1.5 bg-[#1E1B4B] text-white rounded-xl font-bold hover:bg-[#28235C] transition-colors"
                >
                  + Añadir
                </button>
              </div>

              {/* Miniaturas */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 max-h-36 overflow-y-auto">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-stone-200 aspect-square">
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-[9px] text-white px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verificación de Titularidad (P1.6) */}
            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-950">Verificación de Titularidad (Escritura / Nota Simple)</span>
              </div>
              <p className="text-[11px] text-indigo-900/80">
                Aporta la referencia catastral o enlace a la Nota Simple para recibir el distintivo de <strong>Inmueble Verificado</strong>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">Ref. Catastral</label>
                  <input
                    type="text"
                    value={cadastralRef}
                    onChange={e => setCadastralRef(e.target.value)}
                    placeholder="20 caracteres alfanuméricos"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-0.5">URL Nota Simple / Documento</label>
                  <input
                    type="url"
                    value={ownershipDocUrl}
                    onChange={e => setOwnershipDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
                  />
                </div>
              </div>
            </div>

            {/* Dirección exacta (privada) */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Dirección exacta (Privada: solo visible tras el match)
              </label>
              <input
                type="text"
                value={formData.address_exact}
                onChange={e => setFormData({ ...formData, address_exact: e.target.value })}
                placeholder="Ej. Calle Larios 14, 3º B"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">{t.descriptionLabel}</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#1E1B4B]"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.furnished}
                  onChange={e => setFormData({ ...formData, furnished: e.target.checked })}
                  className="rounded border-stone-300 text-[#1E1B4B]"
                />
                <span className="font-semibold text-stone-700">{t.furnished}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pets_allowed}
                  onChange={e => setFormData({ ...formData, pets_allowed: e.target.checked })}
                  className="rounded border-stone-300 text-[#1E1B4B]"
                />
                <span className="font-semibold text-stone-700">{t.petsAllowed}</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? t.publishingBtn : t.publishListingBtn}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
