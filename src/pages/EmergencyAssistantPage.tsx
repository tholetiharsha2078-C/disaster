import React, { useState, useRef, useEffect } from 'react';
import { UserLocation, Incident } from '../types';
import { calculateDistanceKm, getAlertZoneLevel } from '../utils/geo';
import { Send, Shield, AlertCircle, HelpCircle, PhoneCall, ArrowRight } from 'lucide-react';

interface EmergencyAssistantPageProps {
  userLocation: UserLocation;
  incidents: Incident[];
  onNavigate: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  'What should I do during an active flood alert?',
  'Explain my current alert level and danger radius',
  'What supplies should I pack in a 72-hour emergency kit?',
  'How do I safely report a downed power line or electrical hazard?',
  'What are the official emergency hotline numbers?',
  'How does community verification work on this platform?',
];

export const EmergencyAssistantPage: React.FC<EmergencyAssistantPageProps> = ({
  userLocation,
  incidents,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello. I am **ResQ AI**, your public safety and emergency assistant.

I can explain active hazard alerts, suggest immediate protective actions, provide disaster preparedness checklists, and guide you through reporting incidents.

How can I assist you right now? If you are in immediate life-threatening danger, please dial **112** or **108** right away.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Derive contextual active alerts for query context
  const activeAlertSummaries = incidents
    .filter((i) => i.status === 'CONFIRMED')
    .map((i) => {
      const dist = calculateDistanceKm(userLocation.latitude, userLocation.longitude, i.latitude, i.longitude);
      return `${i.type} (${dist} km away, ${i.address})`;
    });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            userLocation: userLocation.address || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
            activeAlerts: activeAlertSummaries,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Server response was not ok');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Please follow official emergency broadcasts and dial 112 if in urgent danger.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Fallback emergency advice
      const assistantMsg: ChatMessage = {
        id: `ai_fallback_${Date.now()}`,
        sender: 'assistant',
        text: `**Safety First Reminder:**
- In an immediate emergency, dial **112** (All Emergencies) or **1077** (Disaster Control Room).
- Avoid travelling through waterlogged causeways or near fallen poles.
- Check the **Live Map** and **My Alerts** for confirmed localized perimeters.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header (Simple, practical, non-sci-fi) */}
      <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            ResQ AI — Emergency Assistant
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Civil protection safety advice, preparedness protocols, and localized alert explanations.
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-medium bg-neutral-100 px-3 py-1.5 rounded-xs self-start">
          Available 24/7 • Public Safety Guidance
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div>
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
          Frequently Asked Emergency Inquiries:
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SUGGESTIONS.map((sugg, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sugg)}
              className="text-xs font-medium text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xs px-3 py-1.5 transition-colors text-left"
            >
              {sugg}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Container */}
      <div className="bg-white border border-neutral-300 rounded-xs shadow-2xs flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[11px] font-bold text-neutral-400 mb-1 px-1">
                  {isUser ? 'You' : 'ResQ AI (Emergency Assistant)'} • {msg.timestamp}
                </div>
                <div
                  className={`max-w-2xl rounded-xs p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-900 border border-neutral-200 whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="text-[11px] font-bold text-neutral-400 mb-1 px-1">
                ResQ AI • Thinking...
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs text-xs text-neutral-600 font-medium">
                Reviewing civil protection safety directives...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-neutral-200 p-3 sm:p-4 bg-white flex items-center gap-3">
          <input
            type="text"
            id="emergency-assistant-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your emergency safety question or situation here..."
            className="flex-1 text-sm border border-neutral-300 rounded-xs p-3 text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-800"
          />

          <button
            type="button"
            id="emergency-assistant-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-3 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs font-bold uppercase tracking-wide rounded-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
