import React, { useState, useEffect } from 'react';
import { FlaskConical, Beaker, Plus, Search, AlertTriangle, User, Calendar, ClipboardCheck, X, CheckCircle2, Clock, Activity, Printer, FileText, ChevronRight, MapPin, Phone, Filter } from 'lucide-react';
import { Card, Button, Input, Table } from '../components/UI';
import Pagination from '../components/Pagination';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../context/SearchContext';

const TEST_TEMPLATES = {
    'LIPID PROFILE': [
        { name: 'CHOLESTEROL', unit: 'mg/dl', normal: 'Up to 200 mg/dl' },
        { name: 'TRIGLYCERIDES', unit: 'mg/dl', normal: 'UP TO 150 mg/dl' },
        { name: 'HDL CHOLESTEROL', unit: 'mg/dl', normal: '35-80 mg/dl' },
        { name: 'LDL CHOLESTEROL', unit: 'mg/dl', normal: 'Up to130 mg/dl' },
        { name: 'VLDL CHOLESTEROL', unit: 'mg/dl', normal: '10-25 mg/dl' },
        { name: 'CHOL / HDL RATIO', unit: '', normal: '0-4.5' },
        { name: 'LDL / HDL RATIO', unit: '', normal: '0-3.5' },
    ],
    'CBC': [
        { name: 'Hemoglobin', unit: 'g/dL', normal: '13.0 - 17.0' },
        { name: 'WBC Count', unit: 'cells/cu.mm', normal: '4000 - 11000' },
        { name: 'Platelet Count', unit: 'lakhs/cu.mm', normal: '1.5 - 4.5' },
    ]
};

