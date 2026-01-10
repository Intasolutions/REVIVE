import React, { useState, useEffect } from 'react';
import { Users, Activity, TrendingUp, Package, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, change, icon: Icon, iconBg }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                {change && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${change.includes('+') ? 'text-green-600' : 'text-red-500'}`}>
                        <TrendingUp size={12} />
                        {change} from yesterday
                    </p>
                )}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/core/dashboard/stats/');
                setStats(data);
            } catch (err) {
                console.error("Dashboard error");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.username}
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your clinic today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    label="New Patients"
                    value={stats?.patients_today || 0}
                    change="+12%"
                    icon={Users}
                    iconBg="bg-blue-500"
                />
                <StatCard
                    label="Active Visits"
                    value={stats?.active_visits || 0}
                    icon={Activity}
                    iconBg="bg-amber-500"
                />
                <StatCard
                    label="Today's Revenue"
                    value={`₹${(stats?.revenue_today || 0).toLocaleString()}`}
                    change="+8%"
                    icon={TrendingUp}
                    iconBg="bg-green-500"
                />
                <StatCard
                    label="Low Stock Items"
                    value={stats?.pharmacy_low_stock || 0}
                    icon={Package}
                    iconBg="bg-red-500"
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                            <p className="text-sm text-gray-500">Last 7 days</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenue_trend || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    tickFormatter={(val) => `₹${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Visits</h2>
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Live
                        </span>
                    </div>
                    <div className="space-y-4">
                        {stats?.recent_visits?.slice(0, 5).map((visit) => (
                            <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                    {visit.patient_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{visit.patient_name}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(visit.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${visit.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                    visit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>
                                    {visit.status?.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                        {(!stats?.recent_visits || stats.recent_visits.length === 0) && (
                            <div className="text-center py-8">
                                <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No recent visits</p>
                            </div>
                        )}
                    </div>
                    <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-1">
                        View all <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
