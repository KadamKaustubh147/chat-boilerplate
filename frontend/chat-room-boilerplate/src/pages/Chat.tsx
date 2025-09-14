import { useEffect, useState } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoIosAddCircle } from "react-icons/io";
import Search from "../components/Search";
import Logo from "../assets/logo_evolvium.png";
import Contact from "../components/Contact";
import ChatInput from "../components/ChatInput";

const Chat = () => {
  const username = "kaustubh";
  const [messages, setMessages] = useState<
    { text: string; who: "me" | "you"; time: string }[]
  >([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Create WebSocket connection
  // on username change we re-render the component
  useEffect(() => {
    const chatSocket = new WebSocket(
      `ws://127.0.0.1:8000/ws/personal/${username}/`
    );

    chatSocket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    chatSocket.onmessage = (event) => {
      // JSON.parse --> converts JSON to JS object


      // so event is already a JS object but data which is a attribute is a JSON thingy therefore we parse that
      const data = JSON.parse(event.data);
      console.log("📩 Received:", data);

      setMessages((prev) => [
        ...prev,
        { text: data.message, who: "you", time: new Date().toLocaleTimeString() },
      ]);
    };

    chatSocket.onclose = () => {
      console.log("❌ WebSocket closed");
    };

    setSocket(chatSocket);

    // Cleanup on unmount
    return () => {
      chatSocket.close();
    };
  }, [username]);

  // Send message
  const handleSend = (message: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("⚠️ WebSocket not connected");
      return;
    }

    const data = {
      message,
      sender: username,
      time: new Date().toLocaleTimeString(),
    };

    // Send the message to the server --> centralised message distributor will distribute it
    socket.send(JSON.stringify(data));

    setMessages((prev) => [
      ...prev,
      { text: message, who: "me", time: new Date().toLocaleTimeString() },
    ]);
  };

  return (
    // container
    <div className="w-full flex bg-black h-screen">
      {/* left sidebar */}
      <div className="flex flex-col w-1/3 p-4 gap-4">
        {/* 1. heading */}
        <div className="flex items-center select-none">
          <img src={Logo} className="w-20 h-20" />
          <p className="text-white text-2xl font-semibold -mt-4">Chat</p>
        </div>

        {/* 2. search + new chat row */}
        <div className="flex items-center gap-2 mb-2 ml-2">
          <Search width="w-10/12" />
          <IoIosAddCircle className="text-4xl text-white cursor-pointer" />
        </div>

        {/* 3. guild + chats */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <h5 className="text-white ml-2 text-2xl mb-2">Guild</h5>

          <div className="pl-2">
            <Contact />
          </div>

          <hr className="text-white w-11/12 mb-2" />

          <div className="flex-1 min-h-0 overflow-y-auto pr-3 pl-2 space-y-1 scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 scrollbar-none hover:scrollbar-thin">
            <Contact />
            <Contact />
            <Contact />
            <Contact />
          </div>
        </div>
      </div>

      {/* right chat panel */}
      <div className="flex-1 flex flex-col border-l border-gray-700">
        {/* 1. header strip */}
        <div className="flex mt-4 ml-4 items-center">
          <img
            src="https://picsum.photos/400"
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-white pl-4">Anish</span>
        </div>

        {/* 2. messages area */}
        <div className="flex-1 w-11/12 mx-auto flex flex-col py-2 overflow-y-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} text={msg.text} who={msg.who} time={msg.time} />
          ))}
        </div>

        {/* 3. chat input fixed at bottom */}
        <div className="w-full mx-auto mb-4 flex justify-center">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
