// Mock temporaire pour authService
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    level: 'ministere' | 'crou';
    crouId?: string;
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Mock de connexion
    return {
      user: {
        id: '1',
        email,
        name: 'Utilisateur Test',
        role: 'admin',
        level: 'ministere',
        permissions: ['all']
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600
    };
  },
  
  logout: async () => {
    // Mock de déconnexion
    return Promise.resolve();
  },
  
  refreshAccessToken: async () => {
    // Mock de refresh token
    return 'new-mock-token';
  }
};
