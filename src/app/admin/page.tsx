"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, RefreshCw, 
  ArrowLeft, Building2, Sun, Shield, AlertTriangle, Play, 
  Edit2, Save, X, Trash2, Layers 
} from "lucide-react";

type ProjectAnalytics = {
  project_id: number;
  project_name: string;
  day_start_value: number;
  day_close_value: number;
  highest_value: number;
  lowest_value: number;
  median_value: number;
  total_matches: number;
  total_volume: number;
  last_updated: string;
};

type OverallAnalytics = {
  day_start_value: number;
  day_close_value: number;
  highest_value: number;
  lowest_value: number;
  median_value: number;
  total_matches: number;
  total_volume: number;
  project_stats: ProjectAnalytics[];
  last_updated: string;
};

type CircuitBreaker = {
  project_id: number;
  project_name: string;
  threshold_percentage: number;
  is_halted: boolean;
  day_open_price: number;
  current_price: number;
  price_drop_percentage: number;
  halted_at?: string;
  last_checked: string;
};

// NEW: Order Type Definition
type Order = {
  id: number;
  user_id: number;
  transaction_id: string;
  price: number;
  quantity: number;
  trade_date: string;
  trade_time: string;
  transaction_type: number;
  project_id: number;
  role: string; // 'buyer' or 'seller'
};

const API_URL = "http://localhost:8080/api";

