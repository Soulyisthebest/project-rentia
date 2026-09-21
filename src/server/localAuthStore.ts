import { SEED_TENANTS } from '../data/seedTenants';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'tenant' | 'landlord' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  preferred_lang: string;
  avatar_url?: string;
  trust_score?: number;
  created_at: string;
}

// Initial demo users available out-of-the-box
const localUsers = new Map<string, LocalUser>();

// Preload standard demo accounts without passwords
const defaultDemoAccounts: LocalUser[] = [
  {
    id: 'demo-tenant-01',
    name: 'Lucía Fernández',
    email: 'inquilino@rentia.com',
    phone: '+34 612 345 678',
    role: 'tenant',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    trust_score: 94,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-landlord-01',
    name: 'Carlos Mendoza',
    email: 'propietario@rentia.com',
    phone: '+34 622 987 654',
    role: 'landlord',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    trust_score: 96,
    created_at: new Date().toISOString(),
  },
  {
    id: 'super-admin-soullis',
    name: 'Administrador Principal',
    email: 'soullis10@gmail.com',
    phone: '+34 600 000 010',
    role: 'admin',
    is_active: true,
    is_verified: true,
    preferred_lang: 'es',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    trust_score: 100,
    created_at: new Date().toISOString(),
  }
];

defaultDemoAccounts.forEach(u => localUsers.set(u.email.toLowerCase(), u));

export function findLocalUserByEmail(email: string): LocalUser | undefined {
  return localUsers.get(email.trim().toLowerCase());
}

export function findLocalUserById(id: string): LocalUser | undefined {
  for (const user of localUsers.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function getAllLocalUsers(): LocalUser[] {
  return Array.from(localUsers.values());
}

export function registerLocalUser(userData: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: 'tenant' | 'landlord' | 'admin';
  preferred_lang?: string;
  avatar_url?: string;
}): LocalUser {
  const cleanEmail = userData.email.trim().toLowerCase();
  const existing = localUsers.get(cleanEmail);
  if (existing) {
    return existing;
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: LocalUser = {
    id,
    name: userData.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: userData.phone || '+34 600 000 000',
    role: userData.role || 'tenant',
    is_active: true,
    is_verified: true,
    preferred_lang: userData.preferred_lang || 'es',
    avatar_url: userData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    trust_score: 85,
    created_at: new Date().toISOString(),
  };

  localUsers.set(cleanEmail, newUser);
  return newUser;
}

export function createLocalToken(user: LocalUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return 'rentia_local_' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyLocalToken(token: string): LocalUser | null {
  if (!token.startsWith('rentia_local_')) {
    // Try to find if it matches any user ID directly or email directly
    return findLocalUserById(token) || findLocalUserByEmail(token) || null;
  }
  try {
    const raw = token.replace('rentia_local_', '');
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    const user = findLocalUserById(decoded.id) || findLocalUserByEmail(decoded.email);
    if (user) return user;

    // Reconstruct user from token payload if server restarted
    return {
      id: decoded.id,
      name: decoded.name || decoded.email.split('@')[0],
      email: decoded.email,
      role: decoded.role || 'tenant',
      is_active: true,
      is_verified: true,
      preferred_lang: 'es',
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
