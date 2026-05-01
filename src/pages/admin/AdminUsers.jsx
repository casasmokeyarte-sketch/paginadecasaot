import React, { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { User, Phone, MapPin, Search, ShoppingBag, MessageSquare, Sparkles, PencilLine, ShieldCheck, Mail, CalendarDays, ScrollText, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadFileToBucket } from '@/lib/storageUpload';
import MediaPicker from '@/components/admin/MediaPicker';

const EMPTY_FORM = {
  id: '',
  full_name: '',
  phone: '',
  address: '',
  avatar_url: '',
  role: 'cliente',
};

const EMPTY_HISTORY_FILTERS = {
  period: 'all',
  orderStatus: 'all',
  pqrStatus: 'all',
  bookingStatus: 'all',
};

const downloadCsv = (filename, rows) => {
  if (!rows.length) return;

  const escapeCell = (value) => {
    const normalized = value == null ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const isWithinPeriod = (value, period) => {
  if (!value || period === 'all') return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const threshold = new Date(now);

  if (period === '7d') threshold.setDate(now.getDate() - 7);
  if (period === '30d') threshold.setDate(now.getDate() - 30);
  if (period === '90d') threshold.setDate(now.getDate() - 90);

  return date >= threshold;
};

const AdminUsers = () => {
  const { users, orders, pqr, bookings, loading, fetchUsers, fetchOrders, fetchPqr, fetchBookings, updateUserProfile, updateOrderStatus, updateBookingStatus } = useAdminData();
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [historyFilters, setHistoryFilters] = useState(EMPTY_HISTORY_FILTERS);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchPqr();
    fetchBookings();
  }, []);

  const startOfMonth = useMemo(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((entry) => {
      const fullName = entry.full_name?.toLowerCase?.() || '';
      const phone = entry.phone?.toLowerCase?.() || '';
      const role = entry.role?.toLowerCase?.() || '';
      const id = entry.id?.toLowerCase?.() || '';
      const address = entry.address?.toLowerCase?.() || '';
      return (
        fullName.includes(normalizedQuery) ||
        phone.includes(normalizedQuery) ||
        role.includes(normalizedQuery) ||
        id.includes(normalizedQuery) ||
        address.includes(normalizedQuery)
      );
    });
  }, [users, query]);

  const newUsersThisMonth = useMemo(
    () =>
      users.filter((entry) => {
        const candidate = entry.created_at || entry.updated_at;
        return candidate ? new Date(candidate) >= startOfMonth : false;
      }).length,
    [users, startOfMonth]
  );

  const summaries = useMemo(() => {
    const orderCountByUser = orders.reduce((acc, order) => {
      if (!order.user_id) return acc;
      acc[order.user_id] = (acc[order.user_id] || 0) + 1;
      return acc;
    }, {});

    const latestOrderByUser = orders.reduce((acc, order) => {
      if (!order.user_id) return acc;
      const current = acc[order.user_id];
      if (!current || new Date(order.created_at) > new Date(current.created_at)) {
        acc[order.user_id] = order;
      }
      return acc;
    }, {});

    const pqrCountByUser = pqr.reduce((acc, item) => {
      if (!item.user_id) return acc;
      acc[item.user_id] = (acc[item.user_id] || 0) + 1;
      return acc;
    }, {});

    const bookingCountByUser = bookings.reduce((acc, booking) => {
      if (!booking.user_id) return acc;
      acc[booking.user_id] = (acc[booking.user_id] || 0) + 1;
      return acc;
    }, {});

    return filteredUsers.map((entry) => ({
      ...entry,
      ordersCount: orderCountByUser[entry.id] || 0,
      pqrCount: pqrCountByUser[entry.id] || 0,
      bookingsCount: bookingCountByUser[entry.id] || 0,
      latestOrder: latestOrderByUser[entry.id] || null,
    }));
  }, [filteredUsers, orders, pqr, bookings]);

  const historySummary = useMemo(() => {
    if (!historyUser) return null;

    const filterByStatus = (items, key, status) => {
      if (status === 'all') return items;
      return items.filter((entry) => (entry[key] || 'unknown') === status);
    };

    return {
      orders: filterByStatus(
        orders.filter((entry) => entry.user_id === historyUser.id && isWithinPeriod(entry.created_at, historyFilters.period)),
        'status',
        historyFilters.orderStatus
      ),
      pqr: filterByStatus(
        pqr.filter((entry) => entry.user_id === historyUser.id && isWithinPeriod(entry.created_at, historyFilters.period)),
        'status',
        historyFilters.pqrStatus
      ),
      bookings: filterByStatus(
        bookings.filter((entry) => entry.user_id === historyUser.id && isWithinPeriod(entry.created_at, historyFilters.period)),
        'status',
        historyFilters.bookingStatus
      ),
    };
  }, [historyUser, orders, pqr, bookings, historyFilters]);

  const handleOpenEdit = (entry) => {
    setSelectedUser(entry);
    setAvatarFile(null);
    setEditForm({
      id: entry.id,
      full_name: entry.full_name || '',
      phone: entry.phone || '',
      address: entry.address || '',
      avatar_url: entry.avatar_url || '',
      role: entry.role || 'cliente',
    });
  };

  const handleOpenHistory = (entry) => {
    setHistoryUser(entry);
    setHistoryFilters(EMPTY_HISTORY_FILTERS);
  };

  const handleOpenDetails = (entry) => {
    setDetailUser(entry);
  };

  const handleCloseEdit = (open) => {
    if (open) return;
    setSelectedUser(null);
    setAvatarFile(null);
    setEditForm(EMPTY_FORM);
    setIsSaving(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    let avatarUrl = editForm.avatar_url || null;
    try {
      if (avatarFile) {
        avatarUrl = await uploadFileToBucket({
          file: avatarFile,
          bucket: 'avatars',
          folder: 'profiles',
        });
      }
    } catch (error) {
      setIsSaving(false);
      window.alert(error?.message || 'No se pudo subir el avatar.');
      return;
    }

    const { error } = await updateUserProfile(selectedUser.id, {
      full_name: editForm.full_name || null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      avatar_url: avatarUrl,
      role: editForm.role || 'cliente',
    });

    if (!error) {
      setSelectedUser(null);
      setEditForm(EMPTY_FORM);
    }

    setIsSaving(false);
  };

  const exportUsers = () => {
    const rows = [
      ['id', 'full_name', 'role', 'phone', 'email', 'address', 'orders_count', 'pqr_count', 'bookings_count', 'created_or_updated_at'],
      ...summaries.map((entry) => [
        entry.id,
        entry.full_name || '',
        entry.role || 'cliente',
        entry.phone || '',
        entry.email || '',
        entry.address || '',
        entry.ordersCount || 0,
        entry.pqrCount || 0,
        entry.bookingsCount || 0,
        entry.created_at || entry.updated_at || '',
      ]),
    ];

    downloadCsv('admin-users.csv', rows);
  };

  const exportHistory = () => {
    if (!historyUser || !historySummary) return;

    const rows = [
      ['section', 'id', 'status', 'title', 'date', 'extra_1', 'extra_2'],
      ...historySummary.orders.map((entry) => [
        'orders',
        entry.id,
        entry.status || 'pending',
        `Orden #${entry.id?.slice?.(0, 8)?.toUpperCase?.() || entry.id}`,
        entry.created_at || '',
        entry.total_amount ?? '',
        '',
      ]),
      ...historySummary.pqr.map((entry) => [
        'pqr',
        entry.id,
        entry.status || 'open',
        entry.subject || 'Solicitud sin asunto',
        entry.created_at || '',
        entry.email || '',
        entry.phone || '',
      ]),
      ...historySummary.bookings.map((entry) => [
        'bookings',
        entry.id,
        entry.status || 'pending',
        entry.style || 'Cita',
        entry.created_at || '',
        entry.appointment_date || '',
        entry.appointment_time || '',
      ]),
    ];

    const slug = (historyUser.full_name || historyUser.id || 'usuario').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadCsv(`historial-${slug}.csv`, rows);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Perfiles de clientes</h1>
        <p className="text-[#a7a8c7]">Visualiza cuantos usuarios llegan, su actividad y gestiona sus datos principales.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-[#111322] p-5">
          <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">
            <User className="text-[#22d3ee]" size={20} />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7f88af]">Perfiles visibles</p>
          <p className="mt-2 text-3xl font-black text-white">{users.length}</p>
          <p className="mt-2 text-sm text-[#9ea6c9]">Registros actualmente disponibles en `profiles`.</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#111322] p-5">
          <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">
            <Sparkles className="text-[#facc15]" size={20} />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7f88af]">Nuevos del mes</p>
          <p className="mt-2 text-3xl font-black text-white">{newUsersThisMonth}</p>
          <p className="mt-2 text-sm text-[#9ea6c9]">Calculado con `created_at` o `updated_at`.</p>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#111322] p-5">
          <div className="mb-3 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">
            <ShoppingBag className="text-[#4ade80]" size={20} />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7f88af]">Actividad vinculada</p>
          <p className="mt-2 text-3xl font-black text-white">{orders.length + pqr.length}</p>
          <p className="mt-2 text-sm text-[#9ea6c9]">{orders.length} ordenes y {pqr.length} solicitudes PQR registradas.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111322]">
        <div className="flex flex-col gap-4 border-b border-white/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, telefono, rol, direccion o ID..."
              className="w-full rounded-lg border border-white/10 bg-[#050510] py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-[#ff2df0]"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#9ea6c9]">{summaries.length} resultado(s)</p>
            <button
              type="button"
              onClick={exportUsers}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-sm font-medium text-[#a7a8c7]">
              <tr>
                <th className="p-4">Usuario</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Direccion</th>
                <th className="p-4">Actividad</th>
                <th className="p-4">Registro</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#a7a8c7]">Cargando perfiles...</td>
                </tr>
              ) : summaries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#a7a8c7]">No hay perfiles que coincidan con la busqueda.</td>
                </tr>
              ) : (
                summaries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#ff2df0]/20 bg-[#ff2df0]/10 text-[#ff2df0]">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{entry.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-[#a7a8c7]">ID: {entry.id.slice(0, 8)}...</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6f789f]">{entry.role || 'cliente'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#a7a8c7]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone size={14} /> {entry.phone || 'No registrado'}
                        </div>
                        {entry.email ? (
                          <div className="flex items-center gap-2">
                            <Mail size={14} /> {entry.email}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#a7a8c7]">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} /> {entry.address || 'No registrada'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#a7a8c7]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={14} /> {entry.ordersCount} compra(s)
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={14} /> {entry.pqrCount} solicitud(es)
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} /> {entry.bookingsCount} cita(s)
                        </div>
                        <p className="text-xs text-[#6f789f]">
                          {entry.latestOrder?.created_at
                            ? `Ultima orden: ${new Date(entry.latestOrder.created_at).toLocaleDateString()}`
                            : 'Sin ordenes registradas'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#a7a8c7]">
                      {entry.created_at || entry.updated_at
                        ? new Date(entry.created_at || entry.updated_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(entry)}
                        className="mr-2 inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
                      >
                        <Eye size={14} />
                        Detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(entry)}
                        className="mr-2 inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-400/20"
                      >
                        <ScrollText size={14} />
                        Historial
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(entry)}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                      >
                        <PencilLine size={14} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={handleCloseEdit}>
        <DialogContent className="border-white/10 bg-[#111322] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck size={20} className="text-cyan-300" />
              Editar perfil
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#9ea6c9]">ID de usuario</label>
              <input
                type="text"
                value={editForm.id}
                disabled
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-[#7f88af] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#9ea6c9]">Nombre completo</label>
              <input
                type="text"
                name="full_name"
                value={editForm.full_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-white outline-none focus:border-[#22d3ee]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#9ea6c9]">Telefono</label>
              <input
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-white outline-none focus:border-[#22d3ee]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#9ea6c9]">Direccion</label>
              <input
                type="text"
                name="address"
                value={editForm.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-white outline-none focus:border-[#22d3ee]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#9ea6c9]">URL del avatar</label>
              <input
                type="url"
                name="avatar_url"
                value={editForm.avatar_url}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-white outline-none focus:border-[#22d3ee]"
              />
            </div>

            <div className="md:col-span-2">
              <MediaPicker
                label="Avatar del usuario"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                file={avatarFile}
                onChange={setAvatarFile}
                previewUrl={!avatarFile ? editForm.avatar_url : ''}
                helperText="Puedes cambiar la foto por URL o adjuntarla desde tu equipo."
                type="image"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[#9ea6c9]">Rol</label>
              <select
                name="role"
                value={editForm.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-sm text-white outline-none focus:border-[#22d3ee]"
              >
                <option value="cliente">cliente</option>
                <option value="admin">admin</option>
                <option value="administrador">administrador</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <button
              type="button"
              onClick={() => handleCloseEdit(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#a7a8c7] transition hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#38bdf8] px-4 py-2 text-sm font-semibold text-[#050510] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailUser)} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="border-white/10 bg-[#111322] text-white sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Eye size={20} className="text-amber-300" />
              Detalle del usuario
            </DialogTitle>
          </DialogHeader>

          {detailUser ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-[auto,1fr]">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-3xl font-black text-white">
                  {detailUser.avatar_url ? (
                    <img src={detailUser.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    (detailUser.full_name || detailUser.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{detailUser.full_name || 'Sin nombre'}</p>
                  <p className="mt-1 text-sm text-[#a7a8c7]">{detailUser.email || 'Sin email en profiles'}</p>
                  <p className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                    {detailUser.role || 'cliente'}
                  </p>
                  <p className="mt-3 break-all text-xs text-[#7f88af]">ID: {detailUser.id}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Compras</p>
                  <p className="mt-2 text-3xl font-black text-white">{orders.filter((entry) => entry.user_id === detailUser.id).length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">PQR</p>
                  <p className="mt-2 text-3xl font-black text-white">{pqr.filter((entry) => entry.user_id === detailUser.id).length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Citas</p>
                  <p className="mt-2 text-3xl font-black text-white">{bookings.filter((entry) => entry.user_id === detailUser.id).length}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#050510] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Contacto</p>
                  <div className="mt-3 space-y-3 text-sm text-[#d8def8]">
                    <p className="flex items-center gap-2"><Mail size={14} /> {detailUser.email || 'No disponible'}</p>
                    <p className="flex items-center gap-2"><Phone size={14} /> {detailUser.phone || 'No registrado'}</p>
                    <p className="flex items-center gap-2"><MapPin size={14} /> {detailUser.address || 'No registrada'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#050510] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Seguimiento</p>
                  <div className="mt-3 space-y-3 text-sm text-[#d8def8]">
                    <p>Creado/actualizado: {detailUser.created_at || detailUser.updated_at ? new Date(detailUser.created_at || detailUser.updated_at).toLocaleString() : 'Sin fecha'}</p>
                    <p>Ultima orden: {orders.find((entry) => entry.user_id === detailUser.id)?.created_at ? new Date(orders.find((entry) => entry.user_id === detailUser.id).created_at).toLocaleString() : 'Sin ordenes'}</p>
                    <p>Ultima cita: {bookings.find((entry) => entry.user_id === detailUser.id)?.created_at ? new Date(bookings.find((entry) => entry.user_id === detailUser.id).created_at).toLocaleString() : 'Sin citas'}</p>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Ordenes del usuario</h3>
                {orders.filter((entry) => entry.user_id === detailUser.id).length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0d1020] p-4 text-sm text-[#a7a8c7]">Sin ordenes registradas.</p>
                ) : (
                  orders.filter((entry) => entry.user_id === detailUser.id).slice(0, 5).map((order) => (
                    <div key={order.id} className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-white">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#cbd2f1]">{order.status || 'pending'}</span>
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'pending')}
                            className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100"
                          >
                            Reactivar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Citas del usuario</h3>
                {bookings.filter((entry) => entry.user_id === detailUser.id).length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0d1020] p-4 text-sm text-[#a7a8c7]">Sin citas registradas.</p>
                ) : (
                  bookings.filter((entry) => entry.user_id === detailUser.id).slice(0, 5).map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-white">{booking.style || 'Cita'}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">{booking.appointment_date || '-'} {booking.appointment_time || ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#cbd2f1]">{booking.status || 'pending'}</span>
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100"
                          >
                            Reactivar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <DialogFooter className="gap-3">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-[#a7a8c7] transition hover:bg-white/5"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailUser(null);
                    handleOpenHistory(detailUser);
                  }}
                  className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-400/20"
                >
                  Ver historial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailUser(null);
                    handleOpenEdit(detailUser);
                  }}
                  className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#38bdf8] px-4 py-2 text-sm font-semibold text-[#050510] transition hover:opacity-90"
                >
                  Editar usuario
                </button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyUser)} onOpenChange={(open) => !open && setHistoryUser(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#111322] text-white sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ScrollText size={20} className="text-violet-300" />
              Historial de usuario
            </DialogTitle>
          </DialogHeader>

          {historyUser && historySummary ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#050510] p-4">
                <p className="text-lg font-semibold text-white">{historyUser.full_name || 'Sin nombre'}</p>
                <p className="mt-1 text-sm text-[#a7a8c7]">ID: {historyUser.id}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#7f88af]">{historyUser.role || 'cliente'}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Compras</p>
                  <p className="mt-2 text-3xl font-black text-white">{historySummary.orders.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">PQR</p>
                  <p className="mt-2 text-3xl font-black text-white">{historySummary.pqr.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Citas</p>
                  <p className="mt-2 text-3xl font-black text-white">{historySummary.bookings.length}</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0d1020] p-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Periodo</label>
                  <select
                    value={historyFilters.period}
                    onChange={(event) => setHistoryFilters((current) => ({ ...current, period: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Todo</option>
                    <option value="7d">Ultimos 7 dias</option>
                    <option value="30d">Ultimos 30 dias</option>
                    <option value="90d">Ultimos 90 dias</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Estado orden</label>
                  <select
                    value={historyFilters.orderStatus}
                    onChange={(event) => setHistoryFilters((current) => ({ ...current, orderStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Estado PQR</label>
                  <select
                    value={historyFilters.pqrStatus}
                    onChange={(event) => setHistoryFilters((current) => ({ ...current, pqrStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="open">open</option>
                    <option value="replied">replied</option>
                    <option value="closed">closed</option>
                    <option value="pending">pending</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-[#7f88af]">Estado cita</label>
                  <select
                    value={historyFilters.bookingStatus}
                    onChange={(event) => setHistoryFilters((current) => ({ ...current, bookingStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={exportHistory}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  <Download size={14} />
                  Exportar historial CSV
                </button>
              </div>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Ordenes</h3>
                {historySummary.orders.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0d1020] p-4 text-sm text-[#a7a8c7]">No hay compras registradas.</p>
                ) : (
                  historySummary.orders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm uppercase tracking-[0.18em] text-[#7f88af]">{order.status || 'pending'}</p>
                          <p className="mt-1 font-semibold text-cyan-300">
                            {typeof order.total_amount === 'number'
                              ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total_amount)
                              : 'Total no disponible'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Solicitudes PQR</h3>
                {historySummary.pqr.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0d1020] p-4 text-sm text-[#a7a8c7]">No hay solicitudes registradas.</p>
                ) : (
                  historySummary.pqr.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{item.subject || 'Solicitud sin asunto'}</p>
                          <p className="mt-2 text-sm text-[#cbd2f1]">{item.message || 'Sin mensaje disponible.'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm uppercase tracking-[0.18em] text-[#7f88af]">{item.status || 'open'}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Citas</h3>
                {historySummary.bookings.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#0d1020] p-4 text-sm text-[#a7a8c7]">No hay citas registradas.</p>
                ) : (
                  historySummary.bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-white/10 bg-[#0d1020] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{booking.style || 'Cita sin estilo'}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">
                            {booking.appointment_date || '-'} {booking.appointment_time ? `• ${booking.appointment_time}` : ''}
                          </p>
                          <p className="mt-2 text-sm text-[#cbd2f1]">Artista: {booking.artist || 'No asignado'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm uppercase tracking-[0.18em] text-[#7f88af]">{booking.status || 'pending'}</p>
                          <p className="mt-1 text-sm text-[#a7a8c7]">{booking.created_at ? new Date(booking.created_at).toLocaleString() : '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
