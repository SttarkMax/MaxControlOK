import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import { userService } from '../services/supabaseService';
import { UserAccessLevel } from '../types';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserAccessLevel;
  created_at: string;
}

interface UserFormData {
  username: string;
  full_name: string;
  password: string;
  role: UserAccessLevel;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    full_name: '',
    password: '',
    role: UserAccessLevel.SALES
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
      newErrors.username = 'Email deve ter um formato válido';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingUser) {
        const updateData: any = {
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await userService.updateUser(editingUser.id, updateData);
      } else {
        await userService.createUser({
          username: formData.username,
          full_name: formData.full_name,
          password: formData.password,
          role: formData.role
        });
      }

      await loadUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ submit: 'Erro ao salvar usuário. Verifique se o email já não está em uso.' });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await userService.deleteUser(userId);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      full_name: '',
      password: '',
      role: UserAccessLevel.SALES
    });
    setErrors({});
  };

  const getRoleLabel = (role: UserAccessLevel) => {
    switch (role) {
      case UserAccessLevel.ADMIN:
        return 'Administrador';
      case UserAccessLevel.SALES:
        return 'Vendas';
      default:
        return role;
    }
  };

  const getRoleStyle = (role: UserAccessLevel) => {
    switch (role) {
      case UserAccessLevel.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserAccessLevel.SALES:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Adicionar Usuário
        </Button>
      </div>

      <div className="bg-[#1d1d1d] shadow-xl rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#282828]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nome Completo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nível de Acesso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Data de Criação
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#1F1F1F] divide-y divide-[#282828]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="hover:bg-[#2A2A2A]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === UserAccessLevel.ADMIN 
                        ? 'bg-red-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        iconLeft={<PencilIcon className="w-4 h-4" />}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        iconLeft={<TrashIcon className="w-4 h-4" />}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label="Email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario@exemplo.com"
                  error={errors.username}
                  required
                />
              </div>

              <div>
                <Input
                  label="Nome Completo"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do usuário"
                  error={errors.full_name}
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  label={editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  error={errors.password}
                  required={!editingUser}
                />
              </div>

              <div>
                <Select
                  label="Nível de Acesso"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserAccessLevel })}
                  error={errors.role}
                  options={[
                    { value: UserAccessLevel.SALES, label: 'Vendas' },
                    { value: UserAccessLevel.ADMIN, label: 'Administrador' }
                  ]}
                  required
                />
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm">{errors.submit}</div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;