import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, UserPlus, Phone, User as UserIcon, Calendar, ArrowRight, X, Activity } from 'lucide-react';
import { Card, Button, Input, Table } from '../components/UI';
import { useSearch } from '../context/SearchContext';
import Pagination from '../components/Pagination';
import api from '../api/axios';

const Reception = () => {
    const [patientsData, setPatientsData] = useState({ results: [], count: 0 });
    const { globalSearch, setGlobalSearch } = useSearch();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [doctors, setDoctors] = useState([]);

    // Registration Form
    const [form, setForm] = useState({ full_name: '', age: '', gender: 'M', phone: '', address: '' });

    // Visit Form
    const [visitForm, setVisitForm] = useState({
        doctor: '',
        vitals: { temp: '', bp: '', pulse: '', weight: '' }
    });

    useEffect(() => {
        fetchPatients();
    }, [page, globalSearch]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reception/patients/?page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}`);
            // DRF paginated response returns { count, next, previous, results }
            setPatientsData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get('/users/management/doctors/');
            setDoctors(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reception/patients/register/', form);
            setShowAddModal(false);
            setPage(1); // Reset to first page
            fetchPatients();
            setForm({ full_name: '', age: '', gender: 'M', phone: '', address: '' });
        } catch (err) {
            alert("Registration failed. Please check phone number uniquely.");
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
            alert("Visit created successfully! Patient sent to Doctor Queue.");
        } catch (err) {
            alert("Failed to create visit.");
        }
    };

    const totalPages = Math.ceil((patientsData.count || 0) / 10);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Reception</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage patient registrations and visit queues.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    <UserPlus size={16} />
                    Register Patient
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

                <div className="overflow-x-auto">
                    <Table headers={['Patient Name', 'Age/Gender', 'Phone', 'Address', 'Actions']}>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-16">
                                <Activity className="mx-auto text-blue-500 animate-spin mb-2" size={24} />
                                <span className="text-gray-400 text-sm">Loading patients...</span>
                            </td></tr>
                        ) : patientsData.results && patientsData.results.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-16 text-gray-400">No patients found.</td></tr>
                        ) : patientsData.results && patientsData.results.map(p => (
                            <tr key={p.p_id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <UserIcon size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{p.full_name}</p>
                                            <p className="text-xs text-gray-400">#{p.p_id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                        {p.age}Y / {p.gender}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">{p.phone}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-500 max-w-[200px] truncate">{p.address}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleNewVisit(p)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                                    >
                                        New Visit
                                        <ArrowRight size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>

                <Pagination
                    current={page}
                    total={totalPages}
                    onPageChange={setPage}
                    loading={loading}
                />
            </div>


            {/* Register Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-2xl font-black text-slate-900 font-outfit">Patient Registration</h2>
                                <p className="text-sm text-slate-500 mt-2 font-inter font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Fill in the details below to create a new patient profile.</p>
                            </div>
                            <form onSubmit={handleRegister} className="p-10 space-y-6">
                                <Input
                                    label="Full Name *"
                                    placeholder="e.g. John Doe"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    required
                                    className="rounded-2xl border-2 border-slate-100 focus:border-sky-500/20"
                                />
                                <div className="flex gap-6">
                                    <Input
                                        label="Age *"
                                        type="number"
                                        value={form.age}
                                        onChange={e => setForm({ ...form, age: e.target.value })}
                                        required
                                        className="rounded-2xl border-2 border-slate-100"
                                    />
                                    <div className="w-full space-y-2">
                                        <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Gender *</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/20 transition-all font-inter font-medium text-slate-700"
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
                                        >
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="O">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <Input
                                    label="Phone Number *"
                                    placeholder="10 digits"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    required
                                    className="rounded-2xl border-2 border-slate-100"
                                />
                                <Input
                                    label="Address"
                                    placeholder="Full residence address"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="rounded-2xl border-2 border-slate-100"
                                />
                                <div className="flex gap-4 pt-4">
                                    <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-sky-500/20">Save Patient</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Visit Modal */}
            <AnimatePresence>
                {showVisitModal && selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 font-outfit leading-tight">Create New Visit</h2>
                                    <p className="text-sm text-slate-500 mt-2 font-inter font-medium tracking-tight">Assign {selectedPatient.full_name} to a doctor.</p>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-sm text-slate-400 hover:text-rose-500 transition-all border border-slate-100"
                                    onClick={() => setShowVisitModal(false)}
                                >
                                    <X size={20} />
                                </div>
                            </div>

                            <form onSubmit={submitVisit} className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Select Doctor *</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {doctors.map(doc => (
                                            <div
                                                key={doc.u_id}
                                                onClick={() => setVisitForm({ ...visitForm, doctor: doc.u_id })}
                                                className={`p-5 border-2 rounded-3xl cursor-pointer transition-all flex items-center gap-4 ${visitForm.doctor === doc.u_id ? 'border-sky-500 bg-sky-50 shadow-lg shadow-sky-500/10 scale-[1.02]' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${visitForm.doctor === doc.u_id ? 'bg-sky-500 text-white shadow-sky-500/30' : 'bg-white text-slate-400'}`}>
                                                    <UserIcon size={20} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={`font-bold text-sm truncate ${visitForm.doctor === doc.u_id ? 'text-sky-900' : 'text-slate-700'}`}>Dr. {doc.username}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none truncate">Available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Clinical Vitals</label>
                                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                        <Input
                                            label="Temp (°C)"
                                            placeholder="37.0"
                                            value={visitForm.vitals.temp}
                                            onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, temp: e.target.value } })}
                                            className="bg-white border-none shadow-sm"
                                        />
                                        <Input
                                            label="BP (mmHg)"
                                            placeholder="120/80"
                                            value={visitForm.vitals.bp}
                                            onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, bp: e.target.value } })}
                                            className="bg-white border-none shadow-sm"
                                        />
                                        <Input
                                            label="Pulse (bpm)"
                                            placeholder="72"
                                            value={visitForm.vitals.pulse}
                                            onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, pulse: e.target.value } })}
                                            className="bg-white border-none shadow-sm"
                                        />
                                        <Input
                                            label="Weight (kg)"
                                            placeholder="70"
                                            value={visitForm.vitals.weight}
                                            onChange={e => setVisitForm({ ...visitForm, vitals: { ...visitForm.vitals, weight: e.target.value } })}
                                            className="bg-white border-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowVisitModal(false)}>Discard</Button>
                                    <Button type="submit" className="flex-1 h-14 rounded-2xl font-bold shadow-2xl shadow-sky-500/25">Send to Doctor Queue</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reception;
