/**
 * FICHIER: apps/web/src/components/admin/UserModals.tsx
 * COMPOSANTS: Modals pour la gestion des utilisateurs
 *
 * DESCRIPTION:
 * Composants de modales pour créer, modifier et voir les détails des utilisateurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { adminService, CreateUserRequest, UpdateUserRequest, type User, type UserRole } from '@/services/api/adminService';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '' as any,
    permissions: [],
    tenantId: '',
    password: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  const loadRoles = async () => {
    try {
      const rolesData = await adminService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.createUser(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: '' as any,
        permissions: [],
        tenantId: '',
        password: ''
      });
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      alert(error?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouvel utilisateur" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Nom *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Téléphone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label="Rôle *"
            value={formData.role as any}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            required
          >
            <option value="">Sélectionnez un rôle</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </Select>

          <Input
            label="Mot de passe *"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
            placeholder="Min. 8 caractères"
          />

          <Input
            label="Tenant ID *"
            value={formData.tenantId}
            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
            required
            placeholder="UUID du tenant"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface UserEditModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [formData, setFormData] = useState<UpdateUserRequest>({});

  useEffect(() => {
    if (isOpen && user) {
      loadRoles();
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      });
    }
  }, [isOpen, user]);

  const loadRoles = async () => {
    try {
      const rolesData = await adminService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await adminService.updateUser(user.id, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur modification utilisateur:', error);
      alert(error?.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'utilisateur" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Nom *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Téléphone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label="Rôle *"
            value={formData.role?.id}
            onChange={(e) => {
              const selectedRole = roles.find(r => r.id === e.target.value);
              if (selectedRole) setFormData({ ...formData, role: selectedRole });
            }}
          >
            <option value="">Sélectionnez un rôle</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </Select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <span>Utilisateur actif</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface UserDetailsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, user, onClose }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de l'utilisateur" size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
            <p className="mt-1">{user.firstName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <p className="mt-1">{user.lastName}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <p className="mt-1">{user.email}</p>
        </div>

        {user.phone && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
            <p className="mt-1">{user.phone}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rôle</label>
          <p className="mt-1">
            <Badge variant="info">{user.role.name}</Badge>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
          <p className="mt-1">
            <Badge variant={user.isActive ? 'success' : 'danger'}>
              {user.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </p>
        </div>

        {user.tenant && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organisation</label>
            <p className="mt-1">{user.tenant.name}</p>
          </div>
        )}

        {user.lastLoginAt && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dernière connexion</label>
            <p className="mt-1">{new Date(user.lastLoginAt).toLocaleString('fr-FR')}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Créé le</label>
            <p className="mt-1 text-sm">{new Date(user.createdAt).toLocaleString('fr-FR')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modifié le</label>
            <p className="mt-1 text-sm">{new Date(user.updatedAt).toLocaleString('fr-FR')}</p>
          </div>
        </div>

        {user.permissions && user.permissions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((perm, index) => (
                <Badge key={index} variant="secondary">{perm.name}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </Modal>
  );
};
