import { useEffect, useState, useContext, useRef } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoIosAddCircle } from "react-icons/io";
import Logo from "../assets/logo_evolvium.png";
import ChatInput from "../components/ChatInput";
import { AuthContext } from "../context/AuthContext-http-jwt";
import api from "../AxiosInstance";

interface Message {
  text: string;
  who: "me" | "you";
  time: string;
  sender: string;
  sender_name: string;
}

interface ContactType {
  id: number;
  email: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  hasConversation?: boolean;
}

const Chat = () => {
  const { user } = useContext(AuthContext)!;
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch contacts/users from API
  const fetchContacts = async () => {
    try {
      const response = await api.get("/chat/users/");
      console.log("📋 Fetched contacts:", response.data);
      setContacts(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch contacts:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
      
      // Refresh contacts every 10 seconds to get new conversations
      const interval = setInterval(fetchContacts, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedContact || !user) {
      console.log("⏭️ Skipping WebSocket connection - no contact selected or no user");
      return;
    }

    // Close existing connection
    if (socket) {
      console.log("🔄 Closing existing WebSocket connection");
      socket.close();
    }

    setConnectionStatus("connecting");

    // Create new WebSocket connection - using localhost (not 127.0.0.1)
    const wsUrl = `ws://localhost:8000/ws/personal/${selectedContact.email}/`;
    
    console.log("🔌 Attempting to connect to:", wsUrl);
    console.log("👤 Current user:", user.email);
    console.log("👥 Selected contact:", selectedContact.email);
    
    const chatSocket = new WebSocket(wsUrl);

    chatSocket.onopen = () => {
      console.log("✅ WebSocket connected to:", selectedContact.email);
      setConnectionStatus("connected");
    };

    chatSocket.onmessage = (event) => {
      console.log("📨 Raw WebSocket message received:", event.data);
      
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Parsed message data:", data);

        setMessages((prev) => {
          const newMessage = {
            text: data.message,
            who: data.sender === user.email ? "me" : "you",
            time: data.timestamp || new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            sender: data.sender,
            sender_name: data.sender_name,
          };
          console.log("➕ Adding message to state:", newMessage);
          return [...prev, newMessage];
        });
      } catch (error) {
        console.error("❌ Error parsing message:", error);
      }
    };

    chatSocket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    chatSocket.onclose = (event) => {
      console.log("❌ WebSocket closed:", event.code, event.reason);
      setConnectionStatus("disconnected");
    };

    setSocket(chatSocket);

    // Load message history
    loadMessageHistory(selectedContact.email);

    // Cleanup on unmount or contact change
    return () => {
      console.log("🧹 Cleanup: closing WebSocket");
      chatSocket.close();
    };
  }, [selectedContact, user]);

  // Load message history from backend
  const loadMessageHistory = async (contactEmail: string) => {
    try {
      console.log("📜 Loading message history with:", contactEmail);
      const response = await api.get(`/chat/messages/${contactEmail}/`);
      console.log("📜 Message history response:", response.data);
      
      const history = response.data.map((msg: any) => ({
        text: msg.message,
        who: msg.sender === user?.email ? "me" : "you",
        time: new Date(msg.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        sender: msg.sender,
        sender_name: msg.sender_name || contactEmail,
      }));
      setMessages(history);
    } catch (error) {
      console.error("❌ Failed to load message history:", error);
      // If endpoint doesn't exist yet, start with empty messages
      setMessages([]);
    }
  };

  // Send message
  const handleSend = (message: string) => {
    console.log("📤 Attempting to send message:", message);
    console.log("🔌 WebSocket state:", socket?.readyState);
    console.log("🔌 WebSocket OPEN constant:", WebSocket.OPEN);

    if (!socket) {
      console.error("⚠️ WebSocket is null");
      alert("WebSocket connection not established");
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      console.error("⚠️ WebSocket not in OPEN state. State:", socket.readyState);
      alert(`WebSocket not connected. State: ${socket.readyState}`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const data = {
      message,
      sender: user?.email,
      sender_name: user?.name,
      timestamp,
    };

    console.log("📤 Sending data:", data);

    try {
      // Send to server
      socket.send(JSON.stringify(data));
      console.log("✅ Message sent successfully");

      // Add to local state immediately (optimistic update)
      setMessages((prev) => {
        const newMessage = { 
          text: message, 
          who: "me" as const, 
          time: timestamp,
          sender: user?.email || "",
          sender_name: user?.name || "",
        };
        console.log("➕ Optimistically adding message:", newMessage);
        return [...prev, newMessage];
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message");
    }
  };

  // Handle contact selection
  const handleContactSelect = (contact: ContactType) => {
    console.log("👤 Selected contact:", contact);
    setSelectedContact(contact);
    setMessages([]); // Clear messages when switching contacts
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex bg-black h-screen">
      {/* Left sidebar */}
      <div className="flex flex-col w-1/3 p-4 gap-4 border-r border-gray-700">
        {/* Heading */}
        <div className="flex items-center select-none">
          <img src={Logo} className="w-20 h-20" alt="Logo" />
          <p className="text-white text-2xl font-semibold -mt-4">Chat</p>
        </div>

        {/* Search + new chat row */}
        <div className="flex items-center gap-2 mb-2 ml-2">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none border border-gray-300 text-gray-900 text-sm rounded-lg 
                         focus:ring-blue-500 focus:border-blue-500 block p-2.5 
                         bg-[#1c1d21] dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
              placeholder="Search contacts..."
            />
          </div>
          <IoIosAddCircle className="text-4xl text-white cursor-pointer" />
        </div>

        {/* Contacts list */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-3 pl-2 space-y-1 scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 scrollbar-none hover:scrollbar-thin">
          {filteredContacts.length === 0 ? (
            <p className="text-gray-400 text-center mt-4">No contacts found</p>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.email}
                onClick={() => handleContactSelect(contact)}
                className={`flex w-full rounded-2xl text-white justify-between gap-3 cursor-pointer select-none hover:bg-[#242121] min-h-[9.5vh] px-2 py-2 ${
                  selectedContact?.email === contact.email ? "bg-[#2a2727]" : ""
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${contact.name}&background=random`}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold">{contact.name}</span>
                    <span className="text-xs text-gray-400 truncate">
                      {contact.lastMessage || contact.email}
                    </span>
                  </div>
                </div>
                {contact.lastMessageTime && (
                  <div className="flex flex-col items-end justify-center flex-shrink-0">
                    <span className="text-xs text-gray-400">{contact.lastMessageTime}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right chat panel */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header strip */}
            <div className="flex mt-4 ml-4 items-center border-b border-gray-700 pb-4">
              <img
                src={`https://ui-avatars.com/api/?name=${selectedContact.name}&background=random`}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col ml-4">
                <span className="text-white font-semibold">{selectedContact.name}</span>
                <span className="text-gray-400 text-xs">{selectedContact.email}</span>
              </div>
              
              {/* Connection Status Indicator */}
              <div className="ml-auto mr-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 
                   'Disconnected'}
                </span>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 w-11/12 mx-auto flex flex-col py-4 overflow-y-auto scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 scrollbar-thin">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center mt-8">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, i) => (
                  <ChatMessage key={i} text={msg.text} who={msg.who} time={msg.time} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="w-full mx-auto mb-4 flex justify-center">
              <ChatInput onSend={handleSend} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-xl mb-2">Select a contact to start chatting</p>
              <p className="text-sm">Choose from your contacts list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;