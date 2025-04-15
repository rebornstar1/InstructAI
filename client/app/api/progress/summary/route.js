// app/api/progress/summary/route.js

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * API route to fetch the user's progress summary
 * Used by the ProgressSummary component
 */
export async function GET(request) {
  try {
    // Get the user session
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Fetch progress data from the backend API
    const response = await fetch(`${process.env.API_BASE_URL}/api/progress/users/${userId}/summary`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error fetching progress summary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress summary' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in progress summary API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API route to check if a module should be auto-completed
 */
export async function POST(request, { params }) {
  try {
    const { moduleId } = params;
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Call the backend API to check module completion
    const response = await fetch(
      `${process.env.API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}/check-completion`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error checking module completion:', error);
      return NextResponse.json(
        { error: 'Failed to check module completion' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in check module completion API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}