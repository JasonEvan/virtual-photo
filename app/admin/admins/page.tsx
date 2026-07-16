"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AdminUser | null>(null);

  // Form inputs
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchAdmins();
    }, 0);
  }, [fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Admin baru berhasil ditambahkan");
        setUsernameInput("");
        setPasswordInput("");
        setShowAddModal(false);
        fetchAdmins();
      } else {
        setFormError(data.error || "Gagal menambahkan admin");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal || submitting) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${showEditModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput || undefined, // Send only if not empty
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Detail admin berhasil diperbarui");
        setUsernameInput("");
        setPasswordInput("");
        setShowEditModal(null);
        fetchAdmins();
      } else {
        setFormError(data.error || "Gagal memperbarui admin");
      }
    } catch (err) {
      console.error(err);
      setFormError("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus admin ini?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Admin berhasil dihapus");
        fetchAdmins();
      } else {
        alert(data.error || "Gagal menghapus admin");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight">
            Kelola Admin
          </h1>
          <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
            Daftar akun admin yang memiliki akses ke dashboard VirtualPhoto
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setUsernameInput("");
            setPasswordInput("");
            setFormError(null);
            setShowAddModal(true);
          }}
          className="bg-[#1C1815] hover:bg-[#2A2420] text-dark-text px-4.5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98] self-start sm:self-auto"
        >
          <i className="ti ti-user-plus text-base" />
          Tambah Admin
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">
          Memuat...
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl py-12 px-6 text-center">
          <p className="text-text-muted text-sm font-medium">Tidak ada admin terdaftar.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EDE8DF] border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-primary">
                  <th className="px-6 py-4.5">Username</th>
                  <th className="px-6 py-4.5">Tanggal Dibuat</th>
                  <th className="px-6 py-4.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-accent-hover/30 transition-colors">
                    <td className="px-6 py-4 text-[13.5px] font-semibold text-text-primary">
                      {admin.username}
                    </td>
                    <td className="px-6 py-4 text-[12.5px] text-text-muted">
                      {new Date(admin.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUsernameInput(admin.username);
                            setPasswordInput("");
                            setFormError(null);
                            setShowEditModal(admin);
                          }}
                          className="w-8 h-8 rounded-lg border border-border hover:bg-[#EDE8DF] flex items-center justify-center text-text-primary cursor-pointer transition-colors"
                          title="Edit Admin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-text-primary">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="w-8 h-8 rounded-lg border border-red-200 hover:bg-red-50 flex items-center justify-center text-red-500 cursor-pointer transition-colors"
                          title="Hapus Admin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD ADMIN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,21,0.6)] backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-100 bg-[#F7F3ED] border border-border rounded-3xl p-6.5 mx-4 shadow-xl animate-[modalIn_0.25s_ease-out]">
            <h3 className="text-[17px] font-bold text-text-primary mb-1">
              Tambah Admin Baru
            </h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Buat kredensial admin baru untuk login ke console.
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-3 text-[12.5px] text-center flex items-center justify-center gap-1.5">
                  <i className="ti ti-alert-circle" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5 pl-0.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Contoh: admin_nikah"
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5 pl-0.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-border rounded-xl py-2.5 text-[13px] font-semibold text-text-primary hover:bg-[#EDE8DF] cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-dark text-dark-text rounded-xl py-2.5 text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-dark-hover transition-colors disabled:opacity-50"
                >
                  <i className="ti ti-device-floppy" />
                  {submitting ? "..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,21,0.6)] backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="w-full max-w-100 bg-[#F7F3ED] border border-border rounded-3xl p-6.5 mx-4 shadow-xl animate-[modalIn_0.25s_ease-out]">
            <h3 className="text-[17px] font-bold text-text-primary mb-1">
              Edit Akun Admin
            </h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Perbarui username atau ubah password admin ini.
            </p>

            <form onSubmit={handleEditAdmin} className="space-y-4">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl p-3 text-[12.5px] text-center flex items-center justify-center gap-1.5">
                  <i className="ti ti-alert-circle" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5 pl-0.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1.5 pl-0.5">
                  Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin diubah"
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-[13.5px] text-text-primary bg-white outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/40 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 border border-border rounded-xl py-2.5 text-[13px] font-semibold text-text-primary hover:bg-[#EDE8DF] cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-dark text-dark-text rounded-xl py-2.5 text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-dark-hover transition-colors disabled:opacity-50"
                >
                  <i className="ti ti-device-floppy" />
                  {submitting ? "..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark text-dark-text rounded-full px-5 py-3 text-[13px] flex items-center gap-2 shadow-lg animate-[fadeIn_0.2s_ease]">
          <i className="ti ti-check text-success" />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
