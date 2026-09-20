import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Web app's Firebase configuration from user's project
export const firebaseConfig = {
  apiKey: "AIzaSyDaz9kg8ldsa6Vp7F_i2cF1EBhxb_O9ySM",
  authDomain: "visitor-pass-5244.firebaseapp.com",
  projectId: "visitor-pass-5244",
  storageBucket: "visitor-pass-5244.firebasestorage.app",
  messagingSenderId: "873452427994",
  appId: "1:873452427994:web:e65472f7c637c028ef23e3"
};

// Initialize Firebase singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
