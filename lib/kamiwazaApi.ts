const KAMIWAZA_API_URI = process.env.KAMIWAZA_API_URI || 'http://localhost:7777';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(`${KAMIWAZA_API_URI}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
  }

  return response.json();
}

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${KAMIWAZA_API_URI}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json()
}

export async function getCurrentUser(): Promise<UserData | null> {
  try {
    // Check if we're on the client-side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      return await verifyToken();
    } else {
      // We're on the server-side, so we can't access localStorage
      console.log('getCurrentUser called on server-side, returning null');
      return null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  organization_id: string;
  is_superuser: boolean;
  external_id: string;
  is_active: boolean;
  groups: string[];
  created_at: string;
  updated_at: string;
  last_login: string;
}

export async function verifyToken(): Promise<UserData | null> {
  if (typeof window === 'undefined') {
    // We're on the server side, so we can't access localStorage
    console.log('verifyToken called on server-side, returning null');
    return null;
  }

  try {
    const response = await fetchWithAuth('/api/auth/verify-token');
    return response as UserData;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}