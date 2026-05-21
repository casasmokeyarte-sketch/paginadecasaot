import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import {
  FileText, Plus, Printer, X, CheckCircle, XCircle,
  DollarSign, Search, Eye, Clock, AlertCircle, Package
} from 'lucide-react';

const IVA_RATE = 0.19;
const COMPANY = {
  name: 'Casa Smoke y Arte SSOT S.A.S',
  nit: '901.XXX.XXX-X',
  address: 'Calle 63B #22-16, Barrio Muequeta, Bogotá',
  phone: '302 300 71 93',
  email: 'casasmokeyarte@casasmokeyarte.com',
};

const STATUS_STYLES = {
  borrador:   { label: 'Borrador',    cls: 'text-yellow-400 bg-yellow-400/10' },
  emitida:    { label: 'Emitida',     cls: 'text-blue-400 bg-blue-400/10' },
  pagada:     { label: 'Pagada',      cls: 'text-green-400 bg-green-400/10' },
  anulada:    { label: 'Anulada',     cls: 'text-red-400 bg-red-400/10' },
};

const COP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n ?? 0);

// ─── Print view ──────────────────────────────────────────────────────────────
const PrintInvoice = React.forwardRef(({ invoice }, ref) => {
  const subtotal = Number(invoice.subtotal || 0);
  const tax     = Number(invoice.tax_amount || 0);
  const total   = Number(invoice.total_amount || 0);

  return (
    <div ref={ref} className="bg-white text-gray-900 p-10 max-w-2xl mx-auto text-sm font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{COMPANY.name}</h1>
          <p className="text-xs text-gray-500 mt-1">NIT: {COMPANY.nit}</p>
          <p className="text-xs text-gray-500">{COMPANY.address}</p>
          <p className="text-xs text-gray-500">Tel: {COMPANY.phone}</p>
          <p className="text-xs text-gray-500">{COMPANY.email}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-pink-600">FACTURA</p>
          <p className="text-lg font-bold">{invoice.invoice_number}</p>
          <p className="text-xs text-gray-500 mt-1">
            Fecha: {new Date(invoice.issued_at || invoice.created_at).toLocaleDateString('es-CO')}
          </p>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold uppercase
            ${invoice.status === 'pagada' ? 'bg-green-100 text-green-700' :
              invoice.status === 'anulada' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'}`}>
            {STATUS_STYLES[invoice.status]?.label || invoice.status}
          </span>
        </div>
      </div>

      {/* Client */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos del Cliente</p>
        <p className="font-bold">{invoice.client_name}</p>
        {invoice.client_nit   && <p className="text-xs text-gray-500">NIT/CC: {invoice.client_nit}</p>}
        {invoice.client_email && <p className="text-xs text-gray-500">{invoice.client_email}</p>}
        {invoice.client_phone && <p className="text-xs text-gray-500">Tel: {invoice.client_phone}</p>}
        {invoice.client_address && <p className="text-xs text-gray-500">{invoice.client_address}</p>}
      </div>

      {/* Items */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white text-xs">
            <th className="p-2 text-left rounded-tl">Descripción</th>
            <th className="p-2 text-center">Cant.</th>
            <th className="p-2 text-right">Precio Unit.</th>
            <th className="p-2 text-right rounded-tr">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="p-2 border-b border-gray-100">{item.name}</td>
              <td className="p-2 text-center border-b border-gray-100">{item.quantity}</td>
              <td className="p-2 text-right border-b border-gray-100">{COP(item.unit_price)}</td>
              <td className="p-2 text-right border-b border-gray-100">{COP(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span><span>{COP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IVA ({invoice.tax_rate ?? 19}%)</span><span>{COP(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-black border-t border-gray-900 pt-1 mt-1">
            <span>TOTAL</span><span className="text-pink-600">{COP(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      {invoice.notes && (
        <p className="text-xs text-gray-400 italic mb-4">Notas: {invoice.notes}</p>
      )}
      <p className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        Gracias por tu preferencia · {COMPANY.name} · {COMPANY.phone}
      </p>
    </div>
  );
});
PrintInvoice.displayName = 'PrintInvoice';

// ─── Main component ───────────────────────────────────────────────────────────
const AdminBilling = () => {
  const {
    invoices, loadingInvoices, fetchInvoices,
    orders, fetchOrders,
    createInvoice, updateInvoiceStatus,
  } = useAdminData();
  const { products, fetchProducts } = useSupabaseData();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [viewInvoice, setView]       = useState(null);   // invoice being previewed
  const [showNew, setShowNew]        = useState(false);  // new invoice modal
  const [selectedOrder, setSelOrder] = useState('');
  const [manualClient, setManual]    = useState({ name: '', email: '', phone: '', address: '', nit: '' });
  const [manualItems, setItems]      = useState([{ product_id: '', name: '', quantity: 1, unit_price: 0 }]);
  const [payMethod, setPayMethod]    = useState('efectivo');
  const [notes, setNotes]            = useState('');
  const [saving, setSaving]          = useState(false);
  const printRef = useRef(null);

  useEffect(() => { fetchInvoices(); fetchOrders(); fetchProducts(); }, []);

  // Refrescar productos cada vez que se abre el modal de nueva factura
  useEffect(() => {
    if (showNew) fetchProducts();
  }, [showNew]);

  // Pre-fill from order
  useEffect(() => {
    if (!selectedOrder) return;
    const order = orders.find(o => o.id === selectedOrder);
    if (!order) return;
    setManual({
      name: order.client_name || order.customer_name || '',
      email: order.client_email || '',
      phone: order.client_phone || '',
      address: order.shipping_address || '',
      nit: '',
    });
    if (Array.isArray(order.items)) {
      setItems(order.items.map(i => ({
        name: i.name || i.title || '',
        quantity: i.quantity || 1,
        unit_price: i.price || i.unit_price || 0,
      })));
    }
  }, [selectedOrder, orders]);

  const computedSubtotal = manualItems.reduce((s, i) => s + (Number(i.unit_price) * Number(i.quantity)), 0);
  const computedTax      = computedSubtotal * IVA_RATE;
  const computedTotal    = computedSubtotal + computedTax;

  const handleAddItem  = () => setItems(p => [...p, { product_id: '', name: '', quantity: 1, unit_price: 0 }]);
  const handleRemItem  = (idx) => setItems(p => p.filter((_, i) => i !== idx));
  const handleItemChg  = (idx, field, val) => setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: val } : it));

  const handleItemProductSelect = (idx, productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setItems(p => p.map((it, i) => i === idx ? { ...it, product_id: prod.id, name: prod.name, unit_price: prod.price } : it));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!manualClient.name) return;
    setSaving(true);
    try {
      await createInvoice({
        order_id: selectedOrder || null,
        client_name: manualClient.name,
        client_email: manualClient.email,
        client_phone: manualClient.phone,
        client_address: manualClient.address,
        client_nit: manualClient.nit,
        items: manualItems.map(i => ({
          product_id: i.product_id || null,
          name: i.name,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          subtotal: Number(i.unit_price) * Number(i.quantity),
        })),
        subtotal: computedSubtotal,
        tax_rate: IVA_RATE * 100,
        tax_amount: computedTax,
        total_amount: computedTotal,
        payment_method: payMethod,
        notes,
        status: 'emitida',
        issued_at: new Date().toISOString(),
      });
      setShowNew(false);
      setSelOrder(''); setManual({ name:'',email:'',phone:'',address:'',nit:'' });
      setItems([{ product_id:'', name:'', quantity:1, unit_price:0 }]); setNotes(''); setPayMethod('efectivo');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Factura</title>
      <style>@media print{body{margin:0}}body{font-family:sans-serif}</style>
      </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const filtered = (invoices || []).filter(inv => {
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchSearch = !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="text-[#ff2df0]" size={30} /> Facturación
          </h1>
          <p className="text-[#a7a8c7]">Genera y gestiona facturas conectadas a tus órdenes.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff2df0] hover:bg-[#d91cb8] text-white font-bold rounded-xl transition-colors"
        >
          <Plus size={18} /> Nueva Factura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_STYLES).map(([key, val]) => {
          const count = (invoices || []).filter(i => i.status === key).length;
          return (
            <div key={key} className="bg-[#111322] border border-white/5 rounded-xl p-4">
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${val.cls.split(' ')[0]}`}>{val.label}</p>
              <p className="text-3xl font-black text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={16} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por # factura o cliente..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111322] border border-white/10 rounded-xl text-white placeholder:text-[#a7a8c7] focus:border-[#ff2df0] outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-[#111322] border border-white/10 rounded-xl text-white outline-none text-sm"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111322] border border-white/5 rounded-2xl overflow-hidden">
        {loadingInvoices ? (
          <p className="p-8 text-[#a7a8c7] text-center">Cargando facturas...</p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-[#a7a8c7] mb-3" size={40} />
            <p className="text-[#a7a8c7]">No hay facturas. Crea la primera desde una orden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[#a7a8c7] text-xs uppercase tracking-wider">
                  <th className="p-4 text-left"># Factura</th>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Fecha</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-[#00e5ff]">{inv.invoice_number}</td>
                    <td className="p-4 text-white">{inv.client_name}</td>
                    <td className="p-4 text-[#a7a8c7]">
                      {new Date(inv.issued_at || inv.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="p-4 text-right font-bold text-[#ff2df0]">{COP(inv.total_amount)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[inv.status]?.cls}`}>
                        {STATUS_STYLES[inv.status]?.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setView(inv)} className="p-1.5 rounded-lg bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20" title="Ver"><Eye size={16}/></button>
                        {inv.status !== 'pagada' && inv.status !== 'anulada' && (
                          <button onClick={() => updateInvoiceStatus(inv.id, 'pagada')} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20" title="Marcar pagada"><CheckCircle size={16}/></button>
                        )}
                        {inv.status !== 'anulada' && (
                          <button onClick={() => { if(window.confirm('¿Anular esta factura?')) updateInvoiceStatus(inv.id, 'anulada'); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Anular"><XCircle size={16}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Invoice Modal ── */}
      <AnimatePresence>
        {viewInvoice && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-white rounded-2xl w-full max-w-2xl my-8 relative">
              <div className="flex items-center justify-between p-4 bg-gray-900 rounded-t-2xl">
                <h2 className="text-white font-bold">Vista previa — {viewInvoice.invoice_number}</h2>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff2df0] text-white rounded-lg text-sm font-bold hover:bg-[#d91cb8]">
                    <Printer size={16}/> Imprimir / PDF
                  </button>
                  <button onClick={() => setView(null)} className="p-1.5 text-white hover:text-[#ff2df0]"><X size={20}/></button>
                </div>
              </div>
              <PrintInvoice ref={printRef} invoice={viewInvoice} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Invoice Modal ── */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#111322] border border-white/10 rounded-2xl w-full max-w-2xl my-8">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plus size={20} className="text-[#ff2df0]"/> Nueva Factura</h2>
                <button onClick={() => setShowNew(false)} className="text-[#a7a8c7] hover:text-white"><X size={22}/></button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {/* Link to order */}
                <div>
                  <label className="block text-xs font-bold text-[#a7a8c7] uppercase tracking-wider mb-1">
                    Vincular con Orden (opcional)
                  </label>
                  <select
                    value={selectedOrder} onChange={e => setSelOrder(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-white text-sm outline-none"
                  >
                    <option value="">— Sin orden vinculada —</option>
                    {(orders || []).map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(0,8).toUpperCase()} — {COP(o.total_amount)} — {o.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client data */}
                <div>
                  <p className="text-xs font-bold text-[#a7a8c7] uppercase tracking-wider mb-3">Datos del Cliente</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ['name','Nombre *','text',true],
                      ['nit','NIT / Cédula','text',false],
                      ['email','Email','email',false],
                      ['phone','Teléfono','tel',false],
                      ['address','Dirección','text',false],
                    ].map(([field, placeholder, type, required]) => (
                      <input key={field} type={type} required={required} placeholder={placeholder}
                        value={manualClient[field]}
                        onChange={e => setManual(p => ({...p, [field]: e.target.value}))}
                        className="px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-[#ff2df0]"
                      />
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#a7a8c7] uppercase tracking-wider">Productos / Servicios</p>
                    <button type="button" onClick={handleAddItem} className="text-xs text-[#ff2df0] hover:underline flex items-center gap-1"><Plus size={12}/> Agregar</button>
                  </div>
                  <div className="space-y-3">
                    {manualItems.map((item, idx) => (
                      <div key={idx} className="space-y-1.5 p-3 bg-[#050510] rounded-xl border border-white/5">
                        {/* Selector de producto (opcional) */}
                        <select
                          value={item.product_id || ''}
                          onChange={e => e.target.value ? handleItemProductSelect(idx, e.target.value) : handleItemChg(idx,'product_id','')}
                          className="w-full px-3 py-2 bg-[#111322] border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[#ff2df0]"
                        >
                          <option value="">— Ingreso manual o selecciona producto —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} · {COP(p.price)} · Stock: {p.stock ?? 0}
                            </option>
                          ))}
                        </select>
                        {/* Campos manuales */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input placeholder="Descripción" value={item.name}
                            onChange={e => handleItemChg(idx,'name',e.target.value)}
                            className="col-span-5 px-3 py-2 bg-[#111322] border border-white/10 rounded-lg text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-[#ff2df0]"
                          />
                          <input type="number" min="1" placeholder="Cant." value={item.quantity}
                            onChange={e => handleItemChg(idx,'quantity',e.target.value)}
                            className="col-span-2 px-3 py-2 bg-[#111322] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-[#ff2df0]"
                          />
                          <input type="number" min="0" placeholder="Precio" value={item.unit_price}
                            onChange={e => handleItemChg(idx,'unit_price',e.target.value)}
                            className="col-span-4 px-3 py-2 bg-[#111322] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-[#ff2df0]"
                          />
                          <button type="button" onClick={() => handleRemItem(idx)} className="col-span-1 text-red-400 hover:text-red-300"><X size={16}/></button>
                        </div>
                        {item.product_id && (
                          <p className="text-xs text-[#ff2df0]/70 pl-1">✓ Stock se descontará al emitir</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Totals preview */}
                  <div className="mt-4 p-3 bg-[#050510] rounded-lg text-sm space-y-1 text-right">
                    <div className="flex justify-between text-[#a7a8c7]"><span>Subtotal</span><span>{COP(computedSubtotal)}</span></div>
                    <div className="flex justify-between text-[#a7a8c7]"><span>IVA 19%</span><span>{COP(computedTax)}</span></div>
                    <div className="flex justify-between font-black text-white text-base border-t border-white/10 pt-1"><span>TOTAL</span><span className="text-[#ff2df0]">{COP(computedTotal)}</span></div>
                  </div>
                </div>

                {/* Payment & notes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#a7a8c7] mb-1">Método de pago</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-white text-sm outline-none">
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="nequi">Nequi / Daviplata</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#a7a8c7] mb-1">Notas</label>
                    <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..."
                      className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-[#ff2df0]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowNew(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-[#a7a8c7] hover:text-white text-sm">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#ff2df0] hover:bg-[#d91cb8] text-white font-bold rounded-xl text-sm disabled:opacity-60">
                    {saving ? 'Guardando...' : 'Emitir Factura'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBilling;
