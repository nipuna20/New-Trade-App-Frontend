"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, CheckCircle, XCircle, Database, Table, Trophy, LogOut, User, DollarSign, Hash, Calendar, Clock, Award, Settings, Target, Briefcase, Crown } from "lucide-react";
type NotificationType = {
  type: "success" | "error";
  message: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
};

const API_URL = "http://trading-platform-backend-production-bddd.up.railway.app/api";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [buyerProjectId, setBuyerProjectId] = useState<number | null>(null);
  const [sellerProjectId, setSellerProjectId] = useState<number | null>(null);
  
  // General Parameters
  const [matchType, setMatchType] = useState<"exact" | "highest_to_lowest" | null>(null);
  
  // Buyer-specific parameter
  const [buyerMarketLeadProgram, setBuyerMarketLeadProgram] = useState<boolean>(false);
  
  // Seller-specific parameter
  const [sellerMarketLeadProgram, setSellerMarketLeadProgram] = useState<boolean>(false);
  
  const [buyerPrice, setBuyerPrice] = useState("");
  const [buyerQuantity, setBuyerQuantity] = useState("");
  const [buyerDate, setBuyerDate] = useState("");
  const [buyerTime, setBuyerTime] = useState("");
  const [buyerTransactionType, setBuyerTransactionType] = useState<number | null>(null);

  const [sellerPrice, setSellerPrice] = useState("");
  const [sellerQuantity, setSellerQuantity] = useState("");
  const [sellerDate, setSellerDate] = useState("");
  const [sellerTime, setSellerTime] = useState("");
  const [sellerTransactionType, setSellerTransactionType] = useState<number | null>(null);

  const [notification, setNotification] = useState<NotificationType | null>(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/projects`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data || []);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    
    fetchProjects();
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUserId(userData.id);
        setCurrentUser(userData);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    fetch(`${API_URL}/auth/verify`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setUserId(data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    })
    .catch(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    });
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getTransactionTypeName = (type: number | null) => {
    if (type === 0) return "Cash";
    if (type === 1) return "Crypto";
    if (type === 2) return "Cash & Crypto";
    return "";
  };

  const handleBuyerTransactionTypeChange = (type: number) => {
    setBuyerTransactionType(buyerTransactionType === type ? null : type);
  };

  const handleSellerTransactionTypeChange = (type: number) => {
    setSellerTransactionType(sellerTransactionType === type ? null : type);
  };

  const formatTimeForAPI = (timeString: string): string => {
    if (!timeString) return "";
    
    if (timeString.length === 5 && timeString.includes(":")) {
      return `${timeString}:00`;
    }
    
    if (timeString.length === 8 && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    let cleaned = timeString.split("T")[0] || timeString;
    cleaned = cleaned.split("Z")[0];
    cleaned = cleaned.split("+")[0];
    
    if (cleaned.includes(":")) {
      const parts = cleaned.split(":");
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, "0");
        const minutes = parts[1].padStart(2, "0");
        const seconds = parts[2] ? parts[2].padStart(2, "0") : "00";
        return `${hours}:${minutes}:${seconds}`;
      }
    }
    
    return timeString;
  };

  const handleBuySubmit = async () => {
    const formattedTime = formatTimeForAPI(buyerTime);
    
    const matchTypeValue = matchType === "exact" ? 0 : 1;
    
    const orderData = {
      role: "buyer",
      price: Number(buyerPrice),
      quantity: Number(buyerQuantity),
      trade_date: buyerDate,
      trade_time: formattedTime,
      transaction_type: buyerTransactionType,
      user_id: userId,
      match_type: matchTypeValue,
      market_lead_program: buyerMarketLeadProgram,
      project_id: buyerProjectId,
    };
    
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        const data = await response.json();
        const projectName = projects.find(p => p.id === buyerProjectId)?.name || "Unknown";
        showNotification("success", `Buy order placed! ID: ${data.id} | TXN: ${data.transaction_id} | Type: ${getTransactionTypeName(buyerTransactionType)} | Match: ${matchType} | MLP: ${buyerMarketLeadProgram ? 'Yes' : 'No'} | Project: ${projectName} | User: ${currentUser?.username}`);
        
        setBuyerPrice("");
        setBuyerQuantity("");
        setBuyerDate("");
        setBuyerTime("");
        setBuyerTransactionType(null);
        setBuyerMarketLeadProgram(false);
        setBuyerProjectId(null);
      } else {
        const error = await response.text();
        showNotification("error", `Failed to place buy order: ${error}`);
      }
    } catch (error) {
      showNotification("error", "Network error. Please check if backend is running.");
    }
  };

  const handleSellSubmit = async () => {
    const formattedTime = formatTimeForAPI(sellerTime);
    
    const matchTypeValue = matchType === "exact" ? 0 : 1;
    
    const orderData = {
      role: "seller",
      price: Number(sellerPrice),
      quantity: Number(sellerQuantity),
      trade_date: sellerDate,
      trade_time: formattedTime,
      transaction_type: sellerTransactionType,
      user_id: userId,
      match_type: matchTypeValue,
      market_lead_program: sellerMarketLeadProgram,
      project_id: sellerProjectId,
    };
    
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        const data = await response.json();
        const projectName = projects.find(p => p.id === sellerProjectId)?.name || "Unknown";
        showNotification("success", `Sell order placed! ID: ${data.id} | TXN: ${data.transaction_id} | Type: ${getTransactionTypeName(sellerTransactionType)} | Match: ${matchType} | MLP: ${sellerMarketLeadProgram ? 'Yes' : 'No'} | Project: ${projectName} | User: ${currentUser?.username}`);
        
        setSellerPrice("");
        setSellerQuantity("");
        setSellerDate("");
        setSellerTime("");
        setSellerTransactionType(null);
        setSellerMarketLeadProgram(false);
        setSellerProjectId(null);
      } else {
        const error = await response.text();
        showNotification("error", `Failed to place sell order: ${error}`);
      }
    } catch (error) {
      showNotification("error", "Network error. Please check if backend is running.");
    }
  };

  const viewTable = (table: string) => {
    window.open(`/view-table?table=${table}`, '_blank');
  };

  const viewMatchedOrders = () => {
    window.open('/matched-orders', '_blank');
  };

  const viewMyMatches = () => {
    window.open(`/matched-orders?user_id=${userId}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out">
          <div className="flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-2 bg-white border-gray-300">
            {notification.type === "success" ? (
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            ) : (
              <XCircle className="text-red-600 flex-shrink-0" size={24} />
            )}
            <div className="max-w-xs">
              <p className="font-semibold text-black">
                {notification.type === "success" ? "Success!" : "Error"}
              </p>
              <p className="text-sm text-gray-600">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-xl shadow-md border border-gray-200 px-4 py-3">
  <div className="flex items-center gap-3">
    <div className="bg-black text-white p-2 rounded-lg">
      <User size={20} />
    </div>
    <div>
      <p className="text-xs text-gray-500">Logged in as</p>
      <p className="text-sm font-bold text-black">{currentUser?.username}</p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    {currentUser?.is_admin && (
      <button
        onClick={() => router.push('/admin')}
        className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-all text-sm font-semibold"
      >
        <Crown size={16} />
        Admin
      </button>
    )}
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-semibold"
    >
      <LogOut size={16} />
      Logout
    </button>
  </div>
</div>

        {/* Compact Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="text-black" size={28} />
            <h1 className="text-3xl font-bold text-black">Trade Platform</h1>
          </div>
          <p className="text-gray-600 text-sm">Place your buy or sell orders quickly</p>
        </div>

        {/* GENERAL PARAMETERS SECTION */}
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-md border-2 border-amber-300 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="text-amber-600" size={24} />
            <h2 className="text-xl font-bold text-black">General Parameters</h2>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Match Type (applies to both buy and sell orders)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label 
                className="flex items-center gap-3 cursor-pointer bg-gray-50 hover:bg-gray-100 border-3 rounded-lg p-4 transition-all"
                style={{
                  borderColor: matchType === "exact" ? '#f59e0b' : '#e5e7eb',
                  backgroundColor: matchType === "exact" ? '#fef3c7' : '#f9fafb',
                  borderWidth: '3px'
                }}
              >
                <input
                  type="radio"
                  name="matchType"
                  checked={matchType === "exact"}
                  onChange={() => setMatchType("exact")}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="text-base font-bold text-black block mb-1">Exact Match</span>
                  <span className="text-xs text-gray-600">Orders match only when prices are exactly equal</span>
                </div>
              </label>
              
              <label 
                className="flex items-center gap-3 cursor-pointer bg-gray-50 hover:bg-gray-100 border-3 rounded-lg p-4 transition-all"
                style={{
                  borderColor: matchType === "highest_to_lowest" ? '#f59e0b' : '#e5e7eb',
                  backgroundColor: matchType === "highest_to_lowest" ? '#fef3c7' : '#f9fafb',
                  borderWidth: '3px'
                }}
              >
                <input
                  type="radio"
                  name="matchType"
                  checked={matchType === "highest_to_lowest"}
                  onChange={() => setMatchType("highest_to_lowest")}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <span className="text-base font-bold text-black block mb-1">Highest to Lowest Match</span>
                  <span className="text-xs text-gray-600">Orders match by best available prices (buyers: lowest, sellers: highest)</span>
                </div>
              </label>
            </div>
            
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong className="text-amber-700">Current Selection:</strong> {matchType === "exact" ? "Exact Match (0)" : "Highest to Lowest Match (1)"}
              </p>
            </div>
          </div>
        </div>

        {/* TWO MATCHED ORDER BANNERS SIDE BY SIDE */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* My Matches Banner
          <div 
            onClick={viewMyMatches}
            className="group bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md overflow-hidden border border-blue-700 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Award className="text-white group-hover:scale-110 transition-transform" size={32} />
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">My Matches</h2>
                <p className="text-blue-100 text-xs">Your completed trades</p>
              </div>
            </div>
            <div className="text-white text-xl">→</div>
          </div> */}

          {/* All Matches Banner */}
          <div 
            onClick={viewMatchedOrders}
            className="group bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md overflow-hidden border border-green-700 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="text-white group-hover:scale-110 transition-transform" size={32} />
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">All Matches</h2>
                <p className="text-green-100 text-xs">All completed trades</p>
              </div>
            </div>
            <div className="text-white text-xl">→</div>
          </div>
        </div>

        {/* COMPACT FORMS SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BUYER FORM - COMPACT */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="bg-blue-500 px-4 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Buy Order</h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Project Selection - Buyer */}
              <div>
  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-2">
    <Briefcase size={14} />
    Select Project *
  </label>
  <select
    value={buyerProjectId || ""}
    onChange={(e) => setBuyerProjectId(Number(e.target.value))}
    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-black bg-white"
  >
    <option value="">-- Choose a Project --</option>
    {projects.map((project) => (
      <option key={project.id} value={project.id}>
        #{project.id} - {project.name}
      </option>
    ))}
  </select>
  {buyerProjectId && (
    <p className="text-xs text-gray-600 mt-1">
      <span className="font-semibold">Project #{buyerProjectId}:</span> {projects.find(p => p.id === buyerProjectId)?.description}
    </p>
  )}
</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <DollarSign size={14} />
                    Price
                  </label>
                  <input
                    type="number"
                    value={buyerPrice}
                    onChange={(e) => setBuyerPrice(e.target.value)}
                    step="0.01"
                    placeholder="100.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Hash size={14} />
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={buyerQuantity}
                    onChange={(e) => setBuyerQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-black placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Transaction Type
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: buyerTransactionType === 0 ? '#3b82f6' : '#e5e7eb', backgroundColor: buyerTransactionType === 0 ? '#eff6ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={buyerTransactionType === 0}
                      onChange={() => handleBuyerTransactionTypeChange(0)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Cash</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: buyerTransactionType === 1 ? '#3b82f6' : '#e5e7eb', backgroundColor: buyerTransactionType === 1 ? '#eff6ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={buyerTransactionType === 1}
                      onChange={() => handleBuyerTransactionTypeChange(1)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Crypto</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: buyerTransactionType === 2 ? '#3b82f6' : '#e5e7eb', backgroundColor: buyerTransactionType === 2 ? '#eff6ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={buyerTransactionType === 2}
                      onChange={() => handleBuyerTransactionTypeChange(2)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Cash or Crypto</span>
                  </label>
                </div>
              </div>

              {/* Market Lead Program - Buyer */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-2 border-blue-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buyerMarketLeadProgram}
                    onChange={(e) => setBuyerMarketLeadProgram(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Target className="text-blue-600" size={18} />
                    <div>
                      <span className="text-sm font-bold text-black block">Market Lead Program</span>
                      <span className="text-xs text-gray-600">Priority matching for this buy order</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={buyerDate}
                    onChange={(e) => setBuyerDate(e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-black"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Clock size={14} />
                    Time (HH:MM:SS)
                  </label>
                  <input
                    type="time"
                    value={buyerTime}
                    onChange={(e) => setBuyerTime(e.target.value)}
                    step="1"
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-black"
                  />
                </div>
              </div>

              <button
                onClick={handleBuySubmit}
                disabled={!buyerPrice || !buyerQuantity || !buyerDate || !buyerTime || buyerTransactionType === null || matchType === null || !buyerProjectId}
                className={`w-full font-bold py-3 px-4 rounded-lg transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm ${
                  buyerPrice && buyerQuantity && buyerDate && buyerTime && buyerTransactionType !== null && matchType !== null && buyerProjectId
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                Place Buy Order
              </button>
            </div>
          </div>

          {/* SELLER FORM - COMPACT */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="bg-purple-500 px-4 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Sell Order</h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Project Selection - Seller */}
              <div>
  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-2">
    <Briefcase size={14} />
    Select Project *
  </label>
  <select
    value={sellerProjectId || ""}
    onChange={(e) => setSellerProjectId(Number(e.target.value))}
    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-black bg-white"
  >
    <option value="">-- Choose a Project --</option>
    {projects.map((project) => (
      <option key={project.id} value={project.id}>
        #{project.id} - {project.name}
      </option>
    ))}
  </select>
  {sellerProjectId && (
    <p className="text-xs text-gray-600 mt-1">
      <span className="font-semibold">Project #{sellerProjectId}:</span> {projects.find(p => p.id === sellerProjectId)?.description}
    </p>
  )}
</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <DollarSign size={14} />
                    Price
                  </label>
                  <input
                    type="number"
                    value={sellerPrice}
                    onChange={(e) => setSellerPrice(e.target.value)}
                    step="0.01"
                    placeholder="125.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-black placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Hash size={14} />
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={sellerQuantity}
                    onChange={(e) => setSellerQuantity(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-black placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Transaction Type
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: sellerTransactionType === 0 ? '#a855f7' : '#e5e7eb', backgroundColor: sellerTransactionType === 0 ? '#faf5ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={sellerTransactionType === 0}
                      onChange={() => handleSellerTransactionTypeChange(0)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Cash</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: sellerTransactionType === 1 ? '#a855f7' : '#e5e7eb', backgroundColor: sellerTransactionType === 1 ? '#faf5ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={sellerTransactionType === 1}
                      onChange={() => handleSellerTransactionTypeChange(1)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Crypto</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 rounded-lg px-2 py-2 transition-all" style={{borderColor: sellerTransactionType === 2 ? '#a855f7' : '#e5e7eb', backgroundColor: sellerTransactionType === 2 ? '#faf5ff' : '#f9fafb'}}>
                    <input
                      type="checkbox"
                      checked={sellerTransactionType === 2}
                      onChange={() => handleSellerTransactionTypeChange(2)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-medium text-black">Cash or Crypto</span>
                  </label>
                </div>
              </div>

              {/* Market Lead Program - Seller */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-2 border-purple-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellerMarketLeadProgram}
                    onChange={(e) => setSellerMarketLeadProgram(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Target className="text-purple-600" size={18} />
                    <div>
                      <span className="text-sm font-bold text-black block">Market Lead Program</span>
                      <span className="text-xs text-gray-600">Priority matching for this sell order</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={sellerDate}
                    onChange={(e) => setSellerDate(e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-black"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                    <Clock size={14} />
                    Time (HH:MM:SS)
                  </label>
                  <input
                    type="time"
                    value={sellerTime}
                    onChange={(e) => setSellerTime(e.target.value)}
                    step="1"
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-black"
                  />
                </div>
              </div>

              <button
                onClick={handleSellSubmit}
                disabled={!sellerPrice || !sellerQuantity || !sellerDate || !sellerTime || sellerTransactionType === null || matchType === null || !sellerProjectId}
                className={`w-full font-bold py-3 px-4 rounded-lg transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm ${
                  sellerPrice && sellerQuantity && sellerDate && sellerTime && sellerTransactionType !== null && matchType !== null && sellerProjectId
                    ? "bg-purple-500 text-white hover:bg-purple-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                Place Sell Order
              </button>
            </div>
          </div>
        </div>

        {/* ALL ORDERS SECTION */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center justify-center gap-2">
            <Database className="text-black" size={24} />
            All Orders (Real-Time)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div 
              onClick={() => viewTable("buyer")}
              className="group bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:scale-105"
            >
              <Table className="text-blue-600 group-hover:text-blue-700 mb-3" size={48} />
              <h3 className="text-lg font-bold text-black mb-1">Buyer Orders</h3>
              <p className="text-gray-600 text-xs">View all buyer orders</p>
            </div>
            <div 
              onClick={() => viewTable("seller")}
              className="group bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:scale-105"
            >
              <Table className="text-purple-600 group-hover:text-purple-700 mb-3" size={48} />
              <h3 className="text-lg font-bold text-black mb-1">Seller Orders</h3>
              <p className="text-gray-600 text-xs">View all seller orders</p>
            </div>
          </div>
        </div>

        {/* TOP 10 ORDERS SECTION */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center justify-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Top 10 Best Orders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div 
              onClick={() => viewTable("top_buyer")}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-300 p-5 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:scale-105"
            >
              <Trophy className="text-blue-600 group-hover:text-blue-700 mb-3" size={48} />
              <h3 className="text-lg font-bold text-black mb-1">Top Buyer Orders</h3>
              <p className="text-gray-700 text-xs font-medium mb-2">10 Highest Prices (MLP Priority)</p>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">Cash</span>
                <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full">Crypto</span>
                <span className="px-2 py-0.5 bg-cyan-200 text-cyan-800 text-xs rounded-full">Cash or Crypto</span>
              </div>
            </div>
            <div 
              onClick={() => viewTable("top_seller")}
              className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border border-purple-300 p-5 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center cursor-pointer hover:scale-105"
            >
              <Trophy className="text-purple-600 group-hover:text-purple-700 mb-3" size={48} />
              <h3 className="text-lg font-bold text-black mb-1">Top Seller Orders</h3>
              <p className="text-gray-700 text-xs font-medium mb-2">10 Lowest Prices (MLP Priority)</p>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full">Cash</span>
                <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full">Crypto</span>
                <span className="px-2 py-0.5 bg-pink-200 text-pink-800 text-xs rounded-full">Cash or Crypto</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 px-4">
          All fields including project, transaction type and match type are required. Click cards to view data in new tabs.
          <br />
          <span className="font-semibold text-black">Top 10 tables auto-update</span> when new orders are placed!
          <br />
          <span className="font-semibold text-green-600">Orders automatically match when both top tables are full!</span>
          <br />
          <span className="font-semibold text-amber-600">Match Type: {matchType === "exact" ? "Exact Match (0)" : matchType === "highest_to_lowest" ? "Highest to Lowest Match (1)" : "Not Selected"}</span>
          <br />
          <span className="font-semibold text-blue-600">⭐ Market Lead Program: Available for BOTH Buy and Sell Orders - Get Priority Matching!</span>
          <br />
          <span className="font-semibold text-purple-600">💼 Projects: Orders only match within the SAME project!</span>
        </p>
      </div>
    </div>
  );
}
