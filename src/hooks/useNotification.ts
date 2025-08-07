import { useCallback } from 'react';
import { notify, NotificationOptions } from '@/lib/services/notifications/notificationService';

export const useNotification = () => {
  const showSuccess = useCallback((message: string, options?: Partial<NotificationOptions>) => {
    notify.success(message, options);
  }, []);

  const showError = useCallback((message: string, options?: Partial<NotificationOptions>) => {
    notify.error(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: Partial<NotificationOptions>) => {
    notify.info(message, options);
  }, []);

  const showWarning = useCallback((message: string, options?: Partial<NotificationOptions>) => {
    notify.warning(message, options);
  }, []);

  const showLoading = useCallback((message: string, options?: Partial<NotificationOptions>) => {
    return notify.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    notify.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    notify.dismissAll();
  }, []);

  const showPromise = useCallback(<T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) => {
    // Varsayılan değerler ile eksik olanları tamamla
    const safeMessages = {
      loading: messages.loading ?? 'Yükleniyor...',
      success: messages.success ?? 'Başarılı!',
      error: messages.error ?? 'Bir hata oluştu!'
    };
    return notify.promise(promise, safeMessages);
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
    dismissAll,
    showPromise,
  };
};