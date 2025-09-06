type Sender = "me" | "you";



type ChatMessageProps = {
    text: string;
    who: Sender;
    time: string;
};

const ChatMessage = ({ text, who, time }: ChatMessageProps) => {
    return (
        <>
            {who === "me" ? (
                <div className="flex justify-end mb-2 items-end">
                    <div className="rounded-2xl px-3 py-1 max-w-[80%] bg-white text-sm ">
                        {text}
                    <span className="text-[#3c3f42] text-xs pl-3 pb-1 select-none">{time}</span>
                    </div>
                </div>
            ) : (
                <div className="flex justify-start mb-2 items-end">
                    <div className="rounded-2xl px-3 py-1.5 max-w-[75%] bg-[#1c1d21] text-white text-sm">
                        {text}
                    <span className="text-[#3c3f42] text-xs pl-3 pb-1 select-none">{time}</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatMessage;
