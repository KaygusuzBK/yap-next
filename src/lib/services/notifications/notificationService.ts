import toast, { ToastOptions } from 'react-hot-toast';

class NotificationService {
  private defaultOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#363636',
      color: '#fff',
    },
  };

  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#10b981',
        ...options?.style,
      },
    });
  }

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#ef4444',
        ...options?.style,
      },
    });
  }

  info(message: string, options?: ToastOptions) {
    return toast(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#3b82f6',
        ...options?.style,
      },
    });
  }

  warning(message: string, options?: ToastOptions) {
    return toast(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        ...this.defaultOptions.style,
        background: '#f59e0b',
        ...options?.style,
      },
    });
  }

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      ...this.defaultOptions,
      ...options,
    });
  }

  promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    }, {
      ...this.defaultOptions,
      ...options,
    });
  }

  dismiss(toastId?: string) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
  }
}

export const notify = new NotificationService();
export { NotificationService };
export type NotificationOptions = import('react-hot-toast').ToastOptions;