/**
 * FICHIER: apps\web\src\components\offline\__tests__\OfflineIndicator.test.tsx
 * TESTS: Tests unitaires pour OfflineIndicator
 * 
 * DESCRIPTION:
 * Tests unitaires pour le composant OfflineIndicator
 * Validation du comportement offline/online
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import { mockUseOffline, mockUseNotifications } from '../../../test/utils/test-utils';

// Mock des hooks
vi.mock('@/hooks/useOffline', () => ({
  useOffline: vi.fn()
}));

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn()
}));

describe('OfflineIndicator', () => {
  const mockOffline = mockUseOffline();
  const mockNotifications = mockUseNotifications();

  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(mockOffline);
    (vi.mocked(require('@/hooks/useNotifications').useNotifications) as any).mockReturnValue(mockNotifications);
  });

  it('affiche le statut en ligne par défaut', () => {
    render(<OfflineIndicator />);
    
    expect(screen.getByText('En ligne')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
  });

  it('affiche le statut hors ligne quand isOnline est false', () => {
    const offlineMock = mockUseOffline({ isOnline: false });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(offlineMock);
    
    render(<OfflineIndicator />);
    
    expect(screen.getByText('Hors ligne')).toBeInTheDocument();
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
  });

  it('affiche le statut de synchronisation quand isSyncing est true', () => {
    const syncingMock = mockUseOffline({ isSyncing: true });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(syncingMock);
    
    render(<OfflineIndicator />);
    
    expect(screen.getByText('Synchronisation...')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  it('affiche le nombre de notifications en attente', () => {
    const pendingMock = mockUseOffline({ pendingCount: 5 });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(pendingMock);
    
    render(<OfflineIndicator />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('ouvre le panneau détaillé au clic', () => {
    render(<OfflineIndicator />);
    
    const button = screen.getByRole('button', { name: /en ligne/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Statut de Connexion')).toBeInTheDocument();
  });

  it('ferme le panneau détaillé au clic sur le bouton fermer', () => {
    render(<OfflineIndicator />);
    
    // Ouvrir le panneau
    const openButton = screen.getByRole('button', { name: /en ligne/i });
    fireEvent.click(openButton);
    
    // Fermer le panneau
    const closeButton = screen.getByRole('button', { name: /fermer/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Statut de Connexion')).not.toBeInTheDocument();
  });

  it('déclenche la synchronisation au clic sur le bouton sync', async () => {
    const mockForceSync = vi.fn();
    const syncMock = mockUseOffline({ 
      isOnline: true, 
      forceSync: mockForceSync 
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(syncMock);
    
    render(<OfflineIndicator />);
    
    const syncButton = screen.getByRole('button', { name: /synchroniser/i });
    fireEvent.click(syncButton);
    
    await waitFor(() => {
      expect(mockForceSync).toHaveBeenCalledTimes(1);
    });
  });

  it('affiche les erreurs de synchronisation', () => {
    const errorMock = mockUseOffline({ 
      errors: ['Erreur de connexion', 'Timeout'] 
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(errorMock);
    
    render(<OfflineIndicator />);
    
    // Ouvrir le panneau
    const openButton = screen.getByRole('button', { name: /en ligne/i });
    fireEvent.click(openButton);
    
    expect(screen.getByText('Erreurs (2)')).toBeInTheDocument();
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });

  it('efface les erreurs au clic sur le bouton effacer', async () => {
    const mockClearErrors = vi.fn();
    const errorMock = mockUseOffline({ 
      errors: ['Erreur de connexion'],
      clearErrors: mockClearErrors
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(errorMock);
    
    render(<OfflineIndicator />);
    
    // Ouvrir le panneau
    const openButton = screen.getByRole('button', { name: /en ligne/i });
    fireEvent.click(openButton);
    
    // Cliquer sur effacer les erreurs
    const clearButton = screen.getByRole('button', { name: /effacer les erreurs/i });
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(mockClearErrors).toHaveBeenCalledTimes(1);
    });
  });

  it('affiche les détails avancés quand showDetails est true', () => {
    render(<OfflineIndicator />);
    
    // Ouvrir le panneau
    const openButton = screen.getByRole('button', { name: /en ligne/i });
    fireEvent.click(openButton);
    
    // Cliquer sur le bouton détails
    const detailsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Cache')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('affiche la barre de progression pendant la synchronisation', () => {
    const syncingMock = mockUseOffline({ 
      isSyncing: true,
      getSyncProgress: vi.fn(() => 75)
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(syncingMock);
    
    render(<OfflineIndicator />);
    
    // Ouvrir le panneau
    const openButton = screen.getByRole('button', { name: /synchronisation/i });
    fireEvent.click(openButton);
    
    expect(screen.getByText('Synchronisation en cours...')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('désactive le bouton de synchronisation quand isSyncing est true', () => {
    const syncingMock = mockUseOffline({ 
      isSyncing: true,
      isOnline: true
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(syncingMock);
    
    render(<OfflineIndicator />);
    
    const syncButton = screen.getByRole('button', { name: /sync/i });
    expect(syncButton).toBeDisabled();
  });

  it('désactive le bouton de synchronisation quand isOnline est false', () => {
    const offlineMock = mockUseOffline({ 
      isOnline: false,
      isSyncing: false
    });
    (vi.mocked(require('@/hooks/useOffline').useOffline) as any).mockReturnValue(offlineMock);
    
    render(<OfflineIndicator />);
    
    const syncButton = screen.getByRole('button', { name: /sync/i });
    expect(syncButton).toBeDisabled();
  });
});
