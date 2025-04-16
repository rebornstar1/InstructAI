"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run this effect after component mounts client-side and auth state is determined
    if (mounted && !loading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, loading, router, mounted]);

  // Don't render anything during initial SSR or when loading
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading completes, don't render the children
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected content
  return children;
}