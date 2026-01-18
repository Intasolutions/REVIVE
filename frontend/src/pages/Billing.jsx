import React, { useState, useEffect } from "react";
import {
    Plus, Search, FileText, Download, Printer, CheckCircle2,
    Clock, TrendingUp, IndianRupee, AlertCircle, X, User,
    Calendar, Pill, ChevronDown, Import, ChevronRight, Sparkles,
    Eye, CreditCard, Wallet, MoreHorizontal
} from "lucide-react";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../context/ToastContext";
import { useDialog } from "../context/DialogContext";

// --- 1. Premium Tooltip Component (Fixed) ---
const ActionTooltip = ({ text, children, variant = 'dark' }) => (
    <div className="group relative flex items-center justify-center">
        {children}
        {/* Tooltip Popup */}
        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-[100] whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
            <span className={`
                relative z-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-xl
                ${variant === 'danger' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}
            `}>
                {text}
                {/* Tiny arrow pointing down */}
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${variant === 'danger' ? 'bg-rose-600' : 'bg-slate-900'}`}></span>
            </span>
        </div>
    </div>
);

const Billing = () => {
    const { showToast } = useToast();
    const { confirm } = useDialog();

    // --- State ---
    const [invoices, setInvoices] = useState([]);
    const [pendingVisits, setPendingVisits] = useState([]);
    const [stats, setStats] = useState({ revenue_today: 0, pending_amount: 0, invoices_today: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Forms ---
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [pharmacyStock, setPharmacyStock] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    const [formData, setFormData] = useState({
        patient_name: "",
        doctor_display_name: "",
        visit: null,
        doctor: "",
        payment_status: "PENDING",
        items: [{ dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "", dosage: "", duration: "" }]
    });

    // --- Effects ---
    useEffect(() => {
        const fetchData = () => {
            fetchInvoices();
            fetchStats();
            fetchPendingVisits();
        };
        fetchData();
        fetchMetadata();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- API Calls ---
    const fetchInvoices = async () => {
        try {
            const res = await api.get(`billing/invoices/`);
            setInvoices(res.data.results || (Array.isArray(res.data) ? res.data : []));
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const fetchPendingVisits = async () => {
        try {
            const res = await api.get(`billing/invoices/pending_visits/`);
            setPendingVisits(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`billing/invoices/stats/`);
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMetadata = async () => {
        try {
            const [docRes, patRes, stockRes] = await Promise.all([
                api.get(`users/management/doctors/`),
                api.get(`reception/patients/`),
                api.get(`pharmacy/stock/`)
            ]);
            setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data.results);
            setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.results);
            setPharmacyStock(Array.isArray(stockRes.data) ? stockRes.data : stockRes.data.results);
        } catch (err) { console.error(err); }
    };

    // --- Logic ---
    const handleBillNow = async (visit) => {
        const patId = (visit.patient && typeof visit.patient === 'object') ? visit.patient.id : visit.patient;
        const patientObj = patients.find(p => p.id === patId);
        const patientName = visit.patient_name || (patientObj ? patientObj.full_name : "Unknown");

        let doctorToSet = visit.doctor || "";
        if (!doctorToSet && visit.doctor_name) {
            const foundDoctor = doctors.find(d => `Dr. ${d.first_name} ${d.last_name}`.toLowerCase().includes(visit.doctor_name.toLowerCase()));
            if (foundDoctor) doctorToSet = foundDoctor.id;
        }

        const existing = invoices.find(inv => (inv.visit === visit.id || inv.visit === visit.v_id) && inv.payment_status === 'PENDING');
        if (existing) {
            handleEditInvoice(existing);
            return;
        }

        const newFormData = {
            patient_name: patientName,
            doctor_display_name: visit.doctor_name || "Not Assigned",
            visit: visit.id || visit.v_id,
            doctor: doctorToSet,
            payment_status: "PENDING",
            items: []
        };

        if (visit.doctor_name && visit.doctor_name !== "Not Assigned") {
            const fee = visit.consultation_fee ? parseFloat(visit.consultation_fee) : 500;
            newFormData.items.push({ dept: "CONSULTATION", description: "General Consultation Fee", qty: 1, unit_price: fee, amount: fee, hsn: "", batch: "", gst_percent: 0, expiry: "", dosage: "", duration: "" });
        }

        if (visit.pharmacy_items && visit.pharmacy_items.length > 0) {
            visit.pharmacy_items.forEach(item => {
                newFormData.items.push({
                    dept: "PHARMACY", description: item.name, qty: item.qty, unit_price: parseFloat(item.unit_price), amount: parseFloat(item.amount),
                    hsn: item.hsn || "", batch: item.batch || "", gst_percent: item.gst || 0, expiry: "", dosage: item.dosage || "", duration: item.duration || ""
                });
            });
        } else if (newFormData.items.length === 0) {
            newFormData.items.push({ dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0, hsn: "", batch: "", gst_percent: 0, expiry: "", dosage: "", duration: "" });
        }

        setFormData(newFormData);
        setSelectedPatientId(patId);
        setShowModal(true);
    };

    const handleImportPrescription = async (overridePatientId = null) => {
        const patId = overridePatientId || selectedPatientId;
        if (!patId) return showToast('error', "No patient selected.");

        try {
            const vId = ((typeof formData.visit === 'object') ? formData.visit.id : formData.visit);
            let notesData = [];
            try {
                const res = vId ? await api.get(`medical/doctor-notes/?visit=${vId}`) : await api.get(`medical/doctor-notes/?visit__patient=${patId}`);
                notesData = res.data.results || (Array.isArray(res.data) ? res.data : []);
            } catch (e) { }

            const newItems = [...formData.items];
            if (notesData.length > 0) {
                const lastNote = notesData[0];
                if (lastNote.prescription) {
                    const presItems = Array.isArray(lastNote.prescription) ? lastNote.prescription : Object.entries(lastNote.prescription).map(([name, details]) => ({ name }));
                    presItems.forEach(p => {
                        const medName = (p.name || "").trim();
                        if (!medName || newItems.some(i => i.description.toLowerCase() === medName.toLowerCase())) return;
                        const stockItem = pharmacyStock.find(s => s.name.toLowerCase() === medName.toLowerCase());
                        newItems.push({
                            dept: "PHARMACY", description: medName, qty: 1,
                            unit_price: stockItem ? parseFloat(stockItem.mrp) : 0,
                            amount: stockItem ? parseFloat(stockItem.mrp) : 0,
                            hsn: stockItem?.hsn || "", batch: stockItem?.batch_no || "", gst_percent: 0, expiry: stockItem?.expiry_date || "", dosage: "", duration: ""
                        });
                    });
                }
            }
            setFormData(prev => ({ ...prev, items: newItems }));
            showToast('success', "Imported available prescription data.");
        } catch (err) { showToast('error', "Failed to import."); }
    };

    const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const handleCreateInvoice = async () => {
        const subtotal = calculateSubtotal(formData.items);
        const invoiceData = {
            patient_name: formData.patient_name,
            payment_status: formData.payment_status,
            total_amount: subtotal.toFixed(2),
            items: formData.items.map(({ id, created_at, updated_at, ...rest }) => rest),
            visit: formData.visit
        };

        try {
            if (formData.id) await api.patch(`billing/invoices/${formData.id}/`, invoiceData);
            else await api.post(`billing/invoices/`, invoiceData);
            setShowModal(false);
            setFormData({ patient_name: "", visit: null, doctor: "", payment_status: "PENDING", items: [] });
            fetchInvoices(); fetchStats(); fetchPendingVisits();
            showToast('success', "Invoice saved successfully!");
        } catch (err) { showToast('error', "Failed to save invoice."); }
    };

    const handleEditInvoice = (invoice) => {
        setFormData({
            id: invoice.id,
            patient_name: invoice.patient_name,
            visit: invoice.visit,
            doctor: formData.doctor,
            doctor_display_name: invoice.doctor_display_name || "",
            payment_status: invoice.payment_status,
            items: invoice.items.map(i => ({ ...i }))
        });
        if (invoice.patient_id) setSelectedPatientId(invoice.patient_id);
        setShowModal(true);
    };

    const handleMarkAsPaid = async (invoice) => {
        const isConfirmed = await confirm({
            title: 'Confirm Payment',
            message: `Mark invoice #${invoice.id?.toString().slice(0, 8)} as PAID?`,
            type: 'success',
            confirmText: 'Mark Paid'
        });
        if (!isConfirmed) return;
        try {
            await api.patch(`billing/invoices/${invoice.id}/`, { payment_status: 'PAID' });
            fetchInvoices(); fetchStats();
            showToast('success', "Marked as PAID.");
        } catch (error) { showToast('error', "Failed to update status."); }
    };

    // --- Global Print Handler ---
    const handlePrint = () => {
        window.print();
    };

    // --- Status Badge ---
    const StatusBadge = ({ status }) => {
        const isPaid = status === "PAID";
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-sm ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">

            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit uppercase">Billing & Finance</h1>
                    <div className="flex items-center gap-2 text-slate-500 font-medium mt-1 text-sm">
                        <span>Financial Overview</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <ActionTooltip text="Export CSV">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm">
                            <Download size={16} /> Reports
                        </button>
                    </ActionTooltip>
                    <ActionTooltip text="Create New Invoice">
                        <button
                            onClick={() => {
                                setFormData({
                                    patient_name: "", visit: null, doctor: "", payment_status: "PENDING",
                                    items: [{ dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0 }]
                                });
                                setSelectedPatientId(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 font-bold text-xs uppercase tracking-wider shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                        >
                            <Plus size={16} /> New Invoice
                        </button>
                    </ActionTooltip>
                </div>
            </div>

            {/* --- Stats Cards (No Print) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 no-print">
                {[
                    { label: "Today's Revenue", value: `₹${(stats?.revenue_today || 0).toLocaleString()}`, icon: IndianRupee, color: "blue" },
                    { label: "Pending Collection", value: `₹${(stats?.pending_amount || 0).toLocaleString()}`, icon: Wallet, color: "amber" },
                    { label: "Invoices Generated", value: stats?.invoices_today || 0, icon: FileText, color: "emerald" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 font-outfit">{stat.value}</h3>
                        </div>
                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Pending Queue (Kanban Style) - No Print --- */}
            {pendingVisits.length > 0 && (
                <div className="mb-10 no-print">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Sparkles size={16} /></div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Ready for Billing</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {pendingVisits.map(visit => (
                            <div key={visit.id} onClick={() => handleBillNow(visit)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[3rem] -mr-8 -mt-8 z-0"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                                                {visit.patient_name?.[0] || "?"}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{visit.patient_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {(visit.id || "").toString().slice(0, 6)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Consultation</span>
                                            <span className="font-bold text-slate-700">₹{visit.consultation_fee || 500}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Pharmacy</span>
                                            <span className="font-bold text-slate-700">
                                                ₹{(visit.pharmacy_items || []).reduce((sum, i) => sum + parseFloat(i.amount), 0).toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">PENDING</span>
                                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-500 text-xs font-bold">
                                            <ActionTooltip text="Generate Bill for this Visit">
                                                <span>Bill Now</span>
                                            </ActionTooltip>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Invoice List (No Print) --- */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden no-print">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" /> Recent Invoices
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
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
                                <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">#{invoice.id?.toString().slice(0, 8).toUpperCase()}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{invoice.patient_name || "Guest"}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">₹{invoice.total_amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${invoice.payment_status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                            }`}>
                                            {invoice.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {/* IMPORTANT: Buttons are always visible now, no group-hover opacity */}
                                        {invoice.payment_status === 'PENDING' && (
                                            <ActionTooltip text="Collect Payment">
                                                <button onClick={() => handleMarkAsPaid(invoice)} className="text-emerald-500 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 border border-emerald-100">
                                                    <CreditCard size={16} />
                                                </button>
                                            </ActionTooltip>
                                        )}
                                        <ActionTooltip text="Print Invoice">
                                            <button className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50" onClick={() => handleEditInvoice(invoice)}>
                                                <Printer size={16} />
                                            </button>
                                        </ActionTooltip>
                                        <ActionTooltip text="View Details">
                                            <button onClick={() => handleEditInvoice(invoice)} className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">
                                                <Eye size={16} />
                                            </button>
                                        </ActionTooltip>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Premium Modal (Invoice Preview & Edit) --- */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print-modal">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Modal Header (Hide on Print) */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center no-print">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 font-outfit uppercase tracking-tight">{formData.id ? 'Edit Invoice' : 'New Invoice'}</h2>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Ref: {formData.id ? `#${formData.id.slice(0, 8)}` : 'Draft'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <ActionTooltip text="Print Invoice">
                                        <button onClick={handlePrint} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                            <Printer size={20} />
                                        </button>
                                    </ActionTooltip>
                                    <ActionTooltip text="Close Modal" variant="danger">
                                        <button onClick={() => setShowModal(false)} className="p-2 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                                            <X size={20} />
                                        </button>
                                    </ActionTooltip>
                                </div>
                            </div>

                            {/* Modal Body (Printable Area) */}
                            <div className="flex-1 overflow-y-auto p-12 bg-white print-content" id="invoice-print-area">

                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 tracking-widest uppercase">REVIVE CLINIC</h1>
                                        <p className="text-xs font-bold text-slate-500 tracking-widest mt-1">HEALTH & RESEARCH CENTRE</p>
                                        <div className="mt-4 text-xs text-slate-400 space-y-1">
                                            <p>Pallikkunnu Road, Anjukunnu</p>
                                            <p>Ph: 9496851538</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-slate-200">INVOICE</div>
                                        <p className="text-sm font-bold text-slate-900 mt-2">#{formData.id ? formData.id.slice(0, 8).toUpperCase() : 'DRAFT'}</p>
                                        <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Patient Info Grid */}
                                <div className="grid grid-cols-2 gap-12 mb-12">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Billed To</label>
                                        <div className="text-lg font-bold text-slate-900">{formData.patient_name || "Unknown Patient"}</div>
                                        <div className="text-xs text-slate-500 mt-1">Patient ID: {selectedPatientId || 'N/A'}</div>
                                    </div>
                                    <div className="text-right">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Doctor</label>
                                        <div className="text-lg font-bold text-slate-900">{formData.doctor_display_name || "General"}</div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-12">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b-2 border-slate-900">
                                            <tr>
                                                <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest w-16">#</th>
                                                <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</th>
                                                <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest w-24 text-center">Qty</th>
                                                <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest w-32 text-right">Price</th>
                                                <th className="py-3 text-[10px] font-black text-slate-900 uppercase tracking-widest w-32 text-right">Amount</th>
                                                <th className="py-3 w-10 no-print"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx} className="group">
                                                    <td className="py-4 text-slate-400 font-mono">{idx + 1}</td>
                                                    <td className="py-4">
                                                        <input
                                                            className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 print:placeholder-transparent"
                                                            placeholder="Item Name / Service"
                                                            value={item.description}
                                                            onChange={(e) => {
                                                                const newItems = [...formData.items];
                                                                newItems[idx].description = e.target.value;
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <input
                                                            type="number" className="w-full bg-transparent text-center font-bold outline-none"
                                                            value={item.qty}
                                                            onChange={(e) => {
                                                                const qty = parseInt(e.target.value) || 0;
                                                                const newItems = [...formData.items];
                                                                newItems[idx] = { ...item, qty, amount: (qty * item.unit_price).toFixed(2) };
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <input
                                                            type="number" className="w-full bg-transparent text-right font-medium outline-none"
                                                            value={item.unit_price}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                const newItems = [...formData.items];
                                                                newItems[idx] = { ...item, unit_price: price, amount: (item.qty * price).toFixed(2) };
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-slate-900">₹{item.amount}</td>
                                                    <td className="py-4 text-center no-print">
                                                        <ActionTooltip text="Remove Item" variant="danger">
                                                            <button onClick={() => {
                                                                const newItems = formData.items.filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, items: newItems });
                                                            }} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                                                        </ActionTooltip>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, items: [...prev.items, { dept: "PHARMACY", description: "", qty: 1, unit_price: 0, amount: 0 }] }))}
                                        className="mt-4 text-xs font-bold text-blue-600 hover:underline uppercase tracking-wide no-print flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add Item Line
                                    </button>
                                </div>

                                {/* Footer Totals */}
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-sm font-medium text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{calculateSubtotal(formData.items).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-end">
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total</span>
                                            <span className="text-3xl font-black text-slate-900 leading-none">₹{calculateSubtotal(formData.items).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Actions) */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center no-print">
                                <div>
                                    <ActionTooltip text="Import Medications from Doctor's Notes">
                                        <button onClick={() => handleImportPrescription()} disabled={!selectedPatientId} className={`text-xs font-bold flex items-center gap-2 ${selectedPatientId ? 'text-blue-600 hover:text-blue-800' : 'text-slate-300 cursor-not-allowed'}`}>
                                            <Import size={16} /> Import from Prescription
                                        </button>
                                    </ActionTooltip>
                                </div>
                                <div className="flex gap-3">
                                    <ActionTooltip text="Discard Changes">
                                        <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all">Cancel</button>
                                    </ActionTooltip>
                                    <ActionTooltip text={formData.id ? "Save Changes" : "Create New Invoice"}>
                                        <button onClick={handleCreateInvoice} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all flex items-center gap-2">
                                            <CheckCircle2 size={18} /> {formData.id ? 'Update Invoice' : 'Generate Invoice'}
                                        </button>
                                    </ActionTooltip>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Billing;