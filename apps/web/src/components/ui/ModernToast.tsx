import React from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

// Configuration du Toaster avec style Niger
export function ModernToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'white',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: '500px',
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-sm">{message}</div>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

// Types de notifications avec style Niger
export const modernToast = {
  success: (message: string, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl p-4 flex items-start gap-3 border-l-4 border-primary-600',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-primary-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  error: (message: string, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl p-4 flex items-start gap-3 border-l-4 border-red-600',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <XCircle className="w-5 h-5 text-red-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  warning: (message: string, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl p-4 flex items-start gap-3 border-l-4 border-orange-500',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-orange-500" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  info: (message: string, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl p-4 flex items-start gap-3 border-l-4 border-blue-600',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-blue-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  // Toast avec gradient Niger
  gradientCrou: (message: string, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-gradient-crou rounded-xl shadow-xl p-4 flex items-start gap-3',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  // Toast avec action (undo)
  withAction: (message: string, actionLabel: string, onAction: () => void, options?: any) => {
    return toast.custom(
      (t) => (
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border-l-4 border-primary-600',
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-primary-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <button
            onClick={() => {
              onAction();
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {actionLabel}
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      ),
      options
    );
  },

  // Toast avec barre de progression
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};

export default modernToast;
