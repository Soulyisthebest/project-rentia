import React, { useState, useEffect } from 'react';
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
  Info,
  Calendar,
  PawPrint,
  BedDouble,
  CheckCircle2,
  Navigation as NavigationIcon,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { TenantProfile } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { ANDALUSIA_CITIES } from './CreateListingModal';
import { TenantPhotoRequiredGate } from './TenantPhotoRequiredGate';
import { SEED_LISTINGS } from '../data/mockData';

// Coordonnées approximatives des 8 capitales provinciales d'Andalousie
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
  const [listings, setListings] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matchedListing, setMatchedListing] = useState<any | null>(null);
  const [compatibility, setCompatibility] = useState<any | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Andalusia City Filter and Geolocation State
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [isLocating, setIsLocating] = useState(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);

  // Motion values for swipe drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacityLike = useTransform(x, [30, 150], [0, 1]);
  const opacityPass = useTransform(x, [-30, -150], [0, 1]);

  useEffect(() => {
    fetchListings(selectedCity === 'all' ? undefined : selectedCity, userCoords?.lat, userCoords?.lng, radiusKm);
  }, [selectedCity, userCoords, radiusKm]);

  const fetchListings = async (city?: string, lat?: number, lng?: number, radius?: number) => {
    try {
      setLoading(true);
      const data = await api.matching.getListings({
        city: city && city !== 'all' ? city : undefined,
        lat,
        lng,
        radius,
      });
      if (Array.isArray(data) && data.length > 0) {
        const seen = new Set<string>();
        const uniqueData = data.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          if (l.is_active === false || l.status === 'rented' || l.status === 'inactive') return false;
          seen.add(l.id);
          return true;
        });
        setListings(uniqueData);
      } else {
        const rawFallback = (city && city !== 'all')
          ? SEED_LISTINGS.filter(l => l.city.toLowerCase() === city.toLowerCase())
          : SEED_LISTINGS;
        const seen = new Set<string>();
        const uniqueFallback = rawFallback.filter((l) => {
          if (!l?.id || seen.has(l.id)) return false;
          if (l.is_active === false || l.status === 'rented' || l.status === 'inactive') return false;
          seen.add(l.id);
          return true;
        });
        setListings(uniqueFallback);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error('Erreur chargement annonces:', err);
      const rawFallback = (city && city !== 'all')
        ? SEED_LISTINGS.filter(l => l.city.toLowerCase() === city.toLowerCase())
        : SEED_LISTINGS;
      const seen = new Set<string>();
      const uniqueFallback = rawFallback.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        if (l.is_active === false || l.status === 'rented' || l.status === 'inactive') return false;
        seen.add(l.id);
        return true;
      });
      setListings(uniqueFallback);
    } finally {
      setCurrentIndex(0);
      setLoading(false);
    }
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

        // Trouver la ville d'Andalousie la plus proche
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

  const currentListing = listings[currentIndex];

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
    setSwipeDirection(direction);
    setShowDetailsSheet(false);

    try {
      const res = await api.matching.swipe({
        actorId: tenant.id || 'anonymous_tenant',
        actorRole: 'tenant',
        listingId: currentListing.id,
        targetUserId: currentListing.landlord_id || 'landlord_01',
        action: direction === 'right' ? 'like' : 'pass',
      });

      if (direction === 'right' && res.isMatch) {
        setMatchedListing(currentListing);
      }
    } catch (err) {
      console.error('Erreur swipe:', err);
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

  // BARRE DE SÉLECTION GÉOGRAPHIQUE ANDALOUSIE (Toujours visible même en état vide)
  const renderCitySelectorBar = () => (
    <div className="w-full bg-white p-2.5 rounded-2xl border border-stone-200/90 shadow-2xs mb-2.5 flex items-center justify-between gap-2">
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
        className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1E1B4B] text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
        id="btn-activate-geolocation"
        title={t.geolocationBtn}
      >
        {isLocating ? (
          <Loader2 className="w-3 h-3 animate-spin text-[#0FA3A3]" />
        ) : (
          <NavigationIcon className="w-3 h-3 text-[#0FA3A3]" />
        )}
        <span>{isLocating ? t.locatingUser : t.geolocationBtn}</span>
      </button>
    </div>
  );

  // ÉTAT VIDE HONNÊTE ET CLAIR LORSQU'AUCUN VRAI LOGEMENT N'EXISTE EN BASE
  if (listings.length === 0) {
    return (
      <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[70vh]">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City bar always accessible */}
        {renderCitySelectorBar()}

        <div className="w-full my-6 bg-white p-8 rounded-3xl border border-stone-200/80 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-[#1E1B4B]/5 text-[#1E1B4B] rounded-2xl flex items-center justify-center mx-auto">
            <Home className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B] mb-1">
              {t.noListingsTitle}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              {t.noListingsDesc}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            {selectedCity !== 'all' && (
              <button
                onClick={() => setSelectedCity('all')}
                className="w-full py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#D97706]" />
                <span>Ver todas las ciudades de Andalucía</span>
              </button>
            )}

            <button
              onClick={fetchListings}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.refreshListingsBtn}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Écran quand tous les logements ont été vus
  if (currentIndex >= listings.length || !currentListing) {
    return (
      <div className="max-w-md mx-auto relative px-2 flex flex-col items-center select-none min-h-[70vh]">
        {/* Toast */}
        {geoToast && (
          <div className="fixed top-20 z-50 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D97706]">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>{geoToast}</span>
          </div>
        )}

        {/* City bar always accessible */}
        {renderCitySelectorBar()}

        <div className="w-full my-6 bg-white p-8 rounded-3xl border border-stone-200/80 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-[#1E1B4B]/5 text-[#1E1B4B] rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#1E1B4B]">{t.upToDateTitle}</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {t.upToDateDesc}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setCurrentIndex(0)}
              className="w-full py-3 bg-[#1E1B4B] text-white rounded-xl text-xs font-bold hover:bg-[#28235C] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-[#D97706]" />
              <span>{t.reviewListingsBtn}</span>
            </button>
            {selectedCity !== 'all' && (
              <button
                onClick={() => {
                  setSelectedCity('all');
                  setCurrentIndex(0);
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Explorar todas las provincias</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regla estricta: Cada inquilino debe tener al menos 3 fotos para mirar/explorar propiedades
  const tenantPhotos = tenant?.photos || [];
  const hasMin3Photos = tenantPhotos.length >= 3;

  if (!hasMin3Photos) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-4">
        <TenantPhotoRequiredGate
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
      {renderCitySelectorBar()}

      {/* Top quick action bar with Matching Quiz trigger */}
      <div className="w-full flex items-center justify-between pb-2 px-1 gap-2">
        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
          {listings.length} {t.availableListingsCount}
        </span>
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

            {/* Bottom Minimalist Card Overlay (Essential Info only) */}
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
                {currentListing.surface_sqm || 65} m² • {currentListing.rooms_count || 2} {t.roomsCount} • {currentListing.furnished ? t.furnished : t.unfurnished}
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
                    <span className="text-xs font-bold block">{currentListing.rooms_count} {t.roomsCount}</span>
                    <span className="text-[10px] text-stone-400">{currentListing.surface_sqm || 65} m²</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <Calendar className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{t.availability}</span>
                    <span className="text-[10px] text-stone-400 truncate block">{currentListing.available_from || t.immediate}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-center">
                    <PawPrint className="w-4 h-4 text-[#1E1B4B] mx-auto mb-1" />
                    <span className="text-xs font-bold block">{t.petsAllowed.split(' ')[0]}</span>
                    <span className="text-[10px] text-stone-400 block">{currentListing.pets_allowed ? t.petsAllowed : t.petsForbidden}</span>
                  </div>
                </div>

                {/* Certified Landlord info */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#1E1B4B] text-white font-bold text-xs flex items-center justify-center">
                      {currentListing.landlord_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#1E1B4B]">{currentListing.landlord_name || t.certifiedLandlord}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" />
                      </div>
                      <span className="text-[10px] text-stone-500">{t.certifiedProofLock}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#1E1B4B] bg-[#FAF9F6] px-2 py-1 rounded-lg border border-stone-200">
                    {t.directLandlord}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsSheet(false)}
                className="w-full py-2.5 bg-stone-200/80 hover:bg-stone-300 text-[#1E1B4B] font-bold text-xs rounded-xl transition-colors"
              >
                {t.closeDetails}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DISCREET BOTTOM CONTROLS (Pass / Like) */}
      <div className="w-full max-w-xs flex items-center justify-center gap-8 py-3 mt-1">
        {/* Pass Button */}
        <button
          type="button"
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
          id="btn-swipe-pass"
          title={t.passAction}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Primary Action: Soft Amber Like Button */}
        <button
          type="button"
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white flex items-center justify-center transition-all shadow-md active:scale-95"
          id="btn-swipe-like"
          title={t.likeAction}
        >
          <Heart className="w-7 h-7 fill-current" />
        </button>
      </div>

      {/* BILATERAL MATCH MODAL */}
      {matchedListing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-stone-200 animate-scale-up">
            <div className="w-14 h-14 bg-[#D97706]/10 text-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Heart className="w-7 h-7 fill-current" />
            </div>

            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">{t.reciprocalMatchTitle}</span>
            <h3 className="text-lg font-black text-[#1E1B4B] mt-1 mb-2">{matchedListing.title}</h3>
            
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              {t.reciprocalMatchDesc}
            </p>

            <div className="space-y-2">
              {onNavigateToChat && (
                <button
                  onClick={() => {
                    setMatchedListing(null);
                    onNavigateToChat();
                  }}
                  className="w-full py-3 bg-[#1E1B4B] hover:bg-[#28235C] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>{t.openChatBtn}</span>
                </button>
              )}
              <button
                onClick={() => setMatchedListing(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all"
              >
                {t.continueDiscoveryBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
