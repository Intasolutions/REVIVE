import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Pill, FlaskConical, Receipt, BarChart3, Settings, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'DOCTOR', 'RECEPTION', 'PHARMACY', 'LAB'] },
        { name: 'Reception', icon: Users, path: '/reception', roles: ['ADMIN', 'RECEPTION'] },
        { name: 'Doctor', icon: Stethoscope, path: '/doctor', roles: ['ADMIN', 'DOCTOR'] },
        { name: 'Pharmacy', icon: Pill, path: '/pharmacy', roles: ['ADMIN', 'PHARMACY'] },
        { name: 'Laboratory', icon: FlaskConical, path: '/lab', roles: ['ADMIN', 'LAB'] },
        { name: 'Billing', icon: Receipt, path: '/billing', roles: ['ADMIN', 'RECEPTION'] },
        { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['ADMIN'] },
        { name: 'Settings', icon: Settings, path: '/users', roles: ['ADMIN'] },
    ].filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-900 font-semibold text-lg">Revive</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                    >
                        <item.icon size={18} strokeWidth={1.8} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                        <p className="text-xs text-gray-400">{user?.role}</p>
                    </div>
                    <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
