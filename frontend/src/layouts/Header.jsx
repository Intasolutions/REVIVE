import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Check, X } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const { globalSearch, setGlobalSearch } = useSearch();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/core/notifications/');
            setNotifications(data.results || data);
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post('/core/notifications/mark_read/', { ids: [id] });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    // Mark all currently visible as read
    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            try {
                await api.post('/core/notifications/mark_read/', { ids: unreadIds });
                fetchNotifications();
            } catch (err) {
                console.error(err);
            }
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            {/* Search */}
            <div className="relative w-96 group">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search patients, invoices, drugs..."
                    className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-sm"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6" ref={dropdownRef}>
                <div className="relative">
                    <button
                        className={`relative p-3 rounded-xl transition-all ${showDropdown ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <Bell size={22} className={unreadCount > 0 ? "animate-pulse-slow" : ""} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-4 ring-gray-500/5 origin-top-right"
                            >
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400">
                                            <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-blue-50/30' : ''}`} onClick={() => !n.is_read && markAsRead(n.id)}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Bell size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                        {n.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {!n.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
