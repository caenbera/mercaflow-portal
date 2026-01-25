
'use client';
import { updateUserProfile } from '@/lib/firestore/users';

// IMPORTANT: In a real application, this key should be stored in .env.local as NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = 'BGn5e3vs2MA9iP2AJ2eFfdCgVG9EJ79EK2vT9msKLqxp9k0OHdIeNJXGrvIc0iGzG69WKzuFH6rQdtOslG4dnNo';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription> {
    if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not defined.');
    }

    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save to user profile
    const subscriptionData = subscription.toJSON();
    await updateUserProfile(userId, { 
        pushSubscription: {
            endpoint: subscriptionData.endpoint,
            keys: subscriptionData.keys,
        }
    });

    return subscription;
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    const swRegistration = await navigator.serviceWorker.ready;
    const subscription = await swRegistration.pushManager.getSubscription();

    if (subscription) {
        const unsubscribed = await subscription.unsubscribe();
        if (unsubscribed) {
             await updateUserProfile(userId, { pushSubscription: null } as any);
        }
        return unsubscribed;
    }
    return false;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const swRegistration = await navigator.serviceWorker.ready;
        return swRegistration.pushManager.getSubscription();
    }
    return null;
}

    