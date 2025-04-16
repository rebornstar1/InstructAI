"use client";

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardComponent from '@/components/dashboard';

const HomePage = () => {
  return (
    <ProtectedRoute>
      <DashboardComponent />
    </ProtectedRoute>
  );
};

export default HomePage;