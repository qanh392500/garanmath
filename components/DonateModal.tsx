import React from 'react';
import qrCode from '../pages/qr.jpg';

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const donors = [
        { name: "Nguyễn Văn A", amount: "50.000đ", message: "Cảm ơn app rất hay!" },
        { name: "Trần Thị B", amount: "100.000đ", message: "Mong app phát triển thêm." },
        { name: "Lê Văn C", amount: "20.000đ", message: "" },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="text-rose-500">❤</span> Donate
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Ủng hộ Garanmath để duy trì server nhé!
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 mb-4">
                            <img src={qrCode} alt="QR Code Donate" className="w-48 h-48 object-contain" />
                        </div>
                        <p className="text-center text-slate-600 dark:text-slate-300 font-medium">
                            Quét mã QR để ủng hộ qua Momo/Bank
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                            Danh sách ủng hộ
                        </h3>
                        {donors.length > 0 ? (
                            <div className="space-y-3">
                                {donors.map((donor, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                                            {donor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 dark:text-white text-sm">{donor.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                                                    {donor.amount}
                                                </span>
                                            </div>
                                            {donor.message && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                                    "{donor.message}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
                                Chưa có ai ủng hộ. Hãy là người đầu tiên!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonateModal;
