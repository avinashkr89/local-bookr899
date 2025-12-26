
const ONESIGNAL_APP_ID = "f90df49b-cd97-4bcf-a4fa-ad7677492768";
const ONESIGNAL_REST_API_KEY = "os_v2_app_7eg7jg6ns5f47jh2vv3hosjhnbw5c6kgdjpegn5ecn3zd54a5jqh47wc2akamktq4oykyts3uhw6ztcwbcr6knwjo5tkdm7tqk6kdtq";

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export const initOneSignal = () => {
  // Logic is handled in index.html script tag
  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [];
  }
};

export const getOneSignalPlayerId = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!window.OneSignalDeferred) {
       resolve(null);
       return;
    }
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        // v16 SDK: Get the Subscription ID
        const id = OneSignal.User.PushSubscription.id;
        console.log("OneSignal Player ID:", id);
        resolve(id || null);
      } catch (e) {
        console.error("OneSignal ID Error (Subscription might be inactive):", e);
        resolve(null);
      }
    });
  });
};

export const requestNotificationPermission = () => {
  if (!window.OneSignalDeferred) return;
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.Slidedown.promptPush();
    } catch (e) {
      console.warn("OneSignal Prompt Error:", e);
    }
  });
};

export const sendPushNotification = async (playerIds: string[], heading: string, content: string, url?: string) => {
  if (!playerIds || playerIds.length === 0) return;
  
  if (ONESIGNAL_REST_API_KEY.includes("YOUR_")) {
    console.warn("⚠️ Push Notification Skipped: Missing REST API Key in services/push.ts");
    return;
  }

  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { en: heading },
        contents: { en: content },
        url: url || window.location.origin,
      })
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    console.log("✅ Push Notification Sent:", data);
  } catch (err) {
    console.error("❌ Push Notification Failed:", err);
  }
};
