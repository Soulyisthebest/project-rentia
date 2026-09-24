import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  MapPin, 
  BedDouble, 
  Search, 
  Loader2, 
  Home, 
  Flag, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Filter,
  Check,
  Power,
  Lock,
  Unlock
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';
import { CreateListingModal } from './CreateListingModal';
import { ReportModal } from './ReportModal';
import { KycVerificationModal } from './KycVerificationModal';
import { Listing } from '../types';
import { SEED_LISTINGS } from '../data/mockData';

interface LandlordDashboardProps {
  currentUser: { 
    id: string; 
    email: string; 
    name?: string;
    role?: string;
    is_verified?: boolean;
    verification_status?: string;
  };
  onNavigateToChat: () => void;
  onNavigateToSwipe?: () => void;
  onNavigateToPublish?: () => void;
  language: Language;
}

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  currentUser,
  onNavigateToChat,
  onNavigateToSwipe,
  onNavigateToPublish,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'inactive'>('all');
  const [contactSuccessToast, setContactSuccessToast] = useState<string | null>(null);

  const [showKycModal, setShowKycModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'listing' | 'user';
    id: string;
    title?: string;
    userId?: string;
    userName?: string;
  } | null>(null);

  const isLandlordVerified = currentUser?.is_verified || currentUser?.verification_status === 'verified';

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.matching.getListings({ include_inactive: true });
      const rawList = Array.isArray(res) && res.length > 0 ? res : SEED_LISTINGS;
      const seen = new Set<string>();
      const unique = rawList.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
      setListings(unique);
    } catch (err) {
      console.warn('Error fetching landlord listings:', err);
      const seen = new Set<string>();
      const unique = SEED_LISTINGS.filter((l) => {
        if (!l?.id || seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      });
      setListings(unique);
    } finally {
      setLoadingListings(false);
    }
  };

  const toggleActiveStatus = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = listings.find(l => l.id === id);
    if (!current) return;
    const willBeActive = current.is_active === false;
    const nextStatus = willBeActive ? (current.status === 'rented' ? 'rented' : 'available') : 'inactive';

    setListings(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, is_active: willBeActive, status: nextStatus };
      }
      return l;
    }));

    try {
      await api.matching.toggleListingStatus(id, willBeActive, nextStatus);
      setContactSuccessToast(
        willBeActive ? '🟢 Anuncio activado con 1 clic' : '⏸️ Anuncio desactivado / en pausa con 1 clic'
      );
      setTimeout(() => setContactSuccessToast(null), 3500);
    } catch {
      // already set in UI
    }
  };

  const toggleListingStatus = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const current = listings.find(l => l.id === id);
    if (!current) return;
    const isCurrentlyRented = current.status === 'rented';
    const nextStatus = isCurrentlyRented ? 'available' : 'rented';

    setListings(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, status: nextStatus, is_active: true };
      }
      return l;
    }));

    try {
      await api.matching.toggleListingStatus(id, true, nextStatus);
      setContactSuccessToast(
        isCurrentlyRented ? '🟢 Anuncio marcado como DISPONIBLE con 1 clic' : '🔒 Anuncio marcado como ALQUILADO con 1 clic'
      );
      setTimeout(() => setContactSuccessToast(null), 3500);
    } catch {
      // already set in UI
    }
  };

  const filteredListings = listings.filter((l) => {
    // Status filter
    if (statusFilter === 'available' && (l.is_active === false || l.status === 'rented' || l.status === 'inactive')) return false;
    if (statusFilter === 'rented' && l.status !== 'rented') return false;
    if (statusFilter === 'inactive' && l.is_active !== false && l.status !== 'inactive') return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = (l.title || '').toLowerCase().includes(term);
    const cityMatch = (l.city || '').toLowerCase().includes(term);
    const neighborhoodMatch = (l.neighborhood || '').toLowerCase().includes(term);
    return titleMatch || cityMatch || neighborhoodMatch;
  });

  const availableCount = listings.filter(l => l.is_active !== false && l.status !== 'rented' && l.status !== 'inactive').length;
  const rentedCount = listings.filter(l => l.status === 'rented').length;
  const inactiveCount = listings.filter(l => l.is_active === false || l.status === 'inactive').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" id="landlord-listings-section">
      
      {/* Toast feedback */}
      {contactSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{contactSuccessToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setContactSuccessToast(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header: Apartado de Anuncios */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-white flex items-center justify-center shadow-xs shrink-0">
              <Home className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-[#1E1B4B] tracking-tight">
                  Apartado de Anuncios
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {t.roleBadgeLandlord}
                </span>
                {isLandlordVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check Verde Verificado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>DNI sin validar</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Gestiona tus viviendas en alquiler, publica nuevos anuncios y administra su disponibilidad
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isLandlordVerified && (
              <button
                type="button"
                onClick={() => setShowKycModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verificar mi DNI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (onNavigateToPublish) {
                  onNavigateToPublish();
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#1E1B4B] hover:bg-[#28235C] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              id="btn-landlord-create-listing"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              <span>{t.publishListingModalBtn}</span>
            </button>
          </div>

        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-stone-100 text-center">
          <div>
            <span className="block text-xl sm:text-2xl font-black text-[#1E1B4B]">
              {listings.length}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              {t.activeListingsCount}
            </span>
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-black text-emerald-600">
              {availableCount}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Disponibles
            </span>
          </div>
          <div>
            <span className="block text-xl sm:text-2xl font-black text-amber-600">
              {rentedCount}
            </span>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Alquilados / Reservados
            </span>
          </div>
        </div>
      </div>

      {/* Security Notice Banner if Landlord is Unverified */}
      {!isLandlordVerified && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-amber-900">
                  Verificación de Identidad Requerida para Contactar Inquilinos
                </h3>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black uppercase">
                  Regla de Seguridad
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 max-w-2xl leading-relaxed">
                Tus anuncios son visibles para todos los inquilinos. Para contactarles directamente o iniciar conversaciones por chat, el administrador debe validar tu documento de identidad (Check Verde).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKycModal(true)}
            className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Subir DNI y Foto</span>
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#1E1B4B] text-white shadow-xs'
                : 'text-stone-600 hover:text-[#1E1B4B] hover:bg-stone-50'
            }`}
          >
            Todos ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'available'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
            }`}
          >
            Disponibles ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rented')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'rented'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-amber-700 hover:bg-stone-50'
            }`}
          >
            Alquilados ({rentedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'inactive'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            Desactivados ({inactiveCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por título, ciudad o barrio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-[#1E1B4B] focus:outline-none focus:ring-1 focus:ring-[#1E1B4B] focus:bg-white"
          />
        </div>

      </div>

      {/* Listings Grid */}
      <div className="space-y-4">
        {loadingListings ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E1B4B] mb-2" />
            <p className="text-xs text-stone-500 font-medium">{t.loadingProperties}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            {searchTerm.trim() ? (
              <>
                <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  Sin resultados para "{searchTerm}"
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Prueba a buscar con otros términos como ciudad o barrio.
                </p>
              </>
            ) : statusFilter === 'rented' ? (
              <>
                <Lock className="w-10 h-10 text-amber-500/70 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles alquilados
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Aquí aparecerán las viviendas que marques como alquiladas o reservadas en tu cartera.
                </p>
              </>
            ) : statusFilter === 'inactive' ? (
              <>
                <Power className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles desactivados
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Aquí aparecerán los anuncios que pauses o desactives temporalmente.
                </p>
              </>
            ) : statusFilter === 'available' ? (
              <>
                <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  No tienes inmuebles disponibles
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Actualmente no tienes ningún anuncio activo en alquiler.
                </p>
              </>
            ) : (
              <>
                <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">
                  {t.noListingsPublishedYet}
                </h3>
                <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
                  Para crear tu anuncio, ve al apartado <strong>Publicar anuncio</strong> situado al lado de Anuncios.
                </p>
                {onNavigateToPublish && (
                  <button
                    type="button"
                    onClick={onNavigateToPublish}
                    className="px-4 py-2 rounded-xl bg-[#1E1B4B] text-white text-xs font-bold hover:bg-[#28235C] transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    id="btn-go-to-publish-tab"
                  >
                    <Plus className="w-4 h-4 text-[#D97706]" />
                    <span>Ir a Publicar anuncio</span>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing, idx) => {
              const isRented = listing.status === 'rented';
              const isInactive = listing.is_active === false || listing.status === 'inactive';

              return (
                <div 
                  key={`${listing.id}-${idx}`}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Photo or Placeholder */}
                  <div className="h-44 bg-stone-100 relative overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        className={`w-full h-full object-cover transition-transform hover:scale-105 duration-300 ${isInactive ? 'grayscale opacity-60' : isRented ? 'grayscale-50 opacity-70' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 text-[#1E1B4B]">
                        <Home className="w-10 h-10 text-stone-300" />
                      </div>
                    )}
                    
                    {/* Price Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#1E1B4B]/90 backdrop-blur-xs text-white text-xs font-black">
                      {listing.rent} {listing.currency || '€'} / {t.perMonthSuffix}
                    </div>

                    {/* Status Tag */}
                    <div className="absolute top-2.5 left-2.5">
                      {isInactive ? (
                        <span className="px-2 py-0.5 rounded-full bg-stone-800/90 backdrop-blur-xs text-stone-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Power className="w-2.5 h-2.5 text-stone-400" />
                          Desactivado
                        </span>
                      ) : isRented ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-900/80 backdrop-blur-xs text-amber-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-300" />
                          Alquilado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700/90 backdrop-blur-xs text-emerald-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-300" />
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1E1B4B] line-clamp-1 mb-1" title={listing.title}>
                        {listing.title}
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{listing.city} {listing.neighborhood ? `• ${listing.neighborhood}` : ''}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                          <span>{listing.rooms_count || 1} {t.roomsSuffix}</span>
                        </span>
                        <span>•</span>
                        <span className="capitalize">{listing.property_type === 'house' ? t.propertyTypeHouse : t.propertyTypeApartment}</span>
                      </div>
                    </div>

                    {/* Actions on this listing */}
                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        {/* 1-click Activate / Deactivate button */}
                        <button
                          type="button"
                          onClick={(e) => toggleActiveStatus(listing.id, e)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            isInactive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                          title={isInactive ? 'Activar anuncio con 1 clic' : 'Desactivar anuncio con 1 clic'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isInactive ? 'Activar' : 'Desactivar'}</span>
                        </button>

                        {/* 1-click Mark Available / Rented button */}
                        <button
                          type="button"
                          onClick={(e) => toggleListingStatus(listing.id, e)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            isRented
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={isRented ? 'Marcar como disponible con 1 clic' : 'Marcar como alquilado con 1 clic'}
                        >
                          {isRented ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Disponible</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Alquilado</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReportTarget({
                              type: 'listing',
                              id: listing.id,
                              title: listing.title,
                              userId: listing.landlord_id || listing.owner_id
                            });
                            setShowReportModal(true);
                          }}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-auto"
                          title="Denunciar anuncio"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Direct action to Swipe Candidates for this property */}
                      {onNavigateToSwipe && (
                        <button
                          type="button"
                          onClick={onNavigateToSwipe}
                          className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Buscar candidatos (Swipe)</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Listing */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onListingCreated={() => {
          setShowCreateModal(false);
          fetchListings();
        }}
        currentUserId={currentUser.id}
        language={language}
      />

      {/* Modal: KYC Verification (Upload DNI and selfie for green check) */}
      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        currentUser={currentUser}
        onSubmitted={() => {
          setShowKycModal(false);
          setContactSuccessToast('DNI y fotografía enviados con éxito. El administrador revisará tu cuenta.');
          setTimeout(() => setContactSuccessToast(null), 5000);
        }}
      />

      {/* Modal: Report (Scams, fake listings, fraudulent profiles) */}
      {reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetUserId={reportTarget.userId}
          targetUserName={reportTarget.userName}
          currentUserId={currentUser.id}
          onSuccess={() => {
            setShowReportModal(false);
            setReportTarget(null);
            setContactSuccessToast('Denuncia recibida. El equipo de administración revisará el caso inmediatamente.');
            setTimeout(() => setContactSuccessToast(null), 5000);
          }}
        />
      )}

    </div>
  );
};
