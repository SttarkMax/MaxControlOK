
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem, UserAccessLevel } from '../types';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';
import SquaresPlusIcon from './icons/SquaresPlusIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CogIcon from './icons/CogIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import TagIcon from './icons/TagIcon'; 
import ChartBarIcon from './icons/ChartBarIcon';
// BanknotesIcon import removed
import { APP_NAME } from '../constants'; 

interface SidebarProps {
  currentRole: UserAccessLevel;
}

const allNavItems: NavItem[] = [
  { name: 'Painel', path: '/', icon: BuildingOfficeIcon, allowedRoles: [UserAccessLevel.ADMIN, UserAccessLevel.SALES, UserAccessLevel.VIEWER] },
  { name: 'Clientes', path: '/customers', icon: UserGroupIcon, allowedRoles: [UserAccessLevel.ADMIN, UserAccessLevel.SALES] },
  { name: 'Produtos', path: '/products', icon: SquaresPlusIcon, allowedRoles: [UserAccessLevel.ADMIN, UserAccessLevel.SALES] },
  { name: 'Categorias', path: '/categories', icon: TagIcon, allowedRoles: [UserAccessLevel.ADMIN, UserAccessLevel.SALES] }, 
  { name: 'Orçamentos', path: '/quotes/new', icon: DocumentTextIcon, allowedRoles: [UserAccessLevel.ADMIN, UserAccessLevel.SALES] },
  // Contas a Pagar item removed
  { name: 'Vendas por Usuário', path: '/sales/user-performance', icon: ChartBarIcon, allowedRoles: [UserAccessLevel.ADMIN] },
  { name: 'Usuários', path: '/users', icon: UserGroupIcon, allowedRoles: [UserAccessLevel.ADMIN] },
  { name: 'Empresa', path: '/settings', icon: CogIcon, allowedRoles: [UserAccessLevel.ADMIN] },
];


const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const availableNavItems = allNavItems.filter(item => 
    !item.allowedRoles || item.allowedRoles.includes(currentRole)
  );

  return (
    <aside className="w-64 bg-black text-gray-200 min-h-screen p-4 flex flex-col fixed top-0 left-0 pt-20">
      <nav>
        <ul>
          {availableNavItems.map((item) => (
            <li key={item.name} className="mb-2">
              <NavLink
                to={item.path}
                end={item.path === '/'} // Important for accurate active state on home/dashboard
                className={({ isActive }) =>
                  `flex items-center py-2.5 px-4 rounded-md transition duration-200 
                   ${isActive 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-yellow-500'}`
                }
              >
                <item.icon className={`w-5 h-5 mr-3 ${ ({isActive}: {isActive:boolean}) => isActive ? 'text-black': 'text-gray-400 group-hover:text-yellow-500' }`} />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto p-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {APP_NAME}
      </div>
    </aside>
  );
};

export default Sidebar;
