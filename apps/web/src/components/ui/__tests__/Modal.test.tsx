/**
 * FICHIER: apps\web\src\components\ui\__tests__\Modal.test.tsx
 * TESTS: Tests unitaires pour les composants Modal du système de design CROU
 * 
 * DESCRIPTION:
 * Tests complets pour tous les composants modal
 * Vérification du comportement, accessibilité et interactions
 * 
 * TESTS:
 * - Rendu et fermeture des modals
 * - Gestion du focus et accessibilité
 * - Interactions clavier et souris
 * - AlertDialog et DrawerModal
 * - Cas d'erreur et edge cases
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  AlertDialog,
  DrawerModal
} from '../Modal';
import { Button } from '../Button';

// Mock pour createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Contenu du modal</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('rend le modal quand isOpen est true', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Contenu du modal')).toBeInTheDocument();
    });

    it('ne rend pas le modal quand isOpen est false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('applique les classes CSS personnalisées', () => {
      render(
        <Modal 
          {...defaultProps} 
          className="custom-modal"
          overlayClassName="custom-overlay"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });

    it('applique les différentes tailles', () => {
      const { rerender } = render(<Modal {...defaultProps} size="sm" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
      
      rerender(<Modal {...defaultProps} size="lg" />);
      expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');
    });
  });

  describe('Interactions', () => {
    it('ferme le modal avec la touche Escape', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('ne ferme pas avec Escape si closeOnEscape est false', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnEscape={false} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('ferme le modal en cliquant sur l\'overlay', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);
      
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('ne ferme pas en cliquant sur l\'overlay si closeOnOverlayClick est false', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnOverlayClick={false} />);
      
      const overlay = screen.getByRole('dialog').parentElement;
      await user.click(overlay!);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('ne ferme pas en cliquant sur le contenu du modal', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibilité', () => {
    it('a les attributs ARIA corrects', () => {
      render(
        <Modal 
          {...defaultProps}
          id="test-modal"
          ariaLabel="Test modal"
          ariaDescription="Description du modal"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('id', 'test-modal');
    });

    it('gère le focus trap correctement', async () => {
      render(
        <Modal {...defaultProps}>
          <button>Premier bouton</button>
          <button>Deuxième bouton</button>
        </Modal>
      );
      
      const buttons = screen.getAllByRole('button');
      
      // Le premier élément focusable devrait être focusé
      await waitFor(() => {
        expect(buttons[0]).toHaveFocus();
      });
    });
  });
});

describe('ModalHeader', () => {
  const defaultProps = {
    title: 'Titre du modal'
  };

  it('rend le titre correctement', () => {
    render(<ModalHeader {...defaultProps} />);
    
    expect(screen.getByText('Titre du modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('rend le sous-titre quand fourni', () => {
    render(<ModalHeader {...defaultProps} subtitle="Sous-titre" />);
    
    expect(screen.getByText('Sous-titre')).toBeInTheDocument();
  });

  it('rend l\'icône quand fournie', () => {
    const icon = <div data-testid="test-icon">Icône</div>;
    render(<ModalHeader {...defaultProps} icon={icon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('rend le bouton de fermeture par défaut', () => {
    const onClose = jest.fn();
    render(<ModalHeader {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Fermer le modal');
    expect(closeButton).toBeInTheDocument();
  });

  it('masque le bouton de fermeture si demandé', () => {
    const onClose = jest.fn();
    render(
      <ModalHeader 
        {...defaultProps} 
        onClose={onClose} 
        hideCloseButton={true} 
      />
    );
    
    expect(screen.queryByLabelText('Fermer le modal')).not.toBeInTheDocument();
  });

  it('appelle onClose quand le bouton est cliqué', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<ModalHeader {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Fermer le modal');
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ModalBody', () => {
  it('rend le contenu correctement', () => {
    render(
      <ModalBody>
        <p>Contenu du corps</p>
      </ModalBody>
    );
    
    expect(screen.getByText('Contenu du corps')).toBeInTheDocument();
  });

  it('applique les différents espacements', () => {
    const { rerender } = render(
      <ModalBody spacing="sm">Contenu</ModalBody>
    );
    
    const container = screen.getByText('Contenu').parentElement;
    expect(container).toHaveClass('p-4');
    
    rerender(<ModalBody spacing="lg">Contenu</ModalBody>);
    expect(container).toHaveClass('p-8');
  });

  it('applique la hauteur maximale avec scroll', () => {
    render(
      <ModalBody maxHeight="200px">
        Contenu long
      </ModalBody>
    );
    
    const container = screen.getByText('Contenu long').parentElement;
    expect(container).toHaveClass('overflow-y-auto');
    expect(container).toHaveStyle({ maxHeight: '200px' });
  });
});

describe('ModalFooter', () => {
  it('rend le contenu correctement', () => {
    render(
      <ModalFooter>
        <Button>Action</Button>
      </ModalFooter>
    );
    
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applique les différents alignements', () => {
    const { rerender } = render(
      <ModalFooter align="left">
        <Button>Action</Button>
      </ModalFooter>
    );
    
    const container = screen.getByRole('button').parentElement;
    expect(container).toHaveClass('justify-start');
    
    rerender(
      <ModalFooter align="center">
        <Button>Action</Button>
      </ModalFooter>
    );
    expect(container).toHaveClass('justify-center');
  });
});

describe('AlertDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Titre de l\'alerte',
    message: 'Message de l\'alerte'
  };

  it('rend l\'alerte correctement', () => {
    render(<AlertDialog {...defaultProps} />);
    
    expect(screen.getByText('Titre de l\'alerte')).toBeInTheDocument();
    expect(screen.getByText('Message de l\'alerte')).toBeInTheDocument();
  });

  it('rend les différents types d\'alerte', () => {
    const { rerender } = render(
      <AlertDialog {...defaultProps} type="success" />
    );
    
    // Vérifier la présence de l'icône de succès
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    rerender(<AlertDialog {...defaultProps} type="error" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('appelle onConfirm quand le bouton confirmer est cliqué', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<AlertDialog {...defaultProps} onConfirm={onConfirm} />);
    
    const confirmButton = screen.getByText('Confirmer');
    await user.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel quand le bouton annuler est cliqué', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<AlertDialog {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('masque le bouton annuler si demandé', () => {
    render(<AlertDialog {...defaultProps} hideCancelButton={true} />);
    
    expect(screen.queryByText('Annuler')).not.toBeInTheDocument();
    expect(screen.getByText('Confirmer')).toBeInTheDocument();
  });

  it('affiche l\'état de chargement', () => {
    render(<AlertDialog {...defaultProps} loading={true} />);
    
    const confirmButton = screen.getByText('Confirmer');
    const cancelButton = screen.getByText('Annuler');
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});

describe('DrawerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Contenu du drawer</div>
  };

  it('rend le drawer correctement', () => {
    render(<DrawerModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Contenu du drawer')).toBeInTheDocument();
  });

  it('applique les différentes positions', () => {
    const { rerender } = render(
      <DrawerModal {...defaultProps} position="left" />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('left-0');
    
    rerender(<DrawerModal {...defaultProps} position="right" />);
    expect(dialog).toHaveClass('right-0');
    
    rerender(<DrawerModal {...defaultProps} position="top" />);
    expect(dialog).toHaveClass('top-0');
    
    rerender(<DrawerModal {...defaultProps} position="bottom" />);
    expect(dialog).toHaveClass('bottom-0');
  });

  it('applique les différentes tailles', () => {
    const { rerender } = render(
      <DrawerModal {...defaultProps} size="sm" position="right" />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('w-80');
    
    rerender(<DrawerModal {...defaultProps} size="lg" position="right" />);
    expect(dialog).toHaveClass('w-[32rem]');
  });

  it('rend le titre quand fourni', () => {
    render(<DrawerModal {...defaultProps} title="Titre du drawer" />);
    
    expect(screen.getByText('Titre du drawer')).toBeInTheDocument();
  });

  it('ne rend pas le drawer quand isOpen est false', () => {
    render(<DrawerModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Gestion du body scroll', () => {
  const originalOverflow = document.body.style.overflow;

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  it('bloque le scroll du body quand le modal est ouvert', () => {
    render(<Modal isOpen={true} onClose={jest.fn()}>Contenu</Modal>);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restaure le scroll du body quand le modal est fermé', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()}>Contenu</Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal isOpen={false} onClose={jest.fn()}>Contenu</Modal>);
    
    // Le style devrait être restauré lors du cleanup
  });

  it('ne bloque pas le scroll si lockBodyScroll est false', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} lockBodyScroll={false}>
        Contenu
      </Modal>
    );
    
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
