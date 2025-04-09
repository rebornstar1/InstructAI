// app/api/threads/[threadId]/route.js

import { NextResponse } from 'next/server';

// Mock data for demonstration purposes
const mockThreads = [
  {
    id: "1",
    name: "Introduction to Machine Learning",
    description: "Discuss fundamental concepts of machine learning, algorithms, and applications",
    parentThreadId: null,
    relatedCourseIds: [101, 102],
    createdAt: "2025-01-15T10:30:00Z",
    active: true,
    subThreadIds: [3, 4],
    conceptTags: ["Machine Learning", "AI", "Neural Networks"]
  },
  {
    id: "2",
    name: "JavaScript Frameworks",
    description: "Compare and discuss modern JavaScript frameworks, best practices, and emerging trends",
    parentThreadId: null,
    relatedCourseIds: [201, 202],
    createdAt: "2025-01-10T14:20:00Z",
    active: true,
    subThreadIds: [5, 6],
    conceptTags: ["JavaScript", "React", "Vue", "Angular"]
  },
  {
    id: "3",
    name: "Supervised Learning Techniques",
    description: "Deep dive into supervised learning algorithms and implementations",
    parentThreadId: "1",
    relatedCourseIds: [101],
    createdAt: "2025-01-18T09:15:00Z",
    active: true,
    subThreadIds: [],
    conceptTags: ["Supervised Learning", "Classification", "Regression"]
  }
];

// Mock conversations data
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
  }
];

// Mock messages data
const mockMessages = [
  {
    id: "1001",
    threadId: "1",
    conversationId: "101",
    userId: "user1",
    content: { text: "Can anyone recommend good introductory resources for ML that aren't too math-heavy?" },
    messageType: "text",
    timestamp: "2025-01-16T11:30:00Z",
    replyToMessageId: null
  },
  {
    id: "1002",
    threadId: "1",
    conversationId: "101",
    userId: "user2",
    content: { text: "I found 'Hands-On Machine Learning with Scikit-Learn & TensorFlow' to be really accessible for beginners. It has a good balance of theory and practice." },
    messageType: "text",
    timestamp: "2025-01-16T12:15:00Z",
    replyToMessageId: "1001"
  },
  {
    id: "1003",
    threadId: "1",
    conversationId: "101",
    userId: "user3",
    content: { 
      text: "I'd also recommend checking out the free Stanford course CS229 lectures on YouTube. Andrew Ng is an excellent teacher.",
      links: ["https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU"]
    },
    messageType: "text",
    timestamp: "2025-01-17T09:45:00Z",
    replyToMessageId: "1001"
  }
];

// Mock members data
const mockMembers = [
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
];

export async function GET(request, { params }) {
  const { threadId } = params;
  
  // Find the requested thread
  const thread = mockThreads.find(t => t.id === threadId);
  
  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json(thread);
}

// For updating thread details
export async function PUT(request, { params }) {
  const { threadId } = params;
  const updatedData = await request.json();
  
  // Find thread index
  const threadIndex = mockThreads.findIndex(t => t.id === threadId);
  
  if (threadIndex === -1) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404 }
    );
  }
  
  // Update thread (in a real app, you'd validate the fields)
  mockThreads[threadIndex] = {
    ...mockThreads[threadIndex],
    ...updatedData
  };
  
  return NextResponse.json(mockThreads[threadIndex]);
}

// For deleting a thread
export async function DELETE(request, { params }) {
  const { threadId } = params;
  
  // Check if thread exists
  const threadIndex = mockThreads.findIndex(t => t.id === threadId);
  
  if (threadIndex === -1) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404 }
    );
  }
  
  // In a real application, you would delete the thread from the database
  // For this mock, we'll just return a success message
  
  return NextResponse.json({ message: "Thread deleted successfully" });
}