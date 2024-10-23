const KAMIWAZA_API_URI = process.env.KAMIWAZA_API_URI || 'http://localhost:7777';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  let token: string | null = null;
  
  // Client-side only
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token')
  }

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

  const data = await response.json();
  
  if (typeof window !== 'undefined') {
    document.cookie = `token=${data.access_token}; path=/; max-age=${data.expires_in}`;
  }

  return data;
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

export async function verifyToken(token?: string): Promise<UserData | null> {
  // If token is provided, we're on server-side
  if (token) {
    try {
      // Updated endpoint URL
      const response = await fetch(`${KAMIWAZA_API_URI}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Server verifyToken: Failed to verify token:', response.status);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Server verifyToken: Error:', error);
      return null;
    }
  }

  // Client-side verification
  if (typeof window === 'undefined') {
    return null;
  }

  const clientToken = localStorage.getItem('token')
  console.log('verifyToken [Client]: Token exists:', !!clientToken)

  if (!clientToken) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/verify-token');
    if (!response.ok) {
      console.error('Client verifyToken: Failed with status:', response.status);
      return null;
    }
    const userData = await response.json();
    console.log('verifyToken: Successful response:', userData);
    return userData;
  } catch (error) {
    console.error('verifyToken: Error:', error);
    return null;
  }
}
