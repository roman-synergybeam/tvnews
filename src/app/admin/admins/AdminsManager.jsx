'use client';
import { useState } from 'react';

const ROLE_LABEL = { super_admin: 'Super admin', editor: 'Editor' };

export default function AdminsManager({ initialUsers, meId, departments = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');

  async function remove(u) {
    if (!confirm(`Delete admin "${u.email}"?`)) return;
    setError('');
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error || 'Delete failed');
    setUsers((list) => list.filter((x) => x.id !== u.id));
  }

  return (
    <>
      <div className="admin-topbar">
        <h1>Admins</h1>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          + Add admin
        </button>
      </div>
      <div className="admin-content">
        {error ? <div className="error">{error}</div> : null}
        <div className="notice">
          <b>Super admins</b> manage accounts, pages and TVs. <b>Editors</b> manage pages and TVs but cannot
          manage other admins.
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.name || '—'}</b>
                  {u.id === meId ? <span className="muted"> (you)</span> : null}
                </td>
                <td className="mono">{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'super_admin' ? 'badge-super' : 'badge-role'}`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                </td>
                <td className="muted">
                  {u.role === 'super_admin' ? 'All' : u.department ? u.department : <span className="muted">All (unscoped)</span>}
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => remove(u)}
                      disabled={u.id === meId}
                      title={u.id === meId ? 'You cannot delete your own account' : ''}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen ? (
        <UserModal
          title="Add admin"
          requirePassword
          departments={departments}
          onClose={() => setAddOpen(false)}
          onSubmit={async (payload) => {
            const res = await fetch('/api/admin/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed');
            setUsers((list) => [...list, json.user]);
            setAddOpen(false);
          }}
        />
      ) : null}

      {editUser ? (
        <UserModal
          title={`Edit ${editUser.email}`}
          initial={editUser}
          editing
          departments={departments}
          onClose={() => setEditUser(null)}
          onSubmit={async (payload) => {
            const res = await fetch(`/api/admin/users/${editUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed');
            setUsers((list) => list.map((x) => (x.id === editUser.id ? json.user : x)));
            setEditUser(null);
          }}
        />
      ) : null}
    </>
  );
}

function UserModal({ title, initial, requirePassword, editing, departments = [], onClose, onSubmit }) {
  const [email, setEmail] = useState(initial?.email || '');
  const [name, setName] = useState(initial?.name || '');
  const [role, setRole] = useState(initial?.role || 'editor');
  const [department, setDepartment] = useState(initial?.department || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { name, role, department: role === 'editor' ? department : '' };
      if (!editing) payload.email = email;
      if (password) payload.password = password;
      await onSubmit(payload);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{title}</h2>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={editing}
            required={!editing}
          />
        </label>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="super_admin">Super admin</option>
          </select>
        </label>
        {role === 'editor' ? (
          <label className="field">
            <span>Department <small>— blank = sees all; set one to scope this editor</small></span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="(none — full access)"
              list="admin-dept-list"
            />
            <datalist id="admin-dept-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </label>
        ) : null}
        <label className="field">
          <span>
            Password {editing ? <small>— leave blank to keep current</small> : <small>— min 8 characters</small>}
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={requirePassword}
            autoComplete="new-password"
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
