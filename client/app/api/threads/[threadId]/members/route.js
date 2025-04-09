// app/api/threads/[threadId]/members/route.js

import { NextResponse } from 'next/server';

// Mock members data
const mockThreadMembers = {
  "1": [ // Thread ID as key
    {
      id: "user1",
      username: "johndoe",
      joinedAt: "2024-12-10T08:30:00Z",
      role: "member",
      level: 3
    },
    {
      id: "user2",
      username: "sarahsmith",
      joinedAt: "2024-11-15T14:20:00Z",
      role: "expert",
      level: 7
    },
    {
      id: "user3",
      username: "mikebrown",
      joinedAt: "2025-01-05T11:10:00Z",
      role: "member",
      level: 2
    },
    {
      id: "user4",
      username: "emmawilson",
      joinedAt: "2024-10-20T16:45:00Z",
      role: "moderator",
      level: 5
    }
  ],
  "2": [
    {
      id: "user1",
      username: "johndoe",
      joinedAt: "2024-12-15T10:30:00Z",
      role: "member",
      level: 3
    },
    {
      id: "user3",
      username: "mikebrown",
      joinedAt: "2025-01-07T09:20:00Z",
      role: "member",
      level: 2
    },
    {
      id: "user5",
      username: "alexjohnson",
      joinedAt: "2024-11-25T11:15:00Z",
      role: "expert",
      level: 6
    }
  ]
};

// Mock user data for lookup
const mockUsers = [
  {
    id: "user1",
    username: "johndoe",
    email: "john.doe@example.com",
    level: 3
  },
  {
    id: "user2",
    username: "sarahsmith",
    email: "sarah.smith@example.com",
    level: 7
  },
  {
    id: "user3",
    username: "mikebrown",
    email: "mike.brown@example.com",
    level: 2
  },
  {
    id: "user4",
    username: "emmawilson",
    email: "emma.wilson@example.com",
    level: 5
  },
  {
    id: "user5",
    username: "alexjohnson",
    email: "alex.johnson@example.com",
    level: 6
  }
];

// Get members of a specific thread
export async function GET(request, { params }) {
  const { threadId } = params;
  
  // Get members for the specified thread
  const members = mockThreadMembers[threadId] || [];
  
  return NextResponse.json(members);
}

// Add a user to a thread
export async function POST(request, { params }) {
  const { threadId } = params;
  const data = await request.json();
  
  // Validate required fields
  if (!data.userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }
  
  // Check if the user exists
  const user = mockUsers.find(u => u.id === data.userId);
  
  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }
  
  // Initialize thread members array if it doesn't exist
  if (!mockThreadMembers[threadId]) {
    mockThreadMembers[threadId] = [];
  }
  
  // Check if the user is already a member
  const existingMember = mockThreadMembers[threadId].find(m => m.id === data.userId);
  
  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a member of this thread" },
      { status: 409 }
    );
  }
  
  // Add the user to the thread
  const newMember = {
    id: user.id,
    username: user.username,
    joinedAt: new Date().toISOString(),
    role: data.role || "member",
    level: user.level
  };
  
  // In a real application, you would save this to a database
  // For this mock, we'll just return the new member information
  
  return NextResponse.json(newMember, { status: 201 });
}

// Special route for current user to join a thread
export const joinThread = async (request, { params }) => {
  const { threadId } = params;
  
  // In a real application, you would get the current user from authentication
  const currentUser = {
    id: "current-user",
    username: "currentuser",
    level: 1
  };
  
  // Initialize thread members array if it doesn't exist
  if (!mockThreadMembers[threadId]) {
    mockThreadMembers[threadId] = [];
  }
  
  // Check if the user is already a member
  const existingMember = mockThreadMembers[threadId].find(m => m.id === currentUser.id);
  
  if (existingMember) {
    return NextResponse.json(
      { error: "You are already a member of this thread" },
      { status: 409 }
    );
  }
  
  // Add the user to the thread
  const newMember = {
    id: currentUser.id,
    username: currentUser.username,
    joinedAt: new Date().toISOString(),
    role: "member",
    level: currentUser.level
  };
  
  mockThreadMembers[threadId].push(newMember);
  
  return NextResponse.json({ message: "Successfully joined the thread", member: newMember });
};

// Special route for current user to leave a thread
export const leaveThread = async (request, { params }) => {
  const { threadId } = params;
  
  // In a real application, you would get the current user from authentication
  const currentUserId = "current-user";
  
  // Check if the thread exists
  if (!mockThreadMembers[threadId]) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404 }
    );
  }
  
  // Check if the user is a member
  const memberIndex = mockThreadMembers[threadId].findIndex(m => m.id === currentUserId);
  
  if (memberIndex === -1) {
    return NextResponse.json(
      { error: "You are not a member of this thread" },
      { status: 404 }
    );
  }
  
  // Remove the user from the thread
  mockThreadMembers[threadId].splice(memberIndex, 1);
  
  return NextResponse.json({ message: "Successfully left the thread" });
};