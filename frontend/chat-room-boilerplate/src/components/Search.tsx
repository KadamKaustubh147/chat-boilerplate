import { IoIosSearch } from "react-icons/io";

interface SearchProps {
  width?: string; // Tailwind width classes like "w-full", "w-1/2", "w-[300px]"
}

const Search: React.FC<SearchProps> = ({ width = "w-full" }) => {
  return (
    <div className={`relative ${width}`}>
      <input
        type="text"
        name="text"
        id="text"
        className="w-full outline-none border border-gray-300 text-gray-900 text-sm rounded-lg 
                   focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-10 
                   bg-[#1c1d21] dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
        placeholder="Search"
        required
      />
      <IoIosSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-pointer" />
    </div>
  );
};

export default Search;
