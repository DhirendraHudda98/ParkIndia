import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env?.VITE_API_URL || '';

export function useNotifications() {
  const [state, setState] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({
      ...prev,
      supported,
      permission: supported ? Notification.permission : 'denied',
    }));

    if (supported && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setState(prev => ({ ...prev, subscribed: !!sub }));
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.supported) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Notification permission denied',
        }));
        return;
      }

      const vapidRes = await fetch(`${BASE_URL}/api/v1/push/vapid-key`);
      if (!vapidRes.ok) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Push notifications not configured on server',
        }));
        return;
      }
      const vapidData = await vapidRes.json();
      const vapidKey = vapidData?.data?.public_key;

      if (!vapidKey) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'VAPID key not available',
        }));
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const { getInMemoryToken } = await import('../api/client');
      const token = getInMemoryToken();
      const subJson = subscription.toJSON();
      const res = await fetch(`${BASE_URL}/api/v1/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
          },
        }),
      });

      if (res.ok) {
        setState(prev => ({ ...prev, subscribed: true, loading: false }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to register subscription on server',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [state.supported]);

  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      const { getInMemoryToken } = await import('../api/client');
      const token = getInMemoryToken();
      await fetch(`${BASE_URL}/api/v1/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      setState(prev => ({ ...prev, subscribed: false, loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
