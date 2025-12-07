import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PromotePage: React.FC = () => {
    const [secretCode, setSecretCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, checkAuth, isAuthenticated, isLoading: authLoading } = useAuth();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handlePromote = async () => {
        if (!secretCode) return;
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/admin/promote-me`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ secretCode })
            });

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                setError(`Server error: ${res.status} ${res.statusText}. ${text.substring(0, 100)}`);
                return;
            }

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage(data.message);
                // Update user context with new role
                if (data.user) {
                    login(data.user);
                }
                // Refresh auth to get latest user data
                await checkAuth();
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setError(data.error || data.message || 'Failed to promote');
            }
        } catch (err: any) {
            console.error('Promote error:', err);
            setError("Error: " + (err.message || 'Network error or server not responding'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-800">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Admin Promotion</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Enter the secret code to elevate your privileges.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Secret Code</label>
                        <input
                            type="password"
                            value={secretCode}
                            onChange={(e) => setSecretCode(e.target.value)}
                            placeholder="Enter code..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    {message && (
                        <div className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-sm text-center">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handlePromote}
                        disabled={isLoading || !secretCode}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? 'Verifying...' : 'Promote Me'}
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
                    >
                        Back to App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromotePage;
