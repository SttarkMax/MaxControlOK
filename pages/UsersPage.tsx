
import React, { useState } from 'react';
import { User, UserAccessLevel, LoggedInUser } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Spinner from '../components/common/Spinner';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import { useUsers } from '../hooks/useSupabaseData';

const initialUserState: User = {
  id: '',
  username: '',
  fullName: '',
  password: '', 
  role: UserAccessLevel.SALES,
};

interface UsersPageProps {
  loggedInUser: LoggedInUser; 
}

const UsersPage: React.FC<UsersPageProps> = ({ loggedInUser }) => {
  const { users, loading, createUser, updateUser, deleteUser } = useUsers();
  
  // Debug: Log users data
  React.useEffect(() => {
    console.log('🔍 UsersPage - Users data:', { 
      users, 
      loading, 
      count: users.length,
      usersList: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
    });
  }, [users, loading]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserForm, setCurrentUserForm] = useState<User>(initialUserState);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editPassword, setEditPassword] = useState(''); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "editPassword") {
      setEditPassword(value);
    } else {
      setCurrentUserForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const openModalForNew = () => {
    setCurrentUserForm(initialUserState);
    setEditPassword('');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: User) => {
    setCurrentUserForm(user);
    setEditPassword(''); 
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUserForm(initialUserState);
    setEditPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserForm.username.trim()) {
        alert("O nome de usuário não pode ser vazio.");
        return;
    }
    if (!currentUserForm.fullName?.trim()) {
        alert("O nome completo não pode ser vazio.");
        return;
    }
    if (!isEditing && !currentUserForm.password?.trim()) {
        alert("A senha é obrigatória para novos usuários.");
        return;
    }
    if (users.some(u => u.username.toLowerCase() === currentUserForm.username.toLowerCase() && u.id !== currentUserForm.id)) {
        alert("Este nome de usuário já existe.");
        return;
    }
    
    if (isEditing && currentUserForm.id === loggedInUser.id && currentUserForm.role !== UserAccessLevel.ADMIN && loggedInUser.role === UserAccessLevel.ADMIN) {
        alert("Você não pode remover seu próprio acesso de administrador.");
        return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing) {
        const userToUpdate = {
          ...currentUserForm,
          ...(editPassword.trim() && { password: editPassword.trim() })
        };
        await updateUser(userToUpdate);
      } else {
        const userToCreate = {
          ...currentUserForm,
          password: currentUserForm.password!
        };
        await createUser(userToCreate);
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === loggedInUser.id) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário. Tente novamente.');
      }
    }
  };
  
  const roleOptions = [
    { value: UserAccessLevel.ADMIN, label: 'Administrador' },
    { value: UserAccessLevel.SALES, label: 'Vendas' },
    { value: UserAccessLevel.VIEWER, label: 'Visualização' },
  ];

  const getRoleLabelAndStyle = (roleValue: UserAccessLevel): { label: string, style: string } => {
    const roleInfo = roleOptions.find(opt => opt.value === roleValue);
    const label = roleInfo?.label || roleValue;
    let style = 'text-gray-300'; // Default for Viewer and any other case

    if (roleValue === UserAccessLevel.ADMIN) {
      style = 'text-yellow-400 font-semibold';
    } else if (roleValue === UserAccessLevel.SALES) {
      style = 'text-green-400 font-semibold';
    }
    return { label, style };
  };

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando usuários...</span>
      </div>
    );
  }

  // Debug: Show current state
  console.log('🔍 Rendering UsersPage:', { 
    usersCount: users.length, 
    loading, 
    users: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
  });

  return (
    <div className="p-6 text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <UserGroupIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">Gerenciamento de Usuários</h2>
        </div>
        <Button onClick={openModalForNew} variant="primary" iconLeft={<PlusIcon className="w-5 h-5"/>}>
          Adicionar Usuário
        </Button>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Gerencie os usuários do sistema e seus níveis de acesso.
      </p>

      {users.length === 0 ? (
        <div className="text-center py-10 bg-[#282828] shadow-xl rounded-lg">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">
            {loading ? 'Carregando usuários...' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {loading ? 'Aguarde...' : 'Comece adicionando um novo usuário ao sistema.'}
          </p>
          {!loading && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-md">
              <p className="text-xs text-blue-300">
                <strong>Debug Info:</strong> Users array length: {users.length}
              </p>
            </div>
          )}
          <div className="mt-6">
            <Button onClick={openModalForNew} variant="primary" iconLeft={<PlusIcon className="w-4 h-4"/>}>
              Adicionar Usuário
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#282828] shadow-xl rounded-lg overflow-x-auto">
          <div className="p-4 bg-green-900/30 border-b border-green-500/50">
            <p className="text-xs text-green-300">
              <strong>✅ Usuários carregados:</strong> {users.length} usuário(s) encontrado(s)
            </p>
            <details className="mt-2">
              <summary className="text-xs text-green-400 cursor-pointer">Ver detalhes dos usuários</summary>
              <pre className="text-xs mt-2 text-green-200">{JSON.stringify(users, null, 2)}</pre>
            </details>
          </div>
          <table className="min-w-full divide-y divide-[#282828]">
            <thead className="bg-[#282828]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome de Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nível de Acesso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#282828] divide-y divide-[#282828]">
              {users.map(user => {
                const { label: roleLabel, style: roleStyle } = getRoleLabelAndStyle(user.role);
                return (
                  <tr key={user.id} className="hover:bg-[#3a3a3a]/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.fullName || user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${roleStyle}`}>{roleLabel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                      <Button 
                          onClick={() => openModalForEdit(user)} 
                          variant="secondary" 
                          size="sm" 
                          iconLeft={<PencilIcon className="w-4 h-4"/>}
                          // Admin can edit themselves, but logic for demotion is handled in handleSubmit
                      >
                          Editar
                      </Button>
                      <Button 
                          onClick={() => handleDeleteUser(user.id)} 
                          variant="danger" 
                          size="sm" 
                          iconLeft={<TrashIcon className="w-4 h-4"/>}
                          disabled={user.id === loggedInUser.id} 
                      >
                          Excluir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-[#282828] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg text-gray-300">
            <h3 className="text-xl font-semibold mb-6 text-white">{isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Nome Completo" 
                name="fullName" 
                value={currentUserForm.fullName || ''} 
                onChange={handleInputChange} 
                required 
              />
              <Input 
                label="Nome de Usuário" 
                name="username" 
                value={currentUserForm.username} 
                onChange={handleInputChange} 
                required 
              />
              <Input 
                label={isEditing ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}
                name={isEditing ? "editPassword" : "password"}
                type="password" 
                value={isEditing ? editPassword : currentUserForm.password || ''} 
                onChange={handleInputChange} 
                required={!isEditing}
                placeholder={isEditing ? "Digite nova senha ou deixe em branco" : "Digite a senha"}
              />
              <Select
                label="Nível de Acesso"
                name="role"
                options={roleOptions}
                value={currentUserForm.role}
                onChange={handleInputChange}
                required
                disabled={isEditing && currentUserForm.id === loggedInUser.id && loggedInUser.role === UserAccessLevel.ADMIN && users.filter(u => u.role === UserAccessLevel.ADMIN && u.id !== currentUserForm.id).length === 0}
              />
               {isEditing && currentUserForm.id === loggedInUser.id && loggedInUser.role === UserAccessLevel.ADMIN && users.filter(u => u.role === UserAccessLevel.ADMIN && u.id !== currentUserForm.id).length === 0 && (
                <p className="text-xs text-yellow-400">Como único administrador, você não pode alterar seu próprio nível de acesso.</p>
               )}
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>{isLoading ? "Salvando..." : (isEditing ? 'Salvar Alterações' : 'Adicionar Usuário')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;