const Laboratory = () => {
    const [chargesData, setChargesData] = useState({ results: [], count: 0 });
    const [pendingVisits, setPendingVisits] = useState([]); // Visits assigned to LAB
    const [inventoryData, setInventoryData] = useState({ results: [], count: 0 });

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue');
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const { globalSearch } = useSearch();

    // Result Entry State
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [resultData, setResultData] = useState({
        results: {},
        technician_name: 'MUHAMMED NIYAS',
        specimen: 'BLOOD'
    });

    // Print State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printCharge, setPrintCharge] = useState(null);

    // Form state for New Test
    const [visits, setVisits] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [testForm, setTestForm] = useState({
        test_name: '',
        amount: ''
    });

    useEffect(() => {
        if (activeTab === 'queue') {
            fetchCharges();
            fetchPendingVisits();
        }
        else fetchInventory();
    }, [activeTab, page, globalSearch, statusFilter]);


    const fetchCharges = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`lab/charges/?page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`);
            setChargesData(data || { results: [], count: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingVisits = async () => {
        try {
            // Fetch visits assigned to LAB that are OPEN
            const { data } = await api.get(`reception/visits/?assigned_role=LAB&status=OPEN`);
            setPendingVisits(data.results || data || []);
        } catch (err) {
            console.error("Failed to fetch pending visits", err);
        }
    };


    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`lab/inventory/?page=${page}${globalSearch ? `&search=${encodeURIComponent(globalSearch)}` : ''}`);
            setInventoryData(data || { results: [], count: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const searchVisits = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setVisits([]);
            return;
        }
        try {
            const { data } = await api.get(`reception/visits/?search=${query}`);
            setVisits(data.results || data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTest = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return alert("Select patient");

        try {
            await api.post('lab/charges/', {
                visit: selectedVisit.v_id || selectedVisit.id,
                test_name: testForm.test_name,
                amount: testForm.amount,
                status: 'PENDING'
            });
            setShowModal(false);
            setPage(1);
            fetchCharges();
            setTestForm({ test_name: '', amount: '' });
            setSelectedVisit(null);
        } catch (err) {
            alert("Failed to add lab test.");
        }
    };

    const handleOpenResultEntry = (charge) => {
        setSelectedCharge(charge);
        const template = TEST_TEMPLATES[charge.test_name?.toUpperCase()] || [{ name: 'Result', unit: '', normal: '' }];
        setResultData({
            results: template.reduce((acc, t) => ({ ...acc, [t.name]: { ...t, value: '' } }), {}),
            technician_name: charge.technician_name || 'MUHAMMED NIYAS',
            specimen: charge.specimen || 'BLOOD'
        });
        setShowResultModal(true);
    };

    const handleSubmitResults = async (e) => {
        e.preventDefault();
        try {
            const formattedResults = Object.entries(resultData.results).reduce((acc, [key, value]) => {
                acc[key] = { value: value.value, unit: value.unit, normal: value.normal };
                return acc;
            }, {});

            await api.patch(`lab/charges/${selectedCharge.lc_id}/`, {
                status: 'COMPLETED',
                results: formattedResults,
                technician_name: resultData.technician_name,
                specimen: resultData.specimen,
                report_date: new Date().toISOString()
            });
            setShowResultModal(false);
            fetchCharges();
        } catch (err) {
            alert("Failed to save results.");
        }
    };

    const handleUpdateStatus = async (chargeId, newStatus) => {
        try {
            await api.patch(`lab/charges/${chargeId}/`, { status: newStatus });
            fetchCharges();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    const totalPages = activeTab === 'queue'
        ? Math.ceil((chargesData?.count || 0) / 10)
        : Math.ceil((inventoryData?.count || 0) / 10);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Laboratory</h1>
                    <div className="flex gap-4 mt-4">
                        {['queue', 'inventory'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setPage(1); }}
                                className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                            >
                                {tab === 'queue' ? 'Test Queue' : 'Reagents & Kits'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Printer size={16} />
                        Export
                    </button>
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <Plus size={16} />
                        New Test
                    </button>
                </div>
            </div>

            {activeTab === 'queue' && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden no-print">
                    <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto bg-gray-50/50">
                        {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <Table headers={['Patient', 'Test Requested', 'Age/Sex', 'Ref/Date', 'Status', 'Amount', 'Actions']}>
                            {/* Pending Visits Section */}
                            {pendingVisits.length > 0 && statusFilter === 'ALL' && page === 1 && (
                                <>
                                    {pendingVisits.map(v => (
                                        <tr key={v.id} className="bg-blue-50/50 hover:bg-blue-50 transition-colors border-b border-blue-100">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{v.patient_name}</p>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">New Assign</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-400 italic">-- Pending Test --</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">--</span> {/* Age/Sex if avail */}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">Dr. {v.doctor_name || 'Referral'}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    WAITING
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-400">---</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => { setSelectedVisit(v); setShowModal(true); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
                                                >
                                                    <Plus size={14} />
                                                    Add Test
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="7" className="px-6 py-2 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                            Recent Charges below
                                        </td>
                                    </tr>
                                </>
                            )}
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-16">
                                    <Activity className="mx-auto text-blue-500 animate-spin mb-2" size={24} />
                                    <span className="text-gray-400 text-sm">Loading queue...</span>
                                </td></tr>
                            ) : chargesData?.results?.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-16">
                                    <p className="text-gray-400 text-sm">No tests found</p>
                                </td></tr>
                            ) : (
                                chargesData?.results?.map(c => (
                                    <tr key={c.lc_id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{c.patient_name || 'Anonymous'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{c.test_name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{c.patient_age}Y / {c.patient_sex}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500">#{(c.visit_id || '').slice(0, 6)}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                c.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">₹{c.amount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {c.status === 'PENDING' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenResultEntry(c)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md hover:bg-blue-100 transition-colors border border-blue-100"
                                                        >
                                                            <FlaskConical size={14} />
                                                            Enter Result
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(c.lc_id, 'CANCELLED')}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Cancel Test"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : c.status === 'COMPLETED' ? (
                                                    <button
                                                        onClick={() => { setPrintCharge(c); setShowPrintModal(true); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-md hover:bg-green-100 transition-colors border border-green-100"
                                                    >
                                                        <Printer size={14} />
                                                        Report
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </Table>
                    </div>
                    <Pagination current={page} total={totalPages} onPageChange={setPage} loading={loading} />
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden no-print">
                    <div className="overflow-x-auto">
                        <Table headers={['Item Name', 'Category', 'Stock Level', 'Reorder Level', 'Status']}>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-16">
                                    <Activity className="mx-auto text-blue-500 animate-spin mb-2" size={24} />
                                    <span className="text-gray-400 text-sm">Loading Inventory...</span>
                                </td></tr>
                            ) : inventoryData?.results?.map((i) => (
                                <tr key={i.item_id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{i.item_name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">ID: {i.item_id.toString().slice(0, 6)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {i.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${i.is_low_stock ? 'text-red-600' : 'text-green-600'}`}>
                                            {i.qty} Units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{i.reorder_level} units</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {i.is_low_stock && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                                                Low Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <Pagination current={page} total={totalPages} onPageChange={setPage} loading={loading} />
                    </div>
                </div>
            )}

            {/* New Test Modal - Standard Style */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900">Add New Test</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddTest} className="p-6 space-y-6">
                                <div className="space-y-4">
                                    {!selectedVisit ? (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Select Patient</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Search patient via visit..."
                                                    value={searchQuery}
                                                    onChange={e => searchVisits(e.target.value)}
                                                />
                                            </div>
                                            {visits.length > 0 && (
                                                <div className="bg-white border border-gray-200 rounded-lg mt-2 max-h-48 overflow-y-auto shadow-sm">
                                                    {visits.map(v => (
                                                        <div key={v.v_id || v.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => { setSelectedVisit(v); setVisits([]); }}>
                                                            <p className="text-sm font-medium text-gray-900">{v.patient_name}</p>
                                                            <p className="text-xs text-gray-500">Ref: {v.doctor_name || 'In-House'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-blue-900">{selectedVisit.patient_name}</p>
                                                <p className="text-xs text-blue-700">ID: {(selectedVisit.v_id || selectedVisit.id).slice(0, 8)}</p>
                                            </div>
                                            <button type="button" onClick={() => setSelectedVisit(null)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Change</button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Test Name</label>
                                        <Input
                                            placeholder="e.g. Lipid Profile, CBC..."
                                            list="tests"
                                            value={testForm.test_name}
                                            onChange={e => setTestForm({ ...testForm, test_name: e.target.value })}
                                            required
                                        />
                                        <datalist id="tests">
                                            {Object.keys(TEST_TEMPLATES).map(t => <option key={t} value={t} />)}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={testForm.amount}
                                            onChange={e => setTestForm({ ...testForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button type="submit">Create Request</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Result Entry Modal - Standard Style */}
            <AnimatePresence>
                {showResultModal && selectedCharge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Enter Results</h3>
                                    <p className="text-xs text-gray-500 mt-1">Test: {selectedCharge.test_name}</p>
                                </div>
                                <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmitResults} className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{selectedCharge.patient_name}</p>
                                            <p className="text-xs text-gray-500">ID: #{(selectedCharge.visit_id || '').slice(0, 12)}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-white rounded border border-gray-200 text-xs font-mono">
                                            {selectedCharge.test_name}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <span className="col-span-4">Parameter</span>
                                        <span className="col-span-4">Value</span>
                                        <span className="col-span-2">Unit</span>
                                        <span className="col-span-2">Normal</span>
                                    </div>
                                    {Object.entries(resultData.results).map(([name, field]) => (
                                        <div key={name} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="col-span-4 text-sm font-medium text-gray-700">{name}</span>
                                            <div className="col-span-4">
                                                <input
                                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    placeholder="Result"
                                                    value={field.value}
                                                    onChange={e => setResultData(prev => ({
                                                        ...prev,
                                                        results: {
                                                            ...prev.results,
                                                            [name]: { ...prev.results[name], value: e.target.value }
                                                        }
                                                    }))}
                                                    required
                                                />
                                            </div>
                                            <span className="col-span-2 text-xs text-gray-500">{field.unit || '-'}</span>
                                            <span className="col-span-2 text-xs text-gray-400 truncate" title={field.normal}>{field.normal}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Technician</label>
                                        <Input
                                            value={resultData.technician_name}
                                            onChange={(e) => setResultData({ ...resultData, technician_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Specimen</label>
                                        <Input
                                            value={resultData.specimen}
                                            onChange={(e) => setResultData({ ...resultData, specimen: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setShowResultModal(false)}>Cancel</Button>
                                    <Button type="submit">Submit Results</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Modal - Premium Report Style (Can be kept or simplified, keeping premium for report is usually fine) */}
            <AnimatePresence>
                {showPrintModal && printCharge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                            {/* Keeping Print Modal Style as it's separate from UI consistency */}
                            {/* Just wrapper changes for consistency if needed, but report style is usually distinct */}
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10">
                                        <FileText size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tighter">Diagnostic manuscript</h2>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="secondary" className="rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => setShowPrintModal(false)}>Retract</Button>
                                    <Button onClick={() => window.print()} className="rounded-2xl px-10 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-sky-500/30 ring-4 ring-sky-500/10 italic">Execute Print</Button>
                                </div>
                            </div>
                            <div id="printable-area" className="flex-1 overflow-y-auto p-12 bg-white text-slate-900 font-serif leading-normal uppercase">
                                {/* Centered Clinical Header */}
                                <div className="text-center space-y-1 mb-8">
                                    <h1 className="text-3xl font-black font-outfit tracking-[0.2em] border-b-2 border-slate-900 pb-1 inline-block">REVIVE CLINIC</h1>
                                    <p className="text-sm font-black tracking-[0.4em]">& RESEARCH CENTRE</p>
                                    <p className="text-[10px] font-bold">PALLIKKUNNU ROAD, ANJUKUNNU</p>
                                    <p className="text-[10px] font-bold">PH. 8547299047, 9496851538</p>
                                </div>

                                {/* Balanced Patient Grid */}
                                <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-[12px] font-bold border-t border-b border-slate-300 py-4">
                                    <div className="flex">
                                        <span className="w-28">Patient</span>
                                        <span className="flex-1 text-left">: {printCharge.patient_name}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Age</span>
                                        <span className="flex-1 text-left">: {printCharge.patient_age} YEARS</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Referred By Dr</span>
                                        <span className="flex-1 text-left">: {chargesData?.results?.find(x => x.lc_id === printCharge.lc_id)?.doctor_name || 'SELF / IN-HOUSE'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Sex</span>
                                        <span className="flex-1 text-left">: {printCharge.patient_sex}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Report No</span>
                                        <span className="flex-1 text-left">: {printCharge.lc_id?.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Collected On</span>
                                        <span className="flex-1 text-left">: {new Date(printCharge.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Specimen</span>
                                        <span className="flex-1 text-left">: {printCharge.specimen || 'BLOOD'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-28">Report Date</span>
                                        <span className="flex-1 text-left">: {new Date(printCharge.report_date || printCharge.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <h2 className="text-center font-black text-sm tracking-[0.5em] mb-4">LAB REPORT</h2>

                                {/* Results Table */}
                                <div className="border-t-2 border-slate-900 border-b-2 mb-12">
                                    <div className="grid grid-cols-12 gap-4 text-[11px] font-black py-2 border-b border-slate-200 uppercase tracking-tighter">
                                        <span className="col-span-5">TestName</span>
                                        <span className="col-span-3 text-center">Result</span>
                                        <span className="col-span-4 text-center">Normal</span>
                                    </div>

                                    <div className="mt-4 space-y-6 min-h-[300px]">
                                        <div>
                                            {/* Sub-header mimics category */}
                                            <p className="font-black text-[12px] underline mb-1">BIOCHEMISTRY</p>
                                            <p className="font-black text-[11px] underline mb-4 ml-2">{printCharge.test_name}</p>

                                            <div className="space-y-4">
                                                {printCharge.results && Object.entries(printCharge.results).map(([name, data]) => (
                                                    <div key={name} className="grid grid-cols-12 gap-4 text-[12px] items-start">
                                                        <span className="col-span-5 font-bold tracking-tight">{name}</span>
                                                        <div className="col-span-3 text-center font-bold">
                                                            <span>{data.value} {data.unit}</span>
                                                        </div>
                                                        <span className="col-span-4 text-center font-bold opacity-70 text-[10px]">{data.normal}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Simplified Technician Auth */}
                                <div className="mt-12 flex justify-end">
                                    <div className="text-center">
                                        <div className="w-48 h-px bg-slate-900 mx-auto mb-1"></div>
                                        <p className="font-black text-[11px]">LAB TECHNICIAN</p>
                                        <p className="text-[9px] font-bold opacity-50 tracking-widest">{printCharge.technician_name}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div>
    );
};

export default Laboratory;
