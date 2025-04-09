// app/api/threads/[threadId]/conversations/route.js

import { NextResponse } from 'next/server';

// Mock data for demonstration purposes - this would be imported or fetched from a database in a real application
const mockConversations = [
  {
    id: "101",
    threadId: "1",
    title: "Best resources for beginners in ML",
    startedAt: "2025-01-16T11:30:00Z",
    lastActivityAt: "2025-01-17T15:45:00Z",
    participantIds: ["user1", "user2", "user3"],
    conceptTags: ["Learning Resources", "Beginner ML"]
  },
  {
    id: "102",
    threadId: "1",
    title: "Neural networks vs. traditional algorithms",
    startedAt: "2025-01-19T14:20:00Z",
    lastActivityAt: "2025-01-19T18:10:00Z",
    participantIds: ["user2", "user4"],
    conceptTags: ["Neural Networks", "Algorithms", "Performance Comparison"]
  },
  {
    id: "201",
    threadId: "2",
    title: "React vs Vue performance benchmarks",
    startedAt: "2025-01-12T10:15:00Z",
    lastActivityAt: "2025-01-14T16:30:00Z",
    participantIds: ["user1", "user3", "user5"],
    conceptTags: ["React", "Vue", "Performance"]
  }
];

// Get conversations for a specific thread
export async function GET(request, { params }) {
  const { threadId } = params;
  
  // Filter conversations by thread ID
  const threadConversations = mockConversations.filter(c => c.threadId === threadId);
  
  return NextResponse.json(threadConversations);
}

// Create a new conversation in a thread
export async function POST(request, { params }) {
  const { threadId } = params;
  const data = await request.json();
  
  // Validate required fields
  if (!data.title) {
    return NextResponse.json(
      { error: "Conversation title is required" },
      { status: 400 }
    );
  }
  
  // Create a new conversation (in a real app, this would be saved to a database)
  const newConversation = {
    id: `conv-${Date.now()}`, // Generate a unique ID
    threadId,
    title: data.title,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    participantIds: [data.userId || "current-user"], // In a real app, you'd get the user ID from authentication
    conceptTags: data.conceptTags || []
  };
  
  // In a real application, you would save this to a database
  // For this mock, we'll just return the new conversation
  
  return NextResponse.json(newConversation, { status: 201 });
}