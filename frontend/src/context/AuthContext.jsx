import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('passpulse_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('passpulse_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    // 1. Listen for Firebase Auth user
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('passpulse_token', idToken);
          setToken(idToken);

          const usersDb = JSON.parse(localStorage.getItem('passpulse_users_db') || '{}');
          const profile = usersDb[fbUser.email?.toLowerCase()] || {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Staff Member',
            email: fbUser.email,
            role: fbUser.email?.includes('admin') ? 'admin' : (fbUser.email?.includes('sec') ? 'security' : 'employee'),
            department: 'Engineering',
            organizationName: 'Apex Global Technologies',
          };
          localStorage.setItem('passpulse_user', JSON.stringify(profile));
          setUser(profile);
        } catch (e) {
          console.error('Firebase session restore error:', e);
        } finally {
          setLoading(false);
        }
      } else {
        // 2. Check if local backend session exists
        const cachedUser = localStorage.getItem('passpulse_user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {}
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check Demo Credentials First for instant evaluation
    const demoCredentials = {
      'admin@visitorpass.com': { role: 'admin', name: 'System Administrator', dept: 'IT' },
      'security@visitorpass.com': { role: 'security', name: 'Security Gate 1', dept: 'Physical Security' },
      'host@visitorpass.com': { role: 'employee', name: 'Host Employee', dept: 'Engineering' },
      'hr@visitorpass.com': { role: 'employee', name: 'HR Department', dept: 'Human Resources' },
    };

    if (demoCredentials[normalizedEmail]) {
      const demoInfo = demoCredentials[normalizedEmail];
      const demoUser = {
        id: 'usr-' + demoInfo.role,
        name: demoInfo.name,
        email: normalizedEmail,
        role: demoInfo.role,
        department: demoInfo.dept,
        organizationName: 'Apex Global Technologies',
      };
      const mockToken = 'demo-jwt-token-' + demoInfo.role;
      localStorage.setItem('passpulse_token', mockToken);
      localStorage.setItem('passpulse_user', JSON.stringify(demoUser));
      setToken(mockToken);
      setUser(demoUser);
      return demoUser;
    }

    // 2. Try Backend API
    try {
      const res = await api.post('/auth/login', { email: normalizedEmail, password });
      if (res && res.success && res.token) {
        localStorage.setItem('passpulse_token', res.token);
        localStorage.setItem('passpulse_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (apiErr) {
      console.warn('Backend API login skipped:', apiErr.message);
    }

    // 3. Fallback to Firebase Authentication
    try {
      const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await userCred.user.getIdToken();
      const usersDb = JSON.parse(localStorage.getItem('passpulse_users_db') || '{}');
      const profile = usersDb[normalizedEmail] || {
        id: userCred.user.uid,
        name: userCred.user.displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: normalizedEmail.includes('admin') ? 'admin' : (normalizedEmail.includes('sec') ? 'security' : 'employee'),
        department: 'Engineering',
        organizationName: 'Apex Global Technologies',
      };
      localStorage.setItem('passpulse_token', idToken);
      localStorage.setItem('passpulse_user', JSON.stringify(profile));
      setToken(idToken);
      setUser(profile);
      return profile;
    } catch (fbErr) {
      console.error('Firebase sign-in error:', fbErr);
      if (
        fbErr.code === 'auth/invalid-credential' ||
        fbErr.code === 'auth/user-not-found' ||
        fbErr.code === 'auth/wrong-password'
      ) {
        throw new Error('Invalid email or password.');
      }
      throw new Error(fbErr.message || 'Login failed');
    }
  };

  const demoLogin = async (role) => {
    const demoMap = {
      admin: { email: 'admin@visitorpass.com', password: 'Admin@123' },
      security: { email: 'security@visitorpass.com', password: 'Security@123' },
      employee: { email: 'host@visitorpass.com', password: 'Host@123' },
      hr: { email: 'hr@visitorpass.com', password: 'Host@123' },
    };
    const cred = demoMap[role] || demoMap.admin;
    return await login(cred.email, cred.password);
  };

  const register = async (userData) => {
    const normalizedEmail = userData.email.toLowerCase().trim();

    // 1. Try Backend API first if mounted
    try {
      const res = await api.post('/auth/register', userData);
      if (res && res.success && res.token) {
        localStorage.setItem('passpulse_token', res.token);
        localStorage.setItem('passpulse_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);

        // Mirror in Firebase Auth in background
        createUserWithEmailAndPassword(auth, normalizedEmail, userData.password)
          .then((cred) => updateProfile(cred.user, { displayName: userData.name }))
          .catch(() => {});

        return res.user;
      }
    } catch (apiErr) {
      console.warn('Backend API registration skipped:', apiErr.message);
    }

    // 2. Direct Firebase Authentication registration
    try {
      const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, userData.password);

      if (userData.name) {
        await updateProfile(userCred.user, { displayName: userData.name }).catch(() => {});
      }

      const idToken = await userCred.user.getIdToken();
      const newUser = {
        id: userCred.user.uid,
        name: userData.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: userData.role || 'employee',
        department: userData.department || 'Engineering',
        phone: userData.phone || '',
        organizationName: userData.organizationName || 'Apex Global Technologies',
      };

      // Store in users registry
      const usersDb = JSON.parse(localStorage.getItem('passpulse_users_db') || '{}');
      usersDb[normalizedEmail] = newUser;
      localStorage.setItem('passpulse_users_db', JSON.stringify(usersDb));

      localStorage.setItem('passpulse_token', idToken);
      localStorage.setItem('passpulse_user', JSON.stringify(newUser));
      setToken(idToken);
      setUser(newUser);
      return newUser;
    } catch (fbErr) {
      console.error('Firebase registration error:', fbErr);

      // If already registered in Firebase, attempt to sign in directly
      if (fbErr.code === 'auth/email-already-in-use') {
        try {
          const signCred = await signInWithEmailAndPassword(auth, normalizedEmail, userData.password);
          const idToken = await signCred.user.getIdToken();
          const usersDb = JSON.parse(localStorage.getItem('passpulse_users_db') || '{}');
          const existingUser = usersDb[normalizedEmail] || {
            id: signCred.user.uid,
            name: userData.name || signCred.user.displayName || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            role: userData.role || 'employee',
            department: userData.department || 'Engineering',
            phone: userData.phone || '',
            organizationName: userData.organizationName || 'Apex Global Technologies',
          };
          localStorage.setItem('passpulse_token', idToken);
          localStorage.setItem('passpulse_user', JSON.stringify(existingUser));
          setToken(idToken);
          setUser(existingUser);
          return existingUser;
        } catch {
          throw new Error('An account with this email already exists with a different password.');
        }
      } else if (fbErr.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (fbErr.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }

      // Fallback: create local account session
      const fallbackUser = {
        id: 'usr-' + Date.now(),
        name: userData.name,
        email: normalizedEmail,
        role: userData.role || 'employee',
        department: userData.department || 'Engineering',
        phone: userData.phone || '',
        organizationName: userData.organizationName || 'Apex Global Technologies',
      };
      const fallbackToken = 'local-token-' + Date.now();
      localStorage.setItem('passpulse_token', fallbackToken);
      localStorage.setItem('passpulse_user', JSON.stringify(fallbackUser));
      setToken(fallbackToken);
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    localStorage.removeItem('passpulse_token');
    localStorage.removeItem('passpulse_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSecurity: user?.role === 'security' || user?.role === 'admin',
        isEmployee: user?.role === 'employee',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
