import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PromotePage: React.FC = () => {
    const [secretCode, setSecretCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handlePromote = async () => {
        if (!secretCode) return;
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('http://localhost:3001/api/admin/promote-me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ secretCode })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    window.location.href = '/'; // Force reload to update user role in context
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError("Error: " + err.message);
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
