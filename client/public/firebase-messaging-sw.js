// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAjNoe8PJgf-9qsQcsBcKJC28nYErZJUA0",
  projectId: "codifier-5c757",
  messagingSenderId: "698514043209",
  appId: "1:698514043209:web:4803872e2c8dcb4cabea98"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("Received background message: ", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body
  });
});
