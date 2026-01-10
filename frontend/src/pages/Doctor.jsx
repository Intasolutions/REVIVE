import React, { useState, useEffect } from 'react';
import { Stethoscope, ClipboardList, Send, User, Activity, X, Search, Plus, FileText, Trash2, ChevronRight, Clock } from 'lucide-react';
import { Card, Button, Input, Table } from '../components/UI';
import Pagination from '../components/Pagination';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

const Doctor = () => {
    const { user } = useAuth();
    const [visitsData, setVisitsData] = useState({ results: [], count: 0 });
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [notes, setNotes] = useState({ diagnosis: '', prescription: {}, notes: '' });
    const [patientHistory, setPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const { globalSearch, setGlobalSearch } = useSearch();

    // Medicine search & selection
    const [medSearch, setMedSearch] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [selectedMeds, setSelectedMeds] = useState([]);

    useEffect(() => {
        if (user) fetchQueue();
    }, [user, page, globalSearch]);

    useEffect(() => {
        if (selectedVisit) fetchPatientHistory(selectedVisit.patient_id || selectedVisit.patient);
        else setPatientHistory([]);
    }, [selectedVisit]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const doctorFilter = user?.role === 'DOCTOR' ? `&doctor=${user.u_id}` : '';
            const { data } = await api.get(`/reception/visits/?status=OPEN${doctorFilter}&page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}`);
            setVisitsData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientHistory = async (pId) => {
        if (!pId) return;
        setHistoryLoading(true);
        try {
            const { data: notesData } = await api.get('/medical/doctor-notes/');
            const { data: visitsData } = await api.get(`/reception/visits/?patient=${pId}`);
            const vIds = (visitsData.results || visitsData).map(v => v.v_id || v.id);
            const filteredNotes = (notesData.results || notesData).filter(n => vIds.includes(n.visit));
            setPatientHistory(filteredNotes);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSaveConsultation = async () => {
        if (!selectedVisit) return;
        try {
            const prescriptionObj = {};
            selectedMeds.forEach(m => {
                // Combine fields into a single string for storage, preserving compatibility
                // Format: "1-0-1 | 5 Days | Qty: 15"
                prescriptionObj[m.name] = `${m.dosage} | ${m.duration} | Qty: ${m.count}`;
            });

            await api.post('/medical/doctor-notes/', {
                visit: selectedVisit.v_id || selectedVisit.id,
                ...notes,
                prescription: prescriptionObj
            });
            await api.patch(`/reception/visits/${selectedVisit.v_id || selectedVisit.id}/`, { status: 'CLOSED' });
            setSelectedVisit(null);
            setNotes({ diagnosis: '', prescription: {}, notes: '' });
            setSelectedMeds([]);
            fetchQueue();
            alert("Consultation completed successfully!");
        } catch (err) {
            alert("Failed to save consultation notes.");
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
                count: '15'
            }]);
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

    const totalPages = Math.ceil((visitsData.count || 0) / 10);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Patient Queue</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back, Dr. <span className="text-blue-600 font-medium">{user?.username}</span></p>
                </div>
                <div className="flex gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <Activity size={14} /> Live
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                {/* Left: Queue List */}
                <div className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Waiting List</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading && visitsData.results.length === 0 ? (
                            <div className="p-10 text-center">
                                <Activity className="mx-auto text-blue-500 animate-spin mb-2" size={24} />
                                <span className="text-gray-400 text-sm">Loading queue...</span>
                            </div>
                        ) : visitsData.results && visitsData.results.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-gray-400 text-sm">No patients waiting.</p>
                                <button onClick={fetchQueue} className="mt-2 text-blue-600 text-xs hover:underline">Refresh</button>
                            </div>
                        ) : visitsData.results && visitsData.results.map(v => (
                            <div
                                key={v.v_id || v.id}
                                onClick={() => setSelectedVisit(v)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between group ${selectedVisit?.v_id === (v.v_id || v.id) ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedVisit?.v_id === (v.v_id || v.id) ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {v.patient_name ? v.patient_name[0] : 'U'}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${selectedVisit?.v_id === (v.v_id || v.id) ? 'text-blue-900' : 'text-gray-900'}`}>{v.patient_name}</p>
                                        <p className="text-xs text-gray-500">ID: {(v.v_id || v.id).slice(0, 6)}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`text-gray-300 ${selectedVisit?.v_id === (v.v_id || v.id) ? 'text-blue-400' : 'group-hover:text-gray-400'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <Pagination current={page} total={totalPages} onPageChange={setPage} loading={loading} compact={true} />
                    </div>
                </div>

                {/* Right: Consultation Area */}
                <div className="lg:col-span-8 h-full">
                    {selectedVisit ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
                            {/* Patient Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{selectedVisit.patient_name}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>In-Patient ID: {(selectedVisit.v_id || selectedVisit.id).slice(0, 8)}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-green-600 font-medium">Session Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedVisit(null)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Diagnosis */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Stethoscope size={16} className="text-blue-600" /> Clinical Diagnosis
                                    </label>
                                    <textarea
                                        className="w-full p-4 border border-gray-300 rounded-lg h-32 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                                        placeholder="Enter clinical observations and diagnosis..."
                                        value={notes.diagnosis}
                                        onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                                    />
                                </div>

                                {/* Prescription */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Plus size={16} className="text-blue-600" /> Add Prescription
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input
                                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="Search medicine database..."
                                                value={medSearch}
                                                onChange={(e) => searchMedicines(e.target.value)}
                                            />
                                            {medResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {medResults.map(med => (
                                                        <div
                                                            key={med.id}
                                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center"
                                                            onClick={() => addMedicine(med)}
                                                        >
                                                            <span>{med.name}</span>
                                                            <span className="text-xs text-gray-500">{med.qty_available} units</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                            {selectedMeds.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">No medicines added yet.</p>}
                                            {selectedMeds.map((med, idx) => (
                                                <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-medium text-gray-800">{med.name}</p>
                                                        <button onClick={() => removeMedicine(med.name)} className="text-gray-400 hover:text-red-500">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 uppercase font-bold">Dosage</label>
                                                            <input
                                                                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500"
                                                                placeholder="e.g 1-0-1"
                                                                value={med.dosage}
                                                                onChange={(e) => updateMedField(med.name, 'dosage', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 uppercase font-bold">Duration</label>
                                                            <input
                                                                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500"
                                                                placeholder="days"
                                                                value={med.duration}
                                                                onChange={(e) => updateMedField(med.name, 'duration', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-500 uppercase font-bold">Qty</label>
                                                            <input
                                                                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500"
                                                                placeholder="count"
                                                                value={med.count}
                                                                onChange={(e) => updateMedField(med.name, 'count', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <FileText size={16} className="text-blue-600" /> Internal Notes
                                        </label>
                                        <textarea
                                            className="w-full p-4 border border-gray-300 rounded-lg h-40 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                                            placeholder="Confidential notes for hospital staff..."
                                            value={notes.notes}
                                            onChange={(e) => setNotes({ ...notes, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* History */}
                                <div className="pt-6 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Clock size={14} /> Patient History
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {historyLoading ? (
                                            <p className="text-xs text-gray-400">Loading history...</p>
                                        ) : patientHistory.length > 0 ? (
                                            patientHistory.map(h => (
                                                <div key={h.note_id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-medium text-blue-600">{new Date(h.created_at).toLocaleDateString()}</span>
                                                        {h.prescription && <span className="text-gray-400">{Object.keys(h.prescription).length} meds</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-700 line-clamp-2">{h.diagnosis}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No previous history available.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setSelectedVisit(null)}>Hold Session</Button>
                                <Button onClick={handleSaveConsultation} className="px-6 gap-2">
                                    <Send size={16} /> Finalize Consultation
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 border-dashed text-center p-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                                <Stethoscope size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No Patient Selected</h3>
                            <p className="text-sm text-gray-500 max-w-sm mt-1">Select a patient from the queue on the left to start a consultation session.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Doctor;
