import { useState, useRef } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // actually submission (called on enter keypress)
  const handleSend = () => {
    if (message.trim()) {
      // custom function passed from the parent
      // trimming removes the whitespace like tabs and spaces (rendundant wale)
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // reset after send
      }
    }
  };

  // for handling what happens when you submit (press enter or something like that)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // for handling the input box height when user types
  // only for this 
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    console.log(e);
    target.style.height = "auto"; // reset
    target.style.height = Math.min(target.scrollHeight, 150) + "px"; 
    // 150px ≈ 6 lines, adjust if needed
  };

  return (
    <div
      className="flex items-end p-2 mb-4 rounded-xl w-10/12"
      style={{ backgroundColor: "#1c1d21" }}
    >
      {/* Image upload button */}
      <button
        className="p-1 mr-2 rounded-md hover:bg-gray-700 text-gray-300"
        title="Attach Image"
      >
        <FiPaperclip size={18} />
      </button>

      {/* Auto-expanding multiline input with max height */}
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none bg-transparent text-white placeholder-gray-400 outline-none px-2 py-1 rounded-md leading-snug text-sm overflow-y-auto"
        placeholder="Type a message..."
        rows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
      />

      {/* Send button */}
      <button
        className="p-1 ml-2 rounded-md hover:bg-blue-600 bg-blue-500 text-white"
        onClick={handleSend}
      >
        <FiSend size={18} />
      </button>
    </div>
  );
};

export default ChatInput;
