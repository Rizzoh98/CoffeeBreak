import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

let messaging = null;

export const initializeMessaging = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app);
      return messaging;
    } catch (error) {
      console.error('Firebase Messaging not supported or error:', error);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async (uid) => {
  if (!uid) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const m = messaging || initializeMessaging();
      if (!m) return null;

      // Get FCM Token
      const token = await getToken(m, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        // Save to Firestore
        await setDoc(doc(db, 'users', uid), {
          fcmToken: token
        }, { merge: true });
        console.log("FCM Token saved for user!");
      }
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const onMessageListener = (callback) => {
  const m = messaging || initializeMessaging();
  if (!m) return;
  return onMessage(m, (payload) => {
    callback(payload);
  });
};
