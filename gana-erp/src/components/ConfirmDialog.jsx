import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  type = 'danger', // 'danger' | 'warning' | 'success' | 'info' | 'error'
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  showCancel = true
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Info className="w-8 h-8 text-indigo-600" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger':
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${getHeaderBg()}`}>
            {getIcon()}
          </div>
          <h3 className="text-lg font-black text-slate-800 mt-1">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-5 py-2 font-bold text-xs rounded-xl transition-colors shadow-sm ${getConfirmBtnStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
