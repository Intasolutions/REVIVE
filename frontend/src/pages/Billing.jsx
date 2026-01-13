import React, { useState, useEffect } from "react";
import {
    Plus, Search, FileText, Download, Printer, CheckCircle,
    Clock, TrendingUp, IndianRupee, AlertCircle, X, User,
    Calendar, Pill, ChevronDown, Stethoscope, Import,
    ChevronRight, Sparkles
} from "lucide-react";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [pendingVisits, setPendingVisits] = useState([]);
    const [stats, setStats] = useState({ revenue_today: 0, pending_amount: 0, invoices_today: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [pharmacyStock, setPharmacyStock] = useState([]);

    const [formData, setFormData] = useState({
        patient_name: "",
        visit: null,
        doctor: "",
        payment_status: "PENDING",
        items: [
            { dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "" }
        ]
    });

    const [selectedPatientId, setSelectedPatientId] = useState(null);

    useEffect(() => {
        fetchInvoices();
        fetchStats();
        fetchMetadata();
        fetchPendingVisits();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get(`billing/invoices/`);
            if (res.data.results && Array.isArray(res.data.results)) {
                setInvoices(res.data.results);
            } else if (Array.isArray(res.data)) {
                setInvoices(res.data);
            } else {
                setInvoices([]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            setLoading(false);
        }
    };

    const fetchPendingVisits = async () => {
        try {
            const res = await api.get(`billing/invoices/pending_visits/`);
            const data = Array.isArray(res.data) ? res.data : [];
            setPendingVisits(data);
        } catch (err) {
            console.error("Error fetching pending visits:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`billing/invoices/stats/`);
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [docRes, patRes, stockRes] = await Promise.all([
                api.get(`users/?role=DOCTOR`),
                api.get(`reception/patients/`),
                api.get(`pharmacy/stock/`)
            ]);

            const getArray = (data) => Array.isArray(data) ? data : (data.results || []);

            setDoctors(getArray(docRes.data));
            setPatients(getArray(patRes.data));
            setPharmacyStock(getArray(stockRes.data));
        } catch (err) {
            console.error("Error fetching metadata:", err);
        }
    };

    const handleBillNow = async (visit) => {
        // Determine IDs safely from serializer
        // Visit serializer might return nested patient object or just ID
        const patId = (visit.patient && typeof visit.patient === 'object') ? visit.patient.id : visit.patient;
        const docId = (visit.doctor && typeof visit.doctor === 'object') ? visit.doctor.id : visit.doctor;

        // Find objects in our lists for safe name display
        const patientObj = patients.find(p => p.id === patId);
        const doctorObj = doctors.find(d => d.id === docId);

        // Use patient_name directly from visit if available, else look up
        const patientName = visit.patient_name || (patientObj ? patientObj.full_name : "Unknown");

        setFormData({
            patient_name: patientName,
            visit: visit.id || visit.v_id,
            doctor: docId || "",
            payment_status: "PENDING",
            items: [
                { dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "" }
            ]
        });
        setSelectedPatientId(patId);
        setShowModal(true);

        // Attempt Auto-Import with a small delay to allow state update or just pass ID
        const visitIdToPass = (visit.id || visit.v_id);
        setTimeout(() => handleImportPrescription(patId, visitIdToPass), 300);
    };

    const handleImportPrescription = async (overridePatientId = null, overrideVisitId = null) => {
        const patId = overridePatientId || selectedPatientId;
        if (!patId) {
            alert("Please select a patient first.");
            return;
        }
        try {
            // Try fetching by Specific Visit ID (safest) or Patient
            let url = `medical/doctor-notes/?visit__patient=${patId}`;

            // Prioritize explicit ID, then form state
            const vId = overrideVisitId || ((typeof formData.visit === 'object') ? formData.visit.id : formData.visit);

            if (vId) {
                // Use visit filter for robustness (backend accepts both visit and visit__id)
                url = `medical/doctor-notes/?visit=${vId}`;
            }

            console.log("Fetching notes from:", url); // Debugging
            const res = await api.get(url);

            if (res.data.length > 0) {
                const lastNote = res.data[0];
                const newItems = [];

                // AUTO-FILL DOCTOR if missing
                if (!formData.doctor || formData.doctor === "") {
                    if (lastNote.created_by) {
                        setFormData(prev => ({ ...prev, doctor: lastNote.created_by }));
                    }
                }

                // Parse prescription JSON
                if (Array.isArray(lastNote.prescription)) {
                    lastNote.prescription.forEach(p => {
                        // Find in Pharmacy Stock
                        const stockItem = pharmacyStock.find(s => s.name.toLowerCase() === p.medicine.toLowerCase());

                        newItems.push({
                            dept: "PHARMACY",
                            description: p.medicine,
                            qty: 1,
                            unit_price: stockItem ? parseFloat(stockItem.mrp) : 0,
                            hsn: stockItem ? stockItem.hsn : "",
                            batch: stockItem ? stockItem.batch_no : "",
                            gst_percent: stockItem ? parseFloat(stockItem.gst_percent) : 0,
                            expiry: stockItem ? stockItem.expiry_date : "",
                            amount: stockItem ? parseFloat(stockItem.mrp) : 0
                        });
                    });
                }

                if (newItems.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        items: newItems
                    }));
                    // Optional: Notification toast instead of alert
                } else {
                    alert("No medicines found in the last prescription.");
                }
            } else {
                // If specific visit failed, maybe try patient fallback? 
                // For now, alerting specific message helps debugging
                console.warn("No notes found for URL:", url);
                alert("No doctor notes found for this visit.");
            }
        } catch (err) {
            console.error("Error importing prescription:", err);
            alert("Failed to fetch prescription.");
        }
    };

    const calculateTotal = (items) => {
        return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2);
    };

    const handleCreateInvoice = async () => {
        const total = calculateTotal(formData.items);
        const invoiceData = {
            patient_name: formData.patient_name,
            payment_status: formData.payment_status,
            total_amount: total,
            items: formData.items,
            visit: formData.visit // Link the invoice to the visit
        };

        try {
            await api.post(`billing/invoices/`, invoiceData);
            setShowModal(false);
            fetchInvoices();
            fetchStats();
            fetchPendingVisits(); // Refresh pending list
            setFormData({
                patient_name: "",
                visit: null,
                doctor: "",
                payment_status: "PENDING",
                items: [{ dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "" }]
            });
        } catch (err) {
            alert("Failed to create billing invoice");
        }
    };

    // UI Components
    const StatusBadge = ({ status }) => {
        const isPaid = status === "PAID";
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${isPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit uppercase">
                        Billing & Invoices
                    </h1>
                    <p className="text-slate-500 mt-1">Manage payments, generate invoices, and track revenue.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={() => {
                            setFormData({
                                patient_name: "",
                                visit: null,
                                doctor: "",
                                payment_status: "PENDING",
                                items: [{ dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "" }]
                            });
                            setSelectedPatientId(null);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-100 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" /> New Bill
                    </button>
                </div>
            </div>

            {/* PENDING BILLING QUEUE */}
            {pendingVisits.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Ready for Billing</h3>
                            <p className="text-sm text-slate-500">Patients completed consultation and waiting for bill.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingVisits.map(visit => {
                            // Use patient_name directly from serializer
                            const patName = visit.patient_name || "Unknown Patient";

                            return (
                                <div key={visit.id} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                            {patName?.[0] || "?"}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{patName}</h4>
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Visit #{(visit.id?.toString() || "").slice(0, 6)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBillNow(visit)}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1 transition-colors"
                                    >
                                        Bill Now <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Today's Revenue", value: `₹${(stats?.revenue_today || 0).toLocaleString()}`, icon: IndianRupee, color: "blue" },
                    { label: "Pending Amount", value: `₹${(stats?.pending_amount || 0).toLocaleString()}`, icon: Clock, color: "amber" },
                    { label: "Invoices Generated", value: stats?.invoices_today || 0, icon: FileText, color: "emerald" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search invoice #, patient name..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.filter(inv => (inv.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (inv.id || "").toString().includes(searchTerm)).map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-mono text-slate-500">#{(invoice.id?.toString() || "").slice(0, 8)}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {invoice.patient_name?.[0] || "G"}
                                    </div>
                                    {invoice.patient_name || "Guest Patient"}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-700">₹{invoice.total_amount}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={invoice.payment_status} />
                                </td>
                                <td className="px-6 py-4 text-slate-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    {/* Add Collect Payment button if PENDING */}
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && !loading && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                    No invoices found. Create a new bill to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">New Invoice</h2>
                                    <p className="text-sm text-slate-500">Create a new bill for pharmacy or services</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">

                                {/* Top Section: Patient & Doctor */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Patient</label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={selectedPatientId || ""}
                                            onChange={(e) => {
                                                const pat = patients.find(p => p.id === e.target.value);
                                                setFormData({ ...formData, patient_name: pat ? pat.full_name : "" });
                                                setSelectedPatientId(pat ? pat.id : null);
                                            }}
                                        >
                                            <option value="">Guest / Walk-in</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Or type Name manually"
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm mt-2"
                                            value={formData.patient_name}
                                            onChange={e => setFormData({ ...formData, patient_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Prescribed By</label>
                                        <select
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.doctor}
                                            onChange={e => setFormData({ ...formData, doctor: e.target.value })}
                                        >
                                            <option value="">Select Doctor</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-6">
                                        <button
                                            onClick={() => handleImportPrescription()}
                                            disabled={!selectedPatientId}
                                            className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium transition-all ${!selectedPatientId && 'opacity-50 cursor-not-allowed'}`}
                                        >
                                            <Import className="w-4 h-4" /> Import from Prescription
                                        </button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-blue-500" /> Bill Items
                                        </h3>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3 w-10">#</th>
                                                    <th className="px-4 py-3">Item / Medicine</th>
                                                    <th className="px-4 py-3 w-24">Batch</th>
                                                    <th className="px-4 py-3 w-24">Exp</th>
                                                    <th className="px-4 py-3 w-20">Qty</th>
                                                    <th className="px-4 py-3 w-24">Price (MRP)</th>
                                                    <th className="px-4 py-3 w-24">GST %</th>
                                                    <th className="px-4 py-3 w-28 text-right">Amount</th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {formData.items.map((item, idx) => (
                                                    <tr key={idx} className="bg-white">
                                                        <td className="px-4 py-2 text-center text-slate-400">{idx + 1}</td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                list="medicine-list"
                                                                type="text"
                                                                className="w-full p-1.5 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                                                                placeholder="Search Medicine..."
                                                                value={item.description}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const stockItem = pharmacyStock.find(s => s.name === val);
                                                                    const newItems = [...formData.items];
                                                                    const price = stockItem ? parseFloat(stockItem.mrp) : (newItems[idx].unit_price || 0);

                                                                    newItems[idx] = {
                                                                        ...newItems[idx],
                                                                        description: val,
                                                                        dept: "PHARMACY",
                                                                        batch: stockItem ? stockItem.batch_no : newItems[idx].batch,
                                                                        expiry: stockItem ? stockItem.expiry_date : newItems[idx].expiry,
                                                                        unit_price: price,
                                                                        gst_percent: stockItem ? parseFloat(stockItem.gst_percent) : newItems[idx].gst_percent,
                                                                        hsn: stockItem ? stockItem.hsn : newItems[idx].hsn,
                                                                        amount: (newItems[idx].qty * price).toFixed(2)
                                                                    };
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                            <datalist id="medicine-list">
                                                                {pharmacyStock.map(s => <option key={s.id} value={s.name} />)}
                                                            </datalist>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="text" className="w-full bg-transparent outline-none text-slate-500" value={item.batch} readOnly tabIndex="-1" />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="text" className="w-full bg-transparent outline-none text-slate-500" value={item.expiry} readOnly tabIndex="-1" />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-full p-1.5 bg-slate-50 rounded border border-slate-200 text-center focus:border-blue-500 outline-none"
                                                                value={item.qty}
                                                                onChange={(e) => {
                                                                    const qty = parseInt(e.target.value) || 0;
                                                                    const newItems = [...formData.items];
                                                                    newItems[idx] = {
                                                                        ...item,
                                                                        qty,
                                                                        amount: (qty * item.unit_price).toFixed(2)
                                                                    };
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="number"
                                                                className="w-full p-1.5 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-right"
                                                                value={item.unit_price}
                                                                onChange={(e) => {
                                                                    const price = parseFloat(e.target.value) || 0;
                                                                    const newItems = [...formData.items];
                                                                    newItems[idx] = {
                                                                        ...item,
                                                                        unit_price: price,
                                                                        amount: (item.qty * price).toFixed(2)
                                                                    };
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                className="w-full bg-transparent outline-none"
                                                                value={Math.round(item.gst_percent)}
                                                                onChange={(e) => {
                                                                    const gst = parseFloat(e.target.value);
                                                                    const newItems = [...formData.items];
                                                                    newItems[idx] = { ...item, gst_percent: gst };
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            >
                                                                <option value="0">0%</option>
                                                                <option value="5">5%</option>
                                                                <option value="12">12%</option>
                                                                <option value="18">18%</option>
                                                                <option value="28">28%</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium text-slate-900">
                                                            ₹{item.amount}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    const newItems = formData.items.filter((_, i) => i !== idx);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                items: [...prev.items, { dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "" }]
                                            }))}
                                            className="w-full py-2 bg-slate-50 text-slate-500 text-sm font-medium hover:bg-slate-100 transition-colors border-t border-slate-200"
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                </div>

                                {/* Totals Section */}
                                <div className="flex justify-end pt-4">
                                    <div className="w-64 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Subtotal</span>
                                            <span>₹{calculateTotal(formData.items)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>GST (Included)</span>
                                            <span className="text-slate-400 italic text-xs">(Calculated on bill)</span>
                                        </div>
                                        <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-lg text-slate-900">
                                            <span>Total</span>
                                            <span>₹{calculateTotal(formData.items)}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateInvoice}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Generate Invoice
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Billing;
