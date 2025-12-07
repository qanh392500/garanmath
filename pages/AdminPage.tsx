import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserData {
    id: number | string;
    name: string;
    email: string;
    role: string;
    hasApiKey: boolean;
    created_at: string;
    last_login?: string;
    ip_address?: string;
    request_count?: number;
}

const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/admin/users`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUsers(data.users);
                } else {
                    setError(data.message || 'Failed to fetch users');
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                setError(errorData.message || 'Failed to fetch users. Access denied?');
            }
        } catch (err: any) {
            setError('Error fetching users: ' + (err.message || 'Network error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUsers(users.filter(u => u.id !== id));
                } else {
                    alert('Failed to delete user: ' + (data.message || 'Unknown error'));
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert('Failed to delete user: ' + (errorData.message || 'Unknown error'));
            }
        } catch (err: any) {
            alert('Error deleting user: ' + (err.message || 'Network error'));
        }
    };

    const handleSyncRag = async () => {
        const apiKey = window.prompt("Enter your Gemini API Key to sync RAG:");
        if (!apiKey) return;

        setIsLoading(true);
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/admin/rag/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ apiKey })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
            } else {
                alert("Failed to sync: " + (data.error || data.message || 'Unknown error'));
            }
        } catch (err: any) {
            alert("Error syncing RAG: " + (err.message || 'Network error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSyncRag}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/20"
                        >
                            Sync RAG
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Back to App
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">ID</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Name</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Email</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Role</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">API Key</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Requests</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Last Login / IP</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Created At</th>
                                    <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">Loading users...</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">No users found.</td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-slate-600 dark:text-slate-400">#{String(u.id).slice(-6)}</td>
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">{u.name}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {u.hasApiKey ? (
                                                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">YES</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">NO</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 text-xs font-bold">
                                                    {u.request_count || 0}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-900 dark:text-white">
                                                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono mt-0.5">
                                                        {u.ip_address || 'Unknown IP'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                {u.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
