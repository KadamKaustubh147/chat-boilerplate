import { useEffect, useState, useContext, useRef } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoIosAddCircle } from "react-icons/io";
import Search from "../components/Search";
import Logo from "../assets/logo_evolvium.png";
import Contact from "../components/Contact";
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
  email: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const Chat = () => {
  const { user } = useContext(AuthContext)!;
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch contacts/users from API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get("/accounts/users/");
        // Filter out current user
        const filteredContacts = response.data.filter(
          (contact: ContactType) => contact.email !== user?.email
        );
        setContacts(filteredContacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };

    if (user) {
      fetchContacts();
    }
  }, [user]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedContact || !user) return;

    // Close existing connection
    if (socket) {
      socket.close();
    }

    // Create new WebSocket connection
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/personal/${selectedContact.email}/`;
    
    const chatSocket = new WebSocket(wsUrl);

    chatSocket.onopen = () => {
      console.log("✅ WebSocket connected to:", selectedContact.email);
    };

    chatSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Received:", data);

      setMessages((prev) => [
        ...prev,
        {
          text: data.message,
          who: data.sender === user.email ? "me" : "you",
          time: data.timestamp || new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          sender: data.sender,
          sender_name: data.sender_name,
        },
      ]);
    };

    chatSocket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    chatSocket.onclose = () => {
      console.log("❌ WebSocket closed");
    };

    setSocket(chatSocket);

    // Load message history
    loadMessageHistory(selectedContact.email);

    // Cleanup on unmount or contact change
    return () => {
      chatSocket.close();
    };
  }, [selectedContact, user]);

  // Load message history from backend
  const loadMessageHistory = async (contactEmail: string) => {
    try {
      const response = await api.get(`/chat/messages/${contactEmail}/`);
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
      console.error("Failed to load message history:", error);
      // If endpoint doesn't exist yet, start with empty messages
      setMessages([]);
    }
  };

  // Send message
  const handleSend = (message: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("⚠️ WebSocket not connected");
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

    // Send to server - the onmessage handler will add it to the UI
    socket.send(JSON.stringify(data));

    // The optimistic update that caused the duplicate message has been removed.
  };

  // Handle contact selection
  const handleContactSelect = (contact: ContactType) => {
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
                className={`flex w-full rounded-2xl text-white justify-between gap-3 cursor-pointer select-none hover:bg-[#242121] h-[9.5vh] px-2 ${
                  selectedContact?.email === contact.email ? "bg-[#2a2727]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${contact.name}&background=random`}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{contact.name}</span>
                    <span className="text-xs text-gray-400 truncate w-36">
                      {contact.email}
                    </span>
                  </div>
                </div>
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
