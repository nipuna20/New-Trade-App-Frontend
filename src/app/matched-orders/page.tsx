"use client";
import { useState, useEffect } from "react";
import { CheckCircle, RefreshCw, ArrowLeft, Trophy, User, ArrowRight } from "lucide-react";

const API_URL = "http://localhost:8080/api";

type MatchedOrder = {
  id: number;
  seller_price: number;
  buyer_price: number;
  seller_qty: number; // The Seller's Total Quantity
  buyer_qty: number;
  matched_qty: number; // The Quantity Assigned/Allowed to Buyer
  seller_time: string;
  buyer_time: string;
  seller_date: string;
  buyer_date: string;
  incoming_time: string;
  outgoing_time: string;
  time_taken: string;
  status: string;
  transaction_type: number;
  buyer_user_id: number;
  seller_user_id: number;
  buyer_transaction_id: string;
  seller_transaction_id: string;
  project_id: number;
  buyer_order_id: number;
  seller_order_id: number;
  is_multi_match: boolean;
};

export default function MatchedOrdersPage() {
  const [data, setData] = useState<MatchedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdFilter, setUserIdFilter] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [projects, setProjects] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    // Fetch projects list
    fetch(`${API_URL}/projects`)
      .then(res => res.json())
      .then(projectList => {
        const projectMap = new Map();
        projectList.forEach((p: any) => {
          projectMap.set(p.id, p.name);
        });
        setProjects(projectMap);
      })
      .catch(err => console.error("Error fetching projects:", err));

    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // Check if URL has user_id parameter
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user_id");
    if (userId) {
      setUserIdFilter(parseInt(userId));
    }
  }, []);

  const getTransactionTypeName = (type: number) => {
    if (type === 0) return "Cash";
    if (type === 1) return "Crypto";
    if (type === 2) return "Cash/Crypto";
    return "Unknown";
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const fetchMatchedOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = `${API_URL}/matched-orders`;
      
      if (userIdFilter) {
        endpoint = `${API_URL}/matched-orders/user/${userIdFilter}`;
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setData(result || []);
      } else {
        setError(`Failed to fetch data: ${response.statusText}`);
      }
    } catch (err) {
      setError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchedOrders();
  }, [userIdFilter]);

  const getPageTitle = () => {
    if (userIdFilter && currentUser) {
      return `My Matched Orders (${currentUser.username})`;
    }
    return "All Matched Orders";
  };

  const navigateToDetails = (buyerOrderId: number) => {
    window.location.href = `/buyer-order-details?buyer_id=${buyerOrderId}`;
  };

  // Group orders by buyer_order_id and calculate totals
  const groupedOrders = data.reduce((acc, order) => {
    const key = order.buyer_order_id;
    if (!acc[key]) {
      acc[key] = {
        buyer: order,
        sellers: [],
        originalQty: 0
      };
    }
    acc[key].sellers.push(order);
    acc[key].originalQty += order.matched_qty; 
    return acc;
  }, {} as Record<number, { buyer: MatchedOrder; sellers: MatchedOrder[]; originalQty: number }>);

  const groupedOrdersArray = Object.values(groupedOrders);

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[98%] mx-auto"> {/* Slightly wider for extra column */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black rounded-lg hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-normal">Back</span>
          </button>
          
          <button
            onClick={fetchMatchedOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            <span className="font-normal">Refresh</span>
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-6">
            {userIdFilter ? (
              <User className="text-blue-600" size={32} />
            ) : (
              <CheckCircle className="text-green-600" size={32} />
            )}
            <h1 className="text-2xl font-bold text-black">{getPageTitle()}</h1>
          </div>

          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">Loading matched orders...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-6 text-center rounded">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="bg-gray-50 p-12 text-center rounded">
              <Trophy className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-gray-600 text-lg font-semibold">
                {userIdFilter ? "No matches found for your account" : "No matched orders yet"}
              </p>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th colSpan={3} className="px-2 py-2"></th>
                    <th colSpan={5} className="px-2 py-2 text-center font-bold text-gray-800 border-l border-gray-200">
                      Buyer's Original Order
                    </th>
                    {/* Updated ColSpan to 6 to accommodate new column */}
                    <th colSpan={6} className="px-2 py-2 text-center font-bold text-gray-800 border-l border-gray-200 bg-gray-50">
                      Seller's Order Details
                    </th>
                    <th colSpan={4} className="px-2 py-2"></th>
                  </tr>
                  
                  <tr className="border-b border-gray-300">
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Buyer Order ID</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Project ID</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Type</th>

                    {/* Buyer Section */}
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 border-l border-gray-100">Buyer User ID</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Date</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Time</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Price</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Original Qty</th>

                    {/* Seller Section - MODIFIED */}
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 border-l border-gray-100 bg-gray-50">Seller User ID</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 bg-gray-50">Date</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 bg-gray-50">Time</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 bg-gray-50">Price</th>
                    {/* New Columns */}
                    <th className="px-2 py-3 text-xs font-bold text-gray-700 bg-gray-50">Seller Total</th>
                    <th className="px-2 py-3 text-xs font-bold text-blue-800 bg-blue-50">Matched (Allowed)</th>

                    <th className="px-2 py-3 text-xs font-bold text-gray-700 border-l border-gray-100">Total Matched</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Time Taken</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Status</th>
                    <th className="px-2 py-3 text-xs font-bold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupedOrdersArray.map((group, groupIdx) => {
                    const { buyer, sellers, originalQty } = group;
                    const isMultiMatch = sellers.length > 1;
                    const totalMatched = sellers.reduce((sum, s) => sum + s.matched_qty, 0);
                    
                    return sellers.map((seller, sellerIdx) => {
                      const isFirstSeller = sellerIdx === 0;
                      const rowSpan = sellers.length;
                      
                      return (
                        <tr
                          key={`${buyer.buyer_order_id}-${seller.id}`}
                          className={`${groupIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-100 transition-colors border-b border-gray-100 ${isMultiMatch ? 'border-l-4 border-l-blue-500' : ''}`}
                        >
                          {isFirstSeller && (
                            <>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 font-medium align-top">
                                {isMultiMatch && <span className="text-blue-600 font-bold mr-1">★</span>}
                                #{buyer.buyer_order_id}
                              </td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">{buyer.project_id}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">{getTransactionTypeName(buyer.transaction_type)}</td>

                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 border-l border-gray-100 align-top">{buyer.buyer_user_id}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">{formatDate(buyer.buyer_date)}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">{formatTime(buyer.buyer_time)}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">${buyer.buyer_price.toFixed(2)}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 font-bold align-top bg-gray-50">{originalQty}</td>
                            </>
                          )}

                          {/* Seller Columns */}
                          <td className="px-2 py-2 text-[11px] text-gray-800 border-l border-gray-100">{seller.seller_user_id}</td>
                          <td className="px-2 py-2 text-[11px] text-gray-800">{formatDate(seller.seller_date)}</td>
                          <td className="px-2 py-2 text-[11px] text-gray-800">{formatTime(seller.seller_time)}</td>
                          <td className="px-2 py-2 text-[11px] text-gray-800">${seller.seller_price.toFixed(2)}</td>
                          
                          {/* NEW: Seller Total Quantity */}
                          <td className="px-2 py-2 text-[11px] text-gray-500">
                             {seller.seller_qty}
                          </td>
                          
                          {/* NEW: Matched (Allowed) Quantity */}
                          <td className="px-2 py-2 text-[11px] text-blue-800 font-bold bg-blue-50">
                            {seller.matched_qty}
                          </td>

                          {isFirstSeller && (
                            <>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 font-bold border-l border-gray-100 align-top bg-green-50">
                                {totalMatched}
                                {isMultiMatch && <span className="text-blue-600 ml-1">({sellers.length} sellers)</span>}
                              </td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">{seller.time_taken}</td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-[11px] text-gray-800 align-top">
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px]">
                                  {seller.status}
                                </span>
                              </td>
                              <td rowSpan={rowSpan} className="px-2 py-2 text-center align-top">
                                {isMultiMatch ? (
                                  <button
                                    onClick={() => navigateToDetails(buyer.buyer_order_id)}
                                    className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-[10px]"
                                    title="View detailed match breakdown"
                                  >
                                    <span>View</span>
                                    <ArrowRight size={12} />
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-[10px]">N/A</span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-center text-gray-500 text-xs">
                Showing {groupedOrdersArray.length} buyer {groupedOrdersArray.length === 1 ? 'order' : 'orders'} matched with {data.length} seller {data.length === 1 ? 'assignment' : 'assignments'}
              </div>
              <div className="text-center text-gray-400 text-xs flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="text-blue-600 font-bold">★</span> = Multi-match order
                </span>
                <span className="flex items-center gap-1">
                   <span className="w-3 h-3 text-gray-500 font-bold">100</span> = Seller Total Qty
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-50 border border-blue-200"></span> = Assigned to Buyer
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-50 border border-green-200"></span> = Total matched
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}