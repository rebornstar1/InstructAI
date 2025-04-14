"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('token');
    if (token) {
      // You could decode the JWT here to get user info if needed
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      // Also set in cookies for middleware to use
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      setUser({ token: data.token });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      // Also set in cookies for middleware to use
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      setUser({ token: data.token });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Clear the cookie as well
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);