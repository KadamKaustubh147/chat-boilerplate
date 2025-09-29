interface ContactProps {
  name: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatarUrl?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const Contact = ({ 
  name, 
  email, 
  lastMessage, 
  lastMessageTime, 
  unreadCount = 0,
  avatarUrl,
  isSelected = false,
  onClick 
}: ContactProps) => {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${name}&background=random`;
  
  return (
    <div 
      onClick={onClick}
      className={`flex w-full rounded-2xl text-white justify-between gap-3 cursor-pointer select-none hover:bg-[#242121] h-[9.5vh] px-2 ${
        isSelected ? "bg-[#2a2727]" : ""
      }`}
    >
      {/* Profile section */}
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl || defaultAvatar}
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold">{name}</span>
          {/* Truncated preview text */}
          <span className="text-xs text-gray-400 truncate w-36">
            {lastMessage || email}
          </span>
        </div>
      </div>

      {/* Time + unread count */}
      <div className="flex flex-col items-end justify-around">
        {lastMessageTime && (
          <span className="text-sm text-gray-400">{lastMessageTime}</span>
        )}
        {unreadCount > 0 && (
          <span className="bg-white w-5 h-5 flex items-center justify-center text-xs text-black rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default Contact