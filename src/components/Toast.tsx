import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({
  toast,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div
      className={`pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border text-sm font-medium transition-all transform translate-y-0 ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : isError
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : "bg-blue-50 border-blue-200 text-blue-900"
      }`}
    >
      <div className="mr-3 mt-0.5 shrink-0">
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="flex-1 pr-2 leading-relaxed">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-md shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
