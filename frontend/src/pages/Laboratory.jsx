import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical, Beaker, Plus, Search, AlertTriangle,
    User, Calendar, ClipboardCheck, X, CheckCircle2,
    Clock, Activity, Printer, FileText, ChevronRight,
    MapPin, Phone, Filter, TestTube2, Microscope
} from 'lucide-react';
import { Card, Button, Input, Table } from '../components/UI';
import Pagination from '../components/Pagination';
import api from '../api/axios';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';

// --- Configuration ---
const TEST_TEMPLATES = {
    'LIPID PROFILE': [
        { name: 'CHOLESTEROL', unit: 'mg/dl', normal: 'Up to 200 mg/dl' },
        { name: 'TRIGLYCERIDES', unit: 'mg/dl', normal: 'UP TO 150 mg/dl' },
        { name: 'HDL CHOLESTEROL', unit: 'mg/dl', normal: '35-80 mg/dl' },
        { name: 'LDL CHOLESTEROL', unit: 'mg/dl', normal: 'Up to130 mg/dl' },
        { name: 'VLDL CHOLESTEROL', unit: 'mg/dl', normal: '10-25 mg/dl' },
    ],
    'CBC': [
        { name: 'Hemoglobin', unit: 'g/dL', normal: '13.0 - 17.0' },
        { name: 'WBC Count', unit: 'cells/cu.mm', normal: '4000 - 11000' },
        { name: 'Platelet Count', unit: 'lakhs/cu.mm', normal: '1.5 - 4.5' },
    ]
};

