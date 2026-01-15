import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, PieChart, Users, Pill, FlaskConical, IndianRupee, Stethoscope, ClipboardList, Package, X } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Table } from '../components/UI';
import api from '../api/axios';

const Reports = () => {
    const [activeReport, setActiveReport] = useState('financial');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedNote, setSelectedNote] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reports/${activeReport}/`, {
                params: { start_date: startDate, end_date: endDate }
            });
            setData(response.data);
        } catch (err) {
            console.error("Error fetching report:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeReport]);

    const handleExport = () => {
        const url = `${import.meta.env.VITE_API_URL}reports/${activeReport}/?export=csv&start_date=${startDate}&end_date=${endDate}`;
        window.open(url, '_blank');
    };

    const tabs = [
        { id: 'financial', name: 'Revenue', icon: <IndianRupee size={18} /> },
        { id: 'opd', name: 'OPD Patients', icon: <Users size={18} /> },
        { id: 'doctor', name: 'Doctor Report', icon: <Stethoscope size={18} /> },
        { id: 'pharmacy', name: 'Pharmacy', icon: <Pill size={18} /> },
        { id: 'lab', name: 'Lab Tests', icon: <FlaskConical size={18} /> },
        { id: 'inventory', name: 'Inventory Logs', icon: <Package size={18} /> },
    ];

    const getChartData = () => {
        if (!data?.details) return [];
        const daily = {};
        data.details.forEach(item => {
            const day = new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' });
            daily[day] = (daily[day] || 0) + (item.amount || item.total || 1);
        });
        return Object.keys(daily).map(day => ({ name: day, value: daily[day] }));
    };

    const chartData = getChartData();

    const getTableConfig = () => {
        if (activeReport === 'financial') {
            return {
                headers: ['ID', 'Patient', 'Amount', 'Status', 'Date'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.patient,
                    `₹${row.amount}`,
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{row.status}</span>,
                    new Date(row.date).toLocaleDateString()
                ])
            };
        }
        if (activeReport === 'opd') {
            return {
                headers: ['ID', 'Patient', 'Doctor', 'Status', 'Date'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.patient,
                    row.doctor,
                    <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">{row.status}</span>,
                    new Date(row.date).toLocaleDateString()
                ])
            };
        }
        if (activeReport === 'pharmacy') {
            return {
                headers: ['ID', 'Patient', 'Total Amount', 'Date'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.patient,
                    `₹${row.total}`,
                    new Date(row.date).toLocaleDateString()
                ])
            };
        }
        if (activeReport === 'lab') {
            return {
                headers: ['ID', 'Patient', 'Test Name', 'Amount', 'Date'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.patient,
                    row.test_name,
                    `₹${row.amount}`,
                    new Date(row.date).toLocaleDateString()
                ])
            };
        }
        if (activeReport === 'inventory') {
            return {
                headers: ['Log ID', 'Item', 'Transaction', 'Qty', 'Cost', 'User', 'Date'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.item_name,
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.type}</span>,
                    row.qty,
                    `₹${row.cost || '0.00'}`,
                    row.performed_by || 'Unknown',
                    new Date(row.date).toLocaleDateString() + ' ' + new Date(row.date).toLocaleTimeString()
                ])
            };
        }
        if (activeReport === 'doctor') {
            return {
                headers: ['ID', 'Doctor', 'Patient', 'Diagnosis', 'Date', 'Action'],
                rows: (data?.details || []).map(row => [
                    row.id.substring(0, 8),
                    row.doctor,
                    row.patient,
                    row.diagnosis,
                    new Date(row.date).toLocaleDateString(),
                    <Button size="xs" onClick={() => setSelectedNote(row)} className="text-[10px] h-7 px-3 bg-slate-900">View Case</Button>
                ])
            };
        }
        return { headers: ['ID', 'Details', 'Date'], rows: (data?.details || []).map(row => [row.id.substring(0, 8), row.patient || 'Internal', new Date(row.date).toLocaleDateString()]) };
    };

    const tableConfig = getTableConfig();

    return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hospital Analytics</h1>
                    <p className="text-slate-500 mt-1">Detailed performance reports and real-time statistics.</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full lg:w-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeReport === tab.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-2">
                        <TrendingUp size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Total {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Summary</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                        {activeReport === 'financial' ? `₹${data?.total_revenue || 0}` : (data?.details?.length || 0)}
                    </h3>
                    <div className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full">
                        <TrendingUp size={14} className="mr-1" /> Performance Stable
                    </div>
                </Card>

                <Card className="lg:col-span-2 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Growth Analysis (Last 7 Days)</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 bg-sky-500 rounded-full"></span>
                            <span className="text-xs text-slate-500 font-medium">Daily Trend</span>
                        </div>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">{activeReport.toUpperCase()} Data Breakdown</h3>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                            <Download size={16} /> Export CSV
                        </Button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        <Table
                            headers={tableConfig.headers}
                            rows={tableConfig.rows}
                        />
                        {tableConfig.rows.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-400">
                                No records found for this date range.
                            </div>
                        )}
                        {loading && (
                            <div className="p-12 flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
                                <p className="text-sm text-slate-500 font-medium animate-pulse">Syncing data...</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-8 space-y-6 h-fit sticky top-8">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Filter & Refine</h3>
                        <Calendar size={20} className="text-slate-400" />
                    </div>
                    <div className="space-y-4">
                        <Input
                            type="date"
                            label="From Date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="To Date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchReport} className="w-full h-14 text-base shadow-xl" variant="primary">
                        Refresh Analytics
                    </Button>
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <p className="text-xs text-sky-700 leading-relaxed">
                            💡 Change dates to track trends over time. Click <b>Export CSV</b> to download a hard copy for auditing.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Case Sheet Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <ClipboardList size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 font-outfit uppercase tracking-tighter leading-none">Clinical Case Sheet</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Visit ID: {selectedNote.id}</p>
                                    </div>
                                </div>
                                <button className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all font-bold" onClick={() => setSelectedNote(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</label>
                                        <p className="font-black text-slate-900 font-outfit text-xl uppercase tracking-tight">{selectedNote.patient}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulting Doctor</label>
                                        <p className="font-bold text-slate-700">Dr. {selectedNote.doctor}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-4 bg-sky-500 rounded-full"></div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Clinical Diagnosis</span>
                                    </div>
                                    <p className="text-slate-600 font-inter font-semibold leading-relaxed whitespace-pre-wrap pl-4 italic">
                                        {selectedNote.diagnosis || "No diagnosis documented."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-4 bg-slate-900 rounded-full"></div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Medical Prescription</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedNote.prescription && Object.entries(selectedNote.prescription).length > 0 ? (
                                            Object.entries(selectedNote.prescription).map(([med, dosage]) => (
                                                <div key={med} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                    <span className="font-black text-slate-900 uppercase text-sm tracking-tight">{med}</span>
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{dosage}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 text-xs italic text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed">No medicines prescribed.</p>
                                        )}
                                    </div>
                                </div>

                                {selectedNote.notes && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-4 bg-slate-200 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Observations</span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-medium italic leading-relaxed pl-4">
                                            {selectedNote.notes}
                                        </p>
                                    </div>
                                ) || null}

                                <div className="flex justify-between items-center pt-8 border-t border-slate-50 opacity-60">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(selectedNote.date).toLocaleString()}</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => window.print()}>
                                        <Download size={16} /> Print Record
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reports;
