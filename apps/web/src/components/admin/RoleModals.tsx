/**
 * FICHIER: apps/web/src/components/admin/RoleModals.tsx
 * COMPOSANTS: Modals pour la gestion des rôles
 *
 * DESCRIPTION:
 * Composants de modales pour créer et modifier les rôles
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { adminService, type UserRole, type Permission } from '@/services/api/adminService';

interface RoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleCreateModal: React.FC<RoleCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    try {
      const permsData = await adminService.getPermissions();
      setPermissions(permsData);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.createRole(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', description: '', permissions: [] });
    } catch (error: any) {
      console.error('Erreur création rôle:', error);
      alert(error?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouveau rôle" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Nom du rôle *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ex: Gestionnaire Stock"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Description du rôle..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions ({formData.permissions.length} sélectionnées)
            </label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="border-b pb-3 last:border-b-0">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{module}</h4>
                  <div className="space-y-2 pl-4">
                    {perms.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {perm.name}
                          {perm.description && (
                            <span className="text-gray-500 ml-1">- {perm.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer le rôle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface RoleEditModalProps {
  isOpen: boolean;
  role: UserRole | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleEditModal: React.FC<RoleEditModalProps> = ({ isOpen, role, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (isOpen && role) {
      loadPermissions();
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => p.id)
      });
    }
  }, [isOpen, role]);

  const loadPermissions = async () => {
    try {
      const permsData = await adminService.getPermissions();
      setPermissions(permsData);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      await adminService.updateRole(role.id, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur modification rôle:', error);
      alert(error?.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le rôle" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {role.isSystem && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Attention:</strong> Ce rôle système ne peut pas être supprimé. Modifiez avec précaution.
              </p>
            </div>
          )}

          <Input
            label="Nom du rôle *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions ({formData.permissions.length} sélectionnées)
            </label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="border-b pb-3 last:border-b-0">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{module}</h4>
                  <div className="space-y-2 pl-4">
                    {perms.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {perm.name}
                          {perm.description && (
                            <span className="text-gray-500 ml-1">- {perm.description}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