const Laboratory = () => {
    const { globalSearch } = useSearch();
    const { showToast } = useToast();
    const { confirm } = useDialog();

    // --- State ---
    const [chargesData, setChargesData] = useState({ results: [], count: 0 });
    const [pendingVisits, setPendingVisits] = useState([]);
    const [inventoryData, setInventoryData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('queue'); // queue | inventory
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [labTests, setLabTests] = useState([]);

    // Test Catalog Form
    const [showTestModal, setShowTestModal] = useState(false);
    const [testCatalogForm, setTestCatalogForm] = useState({ name: '', category: 'HAEMATOLOGY', price: '', normal_range: '' });

    // Modals
    const [showModal, setShowModal] = useState(false); // Add Test Modal
    const [showInventoryModal, setShowInventoryModal] = useState(false); // Add Inventory Modal
    const [showResultModal, setShowResultModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [stockModal, setStockModal] = useState({ show: false, type: 'IN', item: null });

    // Selected Items
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [printCharge, setPrintCharge] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);

    // Forms
    const [resultData, setResultData] = useState({ results: {}, technician_name: 'MUHAMMED NIYAS', specimen: 'BLOOD' });
    const [testForm, setTestForm] = useState({ test_name: '', amount: '' });
    const [stockForm, setStockForm] = useState({ qty: '', cost: '', notes: '' });
    const [inventoryForm, setInventoryForm] = useState({ item_name: '', category: 'REAGENT', qty: 0, cost_per_unit: '', reorder_level: 10 });
    const [visitSearch, setVisitSearch] = useState([]);
    const [visitQuery, setVisitQuery] = useState('');

    // --- Effects ---
    useEffect(() => {
        if (activeTab === 'queue') {
            fetchCharges();
            fetchPendingVisits();
            fetchCharges();
            fetchPendingVisits();
        } else if (activeTab === 'test_catalog') {
            fetchLabTests();
        } else {
            fetchInventory();
        }
    }, [activeTab, page, globalSearch, statusFilter]);

    useEffect(() => {
        if (selectedVisit && selectedVisit.lab_referral_details) {
            setTestForm(prev => ({ ...prev, test_name: selectedVisit.lab_referral_details }));
        } else {
            setTestForm(prev => ({ ...prev, test_name: '' }));
        }
    }, [selectedVisit]);

    // --- API Calls ---
    const fetchCharges = async () => {
        setLoading(true);
        try {
            const statusQuery = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
            const { data } = await api.get(`lab/charges/?page=${page}&search=${globalSearch || ''}${statusQuery}`);
            setChargesData(data || { results: [], count: 0 });
        } catch (err) { showToast('error', 'Failed to fetch lab queue'); }
        finally { setLoading(false); }
    };

    const fetchPendingVisits = async () => {
        try {
            const { data } = await api.get(`reception/visits/?assigned_role=LAB&status=OPEN`);
            setPendingVisits(data.results || data || []);
        } catch (err) { console.error(err); }
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`lab/inventory/?page=${page}&search=${globalSearch || ''}`);
            setInventoryData(data || { results: [], count: 0 });
        } catch (err) { showToast('error', 'Failed to fetch inventory'); }
        finally { setLoading(false); }
    };

    const searchVisits = async (q) => {
        setVisitQuery(q);
        if (q.length < 2) { setVisitSearch([]); return; }
        try {
            const { data } = await api.get(`reception/visits/?search=${q}`);
            setVisitSearch(data.results || data || []);
        } catch (err) { console.error(err); }
    };

    const fetchLabTests = async () => {
        try {
            const { data } = await api.get('lab/tests/');
            setLabTests(data.results || data || []);
        } catch (err) { console.error("Failed to load tests", err); }
    };

    const handleSaveTest = async (e) => {
        e.preventDefault();
        try {
            await api.post('lab/tests/', testCatalogForm);
            showToast('success', 'Test Added Successfully');
            setShowTestModal(false);
            setTestCatalogForm({ name: '', category: 'HAEMATOLOGY', price: '', normal_range: '' });
            fetchLabTests();
        } catch (err) { showToast('error', 'Failed to add test'); }
    };

    // Group tests by category
    const groupedTests = labTests.reduce((acc, test) => {
        const cat = test.category_display || test.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(test);
        return acc;
    }, {});

    // --- Actions ---
    const handleAddTest = async (e) => {
        e.preventDefault();
        if (!selectedVisit) return showToast('error', "Select a patient first");
        try {
            await api.post('lab/charges/', {
                visit: selectedVisit.v_id || selectedVisit.id,
                test_name: testForm.test_name,
                amount: testForm.amount,
                status: 'PENDING'
            });
            await api.patch(`reception/visits/${selectedVisit.v_id || selectedVisit.id}/`, { status: 'IN_PROGRESS' });

            setShowModal(false);
            fetchCharges();
            fetchPendingVisits();
            setTestForm({ test_name: '', amount: '' });
            setSelectedVisit(null);
            showToast('success', 'Test request created');
        } catch (err) { showToast('error', "Failed to create test request"); }
    };

    const handleOpenResultEntry = (charge) => {
        setSelectedCharge(charge);
        // Default to array format
        const template = TEST_TEMPLATES[charge.test_name?.toUpperCase()] || [{ name: 'Result', unit: '', normal: '' }];

        // If existing results are object (legacy), convert to array; otherwise use as is or use template
        let initialResults = [];
        if (charge.results) {
            if (Array.isArray(charge.results)) {
                initialResults = charge.results;
            } else {
                // Legacy object support conversion
                initialResults = Object.entries(charge.results).map(([key, val]) => ({
                    name: key,
                    ...val
                }));
            }
        } else {
            // New entry from template
            initialResults = template.map(t => ({ ...t, value: '' }));
        }

        setResultData({
            results: initialResults,
            technician_name: charge.technician_name || 'MUHAMMED NIYAS',
            specimen: charge.specimen || 'BLOOD'
        });
        setShowResultModal(true);
    };

    const handleSubmitResults = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`lab/charges/${selectedCharge.lc_id}/`, {
                status: 'COMPLETED',
                results: resultData.results,
                technician_name: resultData.technician_name,
                specimen: resultData.specimen,
                report_date: new Date().toISOString()
            });
            setShowResultModal(false);
            fetchCharges();
            showToast('success', 'Results published successfully');
        } catch (err) { showToast('error', "Failed to save results"); }
    };

    const handleStockTransaction = async (e) => {
        e.preventDefault();
        try {
            const endpoint = stockModal.type === 'IN' ? 'stock-in' : 'stock-out';
            await api.post(`lab/inventory/${stockModal.item.item_id}/${endpoint}/`, {
                qty: parseInt(stockForm.qty),
                cost: stockModal.type === 'IN' ? parseFloat(stockForm.cost) : 0,
                notes: stockForm.notes
            });

            setStockModal({ show: false, type: 'IN', item: null });
            setStockForm({ qty: '', cost: '', notes: '' });
            fetchInventory();
            showToast('success', `Stock ${stockModal.type === 'IN' ? 'Updated' : 'Deducted'} Successfully`);
        } catch (err) {
            showToast('error', err.response?.data?.error || "Transaction Failed");
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const isConfirmed = await confirm({
            title: `Mark as ${status}?`,
            message: `Are you sure you want to mark this test as ${status}?`,
            type: status === 'CANCELLED' ? 'danger' : 'info',
            confirmText: 'Yes, Proceed',
            cancelText: 'No, Cancel'
        });

        if (!isConfirmed) return;

        try {
            await api.patch(`lab/charges/${id}/`, { status });
            fetchCharges();
            showToast('success', `Test marked as ${status}`);
        } catch (err) { showToast('error', "Failed to update status"); }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        try {
            if (inventoryForm.id) {
                // Edit Mode
                await api.patch(`lab/inventory/${inventoryForm.id}/`, inventoryForm);
                showToast('success', 'Item Updated Successfully');
            } else {
                // Create Mode
                await api.post('lab/inventory/', inventoryForm);
                showToast('success', 'New Item Added Successfully');
            }
            setShowInventoryModal(false);
            setInventoryForm({ item_name: '', category: 'REAGENT', qty: 0, cost_per_unit: '', reorder_level: 10 });
            fetchInventory();
        } catch (err) { showToast('error', "Failed to save item"); }
    };

    const handleEditItem = (item) => {
        setInventoryForm({
            id: item.item_id,
            item_name: item.item_name,
            category: item.category,
            qty: item.qty,
            cost_per_unit: item.cost_per_unit || '',
            reorder_level: item.reorder_level
        });
        setShowInventoryModal(true);
    };

    return (
        <div className="p-6 h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col overflow-hidden">

            {/* --- Header & Navigation --- */}
            <div className="flex justify-between items-center mb-6 shrink-0 no-print">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">Laboratory</h1>
                    <div className="flex items-center gap-6 mt-2">
                        {['queue', 'inventory', 'test_catalog'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-1 text-sm font-bold transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                {tab === 'queue' ? 'Diagnostic Queue' : tab === 'inventory' ? 'Lab Inventory' : 'Test Catalog'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'queue' ? (
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                            <Plus size={18} /> New Request
                        </button>
                    ) : activeTab === 'inventory' ? (
                        <button onClick={() => setShowInventoryModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
                            <Plus size={18} /> Add Item
                        </button>
                    ) : (
                        <button onClick={() => setShowTestModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
                            <Plus size={18} /> Add Test
                        </button>
                    )}
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="flex-1 min-h-0 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden relative flex flex-col">

                {/* 1. QUEUE TAB */}
                {activeTab === 'queue' && (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-2 overflow-x-auto shrink-0">
                            {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {['Patient Details', 'Test Requested', 'Age/Sex', 'Reference', 'Status', 'Cost', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur-sm">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {/* Pending Visits (Assigned to Lab) */}
                                    {pendingVisits.length > 0 && statusFilter === 'ALL' && page === 1 && (
                                        pendingVisits.map(v => (
                                            <tr key={v.id} className="bg-blue-50/30 hover:bg-blue-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{v.patient_name}</p>
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-1.5 py-0.5 rounded">New Assign</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {v.lab_referral_details ? (
                                                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                            <p className="text-xs font-bold text-slate-800 line-clamp-2" title={v.lab_referral_details}>{v.lab_referral_details}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="italic text-slate-400 text-sm">-- No Details --</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{v.patient_age}Y / {v.patient_gender}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">Dr. {v.doctor_name || 'Ref'}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(v.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">Waiting</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">--</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => { setSelectedVisit(v); setShowModal(true); }} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                                                        <Plus size={14} /> Add Test
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                    {/* Actual Lab Charges */}
                                    {chargesData.results.map(c => (
                                        <tr key={c.lc_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{c.patient_name || 'Anonymous'}</p>
                                                <p className="text-[10px] font-mono text-slate-400">ID: {(c.visit_id || '').slice(0, 6)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Microscope size={16} className="text-slate-400" />
                                                    <span className="font-bold text-slate-700 text-sm">{c.test_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{c.patient_age}Y / {c.patient_sex}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500 font-medium">#{c.lc_id.toString().slice(0, 6)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    c.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {c.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                                                    {c.status === 'PENDING' && <Clock size={12} />}
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">₹{c.amount}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {c.status === 'PENDING' ? (
                                                        <>
                                                            <button onClick={() => handleOpenResultEntry(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all" title="Enter Result">
                                                                <FlaskConical size={16} />
                                                            </button>
                                                            <button onClick={() => handleUpdateStatus(c.lc_id, 'CANCELLED')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : c.status === 'COMPLETED' ? (
                                                        <button onClick={() => { setPrintCharge(c); setShowPrintModal(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 shadow-md transition-all">
                                                            <Printer size={14} /> Report
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <Pagination current={page} total={Math.ceil(chargesData.count / 10)} onPageChange={setPage} loading={loading} compact />
                        </div>
                    </>
                )}

                {/* 2. INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 shadow-sm">
                                    <tr>
                                        {['Item Name', 'Category', 'Stock Level', 'Reorder Level', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {inventoryData.results.map(item => (
                                        <tr key={item.item_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.item_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase">{item.category}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700">{item.qty} Units</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">₹{item.cost_per_unit || '0.00'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.reorder_level} Units</td>
                                            <td className="px-6 py-4">
                                                {item.is_low_stock ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wide">
                                                        <AlertTriangle size={10} /> Low Stock
                                                    </span>
                                                ) : <span className="text-emerald-600 text-xs font-bold">In Stock</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setStockModal({ show: true, type: 'IN', item: item })}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 transition-colors"
                                                    >
                                                        + Stock In
                                                    </button>
                                                    <button
                                                        onClick={() => setStockModal({ show: true, type: 'OUT', item: item })}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs hover:bg-amber-100 transition-colors"
                                                    >
                                                        - Stock Out
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <Pagination current={page} total={Math.ceil(inventoryData.count / 10)} onPageChange={setPage} loading={loading} compact />
                        </div>
                    </div>
                )}
                {/* 3. TEST CATALOG TAB */}
                {activeTab === 'test_catalog' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 shadow-sm">
                                    <tr>
                                        {['Test Name', 'Category', 'Price', 'Normal Range'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {labTests.map(test => (
                                        <tr key={test.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{test.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase">{test.category_display || test.category}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700">₹{test.price}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 whitespace-pre-wrap">{test.normal_range || '--'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            {/* New Test Catalog Modal */}
            <AnimatePresence>
                {showTestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-black text-emerald-900 uppercase tracking-tight">Add New Test</h3>
                                <button onClick={() => setShowTestModal(false)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleSaveTest} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Test Name</label>
                                        <Input value={testCatalogForm.name} onChange={e => setTestCatalogForm({ ...testCatalogForm, name: e.target.value })} required className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <div className="relative">
                                            <select
                                                value={testCatalogForm.category}
                                                onChange={e => setTestCatalogForm({ ...testCatalogForm, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all appearance-none"
                                            >
                                                {['HAEMATOLOGY', 'BIOCHEMISTRY', 'URINE', 'STOOL', 'OTHERS'].map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                        <Input type="number" value={testCatalogForm.price} onChange={e => setTestCatalogForm({ ...testCatalogForm, price: e.target.value })} required className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Normal Range (Optional)</label>
                                        <textarea
                                            value={testCatalogForm.normal_range}
                                            onChange={e => setTestCatalogForm({ ...testCatalogForm, normal_range: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                            placeholder="e.g. 13.0 - 17.0 g/dL"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20">Add Test to Catalog</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* New Lab Request Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">New Lab Request</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleAddTest} className="p-8 space-y-6">
                                {/* Patient Search Block */}
                                {!selectedVisit ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Patient</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-blue-500 outline-none transition-all"
                                                placeholder="Search patient..."
                                                value={visitQuery}
                                                onChange={e => searchVisits(e.target.value)}
                                            />
                                            {visitSearch.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                                                    {visitSearch.map(v => (
                                                        <div key={v.id} onClick={() => { setSelectedVisit(v); setVisitSearch([]); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                                                            <p className="text-sm font-bold text-slate-800">{v.patient_name}</p>
                                                            <p className="text-xs text-slate-500">Dr. {v.doctor_name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-blue-900 text-sm">{selectedVisit.patient_name}</p>
                                            <p className="text-xs text-blue-600 font-mono">ID: {selectedVisit.id.slice(0, 8)}</p>
                                        </div>
                                        <button type="button" onClick={() => setSelectedVisit(null)} className="text-xs font-bold text-blue-500 hover:underline">Change</button>
                                    </div>
                                )}

                                {selectedVisit && selectedVisit.lab_referral_details && (
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 mb-6">
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Recommended Tests</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedVisit.lab_referral_details.split(', ').map(testName => {
                                                const cleanName = testName.trim();
                                                const catalogTest = labTests.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
                                                return (
                                                    <button
                                                        key={cleanName}
                                                        type="button"
                                                        onClick={() => {
                                                            setTestForm({
                                                                test_name: cleanName,
                                                                amount: catalogTest ? catalogTest.price : ''
                                                            });
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-1.5 border shadow-sm rounded-lg transition-all group ${testForm.test_name.toLowerCase() === cleanName.toLowerCase()
                                                                ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200'
                                                                : 'bg-white border-purple-200 text-slate-700 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${catalogTest ? 'bg-emerald-400' : 'bg-amber-400'} ${testForm.test_name.toLowerCase() === cleanName.toLowerCase() ? 'bg-white' : ''}`} />
                                                        <span className="text-xs font-bold">{cleanName}</span>
                                                        {testForm.test_name.toLowerCase() === cleanName.toLowerCase() && <CheckCircle2 size={12} />}
                                                    </button>
                                                );
                                            })}

                                            {/* Add Additional Test Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTestForm({ test_name: '', amount: '' });
                                                    // This effectively deselects recommendation and allows manual search
                                                }}
                                                className={`flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all ${!testForm.test_name ? 'bg-blue-50 border-blue-400 text-blue-600' : ''}`}
                                            >
                                                <Plus size={12} />
                                                Add Other Test
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {(!selectedVisit?.lab_referral_details || !testForm.test_name || !selectedVisit.lab_referral_details.toLowerCase().includes(testForm.test_name.toLowerCase())) && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Search & Select Test</label>
                                            <div className="relative">
                                                <select
                                                    value={testForm.test_name}
                                                    onChange={e => {
                                                        const selected = labTests.find(t => t.name === e.target.value);
                                                        setTestForm({
                                                            ...testForm,
                                                            test_name: e.target.value,
                                                            amount: selected ? selected.price : ''
                                                        });
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none transition-all appearance-none"
                                                    required
                                                >
                                                    <option value="">Select Test...</option>
                                                    {Object.entries(groupedTests).map(([category, tests]) => (
                                                        <optgroup key={category} label={category}>
                                                            {tests.map(t => (
                                                                <option key={t.id} value={t.name}>{t.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <ChevronRight className="rotate-90" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cost Display: Show Standard Price if matched, otherwise show Input */}
                                    {testForm.test_name && (
                                        <div className="space-y-2">
                                            {(() => {
                                                const catalog = labTests.find(t => t.name.toLowerCase() === testForm.test_name.toLowerCase());
                                                const isStandardPrice = catalog && parseFloat(catalog.price) === parseFloat(testForm.amount || 0);

                                                if (isStandardPrice) {
                                                    return (
                                                        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Cost</p>
                                                                <p className="font-bold text-slate-700 text-sm">{testForm.test_name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wide">Standard</span>
                                                                <span className="font-mono font-black text-slate-900 text-lg">₹{testForm.amount}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Custom Cost (₹)</label>
                                                        <Input type="number" placeholder="0.00" value={testForm.amount} onChange={e => setTestForm({ ...testForm, amount: e.target.value })} required className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="submit" disabled={!testForm.test_name} className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {testForm.test_name ? `Create Request for ${testForm.test_name}` : 'Select a Test'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Result Entry Modal - Premium */}
            <AnimatePresence>
                {showResultModal && selectedCharge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Enter Results</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1">{selectedCharge.test_name} • {selectedCharge.patient_name}</p>
                                </div>
                                <button onClick={() => setShowResultModal(false)} className="p-2 rounded-full hover:bg-white shadow-sm"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmitResults} className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-12 gap-4 text-xs font-black text-slate-400 uppercase tracking-widest px-2 border-b border-slate-100 pb-2">
                                    <span className="col-span-4">Parameter</span>
                                    <span className="col-span-4">Observed Value</span>
                                    <span className="col-span-2">Unit</span>
                                    <span className="col-span-2 text-right">Reference</span>
                                </div>

                                <div className="space-y-3">
                                    {resultData.results.map((field, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                                            <div className="col-span-4">
                                                <input
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 font-bold text-slate-700 text-sm outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="Parameter Name"
                                                    value={field.name}
                                                    onChange={e => {
                                                        const newResults = [...resultData.results];
                                                        newResults[index].name = e.target.value;
                                                        setResultData({ ...resultData, results: newResults });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <input
                                                    className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                                    placeholder="Value"
                                                    value={field.value}
                                                    onChange={e => {
                                                        const newResults = [...resultData.results];
                                                        newResults[index].value = e.target.value;
                                                        setResultData({ ...resultData, results: newResults });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-bold text-slate-500 outline-none transition-all"
                                                    placeholder="Unit"
                                                    value={field.unit}
                                                    onChange={e => {
                                                        const newResults = [...resultData.results];
                                                        newResults[index].unit = e.target.value;
                                                        setResultData({ ...resultData, results: newResults });
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2 relative">
                                                <input
                                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-bold text-slate-400 text-right outline-none transition-all"
                                                    placeholder="Ref Range"
                                                    value={field.normal}
                                                    onChange={e => {
                                                        const newResults = [...resultData.results];
                                                        newResults[index].normal = e.target.value;
                                                        setResultData({ ...resultData, results: newResults });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newResults = resultData.results.filter((_, i) => i !== index);
                                                        setResultData({ ...resultData, results: newResults });
                                                    }}
                                                    className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setResultData({
                                            ...resultData,
                                            results: [...resultData.results, { name: '', value: '', unit: '', normal: '' }]
                                        })}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Parameter
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Technician</label>
                                        <Input value={resultData.technician_name} onChange={(e) => setResultData({ ...resultData, technician_name: e.target.value })} className="bg-white border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Specimen Type</label>
                                        <Input value={resultData.specimen} onChange={(e) => setResultData({ ...resultData, specimen: e.target.value })} className="bg-white border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <Button variant="secondary" className="rounded-xl px-6 font-bold" onClick={() => setShowResultModal(false)}>Cancel</Button>
                                <Button onClick={handleSubmitResults} className="rounded-xl px-8 font-bold bg-blue-600 shadow-lg shadow-blue-500/30">Publish Results</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Modal */}
            <AnimatePresence>
                {showPrintModal && printCharge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:max-w-none print:rounded-none">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lab Report</h3>
                                <button onClick={() => setShowPrintModal(false)} className="p-2 rounded-full hover:bg-white shadow-sm"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 print:overflow-visible print:p-8" id="printable-report">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                            <TestTube2 size={32} />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">REVIVE HOSPITALS</h1>
                                            <p className="text-sm font-bold text-slate-500 tracking-widest uppercase mt-1">Laboratory Services</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report ID</p>
                                        <p className="text-xl font-black text-slate-900">#{printCharge.lc_id.toString().slice(0, 8)}</p>
                                        <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 print:bg-transparent print:border-slate-200">
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
                                            <p className="text-lg font-bold text-slate-900">{printCharge.patient_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Age / Sex</p>
                                            <p className="text-lg font-bold text-slate-900">{printCharge.patient_age} Years / {printCharge.patient_sex}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referred By</p>
                                            <p className="text-lg font-bold text-slate-900">Dr. {printCharge.doctor_name || 'Consultant'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Specimen</p>
                                            <p className="text-lg font-bold text-slate-900">{printCharge.specimen || 'Blood'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Table */}
                                <div className="mb-12">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                                        {printCharge.test_name} Analysis
                                    </h3>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Category</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Stock Level</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Cost/Unit</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/6">Reorder Level</th>
                                                <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Reference Range</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(Array.isArray(printCharge.results)
                                                ? printCharge.results
                                                : Object.entries(printCharge.results || {}).map(([key, val]) => ({ name: key, ...val }))
                                            ).map((val, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-4 font-bold text-slate-700 text-sm">{val.name}</td>
                                                    <td className="py-4 font-black text-slate-900 text-sm">{val.value}</td>
                                                    <td className="py-4 font-bold text-slate-500 text-xs">{val.unit}</td>
                                                    <td className="py-4 font-bold text-slate-500 text-xs text-right whitespace-pre-wrap">{val.normal}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-end mt-20 pt-8 border-t border-slate-200 print:mt-auto">
                                    <div className="text-xs font-medium text-slate-400">
                                        <p>Generated by REVIVE Hospital Management System</p>
                                        <p>{new Date().toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        {/* Signature Placeholder */}
                                        <div className="h-12 w-32 mb-2 mx-auto"></div>
                                        <p className="text-sm font-bold text-slate-900">{printCharge.technician_name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lab Technician</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 print:hidden">
                                <Button variant="secondary" className="rounded-xl px-6 font-bold" onClick={() => setShowPrintModal(false)}>Close</Button>
                                <Button onClick={() => window.print()} className="rounded-xl px-8 font-bold bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                                    <Printer size={18} className="mr-2" /> Print Report
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stock Manager Modal */}
            <AnimatePresence>
                {stockModal.show && stockModal.item && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className={`p-6 border-b flex justify-between items-center ${stockModal.type === 'IN' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <h3 className={`text-lg font-black uppercase tracking-tight ${stockModal.type === 'IN' ? 'text-emerald-900' : 'text-amber-900'}`}>
                                        {stockModal.type === 'IN' ? 'Stock In' : 'Stock Out'}
                                    </h3>
                                    <p className="text-sm font-bold opacity-60">{stockModal.item.item_name}</p>
                                </div>
                                <button onClick={() => setStockModal({ ...stockModal, show: false })} className="p-2 rounded-full hover:bg-white/50 transition-colors"><X size={20} className="opacity-60" /></button>
                            </div>
                            <form onSubmit={handleStockTransaction} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                    <Input
                                        type="number"
                                        autoFocus
                                        placeholder="0"
                                        value={stockForm.qty}
                                        onChange={e => setStockForm({ ...stockForm, qty: e.target.value })}
                                        required
                                        className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg"
                                    />
                                </div>

                                {stockModal.type === 'IN' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Total Cost (₹)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={stockForm.cost}
                                            onChange={e => setStockForm({ ...stockForm, cost: e.target.value })}
                                            className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Notes / Reason</label>
                                    <Input
                                        placeholder="Optional..."
                                        value={stockForm.notes}
                                        onChange={e => setStockForm({ ...stockForm, notes: e.target.value })}
                                        className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className={`w-full h-12 rounded-xl text-white font-bold shadow-lg ${stockModal.type === 'IN' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-amber-600 shadow-amber-600/20'}`}
                                    >
                                        Update Stock
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Inventory Creation Modal */}
            <AnimatePresence>
                {showInventoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{inventoryForm.id ? 'Edit Item' : 'Add New Item'}</h3>
                                <button onClick={() => setShowInventoryModal(false)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleSaveItem} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                                        <Input
                                            value={inventoryForm.item_name}
                                            onChange={e => setInventoryForm({ ...inventoryForm, item_name: e.target.value })}
                                            placeholder="e.g., Glucose Kit, Syringe..."
                                            className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <div className="relative">
                                            <Input
                                                value={inventoryForm.category}
                                                onChange={e => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                                                placeholder="e.g. Reagent, Kit, Consumable..."
                                                className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 focus:border-blue-500 outline-none transition-all"
                                                list="category-suggestions"
                                                required
                                            />
                                            <datalist id="category-suggestions">
                                                <option value="REAGENT" />
                                                <option value="KIT" />
                                                <option value="CONSUMABLE" />
                                                <option value="EQUIPMENT" />
                                            </datalist>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Initial Qty</label>
                                            <Input type="number" placeholder="0" value={inventoryForm.qty} onChange={e => setInventoryForm({ ...inventoryForm, qty: e.target.value })} required className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cost / Unit (₹)</label>
                                            <Input type="number" placeholder="0.00" value={inventoryForm.cost_per_unit} onChange={e => setInventoryForm({ ...inventoryForm, cost_per_unit: e.target.value })} className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Reorder Level</label>
                                        <Input type="number" placeholder="10" value={inventoryForm.reorder_level} onChange={e => setInventoryForm({ ...inventoryForm, reorder_level: e.target.value })} required className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="submit" className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20">{inventoryForm.id ? 'Save Changes' : 'Add Item'}</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Laboratory;