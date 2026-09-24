import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Heart, 
  X, 
  Sparkles, 
  MapPin, 
  Home, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  PawPrint, 
  BedDouble, 
  CheckCircle2, 
  Navigation as NavigationIcon, 
  Loader2, 
  RotateCcw,
  SlidersHorizontal,
  Filter,
  HeartOff,
  Euro,
  Check
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { ANDALUSIA_CITIES } from './CreateListingModal';
import { TenantPhotoGate } from './TenantPhotoGate';
import { SEED_LISTINGS } from '../data/seedListings';

// Coordenadas aproximadas de las 8 capitales provinciales de Andalucía
const ANDALUSIA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Málaga': { lat: 36.7213, lng: -4.4214 },
  'Sevilla': { lat: 37.3891, lng: -5.9845 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Córdoba': { lat: 37.8882, lng: -4.7794 },
  'Cádiz': { lat: 36.5298, lng: -6.2924 },
  'Almería': { lat: 36.8381, lng: -2.4597 },
  'Huelva': { lat: 37.2614, lng: -6.9447 },
  'Jaén': { lat: 37.7796, lng: -3.7849 },
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface SwipeDiscoveryProps {
  tenant: TenantProfile;
  language: Language;
  onOpenPassportTab?: () => void;
  onNavigateToChat?: () => void;
  onOpenQuiz?: () => void;
  onPhotosUpdated?: (photos: string[]) => void;
  currentUserEmail?: string;
}

export const SwipeDiscovery: React.FC<SwipeDiscoveryProps> = ({
  tenant,
  language,
  onOpenPassportTab,
  onNavigateToChat,
  onOpenQuiz,
  onPhotosUpdated,
  currentUserEmail,
}) => {
  const t = TRANSLATIONS[language];
  const [rawListings, setRawListings] = useState<any[]>([]);
  const [swipedListingIds, setSwipedListingIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`rentia_swiped_${tenant.id || 'demo'}`);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
    return new Set();
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matchedListing, setMatchedListing] = useState<any | null>(null);
  const [compatibility, setCompatibility] = useState<any | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Andalusia City Filter and Geolocation State
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [isLocating, setIsLocating] = useState(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);

  // Deterministic Filters State
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [propertyType, setPropertyType] = useState<string>('all');
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);
  const [furnishedOnly, setFurnishedOnly] = useState<boolean>(false);
  const [elevatorOnly, setElevatorOnly] = useState<boolean>(false);

  // "los pisos a los cuales se da like o se quitan ya no se pueden ver por inquilinos en explorar, except si le dan una opcion de buscar en propiedades que no se le ha hecho corazon"
  const [hideInteracted, setHideInteracted] = useState<boolean>(true);

  // Motion values for swipe drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacityLike = useTransform(x, [30, 150], [0, 1]);
  const opacityPass = useTransform(x, [-30, -150], [0, 1]);

  // Load existing swiped IDs for this tenant
  useEffect(() => {
    const loadSwiped = async () => {
      if (tenant.id) {
        try {
          const res = await api.matching.getSwipedIds(tenant.id);
          if (res?.all && Array.isArray(res.all)) {
            setSwipedListingIds(prev => {
              const merged = new Set([...prev, ...res.all]);
              try {
                localStorage.setItem(`rentia_swiped_${tenant.id}`, JSON.stringify(Array.from(merged)));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Error fetching swiped IDs:', err);
        }
      }
    };
    loadSwiped();
  }, [tenant.id]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await api.matching.getListings({
        include_inactive: false,
        status: 'available',
      });
      if (Array.isArray(data) && data.length > 0) {
        const seen = new Set<string>();
        const uniqueData = data.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          if (l.is_active === false || l.status === 'rented' || l.status === 'inactive') return false;
          seen.add(l.id);
          return true;
        });
        setRawListings(uniqueData);
      } else {
        const seen = new Set<string>();
        const uniqueFallback = SEED_LISTINGS.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
        setRawListings(uniqueFallback);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      const seen = new Set<string>();
      const uniqueFallback = SEED_LISTINGS.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
      setRawListings(uniqueFallback);
    } finally {
      setCurrentIndex(0);
      setLoading(false);
    }
  };

  // Deterministic Filtering Algorithm
  const filteredListings = useMemo(() => {
    return rawListings.filter((l) => {
      if (!l || l.is_active === false || l.status === 'rented' || l.status === 'inactive') {
        return false;
      }

      // Hide properties with like or quit unless the user specifically disabled hideInteracted
      if (hideInteracted && swipedListingIds.has(l.id)) {
        return false;
      }

      // City filter
      if (selectedCity && selectedCity !== 'all') {
        const lCity = (l.city || '').toLowerCase();
        if (lCity !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Price filter
      const rent = Number(l.rent) || 0;
      if (minPrice !== null && rent < minPrice) return false;
      if (maxPrice !== null && rent > maxPrice) return false;

      // Bedrooms filter
      const beds = Number(l.bedrooms || l.rooms_count) || 1;
      if (minBedrooms !== null && beds < minBedrooms) return false;

      // Property type filter
      if (propertyType && propertyType !== 'all') {
        const pt = (l.property_type || '').toLowerCase();
        const targetPt = propertyType.toLowerCase();
        if (!pt.includes(targetPt) && !targetPt.includes(pt)) {
          return false;
        }
      }

      // Pets allowed filter
      if (petsAllowed && !l.pets_allowed) return false;

      // Furnished filter
      if (furnishedOnly && !l.is_furnished && !l.furnished) return false;

      // Elevator filter
      if (elevatorOnly && !l.elevator) return false;

      return true;
    });
  }, [
    rawListings,
    swipedListingIds,
    hideInteracted,
    selectedCity,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (minPrice !== null) count++;
    if (maxPrice !== null) count++;
    if (minBedrooms !== null) count++;
    if (propertyType !== 'all') count++;
    if (petsAllowed) count++;
    if (furnishedOnly) count++;
    if (elevatorOnly) count++;
    if (!hideInteracted) count++;
    return count;
  }, [
    selectedCity,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
    hideInteracted,
  ]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [
    selectedCity,
    minPrice,
    maxPrice,
    minBedrooms,
    propertyType,
    petsAllowed,
    furnishedOnly,
    elevatorOnly,
    hideInteracted,
  ]);

  const handleResetFilters = () => {
    setSelectedCity('all');
    setMinPrice(null);
    setMaxPrice(null);
    setMinBedrooms(null);
    setPropertyType('all');
    setPetsAllowed(false);
    setFurnishedOnly(false);
    setElevatorOnly(false);
    setHideInteracted(true);
    setCurrentIndex(0);
    setGeoToast('Filtros restablecidos');
    setTimeout(() => setGeoToast(null), 2500);
  };

  const handleActivateGeolocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoToast(t.geolocationErrorToast);
      setTimeout(() => setGeoToast(null), 3500);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        let closestCity = 'Málaga';
        let minDistance = Infinity;

        for (const [cityName, coords] of Object.entries(ANDALUSIA_COORDINATES)) {
          const dist = calculateDistance(latitude, longitude, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = cityName;
          }
        }

        setSelectedCity(closestCity);
        setGeoToast(`${t.closestCityToast} ${closestCity}`);
        setTimeout(() => setGeoToast(null), 3500);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error.message);
        setGeoToast(t.geolocationErrorToast);
        setTimeout(() => setGeoToast(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const currentListing = filteredListings[currentIndex];

  useEffect(() => {
    if (currentListing && tenant.id) {
      api.matching.getCompatibility(currentListing.id, tenant.id)
        .then(res => setCompatibility(res))
        .catch(() => setCompatibility(null));
      setActiveImageIndex(0);
      setShowDetailsSheet(false);
    }
  }, [currentIndex, currentListing?.id, tenant.id]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentListing) return;
    const listingIdToSwipe = currentListing.id;
    setSwipeDirection(direction);
    setShowDetailsSheet(false);

    // Save swiped id immediately so it is excluded from future explore views
    setSwipedListingIds((prev) => {
      const updated = new Set(prev);
      updated.add(listingIdToSwipe);
      try {
        localStorage.setItem(`rentia_swiped_${tenant.id || 'demo'}`, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });

    try {
      const res = await api.matching.swipe({
        actorId: tenant.id || 'anonymous_tenant',
        actorRole: 'tenant',
        listingId: listingIdToSwipe,
        targetUserId: currentListing.landlord_id || 'landlord_01',
        action: direction === 'right' ? 'like' : 'pass',
      });

      if (direction === 'right' && res.isMatch) {
        setMatchedListing(currentListing);
      }
    } catch (err) {
      console.error('Error swipe:', err);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      x.set(0);
    }, 220);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <div className="w-10 h-10 border-3 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#1E1B4B]/70 tracking-wide uppercase">
          {t.searchingListings}
        </p>
      </div>
    );
  }

  // TOP TOOLBAR CON FILTROS Y CONTADOR EN TIEMPO REAL
  const renderFilterAndCityBar = () => (
    <div className="w-full bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs mb-2.5 flex items-center justify-between gap-2">
      {/* City Selector */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full text-xs font-bold text-[#1E1B4B] bg-transparent border-0 focus:outline-none cursor-pointer truncate"
          id="select-city-andalusia"
        >
          <option value="all">{t.allCitiesAndalusia}</option>
          {ANDALUSIA_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Geolocation Button */}
      <button
        type="button"
        onClick={handleActivateGeolocation}
        disabled={isLocating}
        className="px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
        id="btn-activate-geolocation"
        title={t.geolocationBtn}
      >
        {isLocating ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#0FA3A3]" />
        ) : (
          <NavigationIcon className="w-3 h-3 text-[#0FA3A3]" />
        )}
        <span className="hidden sm:inline">{isLocating ? t.locatingUser : t.geolocationBtn}</span>
      </button>

      {/* Open Filters Modal Button */}
      <button
        type="button"
        onClick={() => setShowFilterModal(true)}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
          activeFiltersCount > 0
            ? 'bg-[#1E1B4B] text-white shadow-xs'
            : 'bg-stone-100 hover:bg-stone-200 text-[#1E1B4B]'
        }`}
        id="btn-open-filters"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.2 bg-amber-400 text-stone-900 rounded-full text-[10px] font-black">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );

  // ÉTAT VIDE EXACTO SI 0 PROPIEDADES COINCIDEN CON LOS FILTROS
  if (filteredListings.length === 0) {
    return (
      <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[70vh]">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City and Filter bar always accessible */}
        {renderFilterAndCityBar()}

        <div className="w-full my-6 bg-white p-7 rounded-3xl border border-stone-200 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 bg-stone-100 text-stone-500 rounded-2xl flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7 text-stone-400" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs mb-2 border border-rose-200">
              0 propiedades encontradas con estos filtros
            </div>
            <h3 className="text-base font-black text-[#1E1B4B]">
              Ningún inmueble coincide con tus criterios
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto mt-1">
              El algoritmo ha evaluado la base de datos y no existen pisos que cumplan todos los filtros seleccionados a la vez. No se muestran viviendas aleatorias.
            </p>
          </div>

          {/* Active filter tags list with clear buttons */}
          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            {selectedCity !== 'all' && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span>{selectedCity}</span>
                <button onClick={() => setSelectedCity('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {maxPrice !== null && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span>Máx {maxPrice}€</span>
                <button onClick={() => setMaxPrice(null)} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {minBedrooms !== null && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span>{minBedrooms}+ hab</span>
                <button onClick={() => setMinBedrooms(null)} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {propertyType !== 'all' && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span className="capitalize">{propertyType}</span>
                <button onClick={() => setPropertyType('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {petsAllowed && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span>Mascotas</span>
                <button onClick={() => setPetsAllowed(false)} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {hideInteracted && (
              <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <span>Sin corazón (ocultar vistas)</span>
              </span>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer todos los filtros</span>
            </button>

            {hideInteracted && swipedListingIds.size > 0 && (
              <button
                onClick={() => setHideInteracted(false)}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-rose-200"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Buscar también en propiedades con corazón ({swipedListingIds.size} vistas)</span>
              </button>
            )}

            <button
              onClick={() => setShowFilterModal(true)}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ajustar filtros detallados</span>
            </button>
          </div>
        </div>

        {/* Filter Drawer / Modal */}
        {renderFilterModal()}
      </div>
    );
  }

  // Écran quand tous les logements filtrés ont été vus
  if (currentIndex >= filteredListings.length || !currentListing) {
    return (
      <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[70vh]">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City and Filter bar always accessible */}
        {renderFilterAndCityBar()}

        <div className="w-full my-6 bg-white p-8 rounded-3xl border border-stone-200/80 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-[#1E1B4B]/5 text-[#1E1B4B] rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-[#1E1B4B]">{t.upToDateTitle}</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Has revisado todas las propiedades disponibles que cumplen con tus filtros actuales.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setCurrentIndex(0)}
              className="w-full py-3 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Volver a revisar desde el principio</span>
            </button>

            {hideInteracted && (
              <button
                onClick={() => {
                  setHideInteracted(false);
                  setCurrentIndex(0);
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Mostrar también pisos con like o descartados</span>
              </button>
            )}

            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Restablecer filtros de búsqueda</span>
            </button>
          </div>
        </div>

        {/* Filter Drawer / Modal */}
        {renderFilterModal()}
      </div>
    );
  }

  // Regla estricta: Cada inquilino debe tener al menos 3 fotos para mirar/explorar propiedades
  const tenantPhotos = tenant?.photos || [];
  const hasMin3Photos = tenantPhotos.length >= 3;

  if (!hasMin3Photos) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-4">
        <TenantPhotoGate
          currentPhotos={tenantPhotos}
          currentUser={{ id: tenant?.id, email: currentUserEmail || tenant?.email, name: tenant?.fullName }}
          language={language}
          onPhotosSaved={(savedPhotos) => {
            if (onPhotosUpdated) {
              onPhotosUpdated(savedPhotos);
            }
          }}
          onOpenMatchingQuiz={onOpenQuiz}
        />
      </div>
    );
  }

  function renderFilterModal() {
    if (!showFilterModal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1E1B4B]">Filtros de Búsqueda</h3>
                <p className="text-[11px] text-stone-400">Personaliza exactamente los inmuebles que deseas ver</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Ocultar pisos con like o descarte (Requisito clave) */}
          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-950">
                  <HeartOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Ocultar pisos con like o quitados</span>
                </div>
                <p className="text-[10px] text-rose-700 leading-snug">
                  {hideInteracted 
                    ? 'Activado: Solo se muestran pisos nuevos sin corazón ni descartes.' 
                    : 'Desactivado: Mostrando todos los pisos incluidos los que ya diste corazón.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={hideInteracted}
                onChange={(e) => setHideInteracted(e.target.checked)}
                className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer ml-3 shrink-0"
              />
            </label>
          </div>

          {/* Ciudad */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">Ciudad de Andalucía</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs font-bold text-[#1E1B4B] p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Todas las capitales de Andalucía</option>
              {ANDALUSIA_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rango de Precio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Precio Máximo de Renta (€/mes)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[null, 700, 900, 1100, 1300, 1600].map((val) => (
                <button
                  key={val === null ? 'any' : val}
                  type="button"
                  onClick={() => setMaxPrice(val)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    maxPrice === val
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {val === null ? 'Sin tope' : `Hasta ${val}€`}
                </button>
              ))}
            </div>
          </div>

          {/* Dormitorios Mínimos */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Habitaciones mínimas</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[null, 1, 2, 3, 4].map((num) => (
                <button
                  key={num === null ? 'any' : num}
                  type="button"
                  onClick={() => setMinBedrooms(num)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    minBedrooms === num
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {num === null ? 'Todas' : `${num}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Inmueble */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">Tipo de Propiedad</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Todos', val: 'all' },
                { label: 'Piso', val: 'piso' },
                { label: 'Apartamento', val: 'apartamento' },
                { label: 'Ático', val: 'ático' },
                { label: 'Estudio', val: 'estudio' },
                { label: 'Casa', val: 'casa' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setPropertyType(item.val)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    propertyType === item.val
                      ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Características Adicionales */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700">Equipamiento</label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Admite mascotas</span>
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Solo totalmente amueblados</span>
                <input
                  type="checkbox"
                  checked={furnishedOnly}
                  onChange={(e) => setFurnishedOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-semibold text-stone-700">Con ascensor</span>
                <input
                  type="checkbox"
                  checked={elevatorOnly}
                  onChange={(e) => setElevatorOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E1B4B] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Actions with Live Exact Count */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
            >
              Restablecer
            </button>

            <button
              type="button"
              onClick={() => setShowFilterModal(false)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                filteredListings.length > 0
                  ? 'bg-[#1E1B4B] hover:bg-[#28235C] text-white'
                  : 'bg-stone-300 text-stone-600'
              }`}
            >
              {filteredListings.length > 0 ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Ver {filteredListings.length} {filteredListings.length === 1 ? 'propiedad' : 'propiedades'}</span>
                </>
              ) : (
                <span>0 propiedades con estos filtros</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[82vh] justify-between">
      
      {/* Geolocation & Filter Feedback Toast */}
      {geoToast && (
        <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
          <MapPin className="w-4 h-4 text-[#D97706]" />
          <span>{geoToast}</span>
        </div>
      )}

      {/* Andalusia Filter & Geolocation Bar */}
      {renderFilterAndCityBar()}

      {/* Top quick action bar with Matching Quiz trigger & Active Filter summary */}
      <div className="w-full flex items-center justify-between pb-2 px-1 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {filteredListings.length} {filteredListings.length === 1 ? 'propiedad' : 'propiedades'}
          </span>
          {hideInteracted && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Sin corazón
            </span>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-indigo-700 hover:underline"
            >
              (Limpiar filtros)
            </button>
          )}
        </div>

        {onOpenQuiz && (
          <button
            onClick={onOpenQuiz}
            className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Mi Matching</span>
          </button>
        )}
      </div>

      {/* IMMERSIVE TINDER CARD CONTAINER */}
      <div className="relative w-full h-[600px] max-h-[78vh] rounded-3xl overflow-hidden shadow-xl border border-stone-200/60 bg-stone-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentListing.id}-${currentIndex}`}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90) {
                handleSwipe('right');
              } else if (info.offset.x < -90) {
                handleSwipe('left');
              }
            }}
            animate={
              swipeDirection === 'right'
                ? { x: 500, opacity: 0 }
                : swipeDirection === 'left'
                ? { x: -500, opacity: 0 }
                : { x: 0, opacity: 1 }
            }
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-stone-900 flex flex-col justify-between"
          >
            {/* Background Fullscreen Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentListing.images?.[activeImageIndex] || currentListing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'}
                alt={currentListing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
            </div>

            {/* Top Carousel Navigation Indicators */}
            {currentListing.images && currentListing.images.length > 1 && (
              <div className="relative z-10 pt-3 px-4 flex gap-1.5">
                {currentListing.images.map((_: any, i: number) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }}
                    className={`h-1 flex-1 rounded-full cursor-pointer transition-all ${
                      i === activeImageIndex ? 'bg-white shadow-sm' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* LIKE BADGE ON SWIPE RIGHT */}
            <motion.div
              style={{ opacity: opacityLike }}
              className="absolute top-10 left-6 z-20 bg-[#D97706] text-white px-4 py-1 rounded-xl font-black text-sm tracking-wider uppercase border-2 border-white shadow-lg pointer-events-none rotate-[-12deg]"
            >
              {t.likeAction}
            </motion.div>

            {/* PASS BADGE ON SWIPE LEFT */}
            <motion.div
              style={{ opacity: opacityPass }}
              className="absolute top-10 right-6 z-20 bg-stone-700 text-white px-4 py-1 rounded-xl font-black text-sm tracking-wider uppercase border-2 border-white shadow-lg pointer-events-none rotate-[12deg]"
            >
              {t.passAction}
            </motion.div>

            {/* Top Bar Badges */}
            <div className="relative z-10 px-4 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-stone-200" />
                <span>{currentListing.neighborhood || currentListing.city}</span>
                {currentListing.distance_km !== undefined && currentListing.distance_km !== null && (
                  <span className="text-[10px] text-amber-300 font-bold ml-1">
                    • a {currentListing.distance_km} km
                  </span>
                )}
              </div>

              {compatibility && (
                <div className="flex items-center gap-1 bg-[#1E1B4B]/80 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{compatibility.matchScore || 92}%</span>
                </div>
              )}
            </div>

            {/* Bottom Minimalist Card Overlay */}
            <div 
              onClick={() => setShowDetailsSheet(true)}
              className="relative z-10 p-5 text-white cursor-pointer bg-gradient-to-t from-black via-black/80 to-transparent"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-black tracking-tight text-white line-clamp-1">
                  {currentListing.title}
                </h2>
                <div className="text-xl font-black text-white shrink-0">
                  {currentListing.rent} <span className="text-xs font-normal opacity-80">{currentListing.currency || '€'}/{t.perMonth}</span>
                </div>
              </div>

              <p className="text-xs text-stone-300 line-clamp-1 mb-2.5">
                {currentListing.surface_sqm || 65} m² • {currentListing.rooms_count || currentListing.bedrooms || 2} hab. • {currentListing.furnished || currentListing.is_furnished ? t.furnished : t.unfurnished}
              </p>

              {/* Tap for more details hint */}
              <div className="flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-stone-300 hover:text-white transition-colors bg-white/10 rounded-xl backdrop-blur-xs">
                <span>{t.seeDetailsHint}</span>
                <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM SHEET: DETAILED SPECIFICATIONS (Revealed upon tap) */}
        <AnimatePresence>
          {showDetailsSheet && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 top-16 z-30 bg-[#FAF9F6] rounded-t-3xl p-5 overflow-y-auto text-[#1E1B4B] shadow-2xl border-t border-stone-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
                  <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto" />
                  <button
                    onClick={() => setShowDetailsSheet(false)}
                    className="p-1 text-stone-400 hover:text-[#1E1B4B] transition-colors rounded-full"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-lg font-black text-[#1E1B4B]">{currentListing.title}</h3>
                  <span className="text-base font-extrabold text-[#1E1B4B]">
                    {currentListing.rent} {currentListing.currency || '€'}/{t.perMonth}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  {currentListing.description || ''}
                </p>

                {/* Key Characteristics Chips */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <BedDouble className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{currentListing.rooms_count || currentListing.bedrooms || 2} hab.</span>
                    <span className="text-[10px] text-stone-400">{currentListing.surface_sqm || 65} m²</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <Calendar className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{t.availability}</span>
                    <span className="text-[10px] text-stone-400 truncate block">{currentListing.available_from || t.immediate}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <PawPrint className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">Mascotas</span>
                    <span className="text-[10px] text-stone-400 block">{currentListing.pets_allowed ? t.petsAllowed : t.petsForbidden}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons inside sheet */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <button
                  onClick={() => handleSwipe('left')}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Descartar</span>
                </button>
                <button
                  onClick={() => handleSwipe('right')}
                  className="flex-1 py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Dar Like</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM FLOATING CONTROLS */}
      <div className="w-full flex items-center justify-center gap-6 py-4">
        {/* Pass Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95"
          id="btn-swipe-pass"
          title="Descartar propiedad"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Info/Details Button */}
        <button
          onClick={() => setShowDetailsSheet(!showDetailsSheet)}
          className="w-11 h-11 rounded-full bg-white border border-stone-200 text-[#1E1B4B] hover:bg-stone-100 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
          id="btn-swipe-info"
          title="Ver detalles del inmueble"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1E1B4B] to-[#28235C] text-white hover:from-[#28235C] hover:to-[#3730A3] flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border border-white/20"
          id="btn-swipe-like"
          title="Dar like al piso"
        >
          <Heart className="w-7 h-7 fill-rose-400 text-rose-400" />
        </button>
      </div>

      {/* Filter Modal */}
      {renderFilterModal()}
    </div>
  );
};
