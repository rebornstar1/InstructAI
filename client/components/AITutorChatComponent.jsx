"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain } from "lucide-react";

export default function AITutorChatComponent({ messages, setMessages }) {
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: chatInput },
        {
          role: "ai",
          content: `I'd be happy to help with "${chatInput}". Check out the course content for more details.`,
        },
      ]);
      setChatInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && chatInput.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <div ref={chatContainerRef} className="h-96 overflow-y-auto border rounded-md p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  message.role === "ai" ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === "ai" ? (
                    <Brain className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                      U
                    </div>
                  )}
                  <div>
                    <p className="font-bold mb-1">
                      {message.role === "ai" ? "AI Tutor" : "You"}
                    </p>
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-end mt-4">
            <Input
              placeholder="Ask a question..."
              className="flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
