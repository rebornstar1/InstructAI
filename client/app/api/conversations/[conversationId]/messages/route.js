// app/api/conversations/[conversationId]/messages/route.js

import { NextResponse } from 'next/server';

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
      text: "I'd also recommend checking out the free Stanford course CS229 lectures on YouTube. Andrew Ng is an excellent teacher."
    },
    messageType: "text",
    timestamp: "2025-01-17T09:45:00Z",
    replyToMessageId: "1001"
  },
  {
    id: "2001",
    threadId: "1",
    conversationId: "102",
    userId: "user2",
    content: { 
      text: "Has anyone compared the performance of neural networks vs. traditional ML algorithms on structured data problems? I'm wondering if the added complexity of NNs is always worth it."
    },
    messageType: "text",
    timestamp: "2025-01-19T14:20:00Z",
    replyToMessageId: null
  },
  {
    id: "2002",
    threadId: "1",
    conversationId: "102",
    userId: "user4",
    content: { 
      text: "In my experience, for structured data with clear features, traditional algorithms like Random Forests or Gradient Boosting often outperform neural networks - especially when you factor in training time and interpretability."
    },
    messageType: "text",
    timestamp: "2025-01-19T15:30:00Z",
    replyToMessageId: "2001"
  },
  {
    id: "2003",
    threadId: "1",
    conversationId: "102",
    userId: "user4",
    content: { 
      code: "from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score\n\n# Train random forest\nrf = RandomForestClassifier(n_estimators=100)\nrf.fit(X_train, y_train)\n\n# Evaluate\npredictions = rf.predict(X_test)\naccuracy = accuracy_score(y_test, predictions)\nprint(f'Random Forest Accuracy: {accuracy:.4f}')",
      language: "python"
    },
    messageType: "code",
    timestamp: "2025-01-19T15:35:00Z",
    replyToMessageId: "2002"
  }
];

// Mock conversations data to update lastActivityAt
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

// Get messages for a specific conversation
export async function GET(request, { params }) {
  const { conversationId } = params;
  
  // Filter messages by conversation ID
  const conversationMessages = mockMessages.filter(m => m.conversationId === conversationId);
  
  // Sort by timestamp ascending
  conversationMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return NextResponse.json(conversationMessages);
}

// Create a new message in a conversation
export async function POST(request, { params }) {
  const { conversationId } = params;
  const data = await request.json();
  
  // Find the conversation
  const conversation = mockConversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }
  
  // Validate required fields
  if (!data.content || !data.messageType) {
    return NextResponse.json(
      { error: "Message content and type are required" },
      { status: 400 }
    );
  }
  
  // Create a new message
  const newMessage = {
    id: `msg-${Date.now()}`, // Generate a unique ID
    threadId: conversation.threadId,
    conversationId,
    userId: data.userId || "current-user", // In a real app, you'd get the user ID from authentication
    content: data.content,
    messageType: data.messageType,
    timestamp: new Date().toISOString(),
    replyToMessageId: data.replyToMessageId || null,
    conceptTags: data.conceptTags || []
  };
  
  // In a real application, you would:
  // 1. Save the message to a database
  // 2. Update the conversation's lastActivityAt timestamp
  // 3. Add the user to participantIds if not already there
  // 4. Potentially trigger notifications or websocket events
  
  // For this mock, we'll just return the new message
  return NextResponse.json(newMessage, { status: 201 });
}