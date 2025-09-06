const Contact = () => {
  return (
    <div className="flex w-full rounded-2xl text-white justify-between gap-3 cursor-pointer select-none hover:bg-[#242121] h-[9.5vh] px-2">
      {/* Profile section */}
      <div className="flex items-center gap-3">
        <img
          src="https://picsum.photos/400"
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold">2CB</span>
          {/* Truncated preview text */}
          <span className="text-xs truncate w-36">
            Lorem ipsum, dolor sit amet consectetur adipisicihgk...
          </span>
        </div>
      </div>

      {/* Time + unread count */}
      <div className="flex flex-col items-end justify-around">
        <span className="text-sm">1:59PM</span>
        <span className="bg-white w-5 h-5 flex items-center justify-center text-xs text-black rounded-full">
          5
        </span>
      </div>
    </div>
  );
};

export default Contact;
