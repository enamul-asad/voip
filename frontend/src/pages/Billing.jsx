import React, { useState, useEffect } from "react";
import {
    CreditCard,
    History,
    Wallet,
    Plus,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useOutletContext } from "react-router-dom";

// Components
import DashboardCard from "../components/DashboardCard";
import CreditBalanceCard from "../components/CreditBalanceCard";
import InvoiceButton from "../components/InvoiceButton";

// Services
import { getInvoices } from "../services/billing";

export default function Billing() {
    const { user } = useOutletContext();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to format currency
    const currency = user?.company?.currency || "USD";
    const balance = user?.company?.credit_balance || 0;
    const isLow = Number(balance) < 10;

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                // If you haven't built the API yet, this might fail, so we catch it.
                const res = await getInvoices();
                if (res.data) {
                    setInvoices(res.data);
                }
            } catch (err) {
                console.error("Failed to load invoices", err);
                // Optional: Set mock data here if API fails during demo
                // setInvoices(MOCK_INVOICES); 
            } finally {
                setLoading(false);
            }
        };

        loadInvoices();
    }, []);

    return (
        <div className="space-y-6 pb-8">

            {/* --- Page Header --- */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Wallet size={24} />
                    </div>
                    Billing & Payments
                </h1>
                <p className="text-slate-400 text-sm mt-1 ml-11">
                    Manage your credit balance, payment methods, and invoices.
                </p>
            </div>

            {/* --- Top Section: Wallet & Cards --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Credit Balance */}
                <div className="lg:col-span-1 h-full">
                    <CreditBalanceCard
                        balance={balance}
                        currency={currency}
                        low={isLow}
                    />
                    <button className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                        <Plus size={18} /> Add Funds
                    </button>
                </div>

                {/* 2. Payment Method Card */}
                <DashboardCard className="lg:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Payment Method</h3>
                            <p className="text-slate-500 text-xs">Primary card for auto-recharge</p>
                        </div>
                        <button className="text-xs font-medium text-sky-400 hover:text-sky-300 border border-sky-500/20 px-3 py-1.5 rounded-lg bg-sky-500/5 transition-colors">
                            Manage Cards
                        </button>
                    </div>

                    {/* Visual Credit Card */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700/50 w-fit min-w-75">
                        <div className="p-3 bg-blue-600 rounded-lg text-white shadow-inner">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-200 tracking-wide">•••• •••• •••• 4242</p>
                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                <span>Expires 12/28</span>
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Active
                                </span>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <span className="text-xs font-bold text-slate-600 italic">VISA</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                        <AlertCircle size={14} className="text-sky-400" />
                        Auto-recharge is enabled when balance drops below {currency}10.00
                    </div>
                </DashboardCard>
            </div>

            {/* --- Bottom Section: Invoice History --- */}
            <DashboardCard className="w-full">
                <div className="p-6 border-b border-slate-700/50 flex items-center gap-3 bg-slate-800/30">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                        <History size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Billing History</h3>
                        <p className="text-slate-500 text-xs">Download past invoices</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-[11px] font-bold">
                            <tr>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 italic">
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 italic">
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-300">{inv.ref || `INV-${inv.id}`}</td>
                                        <td className="px-6 py-4 text-slate-400">{inv.date}</td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {currency}{Number(inv.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium border
                                                ${inv.status === 'Paid' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end">
                                                <InvoiceButton
                                                    invoiceId={inv.id}
                                                    year={inv.year || 2026}
                                                    month={inv.month || "01"}
                                                    filename={`Invoice-${inv.ref || inv.id}.pdf`}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DashboardCard>

        </div>
    );
}