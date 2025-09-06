import ChatMessage from "../components/ChatMessage";
import { IoIosAddCircle } from "react-icons/io";
import Search from "../components/Search";
import Logo from "../assets/logo_evolvium.png"
import Contact from "../components/Contact";

const Chat = () => {
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

          {/* guild pinned chat */}
          <div className="pl-2">
            <Contact />

          </div>

          <hr className="text-white w-11/12 mb-2" />

          {/* scrollable list */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-3 pl-2 space-y-1 scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 scrollbar-none hover:scrollbar-thin">
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
            <Contact />
          </div>
        </div>
      </div>

      {/* right chat panel */}
      <div className="flex-1 flex flex-col border-l border-gray-700 items-center">
        {/* name of the person at the top with profile picture*/}
        {/* the messages in the middle huge part */}
        {/* The chatbox input field with send button */}

        {/* all three a flex */}
        {/* 1st is a strip */}
        <div className="flex mt-4 self-start ml-4 items-center">
          <img
            src="https://picsum.photos/400"
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-white pl-4">Anish</span>
          {/* if guild show members in brief */}
        </div>

        {/* chat messages */}
        <div className="w-11/12 flex flex-col ">

        <ChatMessage text="Buri" who="me" time="09:00PM" />
        <ChatMessage text="buri buri zaemon ding ding ping ping" time="09:01PM" who="you" />
        <ChatMessage text="Anish randika" time="10:30PM" who="me" />
        <ChatMessage text="😭" time="10:31PM" who="you" />

        <ChatMessage text="Bro did you finish the assignment?" time="10:45PM" who="me" />
        <ChatMessage text="Not yet, I was gaming 😅" time="10:46PM" who="you" />
        <ChatMessage text="Bruh, deadline is tomorrow 💀" time="10:47PM" who="me" />
        <ChatMessage text="Relax, I’ll copy from you 😎" time="10:48PM" who="you" />
        <ChatMessage text="No chance 😂" time="10:49PM" who="me" />

        <ChatMessage text="Ok ok, send me at least Q2 solution 🙏" time="10:50PM" who="you" />
        <ChatMessage text="Hmm… maybe after dinner 🍲" time="10:51PM" who="me" />
        <ChatMessage text="Fine, I’ll wait 😤" time="10:52PM" who="you" />

        <ChatMessage text="By the way, did you watch the new episode?" time="11:00PM" who="you" />
        <ChatMessage text="Yes bro, that twist was insane 🔥" time="11:01PM" who="me" />
        <ChatMessage text="Fr fr, can’t wait for next week" time="11:02PM" who="you" />
        <ChatMessage text="Same here 👀" time="11:03PM" who="me" />
        </div>

        {/* show messages + date + images */}
      </div>
    </div>
  );
};

export default Chat;

