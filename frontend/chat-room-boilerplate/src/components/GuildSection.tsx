import { useState, useEffect } from "react";
import { FaUsers, FaPlus, FaSignOutAlt, FaCrown, FaShieldAlt } from "react-icons/fa";
import api from "../AxiosInstance";

interface Guild {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  isFull: boolean;
  isMember: boolean;
  createdBy: string;
}

interface GuildSectionProps {
  onGuildSelect: (guild: Guild) => void;
  selectedGuild: Guild | null;
}

const GuildSection = ({ onGuildSelect, selectedGuild }: GuildSectionProps) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuildList, setShowGuildList] = useState(false);
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildDesc, setNewGuildDesc] = useState("");

  useEffect(() => {
    fetchMyGuild();
    fetchGuilds();
  }, []);

  const fetchMyGuild = async () => {
    try {
      const response = await api.get("/chat/guilds/my-guild/");
      if (response.data.guild) {
        setMyGuild(response.data.guild);
      } else {
        setMyGuild(null);
      }
    } catch (error) {
      console.error("Failed to fetch my guild:", error);
    }
  };

  const fetchGuilds = async () => {
    try {
      const response = await api.get("/chat/guilds/");
      setGuilds(response.data);
    } catch (error) {
      console.error("Failed to fetch guilds:", error);
    }
  };

  const handleCreateGuild = async () => {
    if (!newGuildName.trim()) {
      alert("Guild name is required");
      return;
    }

    try {
      await api.post("/chat/guilds/", {
        name: newGuildName,
        description: newGuildDesc,
      });
      
      alert("Guild created successfully!");
      setShowCreateModal(false);
      setNewGuildName("");
      setNewGuildDesc("");
      fetchMyGuild();
      fetchGuilds();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create guild");
    }
  };

  const handleJoinGuild = async (guildId: number) => {
    try {
      await api.post(`/chat/guilds/${guildId}/join/`);
      alert("Successfully joined guild!");
      setShowGuildList(false);
      fetchMyGuild();
      fetchGuilds();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to join guild");
    }
  };

  const handleLeaveGuild = async () => {
    if (!myGuild) return;
    
    if (!confirm(`Are you sure you want to leave ${myGuild.name}?`)) return;

    try {
      await api.post(`/chat/guilds/${myGuild.id}/leave/`);
      alert("Successfully left guild");
      setMyGuild(null);
      fetchGuilds();
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to leave guild");
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-yellow-400 text-lg" />
          <h5 className="text-white text-xl font-bold">Guild</h5>
        </div>
        {!myGuild && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            title="Create Guild"
          >
            <FaPlus size={18} />
          </button>
        )}
      </div>

      {myGuild ? (
        <div
          onClick={() => onGuildSelect(myGuild)}
          className={`relative overflow-hidden rounded-2xl cursor-pointer select-none transition-all duration-300 ${
            selectedGuild?.id === myGuild.id 
              ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30" 
              : "hover:ring-2 hover:ring-yellow-400/50"
          }`}
          style={{
            background: selectedGuild?.id === myGuild.id
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #434343 0%, #000000 100%)"
          }}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s infinite'
                 }} 
            />
          </div>

          {/* Content */}
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 rounded-full p-2">
                  <FaCrown className="text-purple-900 text-sm" />
                </div>
                <span className="font-bold text-lg text-white drop-shadow-lg">
                  {myGuild.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveGuild();
                }}
                className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/30 rounded-lg"
                title="Leave Guild"
              >
                <FaSignOutAlt size={16} />
              </button>
            </div>
            
            <div className="text-sm text-gray-200 mb-2 line-clamp-2">
              {myGuild.description || "No description"}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <FaUsers className="text-yellow-400" />
                <span className="text-white font-semibold">
                  {myGuild.memberCount}/{myGuild.maxMembers}
                </span>
                <span className="text-gray-300">members</span>
              </div>
              
              {/* Progress bar */}
              <div className="flex-1 ml-4 bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                  style={{ width: `${(myGuild.memberCount / myGuild.maxMembers) * 100}%` }}
                />
              </div>
            </div>

            {/* Special badge if selected */}
            {selectedGuild?.id === myGuild.id && (
              <div className="absolute top-2 right-2">
                <div className="bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  ACTIVE
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => setShowGuildList(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
          >
            <FaUsers />
            Browse Guilds
          </button>
        </div>
      )}

      {/* Create Guild Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-96 border border-yellow-400/30 shadow-2xl shadow-yellow-400/20">
            <div className="flex items-center gap-2 mb-4">
              <FaCrown className="text-yellow-400 text-2xl" />
              <h3 className="text-white text-2xl font-bold">Create New Guild</h3>
            </div>
            
            <input
              type="text"
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              placeholder="Guild Name"
              className="w-full mb-3 p-3 rounded-lg bg-gray-800 text-white outline-none border border-gray-700 focus:border-yellow-400 transition-colors"
              maxLength={50}
            />
            
            <textarea
              value={newGuildDesc}
              onChange={(e) => setNewGuildDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full mb-4 p-3 rounded-lg bg-gray-800 text-white outline-none resize-none border border-gray-700 focus:border-yellow-400 transition-colors"
              rows={3}
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleCreateGuild}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold rounded-lg px-4 py-3 transition-all duration-300 shadow-lg hover:shadow-yellow-400/50"
              >
                Create Guild
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGuildName("");
                  setNewGuildDesc("");
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guild List Modal */}
      {showGuildList && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-[550px] max-h-[700px] border border-purple-400/30 shadow-2xl shadow-purple-400/20">
            <div className="flex items-center gap-2 mb-4">
              <FaShieldAlt className="text-purple-400 text-2xl" />
              <h3 className="text-white text-2xl font-bold">Available Guilds</h3>
            </div>
            
            <div className="space-y-3 mb-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
              {guilds.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No guilds available. Create one!</p>
              ) : (
                guilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FaCrown className="text-yellow-400 text-sm" />
                          <div className="text-white font-bold text-lg">{guild.name}</div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">{guild.description}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaUsers className="text-purple-400" />
                            {guild.memberCount}/{guild.maxMembers}
                          </span>
                          <span>by {guild.createdBy}</span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {guild.isMember ? (
                          <div className="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-semibold border border-green-500/50">
                            ✓ Joined
                          </div>
                        ) : guild.isFull ? (
                          <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold border border-red-500/50">
                            Full
                          </div>
                        ) : (
                          <button
                            onClick={() => handleJoinGuild(guild.id)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress bar for guild */}
                    <div className="mt-3 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-500"
                        style={{ width: `${(guild.memberCount / guild.maxMembers) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowGuildList(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-3 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
};

export default GuildSection;