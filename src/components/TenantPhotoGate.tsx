import React from 'react';
import { TenantProfile } from '../types';
import { Language } from '../i18n/translations';
import { TenantPhotoRequiredGate } from './TenantPhotoRequiredGate';

interface TenantPhotoGateProps {
  tenant: TenantProfile;
  language: Language;
  onPhotosUpdated: (photos: string[]) => void;
  onOpenQuiz?: () => void;
}

/**
 * Componente unificado para el bloqueo por requisito de fotos del inquilino (Prioridad 8.4).
 * Reutiliza TenantPhotoRequiredGate para evitar duplicación de reglas de negocio.
 */
export const TenantPhotoGate: React.FC<TenantPhotoGateProps> = ({
  tenant,
  language,
  onPhotosUpdated,
  onOpenQuiz,
}) => {
  const currentPhotos = Array.isArray(tenant.photos) && tenant.photos.length > 0
    ? tenant.photos
    : (tenant.avatarUrl ? [tenant.avatarUrl] : []);

  return (
    <TenantPhotoRequiredGate
      currentPhotos={currentPhotos}
      currentUser={{
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
      }}
      language={language}
      onPhotosSaved={onPhotosUpdated}
      onOpenMatchingQuiz={onOpenQuiz}
    />
  );
};