export default function AdminAnalytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([]);
  const [activeOrders, setActiveOrders] = useState<Record<string, Order[]>>({}); // NEW: State for orders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingThreshold, setEditingThreshold] = useState<{projectId: number, value: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'circuit-breaker' | 'orders'>('analytics'); // Updated Tab State

  // New State Variables
  const [matchingEnabled, setMatchingEnabled] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isTogglingMatching, setIsTogglingMatching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (userStr) {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData);
      
      if (!userData.is_admin) {
        router.push("/");
        return;
      }
    }

    fetchData();
    fetchMatchingStatus();
  }, [router]);

  const fetchMatchingStatus = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/admin/matching-engine/status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMatchingEnabled(data.enabled);
      }
    } catch (err) {
      console.error("Error fetching matching status:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem("token");
    
    try {
      // 1. Fetch Analytics
      const analyticsRes = await fetch(`${API_URL}/admin/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      // 2. Fetch Circuit Breakers
      const cbRes = await fetch(`${API_URL}/admin/circuit-breaker/status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        setCircuitBreakers(cbData || []);
      }

      // 3. NEW: Fetch Active (Top) Orders
      const ordersRes = await fetch(`${API_URL}/top-orders/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setActiveOrders(ordersData);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle Cancel Order
  const handleCancelOrder = async (role: string, id: number) => {
    if (!confirm(`Are you sure you want to cancel this ${role} order (ID: ${id})?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/orders/${role}/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        alert("✅ Order cancelled successfully");
        fetchData(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to cancel: ${errorData.message}`);
      }
    } catch (err) {
      alert("❌ Error connecting to server");
    }
  };

  const handleSetThreshold = async (projectId: number, threshold: number) => {
    const token = localStorage.getItem("token");
    
    if (threshold < 0 || threshold > 100) {
      alert("Threshold must be between 0 and 100%");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/circuit-breaker/set`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: projectId,
          threshold_percentage: threshold
        })
      });

      if (response.ok) {
        setEditingThreshold(null);
        fetchData();
      } else {
        alert("Failed to set threshold");
      }
    } catch (err) {
      alert("Error setting threshold");
    }
  };

  const handleResetCircuitBreaker = async (projectId: number) => {
    if (!confirm("Are you sure you want to resume trading for this project?")) {
      return;
    }

    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_URL}/admin/circuit-breaker/reset/${projectId}`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to reset circuit breaker");
      }
    } catch (err) {
      alert("Error resetting circuit breaker");
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm(
      "⚠️ WARNING: This will DELETE ALL trading data!\n\n" +
      "Type 'DELETE' in the next prompt to confirm."
    )) {
      return;
    }
  
    const confirmation = prompt("Type DELETE to confirm:");
    if (confirmation !== "DELETE") {
      alert("Database clear cancelled.");
      return;
    }
  
    setIsClearing(true);
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${API_URL}/admin/clear-database`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
  
      if (response.ok) {
        alert("✅ Database cleared successfully!");
        fetchData();
      } else {
        alert("❌ Failed to clear database");
      }
    } catch (err) {
      alert("❌ Error clearing database");
    } finally {
      setIsClearing(false);
    }
  };
  
  const handleToggleMatching = async () => {
    const newState = !matchingEnabled;
    const action = newState ? "START" : "STOP";
     
    if (!confirm(`Are you sure you want to ${action} the matching engine?`)) {
      return;
    }
  
    setIsTogglingMatching(true);
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${API_URL}/admin/matching-engine/toggle`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled: newState })
      });
  
      if (response.ok) {
        setMatchingEnabled(newState);
        alert(`✅ Matching engine ${newState ? 'STARTED' : 'STOPPED'}`);
      } else {
        alert("❌ Failed to toggle matching engine");
      }
    } catch (err) {
      alert("❌ Error toggling matching engine");
    } finally {
      setIsTogglingMatching(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, percentage: 0 };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { value: change, percentage };
  };

  // Helper to render Order Tables
  const renderOrderTable = (orders: Order[], title: string, role: string) => (
    <div className="mb-8">
      <h3 className={`text-lg font-bold mb-4 ${role === 'buyer' ? 'text-green-700' : 'text-blue-700'}`}>
        {title} ({orders?.length || 0})
      </h3>
      {(!orders || orders.length === 0) ? (
        <p className="text-gray-500 italic text-sm">No active orders.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">User ID</th>
                <th className="px-4 py-2 text-left">Project ID</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-center">Type</th>
                <th className="px-4 py-2 text-right">Time</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono">{order.id}</td>
                  <td className="px-4 py-2">{order.user_id}</td>
                  <td className="px-4 py-2 font-bold">{order.project_id}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold">
                    ${order.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">{order.quantity}</td>
                  <td className="px-4 py-2 text-center text-xs">
                     {order.transaction_type === 0 ? "Standard" : 
                      order.transaction_type === 1 ? "Good-Till-Date" : "Fill-or-Kill"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500 text-xs">
                    {order.trade_time}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleCancelOrder(role, order.id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all"
                      title="Cancel Order"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Combine top orders from different transaction types for display
  const allTopBuyers = [
    ...(activeOrders['top_buyer_0'] || []),
    ...(activeOrders['top_buyer_1'] || []),
    ...(activeOrders['top_buyer_2'] || [])
  ];
  
  const allTopSellers = [
    ...(activeOrders['top_seller_0'] || []),
    ...(activeOrders['top_seller_1'] || []),
    ...(activeOrders['top_seller_2'] || [])
  ];

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-black">Admin Control Panel</h1>
              <p className="text-sm text-gray-600">Analytics & Risk Management</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* ADMIN CONTROLS */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matching Engine Control */}
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-black mb-1">Matching Engine</h3>
                <p className="text-xs text-gray-600">
                  {matchingEnabled ? "Automatic matching is active" : "Matching is paused"}
                </p>
              </div>
              <button
                onClick={handleToggleMatching}
                disabled={isTogglingMatching}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  matchingEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } ${isTogglingMatching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isTogglingMatching ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : matchingEnabled ? (
                  <>
                    <X size={20} />
                    STOP
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    START
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear Database */}
          <div className="bg-white border-2 border-red-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-red-600 mb-1">Danger Zone</h3>
                <p className="text-xs text-gray-600">
                  Permanently delete all trading data
                </p>
              </div>
              <button
                onClick={handleClearDatabase}
                disabled={isClearing}
                className={`px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all flex items-center gap-2 ${
                  isClearing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isClearing ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} />
                    Clear Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={20} />
              Analytics
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('circuit-breaker')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'circuit-breaker'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield size={20} />
              Circuit Breaker
              {circuitBreakers.some(cb => cb.is_halted) && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {circuitBreakers.filter(cb => cb.is_halted).length}
                </span>
              )}
            </div>
          </button>

          {/* NEW TAB: Order Management */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={20} />
              Active Orders
              <span className="bg-gray-200 text-black text-xs px-2 py-0.5 rounded-full">
                {allTopBuyers.length + allTopSellers.length}
              </span>
            </div>
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>
            {/* Overall Summary Cards - ALL 7 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">DAY START</h3>
                  <Sun className="text-black" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">${analytics.day_start_value.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Yesterday's close</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">DAY CLOSE</h3>
                  <Activity className="text-black" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">${analytics.day_close_value.toFixed(2)}</p>
                {analytics.day_start_value > 0 && (
                  <p className={`text-xs mt-1 font-semibold ${
                    analytics.day_close_value >= analytics.day_start_value ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.day_close_value >= analytics.day_start_value ? '↑' : '↓'} 
                    {' '}${Math.abs(analytics.day_close_value - analytics.day_start_value).toFixed(2)}
                    {' '}({Math.abs(((analytics.day_close_value - analytics.day_start_value) / analytics.day_start_value) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">HIGHEST</h3>
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">${analytics.highest_value.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Today's peak</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">LOWEST</h3>
                  <TrendingDown className="text-red-600" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">${analytics.lowest_value.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Today's low</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">MEDIAN</h3>
                  <BarChart3 className="text-black" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">${analytics.median_value.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Average price</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">MATCHES</h3>
                  <BarChart3 className="text-black" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">{analytics.total_matches}</p>
                <p className="text-xs text-gray-500 mt-1">Today's trades</p>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">VOLUME</h3>
                  <BarChart3 className="text-black" size={20} />
                </div>
                <p className="text-3xl font-bold text-black">{analytics.total_volume}</p>
                <p className="text-xs text-gray-500 mt-1">Units traded</p>
              </div>
            </div>

            {/* Project Analytics Table */}
            <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="text-black" size={24} />
                <h2 className="text-2xl font-bold text-black">Project Analytics</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-3 px-4 font-bold text-sm">PROJECT</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">START</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">CLOSE</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">CHANGE</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">HIGH</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">LOW</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">MEDIAN</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">MATCHES</th>
                      <th className="text-right py-3 px-4 font-bold text-sm">VOLUME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.project_stats.map((project) => {
                      const change = calculateChange(project.day_close_value, project.day_start_value);
                      const hasData = project.day_close_value > 0 || project.day_start_value > 0 || project.total_matches > 0;
                      
                      return (
                        <tr 
                          key={project.project_id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${!hasData ? 'opacity-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-black">{project.project_name}</div>
                            <div className="text-xs text-gray-500">ID: {project.project_id}</div>
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-black">
                            {project.day_start_value > 0 ? `$${project.day_start_value.toFixed(2)}` : <span className="text-gray-400">$0.00</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-mono font-semibold text-black">
                            {project.day_close_value > 0 ? `$${project.day_close_value.toFixed(2)}` : <span className="text-gray-400">$0.00</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-mono">
                            {project.day_start_value > 0 && project.day_close_value > 0 ? (
                              <span className={`font-semibold ${change.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change.value >= 0 ? '↑' : '↓'} {Math.abs(change.percentage).toFixed(2)}%
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-black">
                            {project.highest_value > 0 ? `$${project.highest_value.toFixed(2)}` : <span className="text-gray-400">$0.00</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-black">
                            {project.lowest_value > 0 ? `$${project.lowest_value.toFixed(2)}` : <span className="text-gray-400">$0.00</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-black">
                            {project.median_value > 0 ? `$${project.median_value.toFixed(2)}` : <span className="text-gray-400">$0.00</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-black">
                            {project.total_matches > 0 ? project.total_matches : <span className="text-gray-400">0</span>}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-black">
                            {project.total_volume > 0 ? project.total_volume : <span className="text-gray-400">0</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {analytics.project_stats.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No project data available yet</p>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Last updated: {analytics.last_updated}
              </p>
            </div>
          </>
        )}

        {/* Circuit Breaker Tab */}
        {activeTab === 'circuit-breaker' && (
          <div className="bg-white border-2 border-black rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="text-black" size={24} />
                <h2 className="text-2xl font-bold text-black">Circuit Breaker Management</h2>
              </div>
              <p className="text-sm text-gray-600">
                Set price drop thresholds to automatically halt trading when exceeded. Orders will be accepted but not matched until manually resumed.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-3 px-4 font-bold text-sm">PROJECT</th>
                    <th className="text-center py-3 px-4 font-bold text-sm">STATUS</th>
                    <th className="text-center py-3 px-4 font-bold text-sm">THRESHOLD %</th>
                    <th className="text-right py-3 px-4 font-bold text-sm">OPEN</th>
                    <th className="text-right py-3 px-4 font-bold text-sm">CURRENT</th>
                    <th className="text-right py-3 px-4 font-bold text-sm">DROP %</th>
                    <th className="text-center py-3 px-4 font-bold text-sm">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {circuitBreakers.map((cb) => (
                    <tr 
                      key={cb.project_id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${cb.is_halted ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-black">{cb.project_name}</div>
                        <div className="text-xs text-gray-500">ID: {cb.project_id}</div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {cb.is_halted ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                            <AlertTriangle size={14} />
                            HALTED
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                            <Play size={14} />
                            ACTIVE
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {editingThreshold?.projectId === cb.project_id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editingThreshold.value}
                              onChange={(e) => setEditingThreshold({projectId: cb.project_id, value: e.target.value})}
                              className="w-20 px-2 py-1 border-2 border-black rounded text-center font-mono"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSetThreshold(cb.project_id, parseFloat(editingThreshold.value));
                                } else if (e.key === 'Escape') {
                                  setEditingThreshold(null);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleSetThreshold(cb.project_id, parseFloat(editingThreshold.value))}
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingThreshold(null)}
                              className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingThreshold({projectId: cb.project_id, value: cb.threshold_percentage.toString()})}
                            className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black rounded hover:bg-gray-100 transition-all font-mono font-bold"
                          >
                            {cb.threshold_percentage > 0 ? `${cb.threshold_percentage.toFixed(1)}%` : 'Set'}
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 font-mono text-black">
                        {cb.day_open_price > 0 ? `$${cb.day_open_price.toFixed(2)}` : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="text-right py-3 px-4 font-mono font-semibold text-black">
                        {cb.current_price > 0 ? `$${cb.current_price.toFixed(2)}` : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {cb.price_drop_percentage > 0 ? (
                          <span className={`font-bold ${
                            cb.price_drop_percentage >= cb.threshold_percentage ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            ↓ {cb.price_drop_percentage.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {cb.is_halted && (
                          <button
                            onClick={() => handleResetCircuitBreaker(cb.project_id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all inline-flex items-center gap-2"
                          >
                            <Play size={16} />
                            Resume Trading
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {circuitBreakers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No circuit breaker data available</p>
              </div>
            )}
          </div>
        )}

        {/* NEW TAB CONTENT: Active Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white border-2 border-black rounded-lg p-6">
             <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="text-black" size={24} />
                <h2 className="text-2xl font-bold text-black">Active Matching Pool</h2>
              </div>
              <p className="text-sm text-gray-600">
                These orders are currently stuck or waiting to be matched. You can manually cancel them to clear the liquidity.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sellers Column */}
              {renderOrderTable(allTopSellers, "Top Sellers", "seller")}

              {/* Buyers Column */}
              {renderOrderTable(allTopBuyers, "Top Buyers", "buyer")}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}