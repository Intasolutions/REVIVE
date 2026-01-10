import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    UserPlus, Phone, User as UserIcon, ArrowRight, X, 
    Activity, Thermometer, Heart, Scale, Stethoscope, 
    MapPin, ChevronRight, Search, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import Pagination from '../components/Pagination'; 
import api from '../api/axios';

// --- Sub-Component: Skeleton Loader (Premium Loading State) ---
const TableSkeleton = () => (
    <div className="animate-pulse space-y-4 p-6">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-24 rounded-lg bg-slate-100" />
            </div>
        ))}
    </div>
);

// --- Sub-Component: Toast Notification (Replaces Alert) ---
const Toast = ({ message, type, onClose }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl z-[60] border ${
            type === 'success' ? 'bg-white border-green-100' : 'bg-white border-red-100'
        }`}
    >
        <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <div>
            <h4 className={`text-sm font-bold ${type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {type === 'success' ? 'Success' : 'Error'}
            </h4>
            <p className="text-xs text-slate-500 font-medium">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600">
            <X size={16} />
        </button>
    </motion.div>
);

const Reception = () => {
    // --- State Management ---
    const [patientsData, setPatientsData] = useState({ results: [], count: 0 });
    const { globalSearch } = useSearch();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    
    // Data Selection
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [doctors, setDoctors] = useState([]);

    // Feedback State
    const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

    // Registration Form
    const [form, setForm] = useState({ full_name: '', age: '', gender: 'M', phone: '', address: '' });

    // Visit Form
    const [visitForm, setVisitForm] = useState({
        doctor: '',
        vitals: { temp: '', bp: '', pulse: '', weight: '' }
    });

    // --- Helper: Show Notification ---
    const showToast = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000); // Auto hide after 4s
    };

    // --- Effects ---
    useEffect(() => {
        fetchPatients();
    }, [page, globalSearch]);

    // --- API Functions ---
    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reception/patients/?page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}`);
            setPatientsData(data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to load patients list.');
        } finally {
            // Artificial delay to show off the skeleton loader (Optional: remove in production)
            setTimeout(() => setLoading(false), 500); 
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get('/users/management/doctors/');
            setDoctors(data);
        } catch (err) {
            console.error(err);
            showToast('error', 'Could not fetch doctors list.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reception/patients/register/', form);
            setShowAddModal(false);
            setPage(1);
            fetchPatients();
            setForm({ full_name: '', age: '', gender: 'M', phone: '', address: '' });
            showToast('success', 'New patient registered successfully!');
        } catch (err) {
            showToast('error', 'Registration failed. Check phone number.');
        }
    };

    const handleNewVisit = async (p) => {
        setSelectedPatient(p);
        await fetchDoctors();
        setShowVisitModal(true);
    };

    const submitVisit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reception/visits/', {
                patient: selectedPatient.p_id,
                doctor: visitForm.doctor,
                status: 'OPEN',
                vitals: visitForm.vitals
            });
            setShowVisitModal(false);
            setVisitForm({ doctor: '', vitals: { temp: '', bp: '', pulse: '', weight: '' } });
            showToast('success', `Visit token generated for ${selectedPatient.full_name}`);
        } catch (err) {
            showToast('error', 'Failed to create visit record.');
        }
    };

    const totalPages = Math.ceil((patientsData.count || 0) / 10);

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
            
            {/* --- Toast Notification Container --- */}
            <AnimatePresence>
                {notification && (
                    <Toast 
                        message={notification.message} 
                        type={notification.type} 
                        onClose={() => setNotification(null)} 
                    />
                )}
            </AnimatePresence>

            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">Reception</h1>
                    <div className="flex items-center gap-2 text-slate-500 font-medium mt-1">
                        <span>Patient Management</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>Today: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    className="group flex items-center gap-3 px-6 py-3.5 bg-slate-950 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                    <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                        <UserPlus size={18} />
                    </div>
                    <span>Register New Patient</span>
                </button>
            </div>

            {/* --- Main Data Card --- */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <TableSkeleton />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-widest font-bold text-slate-400">
                                        <th className="px-8 py-6">Patient Identity</th>
                                        <th className="px-6 py-6">Vitals</th>
                                        <th className="px-6 py-6">Contact Info</th>
                                        <th className="px-6 py-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {patientsData.results && patientsData.results.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-24 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-50">
                                                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                                                        <Search size={32} className="text-slate-400" />
                                                    </div>
                                                    <p className="font-bold text-slate-900">No patients found</p>
                                                    <p className="text-sm text-slate-500">Try adjusting your search filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        patientsData.results.map((p) => (
                                            <tr key={p.p_id} className="group hover:bg-blue-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                                                {p.full_name.charAt(0)}
                                                            </div>
                                                            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                                                <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-[15px]">{p.full_name}</p>
                                                            <p className="text-xs font-bold text-slate-400 font-mono tracking-wide">ID: {p.p_id.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${p.gender === 'M' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                            {p.gender === 'M' ? 'Male' : 'Female'}
                                                        </span>
                                                        <span className="text-sm font-semibold text-slate-600">{p.age} Yrs</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                            <Phone size={14} className="text-slate-400" />
                                                            {p.phone}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 truncate max-w-[200px]">
                                                            <MapPin size={12} />
                                                            {p.address}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button 
                                                        onClick={() => handleNewVisit(p)}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95"
                                                    >
                                                        Triage
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <Pagination 
                                current={page} 
                                total={totalPages} 
                                onPageChange={setPage} 
                                loading={loading} 
                            />
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL: Patient Registration --- */}
           {/* --- PREMIUM MODAL: Patient Registration --- */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        {/* 1. Glassmorphism Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-all" 
                            onClick={() => setShowAddModal(false)}
                        />
                        
                        {/* 2. The Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-white/20"
                        >
                            {/* Header */}
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                                            <UserPlus className="text-white" size={20} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Patient</h2>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium ml-1">Create a digital health record.</p>
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(false)} 
                                    className="p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {/* Form */}
                            <form onSubmit={handleRegister} className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Full Name (Span 2 cols) */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Legal Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
                                                value={form.full_name}
                                                onChange={e => setForm({...form, full_name: e.target.value})}
                                                placeholder="e.g. Rahul Verma"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Age */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Age</label>
                                        <div className="relative group">
                                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input 
                                                type="number" 
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                value={form.age}
                                                onChange={e => setForm({...form, age: e.target.value})}
                                                placeholder="Years"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Gender (Segmented Control - Premium UX) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                            {['M', 'F', 'O'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setForm({...form, gender: option})}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                                        form.gender === option 
                                                        ? 'bg-white text-blue-600 shadow-sm shadow-slate-200' 
                                                        : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {option === 'M' ? 'Male' : option === 'F' ? 'Female' : 'Other'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input 
                                                type="tel" 
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
                                                value={form.phone}
                                                onChange={e => setForm({...form, phone: e.target.value})}
                                                placeholder="10-digit mobile number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Residential Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
                                                value={form.address}
                                                onChange={e => setForm({...form, address: e.target.value})}
                                                placeholder="Area, Street, City"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="mt-8 w-full py-4 bg-slate-950 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <span>Complete Registration</span>
                                    <ArrowRight size={18} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL: Create Visit --- */}
            <AnimatePresence>
                {showVisitModal && selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                            onClick={() => setShowVisitModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Left: Vitals */}
                            <div className="md:w-1/2 p-8 border-r border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                                    <Activity className="text-blue-600" size={20} />
                                    Initial Triage
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Temp */}
                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Temp</label>
                                            <Thermometer size={16} className="text-rose-400" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="text" placeholder="98.6"
                                                className="w-full text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
                                                value={visitForm.vitals.temp}
                                                onChange={e => setVisitForm({...visitForm, vitals: {...visitForm.vitals, temp: e.target.value}})}
                                            />
                                            <span className="text-xs font-bold text-slate-400">°F</span>
                                        </div>
                                    </div>
                                    {/* BP */}
                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">BP</label>
                                            <Heart size={16} className="text-red-500" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="text" placeholder="120/80"
                                                className="w-full text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
                                                value={visitForm.vitals.bp}
                                                onChange={e => setVisitForm({...visitForm, vitals: {...visitForm.vitals, bp: e.target.value}})}
                                            />
                                            <span className="text-xs font-bold text-slate-400">mm</span>
                                        </div>
                                    </div>
                                    {/* Pulse */}
                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Pulse</label>
                                            <Activity size={16} className="text-emerald-500" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="text" placeholder="72"
                                                className="w-full text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
                                                value={visitForm.vitals.pulse}
                                                onChange={e => setVisitForm({...visitForm, vitals: {...visitForm.vitals, pulse: e.target.value}})}
                                            />
                                            <span className="text-xs font-bold text-slate-400">bpm</span>
                                        </div>
                                    </div>
                                    {/* Weight */}
                                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Weight</label>
                                            <Scale size={16} className="text-blue-500" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="text" placeholder="70"
                                                className="w-full text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-200"
                                                value={visitForm.vitals.weight}
                                                onChange={e => setVisitForm({...visitForm, vitals: {...visitForm.vitals, weight: e.target.value}})}
                                            />
                                            <span className="text-xs font-bold text-slate-400">kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Doctor Selection */}
                            <div className="md:w-1/2 p-8 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Stethoscope className="text-slate-900" size={20} />
                                        Assign Doctor
                                    </h3>
                                    <button onClick={() => setShowVisitModal(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {doctors.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">No doctors available.</p>
                                    ) : doctors.map(doc => (
                                        <div 
                                            key={doc.u_id}
                                            onClick={() => setVisitForm({...visitForm, doctor: doc.u_id})}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group ${
                                                visitForm.doctor === doc.u_id 
                                                ? 'border-blue-600 bg-blue-50 shadow-md' 
                                                : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                visitForm.doctor === doc.u_id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-blue-500'
                                            }`}>
                                                <UserIcon size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${visitForm.doctor === doc.u_id ? 'text-blue-900' : 'text-slate-900'}`}>
                                                    Dr. {doc.username}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">Available Now</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                visitForm.doctor === doc.u_id ? 'border-blue-600' : 'border-slate-300'
                                            }`}>
                                                {visitForm.doctor === doc.u_id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={submitVisit}
                                    disabled={!visitForm.doctor}
                                    className="mt-6 w-full py-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <span>Generate Token</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reception;