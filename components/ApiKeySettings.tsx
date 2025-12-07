import React, { useState, useEffect } from 'react';

interface ApiKeySettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [keyName, setKeyName] = useState('');
    const [savedKeyName, setSavedKeyName] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchApiKey();
        }
    }, [isOpen]);

    const fetchApiKey = async () => {
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/user/apikey`, {
                credentials: 'include'
            });

            if (res.status === 401 || res.status === 403) {
                console.warn("Unauthorized access to API key settings");
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.apiKey) {
                    setApiKey(data.apiKey);
                    setHasKey(true);
                    setSavedKeyName(data.keyName || 'My Gemini Key');
                    setKeyName(data.keyName || 'My Gemini Key');
                    setIsEditing(false);
                } else {
                    setHasKey(false);
                    setIsEditing(true);
                    setApiKey('');
                    setKeyName('');
                }
            }
        } catch (err) {
            console.error("Failed to fetch API key", err);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/user/apikey`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ apiKey, keyName })
            });

            if (res.ok) {
                setStatus('success');
                setMessage('API Key saved successfully! Reloading...');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setStatus('error');
                setMessage('Failed to save API Key.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage('Error saving API Key: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleTest = async () => {
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/test-apikey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ apiKey })
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.error || 'Invalid API Key.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage('Error testing API Key: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your API Key?")) return;
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            const res = await fetch(`${API_URL}/api/user/apikey`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setStatus('success');
                setMessage('API Key deleted successfully! Reloading...');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setStatus('error');
                setMessage('Failed to delete API Key.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage('Error deleting API Key: ' + (err.message || err));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gemini API Key</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Enter your Gemini API Key to use your own quota. Your key is stored securely on our server.
                </p>

                <div className="space-y-4">
                    {!isEditing && hasKey ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{savedKeyName}</span>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Active</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-sm">
                                <span>{apiKey.substring(0, 3)}••••••••••••••••••••••</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium"
                                >
                                    Change Key
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Name</label>
                                <input
                                    type="text"
                                    value={keyName}
                                    onChange={(e) => setKeyName(e.target.value)}
                                    placeholder="e.g. My Personal Key"
                                    autoComplete="off"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${status === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleTest}
                                    disabled={isLoading || !apiKey}
                                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    Test Key
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {isLoading ? 'Saving...' : 'Save Key'}
                                </button>
                            </div>
                            {hasKey && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setKeyName(savedKeyName);
                                    }}
                                    className="w-full mt-2 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApiKeySettings;
