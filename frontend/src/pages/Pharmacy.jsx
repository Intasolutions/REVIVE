import React, { useState, useEffect } from 'react';
import { Pill, Box, FileUp, Plus, Search, ShoppingCart, AlertTriangle, Activity, User, Trash2, Printer, X, CheckCircle2, Clock, MapPin, Phone, Eye, FileText, Calendar, ChevronDown } from 'lucide-react';
import { Card, Button, Input, Table } from '../components/UI';
import Pagination from '../components/Pagination';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../context/SearchContext';

const Pharmacy = () => {
    // Inventory State
    const [stockData, setStockData] = useState({ results: [], count: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory');
    const [page, setPage] = useState(1);
    const { globalSearch, setGlobalSearch } = useSearch();
    const [selectedStockItem, setSelectedStockItem] = useState(null); // For View Details Modal

    // POS State
    const [cart, setCart] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [doctorSearch, setDoctorSearch] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [medSearch, setMedSearch] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [lastSale, setLastSale] = useState(null);
    const [activePrescription, setActivePrescription] = useState(null);

    // Bulk Upload & Purchases State
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [filterSupplier, setFilterSupplier] = useState('');
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [recentImports, setRecentImports] = useState([]); // List of Purchase Invoices
    const [selectedImport, setSelectedImport] = useState(null); // For viewing import details

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get('pharmacy/suppliers/');
            setSuppliers(data.results || data);
        } catch (err) { console.error(err); }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('supplier_name', selectedSupplier);

        setUploadLoading(true);
        setUploadResult(null);

        try {
            const { data } = await api.post('pharmacy/bulk-upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult({ success: true, message: 'Upload Successful', details: `${data.items_processed} items processed.`, invoice: data.invoice_no });
            if (activeTab === 'inventory') fetchStock();
            if (activeTab === 'purchases') fetchRecentImports();
        } catch (err) {
            setUploadResult({ success: false, message: 'Upload Failed', details: err.response?.data?.error || "Error uploading file." });
        } finally {
            setUploadLoading(false);
            e.target.value = null;
        }
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            await api.post('pharmacy/suppliers/', { supplier_name: newSupplierName });
            fetchSuppliers();
            setShowAddSupplierModal(false);
            setNewSupplierName('');
            alert('Supplier added successfully');
        } catch (err) {
            alert('Failed to add supplier');
        }
    };

    useEffect(() => {
        if (activeTab === 'inventory') fetchStock();
        if (activeTab === 'purchases') fetchRecentImports();
    }, [activeTab, page, globalSearch]);

    useEffect(() => {
        if (selectedPatient) fetchPrescription(selectedPatient.p_id || selectedPatient.id);
        else setActivePrescription(null);
    }, [selectedPatient]);

    const fetchStock = async () => {
        setLoading(true);
        try {
            let url = `pharmacy/stock/?page=${page}`;
            if (globalSearch) url += `&search=${encodeURIComponent(globalSearch)}`;
            if (filterSupplier) url += `&supplier=${filterSupplier}`;

            const { data } = await api.get(url);
            setStockData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentImports = async () => {
        try {
            // Assuming this endpoint returns list of PurchaseInvoices
            const { data } = await api.get('pharmacy/purchases/');
            setRecentImports(data.results || data);
        } catch (err) {
            console.error("Failed to fetch imports", err);
        }
    };

    const searchPatients = async (q) => {
        setPatientSearch(q);
        if (q.length < 2) return setPatients([]);
        try {
            const { data } = await api.get(`reception/patients/?search=${q}`);
            setPatients(data.results || data);
        } catch (err) { console.error(err); }
    };

    const searchDoctors = async (q) => {
        setDoctorSearch(q);
        if (q.length < 2) return setDoctors([]);
        try {
            const { data } = await api.get(`users/management/doctors/?search=${q}`);
            setDoctors(data);
        } catch (err) { console.error(err); }
    };

    const searchMeds = async (q) => {
        setMedSearch(q);
        if (q.length < 2) return setMedResults([]);
        try {
            const { data } = await api.get(`pharmacy/stock/?search=${q}`);
            setMedResults(data.results || data);
        } catch (err) { console.error(err); }
    };

    const fetchPrescription = async (pId) => {
        try {
            const { data } = await api.get(`medical/doctor-notes/`);
            const vRes = await api.get(`reception/visits/?patient=${pId}`);
            const vIds = (vRes.data.results || vRes.data).map(v => v.v_id || v.id);
            const latestNote = (data.results || data).find(n => vIds.includes(n.visit));
            setActivePrescription(latestNote);
        } catch (err) { console.error("Prescription fetch error:", err); }
    };

    const loadPrescriptionToCart = async () => {
        if (!activePrescription || !activePrescription.prescription) return;

        const medsToLoad = [];
        for (const [name, dosageString] of Object.entries(activePrescription.prescription)) {
            try {
                let qty = 1;
                const qtyMatch = typeof dosageString === 'string' ? dosageString.match(/Qty:\s*(\d+)/i) : null;
                if (qtyMatch) {
                    qty = parseInt(qtyMatch[1]) || 1;
                }

                const { data } = await api.get(`pharmacy/stock/?search=${name}`);
                const match = (data.results || data).find(m => m.name.toLowerCase() === name.toLowerCase());
                if (match) {
                    medsToLoad.push({ ...match, qty: qty, dosage: dosageString });
                }
            } catch (err) { console.error(err); }
        }

        if (medsToLoad.length > 0) {
            setCart([...cart, ...medsToLoad.filter(m => !cart.find(c => c.med_id === m.med_id))]);
            alert(`Loaded ${medsToLoad.length} medicines from prescription.`);
        } else {
            alert("No matching medicines found in stock for this prescription.");
        }
    };

    const addToCart = (med) => {
        const existing = cart.find(item => item.med_id === med.med_id);
        if (existing) {
            if (existing.qty < med.qty_available) {
                setCart(cart.map(item => item.med_id === med.med_id ? { ...item, qty: item.qty + 1 } : item));
            } else {
                alert("Out of stock!");
            }
        } else {
            setCart([...cart, { ...med, qty: 1 }]);
        }
        setMedSearch('');
        setMedResults([]);
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.med_id !== id));

    const updateCartQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.med_id === id) {
                const newQty = Math.max(1, Math.min(item.qty + delta, item.qty_available));
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.qty), 0);
        const roundOff = subtotal % 1 === 0 ? 0 : (Math.ceil(subtotal) - subtotal).toFixed(2);
        const net = Math.ceil(subtotal);
        return { subtotal, roundOff, net };
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        const payload = {
            visit: selectedPatient?.v_id || null,
            items: cart.map(item => ({
                med_stock: item.med_id,
                qty: item.qty,
                unit_price: item.selling_price
            })),
            payment_status: 'PAID'
        };

        try {
            const { data } = await api.post('pharmacy/sales/', payload);
            setLastSale({
                ...data,
                patient: selectedPatient,
                doctor: selectedDoctor,
                details: cart
            });
            setShowPrintModal(true);
            setCart([]);
            setSelectedPatient(null);
            setSelectedDoctor(null);
            if (activeTab === 'inventory') fetchStock();
        } catch (err) {
            alert("Checkout failed. Check stock levels.");
        }
    };

    const totalPages = Math.ceil((stockData.count || 0) / 10);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Pharmacy</h1>
                    <div className="flex gap-4 mt-4">
                        {['inventory', 'pos', 'purchases'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                            >
                                {tab === 'pos' ? 'Quick Billing (POS)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <FileUp size={16} />
                        Export
                    </button>
                    <button onClick={() => setActiveTab('pos')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        <Plus size={16} />
                        New Bill
                    </button>
                </div>
            </div>

            {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden no-print">
                    <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
                        <select
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium"
                            value={filterSupplier}
                            onChange={(e) => { setFilterSupplier(e.target.value); setPage(1); }}
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.supplier_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <Table headers={['Drug & Manufacturer', 'Batch / HSN', 'Expiry', 'Stock', 'Pricing', 'Status', 'Action']}>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-16">
                                    <Activity className="mx-auto text-blue-500 animate-spin mb-2" size={24} />
                                    <span className="text-gray-400 text-sm">Loading inventory...</span>
                                </td></tr>
                            ) : stockData.results && stockData.results.map(s => (
                                <tr key={s.med_id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                                <Pill size={18} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{s.name}</p>
                                                <p className="text-xs text-gray-400">{s.manufacturer || 'Generic'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="font-mono text-sm text-gray-900">{s.batch_no}</span>
                                            <p className="text-xs text-gray-400 mt-0.5">HSN: {s.hsn || '—'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{new Date(s.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.qty_available < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {s.qty_available} units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="text-base font-semibold text-gray-900">₹{s.selling_price}</span>
                                            <p className="text-xs text-gray-400 line-through">MRP: ₹{s.mrp}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.qty_available < 10 && (
                                            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                Low Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setSelectedStockItem(s)}>
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                    <Pagination current={page} total={totalPages} onPageChange={setPage} loading={loading} />
                </div>
            )}

            {/* View Stock Details Modal */}
            <AnimatePresence>
                {selectedStockItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6"
                        >
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                <h3 className="font-bold text-lg text-gray-900">Product Details</h3>
                                <button className="p-1 rounded-full hover:bg-gray-100" onClick={() => setSelectedStockItem(null)}><X size={20} className="text-gray-500" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Product Name</label><p className="font-bold text-gray-900 text-lg">{selectedStockItem.name}</p></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Manufacturer</label><p className="font-semibold text-gray-700">{selectedStockItem.manufacturer || 'N/A'}</p></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Batch</label><p className="font-mono font-bold text-gray-900">{selectedStockItem.batch_no}</p></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Expiry</label><p className="font-mono font-bold text-gray-900">{selectedStockItem.expiry_date}</p></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Stock</label><p className="font-bold text-emerald-600">{selectedStockItem.qty_available} units</p></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">MRP</label><p className="font-bold text-gray-900">₹{selectedStockItem.mrp}</p></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">PTR/Rate</label><p className="font-bold text-gray-900">₹{selectedStockItem.selling_price}</p></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">GST %</label><p className="font-bold text-gray-900">{selectedStockItem.gst_percent}%</p></div>
                                </div>
                                <div><label className="text-xs font-bold text-gray-400 uppercase">HSN Code</label><p className="font-mono font-bold text-gray-900">{selectedStockItem.hsn || 'N/A'}</p></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {activeTab === 'pos' && (
                // ... (POS Tab Code remains same, omitting for brevity in this replace but assume relevant POS code is here or reused)
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start no-print">
                    {/* Full POS UI Code... reusing logic from previous read */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Search Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6 space-y-4 border-2 border-slate-100 shadow-xl shadow-slate-100/50 rounded-[2rem]">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Details</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                                    <input
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-sky-500/20 focus:ring-4 focus:ring-sky-500/5 font-bold text-sm"
                                        placeholder="Search by name or phone..."
                                        value={patientSearch}
                                        onChange={e => searchPatients(e.target.value)}
                                    />
                                    {patients.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-50">
                                            {patients.map(p => (
                                                <div key={p.p_id} className="p-4 hover:bg-sky-50 cursor-pointer flex items-center gap-3 transition-colors" onClick={() => { setSelectedPatient(p); setPatients([]); setPatientSearch(''); }}>
                                                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-black text-xs">{p.full_name[0]}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{p.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedPatient && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between p-3 bg-sky-50 rounded-xl border border-sky-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-xs">{selectedPatient.full_name[0]}</div>
                                                <span className="text-sm font-black text-sky-900">{selectedPatient.full_name}</span>
                                            </div>
                                            <X size={16} className="text-sky-400 cursor-pointer hover:text-sky-600" onClick={() => setSelectedPatient(null)} />
                                        </div>

                                        {activePrescription ? (
                                            <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100/50 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={12} /> Active Prescription Found
                                                    </span>
                                                    <Button size="xs" onClick={loadPrescriptionToCart} className="bg-emerald-500 hover:bg-emerald-600 text-[10px] h-7 px-3">Load Items</Button>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono bg-white/50 p-2 rounded-lg leading-relaxed">
                                                    {Object.entries(activePrescription.prescription).map(([m, d]) => (
                                                        <div key={m} className="flex justify-between border-b last:border-0 border-emerald-100/30 py-1">
                                                            <span className="font-bold">{m}</span>
                                                            <span className="opacity-60">{d}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 border-dashed text-center">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No pending prescriptions found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>

                            <Card className="p-6 space-y-4 border-2 border-slate-100 shadow-xl shadow-slate-100/50 rounded-[2rem]">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prescribed By</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                                    <input
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-sky-500/20 focus:ring-4 focus:ring-sky-500/5 font-bold text-sm"
                                        placeholder="Search doctor..."
                                        value={doctorSearch}
                                        onChange={e => searchDoctors(e.target.value)}
                                    />
                                    {doctors.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-50">
                                            {doctors.map(d => (
                                                <div key={d.u_id} className="p-4 hover:bg-sky-50 cursor-pointer flex items-center gap-3 transition-colors" onClick={() => { setSelectedDoctor(d); setDoctors([]); setDoctorSearch(''); }}>
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs">DR</div>
                                                    <p className="text-sm font-black text-slate-800">{d.username}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedDoctor && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                        <span className="text-sm font-black text-slate-800">Dr. {selectedDoctor.username}</span>
                                        <X size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setSelectedDoctor(null)} />
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Medicine Search & Cart */}
                        <Card className="p-0 border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[3rem]">
                            <div className="p-8 border-b border-slate-100 bg-white">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Drug Inventory Search</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                        <Pill size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Scan barcode or type medicine name..."
                                        className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:ring-8 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all text-lg font-inter font-bold"
                                        value={medSearch}
                                        onChange={e => searchMeds(e.target.value)}
                                    />
                                    {medResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white border-4 border-sky-50 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] z-30 overflow-hidden divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                                            {medResults.map(m => (
                                                <div key={m.med_id} className="p-6 hover:bg-sky-50 cursor-pointer flex items-center justify-between transition-all group" onClick={() => addToCart(m)}>
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                                                            <Activity size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 font-outfit text-xl uppercase tracking-tighter">{m.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                                Batch: {m.batch_no} • Exp: {m.expiry_date}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-slate-900 font-outfit">₹{m.selling_price}</p>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${m.qty_available < 10 ? 'text-rose-500 underline underline-offset-4 decoration-2' : 'text-emerald-500'}`}>
                                                            {m.qty_available} units left
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-[400px]">
                                <Table headers={['Drug Detail', 'Batch/Exp', 'Qty', 'Amount', '']}>
                                    {cart.length === 0 ? (
                                        <tr><td colSpan="5" className="py-32 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200 mb-4 border-2 border-slate-100 border-dashed">
                                                <ShoppingCart size={32} />
                                            </div>
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs font-outfit">Billing list is empty.</p>
                                        </td></tr>
                                    ) : cart.map(item => (
                                        <tr key={item.med_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="font-black text-slate-900 font-inter uppercase tracking-tight">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.manufacturer || 'GENERIC'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-600">B: {item.batch_no}</span>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase mt-1">E: {item.expiry_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-inner border border-slate-100 w-fit">
                                                    <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors font-bold" onClick={() => updateCartQty(item.med_id, -1)}>-</button>
                                                    <span className="font-black text-slate-900 w-8 text-center text-sm">{item.qty}</span>
                                                    <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors font-bold" onClick={() => updateCartQty(item.med_id, 1)}>+</button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xl font-black text-slate-900 font-outfit">₹{(item.selling_price * item.qty).toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button className="text-slate-300 hover:text-rose-500 transition-colors group-hover:scale-125 duration-300" onClick={() => removeFromCart(item.med_id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                            </div>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden bg-slate-900 text-white p-10 relative">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-slate-400 flex items-center gap-4">
                                <div className="w-8 h-[2px] bg-sky-500"></div>
                                Billing Checkout
                            </h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-sm font-bold opacity-60">
                                    <span>Subtotal</span>
                                    <span>₹{calculateTotals().subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold opacity-60">
                                    <span>Round Off</span>
                                    <span>₹{calculateTotals().roundOff}</span>
                                </div>
                                <div className="h-px bg-white/10 my-8 border-dashed border-b"></div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Total Payable</p>
                                        <p className="text-5xl font-black font-outfit tracking-tighter leading-none">₹{calculateTotals().net.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full mt-12 h-20 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 transition-all rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-4 group"
                            >
                                <CheckCircle2 size={24} className="group-hover:scale-125 transition-transform" />
                                Finalize & Bill
                            </button>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-center mt-6 text-slate-500">Digital Tax Invoice will be generated.</p>
                        </Card>

                        <div className="p-8 bg-sky-50/50 rounded-[2.5rem] border-2 border-sky-100/50 border-dashed space-y-4">
                            <div className="flex items-center gap-3 text-sky-600">
                                <ShoppingCart size={20} />
                                <span className="font-black uppercase tracking-widest text-[10px]">Session Intel</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Items in Cart</span>
                                <span className="font-black text-slate-900">{cart.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Total Units</span>
                                <span className="font-black text-slate-900">{cart.reduce((a, b) => a + b.qty, 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'purchases' && (
                <div className="max-w-5xl mx-auto py-12 px-6 no-print space-y-12">
                    {/* 1. Bulk Upload Section */}
                    <Card className="p-16 text-center space-y-10 border-4 border-slate-100 border-dashed rounded-[4rem] bg-white/30 backdrop-blur-xl shadow-2xl shadow-slate-200/50 group hover:border-sky-200 transition-all duration-500">
                        <div className="w-32 h-32 bg-sky-50 text-sky-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-sky-500/10 group-hover:scale-110 transition-transform duration-500">
                            <FileUp size={56} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 font-outfit uppercase tracking-tighter italic">Institutional Inflow</h2>
                            <p className="text-slate-500 font-medium font-inter max-w-sm mx-auto text-lg leading-snug">Drag & drop your pharmacy CSV invoices to refresh institutional stock levels instantly.</p>
                        </div>

                        {/* Supplier Selection */}
                        <div className="max-w-sm mx-auto space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Supplier (Pharma)</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/20 transition-all font-bold font-inter text-slate-700"
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                >
                                    <option value="">Select Supplier...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setShowAddSupplierModal(true)}
                                    className="px-4 bg-slate-900 text-white rounded-2xl hover:bg-sky-500 transition-colors shadow-lg"
                                    title="Add New Supplier"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <input
                                type="file"
                                id="bulk-file"
                                className="hidden"
                                accept=".csv"
                                onChange={handleBulkUpload}
                                disabled={!selectedSupplier || uploadLoading}
                            />
                            <label
                                htmlFor="bulk-file"
                                className={`px-12 py-6 rounded-3xl inline-flex items-center gap-4 transition-all shadow-2xl shadow-slate-900/30 font-black text-xl uppercase tracking-widest ${!selectedSupplier || uploadLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'cursor-pointer bg-slate-900 text-white hover:bg-sky-500'}`}
                            >
                                {uploadLoading ? (
                                    <>
                                        <Activity className="animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>Initialize Upload</>
                                )}
                            </label>
                        </div>

                        {uploadResult && (
                            <div className={`mt-6 p-6 rounded-2xl border-2 ${uploadResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                <div className="flex items-center gap-3 justify-center mb-2">
                                    {uploadResult.success ? <CheckCircle2 /> : <AlertTriangle />}
                                    <span className="font-black uppercase tracking-widest">{uploadResult.message}</span>
                                </div>
                                {uploadResult.details && <p className="text-sm font-medium">{uploadResult.details}</p>}
                                {uploadResult.invoice && <p className="text-xs font-bold uppercase mt-2 opacity-70">Invoice Generated: {uploadResult.invoice}</p>}
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-3 bg-white/50 py-3 px-6 rounded-2xl inline-block shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WMS Format V2.4 Supported</span>
                        </div>
                    </Card>

                    {/* 2. Recent Imports List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tighter">Purchase History</h3>
                                <p className="text-slate-500 font-medium text-sm">Review recent bulk uploads and invoices.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <Table headers={['Invoice No', 'Supplier', 'Entry Date', 'Items', 'Action']}>
                                {recentImports.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-medium">No purchase history found.</td></tr>
                                ) : recentImports.map(imp => (
                                    <tr key={imp.id} className="hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0">
                                        <td className="px-8 py-5 font-bold text-slate-900">{imp.invoice_no}</td>
                                        <td className="px-8 py-5">
                                            <span className="font-semibold text-slate-700">{suppliers.find(s => s.id === imp.supplier)?.supplier_name || 'Agencies'}</span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-500">
                                            {new Date(imp.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wide">
                                                {imp.items_detail ? imp.items_detail.length : (imp.items ? imp.items.length : 0)} Items
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <button
                                                className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-widest hover:text-sky-600 transition-colors"
                                                onClick={() => setSelectedImport(imp)}
                                            >
                                                View Details <ChevronDown size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </Table>
                        </div>
                    </div>
                </div>
            )}

            {/* View Import/Invoice Details Modal */}
            <AnimatePresence>
                {selectedImport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-gray-50 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest">Received</span>
                                        <h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tighter">Invoice #{selectedImport.invoice_no}</h2>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">{suppliers.find(s => s.id === selectedImport.supplier)?.supplier_name || 'Supplier'} • {new Date(selectedImport.created_at).toLocaleDateString()}</p>
                                </div>
                                <button className="p-2 rounded-full hover:bg-white transition-colors" onClick={() => setSelectedImport(null)}>
                                    <X size={24} className="text-slate-400 hover:text-rose-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            {['Product', 'Batch', 'Exp', 'S-Qty', 'Free', 'MRP', 'PTR', 'GST%', 'Amt'].map(h => (
                                                <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedImport.items_detail && selectedImport.items_detail.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900 text-sm max-w-[200px] truncate" title={item.product_name}>{item.product_name}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.batch_no}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.expiry_date}</td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">{item.qty}</td>
                                                <td className="px-6 py-4 font-bold text-sky-600">{item.free_qty || 0}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">₹{item.mrp}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">₹{item.ptr || item.purchase_rate}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.gst_percent}%</td>
                                                <td className="px-6 py-4 font-black text-slate-900">₹{((item.ptr || item.purchase_rate) * item.qty).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Items: {selectedImport.items_detail?.length || 0}</span>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                                    <p className="text-2xl font-black text-slate-900 font-outfit">₹{selectedImport.total_amount}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Supplier Modal */}
            <AnimatePresence>
                {showAddSupplierModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-900 uppercase tracking-wide">New Supplier</h3>
                                <X className="cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setShowAddSupplierModal(false)} />
                            </div>
                            <form onSubmit={handleAddSupplier} className="space-y-4">
                                <Input
                                    placeholder="Supplier Name"
                                    value={newSupplierName}
                                    onChange={e => setNewSupplierName(e.target.value)}
                                    required
                                    className="bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"
                                />
                                <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-sky-500/20">
                                    Create Supplier
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print POS Modal (Matches User Image - Daya Pharmacy style) */}
            <AnimatePresence>
                {showPrintModal && lastSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm no-print">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <Printer size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tighter">Retail Receipt</h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="rounded-xl px-5 font-bold" onClick={() => setShowPrintModal(false)}>Close</Button>
                                    <Button onClick={() => window.print()} className="rounded-xl px-8 font-black shadow-lg shadow-sky-500/20 uppercase tracking-widest">
                                        Confirm Print
                                    </Button>
                                </div>
                            </div>

                            <div id="printable-area" className="flex-1 overflow-y-auto p-12 bg-white text-slate-900 font-mono text-[10px] leading-relaxed uppercase">
                                {/* Dot Matrix Header */}
                                <div className="text-center space-y-1 mb-8">
                                    <h1 className="text-2xl font-black tracking-widest uppercase">Daya Pharmacy</h1>
                                    <div className="flex items-center justify-center gap-4 text-[9px] font-bold">
                                        <div className="flex items-center gap-1"><MapPin size={10} /> WAYANAD</div>
                                        <div className="flex items-center gap-1"><Phone size={10} /> PH : 9496851538</div>
                                    </div>
                                    <p className="text-[9px] font-black border-y border-slate-900 py-1 mt-2">RETAIL BILL</p>
                                    <div className="flex justify-center gap-4 text-[8px] mt-1 font-bold">
                                        <span>DL NO : KL-WYD-159132</span>
                                        <span>KL-WYD-159133</span>
                                    </div>
                                </div>

                                {/* Bill Meta */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 border-b border-dashed border-slate-300 pb-4 mb-4">
                                    <div className="flex justify-between"><span>Bill Date</span> <span>: {new Date(lastSale.sale_date).toLocaleDateString()}</span></div>
                                    <div className="flex justify-between"><span>Patient</span> <span>: {lastSale.patient?.full_name || 'Walk-In'}</span></div>
                                    <div className="flex justify-between"><span>Bill No</span> <span>: {lastSale.id.slice(0, 8).toUpperCase()}</span></div>
                                    <div className="flex justify-between"><span>Doctor</span> <span>: {lastSale.doctor?.username || '---'}</span></div>
                                    <div className="flex justify-between"><span>Time</span> <span>: {new Date(lastSale.sale_date).toLocaleTimeString()}</span></div>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-1 border-b border-slate-900 pb-1 mb-2 font-black text-[9px]">
                                    <span className="col-span-1">HSN</span>
                                    <span className="col-span-1 text-center">QTY</span>
                                    <span className="col-span-5">PARTICULAR</span>
                                    <span className="col-span-1 text-center">GST%</span>
                                    <span className="col-span-1 text-center">BATCH</span>
                                    <span className="col-span-1 text-center">EXPIRY</span>
                                    <span className="col-span-1 text-right">MRP</span>
                                    <span className="col-span-1 text-right">AMT</span>
                                </div>

                                {/* Items */}
                                <div className="space-y-1 min-h-[150px]">
                                    {lastSale.details.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-1 font-bold text-[9px] items-start">
                                            <span className="col-span-1 truncate">{item.hsn || '---'}</span>
                                            <span className="col-span-1 text-center">{item.qty}</span>
                                            <span className="col-span-5 truncate">{item.name}</span>
                                            <span className="col-span-1 text-center">{item.gst_percent}%</span>
                                            <span className="col-span-1 text-center truncate">{item.batch_no}</span>
                                            <span className="col-span-1 text-center">{new Date(item.expiry_date).toLocaleDateString(undefined, { month: 'short', year: '2y' })}</span>
                                            <span className="col-span-1 text-right">{item.mrp}</span>
                                            <span className="col-span-1 text-right">{(item.selling_price * item.qty).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="mt-8 pt-4 border-t border-dashed border-slate-300 space-y-1 font-black">
                                    <div className="flex justify-end gap-12">
                                        <span>TOTAL  : </span>
                                        <span className="w-24 text-right">{(lastSale.total_amount - 0 + (lastSale.total_amount % 1 === 0 ? 0 : -(Math.ceil(lastSale.total_amount) - lastSale.total_amount))).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end gap-12 items-center">
                                        <span className="text-[8px] opacity-60 font-bold">ROUND OFF : </span>
                                        <span className="w-24 text-right">{(lastSale.total_amount % 1 === 0 ? 0 : (Math.ceil(lastSale.total_amount) - lastSale.total_amount)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-end gap-12 items-center text-lg border-y border-slate-900 py-2 my-2 font-black tracking-tighter">
                                        <span>NET AMOUNT:</span>
                                        <span className="w-32 text-right">₹{Math.ceil(lastSale.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Amount in Words */}
                                <p className="font-bold text-[9px] mt-4 italic">Rupees {Math.ceil(lastSale.total_amount)} ONLY</p>

                                {/* Legal Text */}
                                <div className="mt-12 text-[8px] font-bold space-y-3 leading-tight border-t border-slate-100 pt-6 opacity-60">
                                    <p>CERTIFIED THAT THE MEDICINES SOLD AS PER THIS BILL HAVE BEEN PURCHASED LOCAL FROM REGISTERED DEALERS WHO HAVE CERTIFIED IN THE RELATED SALES BILLS THAT SUCH MEDICINES HAD DULY SUFFERED COMPOUND TAX.</p>
                                    <div className="flex justify-between items-end pt-4">
                                        <p>WISH YOU A SPEEDY RECOVERY.</p>
                                        <p className="text-right">PHARMACIST (SD)</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Pharmacy;
