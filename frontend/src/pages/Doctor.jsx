import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope, ClipboardList, Send, User, Activity, X, Search,
    Plus, FileText, Trash2, ChevronRight, Clock, Pill,
    CalendarDays, History, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext'; // Using the global toast we made
import api from '../api/axios';
import Pagination from '../components/Pagination';

// --- Components: Skeletons & UI Bits ---
const QueueSkeleton = () => (
    <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                    <div className="h-3 w-1/3 bg-slate-50 rounded" />
                </div>
            </div>
        ))}
    </div>
);

const Doctor = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { globalSearch } = useSearch();

    // Data States
    const [visitsData, setVisitsData] = useState({ results: [], count: 0 });
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form States
    const [notes, setNotes] = useState({ diagnosis: '', prescription: {}, notes: '' });

    // Medicine States
    const [medSearch, setMedSearch] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [selectedMeds, setSelectedMeds] = useState([]);
    const [referral, setReferral] = useState('NONE'); // NONE, LAB, PHARMACY, CASUALTY
    const [labDetails, setLabDetails] = useState('');


    // --- Effects ---
    useEffect(() => {
        if (user) fetchQueue();
    }, [user, page, globalSearch]);

    useEffect(() => {
        if (selectedVisit) {
            // Reset forms when switching patients
            setNotes({ diagnosis: '', prescription: {}, notes: '' });
            setSelectedMeds([]);
            setReferral('NONE');
            setLabDetails('');
            fetchPatientHistory(selectedVisit.patient_id || selectedVisit.patient);

        } else {
            setPatientHistory([]);
        }
    }, [selectedVisit]);

    // --- API Interactions ---
    const fetchQueue = async () => {
        setLoading(true);
        try {
            const doctorFilter = user?.role === 'DOCTOR' ? `&doctor=${user.u_id}` : '';
            const { data } = await api.get(`/reception/visits/?status=OPEN${doctorFilter}&page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}`);
            setVisitsData(data);
        } catch (err) {
            showToast('error', 'Could not refresh patient queue');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientHistory = async (pId) => {
        if (!pId) return;
        setHistoryLoading(true);
        try {
            // In a real app, you'd likely have a specific endpoint for history
            const { data: notesData } = await api.get('/medical/doctor-notes/');
            const { data: visitsData } = await api.get(`/reception/visits/?patient=${pId}`);
            const vIds = (visitsData.results || visitsData).map(v => v.v_id || v.id);
            const filteredNotes = (notesData.results || notesData).filter(n => vIds.includes(n.visit));
            setPatientHistory(filteredNotes);
        } catch (err) {
            console.error("History fetch error", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const searchMedicines = async (query) => {
        setMedSearch(query);
        if (query.length < 2) {
            setMedResults([]);
            return;
        }
        try {
            const { data } = await api.get(`/pharmacy/stock/?search=${query}`);
            setMedResults(data.results || data);
        } catch (err) {
            console.error(err);
        }
    };

    const addMedicine = (med) => {
        if (!selectedMeds.find(m => m.name === med.name)) {
            setSelectedMeds([...selectedMeds, {
                name: med.name,
                dosage: '1-0-1',
                duration: '5 Days',
                count: '15',
                stock: med.qty_available
            }]);
            showToast('success', `${med.name} added to prescription`);
        }
        setMedSearch('');
        setMedResults([]);
    };

    const removeMedicine = (name) => {
        setSelectedMeds(selectedMeds.filter(m => m.name !== name));
    };

    const updateMedField = (name, field, value) => {
        setSelectedMeds(selectedMeds.map(m => m.name === name ? { ...m, [field]: value } : m));
    };

    const handleSaveConsultation = async () => {
        if (!selectedVisit) return;
        try {
            const prescriptionObj = {};
            selectedMeds.forEach(m => {
                prescriptionObj[m.name] = `${m.dosage} | ${m.duration} | Qty: ${m.count}`;
            });

            await api.post('/medical/doctor-notes/', {
                visit: selectedVisit.v_id || selectedVisit.id,
                ...notes,
                prescription: prescriptionObj,
                lab_referral_details: labDetails
            });

            const updatePayload = referral !== 'NONE'
                ? { status: 'OPEN', assigned_role: referral, doctor: null } // Release to other dept
                : { status: 'CLOSED' }; // Discharge

            await api.patch(`/reception/visits/${selectedVisit.v_id || selectedVisit.id}/`, updatePayload);

            showToast('success', referral !== 'NONE' ? `Referred to ${referral}` : 'Consultation saved & patient discharged');
            setSelectedVisit(null);
            fetchQueue();

        } catch (err) {
            showToast('error', 'Failed to save consultation details');
        }
    };

    const totalPages = Math.ceil((visitsData.count || 0) / 10);

    return (
        <div className="p-6 h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden flex flex-col">

            {/* --- Top Bar --- */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">Consultation Room</h1>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Dr. {user?.username} is Online</span>
                    </div>
                </div>
            </div>

            {/* --- Main Workspace (Grid) --- */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">

                {/* --- LEFT: Patient Queue (4 Cols) --- */}
                <div className="col-span-3 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Waiting Room</h3>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{visitsData.count || 0}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <QueueSkeleton />
                        ) : visitsData.results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Clock className="text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Queue is empty</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {visitsData.results.map(v => {
                                    const isActive = selectedVisit?.v_id === (v.v_id || v.id);
                                    return (
                                        <div
                                            key={v.v_id || v.id}
                                            onClick={() => setSelectedVisit(v)}
                                            className={`p-4 cursor-pointer transition-all hover:bg-slate-50 relative group ${isActive ? 'bg-blue-50/50' : ''
                                                }`}
                                        >
                                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${isActive ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white border border-slate-100 text-slate-500'
                                                    }`}>
                                                    {v.patient_name ? v.patient_name[0] : 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                                                        {v.patient_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium truncate">
                                                        Wait: 12 mins
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className={`transition-opacity ${isActive ? 'opacity-100 text-blue-500' : 'opacity-0 group-hover:opacity-50 text-slate-300'}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100">
                        <Pagination current={page} total={totalPages} onPageChange={setPage} loading={loading} compact={true} />
                    </div>
                </div>

                {/* --- RIGHT: Consultation Pad (9 Cols) --- */}
                <div className="col-span-9 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                    {selectedVisit ? (
                        <>
                            {/* Patient Header */}
                            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedVisit.patient_name}</h2>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                                            <span>ID: {(selectedVisit.v_id || selectedVisit.id).slice(0, 8)}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-blue-600">Male • 34 Yrs</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <select
                                        value={referral}
                                        onChange={(e) => setReferral(e.target.value)}
                                        className="h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 hover:border-blue-300 transition-all cursor-pointer"
                                    >
                                        <option value="NONE">No Referral</option>
                                        <option value="LAB">Refer to Lab</option>
                                        <option value="PHARMACY">Refer to Pharmacy</option>
                                        <option value="CASUALTY">Refer to Casualty</option>
                                    </select>

                                    <button
                                        onClick={() => setSelectedVisit(null)}
                                        className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors"
                                    >
                                        Hold Patient
                                    </button>
                                    <button
                                        onClick={handleSaveConsultation}
                                        className={`px-6 py-2 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95 ${referral !== 'NONE' ? 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700' : 'bg-slate-950 shadow-slate-900/20 hover:bg-blue-600'}`}
                                    >
                                        <Send size={14} />
                                        {referral !== 'NONE' ? 'Refer & Release' : 'Finalize & Discharge'}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Workspace */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-3 gap-8">

                                    {/* Main Clinical Column (2/3) */}
                                    <div className="col-span-2 space-y-8">

                                        {/* Diagnosis Section */}
                                        <div className="group">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Stethoscope size={16} /></div>
                                                Clinical Diagnosis & Notes
                                            </label>
                                            <textarea
                                                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none placeholder:text-slate-400"
                                                rows="4"
                                                placeholder="Type your clinical findings here..."
                                                value={notes.diagnosis}
                                                onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                                            />
                                        </div>

                                        {/* Lab Referral Details Input (Conditional) */}
                                        <AnimatePresence>
                                            {referral === 'LAB' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="group mt-6">
                                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                                            <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><ClipboardList size={16} /></div>
                                                            Lab Test Requirements
                                                        </label>
                                                        <textarea
                                                            className="w-full p-5 bg-purple-50/50 border-2 border-purple-100 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none placeholder:text-slate-400"
                                                            rows="3"
                                                            placeholder="Specify tests or checkups required..."
                                                            value={labDetails}
                                                            onChange={(e) => setLabDetails(e.target.value)}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Prescription Pad */}
                                        <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-6 relative group focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Pill size={16} /></div>
                                                    Prescription Pad
                                                </label>

                                                {/* Medicine Search */}
                                                <div className="relative w-64 z-20">
                                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                                    <input
                                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm"
                                                        placeholder="Search medicine..."
                                                        value={medSearch}
                                                        onChange={(e) => searchMedicines(e.target.value)}
                                                    />
                                                    <AnimatePresence>
                                                        {medResults.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-50"
                                                            >
                                                                {medResults.map(med => (
                                                                    <div
                                                                        key={med.id}
                                                                        onClick={() => addMedicine(med)}
                                                                        className="px-4 py-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group"
                                                                    >
                                                                        <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">{med.name}</span>
                                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Stock: {med.qty_available}</span>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Medicine List */}
                                            <div className="space-y-3 min-h-[100px]">
                                                {selectedMeds.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                                        <Plus size={24} />
                                                        <span className="text-xs font-bold mt-2">Add medicines from search</span>
                                                    </div>
                                                ) : (
                                                    <AnimatePresence>
                                                        {selectedMeds.map((med, idx) => (
                                                            <motion.div
                                                                key={med.name}
                                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center"
                                                            >
                                                                <div className="flex-1 flex items-center gap-3 w-full">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                                                                </div>

                                                                {/* Smart Inputs */}
                                                                <div className="flex items-center gap-2 w-full md:w-auto">
                                                                    <div className="relative group">
                                                                        <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 uppercase">Dosage</label>
                                                                        <input
                                                                            value={med.dosage}
                                                                            onChange={(e) => updateMedField(med.name, 'dosage', e.target.value)}
                                                                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="relative group">
                                                                        <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 uppercase">Duration</label>
                                                                        <input
                                                                            value={med.duration}
                                                                            onChange={(e) => updateMedField(med.name, 'duration', e.target.value)}
                                                                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="relative group">
                                                                        <label className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-bold text-slate-400 uppercase">Qty</label>
                                                                        <input
                                                                            value={med.count}
                                                                            onChange={(e) => updateMedField(med.name, 'count', e.target.value)}
                                                                            className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:border-blue-500 outline-none"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeMedicine(med.name)}
                                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Sidebar: History & Info (1/3) */}
                                    <div className="col-span-1 border-l border-slate-100 pl-8">
                                        <div className="sticky top-0 space-y-8">

                                            {/* Vital Stats (Mockup/Placeholder) */}
                                            <div className="space-y-4">
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <Activity size={16} className="text-rose-500" /> Vitals Today
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">BP</p>
                                                        <p className="text-lg font-bold text-slate-900">120/80</p>
                                                    </div>
                                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Temp</p>
                                                        <p className="text-lg font-bold text-slate-900">98.4°F</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Patient History Timeline */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                                                    <History size={16} className="text-purple-500" /> History Timeline
                                                </label>
                                                <div className="space-y-0 relative">
                                                    {/* Vertical Line */}
                                                    <div className="absolute left-2.5 top-2 bottom-0 w-0.5 bg-slate-100" />

                                                    {historyLoading ? (
                                                        <div className="pl-8 text-xs text-slate-400">Loading history...</div>
                                                    ) : patientHistory.length === 0 ? (
                                                        <div className="pl-8 text-xs text-slate-400 italic">No previous records.</div>
                                                    ) : (
                                                        patientHistory.map((h, i) => (
                                                            <div key={i} className="relative pl-8 pb-6 group">
                                                                <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-slate-200 rounded-full group-hover:border-blue-500 transition-colors z-10" />
                                                                <p className="text-xs font-bold text-slate-400 mb-1">{new Date(h.created_at).toLocaleDateString()}</p>
                                                                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                                                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{h.diagnosis}</p>
                                                                    {h.prescription && (
                                                                        <div className="mt-2 flex gap-1 flex-wrap">
                                                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                                                                {Object.keys(h.prescription).length} Meds
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Empty State
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">

                            {/* ^ Example trigger for illustrative purpose, in real code replace with: */}
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Stethoscope size={48} className="text-blue-200" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Consultation</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Select a patient from the waiting list to view their details, check vitals, and prescribe medication.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Doctor;