import React, { useState, useEffect } from 'react';
import {
    Activity, Search, Clock, Save, X, CheckCircle,
    Thermometer, Heart, Wind, Stethoscope, AlertTriangle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

// --- Modals ---

const TriageModal = ({ visit, onClose, onSave, doctors = [] }) => {
    const [formData, setFormData] = useState({
        vitals: { bp: '', temp: '', pulse: '', spo2: '', weight: '' },
        treatment_notes: '',
        transfer_path: 'REFER_DOCTOR', // Default
        doctor: ''
    });

    useEffect(() => {
        if (visit) {
            setFormData(prev => ({
                ...prev,
                vitals: { ...visit.vitals, weight: visit.vitals?.weight || '' } || { bp: '', temp: '', pulse: '', spo2: '', weight: '' },
                treatment_notes: visit.treatment_notes || '',
                doctor: visit.doctor || ''
            }));
        }
    }, [visit]);

    const handleSubmit = async () => {
        await onSave(visit.id, formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Triage Assessment</h3>
                        <p className="text-sm text-slate-500">{visit.patient_name} (ID: {visit.v_id?.slice(0, 8)})</p>
                    </div>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Vitals Section */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <Activity size={16} className="text-blue-500" /> Vitals Checks
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">BP (mmHg)</label>
                                <input
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                    placeholder="120/80"
                                    value={formData.vitals.bp}
                                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, bp: e.target.value } })}
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Temp (°F)</label>
                                <input
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                    placeholder="98.6"
                                    value={formData.vitals.temp}
                                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, temp: e.target.value } })}
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pulse (bpm)</label>
                                <input
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                    placeholder="72"
                                    value={formData.vitals.pulse}
                                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, pulse: e.target.value } })}
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SpO2 (%)</label>
                                <input
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                    placeholder="98"
                                    value={formData.vitals.spo2}
                                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: e.target.value } })}
                                />
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight (kg)</label>
                                <input
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none"
                                    placeholder="65"
                                    value={formData.vitals.weight}
                                    onChange={e => setFormData({ ...formData, vitals: { ...formData.vitals, weight: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <FileText size={16} className="text-slate-500" /> Clinical Notes
                        </h4>
                        <textarea
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none resize-none h-32"
                            placeholder="Enter symptoms, observations, and immediate treatment..."
                            value={formData.treatment_notes}
                            onChange={e => setFormData({ ...formData, treatment_notes: e.target.value })}
                        />
                    </div>

                    {/* Action Plan */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <CheckCircle size={16} className="text-emerald-500" /> Action Plan
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { val: 'REFER_DOCTOR', label: 'Refer to Doctor', desc: 'Patient stable available for consultation' },
                                { val: 'REFER_LAB', label: 'Refer to Lab', desc: 'Immediate investigation required' }
                            ].map(opt => (
                                <label key={opt.val} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${formData.transfer_path === opt.val ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="transfer_path"
                                        value={opt.val}
                                        checked={formData.transfer_path === opt.val}
                                        onChange={e => setFormData({ ...formData, transfer_path: e.target.value })}
                                        className="accent-blue-600 w-5 h-5"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{opt.label}</div>
                                        <div className="text-xs text-slate-500">{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Doctor Selection (Only if Referring to Doctor) */}
                        <AnimatePresence>
                            {formData.transfer_path === 'REFER_DOCTOR' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-3"
                                >
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Select Specialist</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
                                        value={formData.doctor}
                                        onChange={e => setFormData({ ...formData, doctor: e.target.value })}
                                    >
                                        <option value="">-- Assign a Doctor --</option>
                                        {doctors.map(doc => (
                                            <option key={doc.u_id} value={doc.u_id}>Dr. {doc.username} ({doc.specialization || 'General'})</option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">Confirm & Update</button>
                </div>
            </motion.div>
        </div>
    );
};

const CasualtyPage = () => {
    const { showToast } = useToast();
    const [queue, setQueue] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedVisit, setSelectedVisit] = useState(null); // For Modal

    useEffect(() => {
        fetchQueue();
        fetchDoctors();
    }, []);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reception/visits/?assigned_role=CASUALTY&status=IN_PROGRESS&status=OPEN');
            setQueue(data.results || data);
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to fetch Casualty queue');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data } = await api.get('/users/management/doctors/');
            setDoctors(data);
        } catch (error) {
            console.error("Failed to load doctors", error);
        }
    };

    const handleUpdate = async (visitId, data) => {
        try {
            // 1. Create Log
            await api.post('/casualty/logs/', {
                visit: visitId,
                treatment_notes: data.treatment_notes,
                vitals: data.vitals,
                transfer_path: data.transfer_path
            });

            // 2. Update Visit Status
            let updatePayload = { vitals: data.vitals };
            if (data.transfer_path === 'REFER_DOCTOR') {
                updatePayload = { ...updatePayload, assigned_role: 'DOCTOR', status: 'OPEN', doctor: data.doctor || null };
            } else if (data.transfer_path === 'REFER_LAB') {
                updatePayload = { ...updatePayload, assigned_role: 'LAB', status: 'OPEN' };
            }

            await api.patch(`/reception/visits/${visitId}/`, updatePayload);

            showToast('success', 'Patient updated successfully');
            fetchQueue();
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to update patient');
        }
    };

    const filteredQueue = queue.filter(v =>
        v.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.v_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertTriangle size={24} /></div>
                        Casualty / Emergency
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 ml-1">Manage emergency triage admissions.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none shadow-sm w-64 transition-all"
                        placeholder="Search patient..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Arrival Time</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Vitals Preview</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-20 text-slate-400 font-bold">Loading Queue...</td></tr>
                            ) : filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-20">
                                        <div className="flex flex-col items-center opacity-50">
                                            <div className="p-4 bg-slate-50 rounded-full mb-3"><CheckCircle size={32} className="text-slate-400" /></div>
                                            <p className="font-bold text-slate-900">No active emergency cases</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map(visit => (
                                    <tr key={visit.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-500/20">
                                                    {visit.patient_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{visit.patient_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">ID: {visit.v_id?.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                {new Date(visit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 ml-1">
                                                    {Math.floor((new Date() - new Date(visit.created_at)) / 60000)}m ago
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {visit.vitals ? (
                                                <div className="text-xs font-bold text-slate-600 space-y-1">
                                                    <span className="mr-3"><span className="text-rose-500">BP:</span> {visit.vitals.bp || '--'}</span>
                                                    <span><span className="text-amber-500">Temp:</span> {visit.vitals.temp || '--'}°F</span>
                                                </div>
                                            ) : <span className="text-xs text-slate-400 italic">No Data</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedVisit(visit)}
                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 ml-auto"
                                            >
                                                <Stethoscope size={14} /> Assess / Triage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedVisit && (
                    <TriageModal
                        visit={selectedVisit}
                        onClose={() => setSelectedVisit(null)}
                        onSave={handleUpdate}
                        doctors={doctors}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CasualtyPage;
