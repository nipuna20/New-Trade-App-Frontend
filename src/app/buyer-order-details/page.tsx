"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Package, Users, CheckCircle, Clock } from "lucide-react";

const API_URL = "http://trading-platform-backend-production-bddd.up.railway.app/api";

type BuyerOrderHistory = {
  id: number;
  buyer_order_id: number;
  buyer_user_id: number;
  buyer_transaction_id: string;
  original_price: number;
  original_qty: number;
  buyer_trade_date: string;
  buyer_trade_time: string;
  project_id: number;
  total_matched_qty: number;
  remaining_qty: number;
  match_count: number;
  seller_count: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type MatchAssignment = {
  id: number;
  buyer_order_id: number;
  seller_order_id: number;
  seller_user_id: number;
  seller_transaction_id: string;
  seller_total_qty: number;
  assigned_qty: number;
  seller_price: number;
  matched_order_id: number;
  assigned_at: string;
};

export default function BuyerOrderDetailsPage() {
  const [buyerHistory, setBuyerHistory] = useState<BuyerOrderHistory | null>(null);
  const [assignments, setAssignments] = useState<MatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("buyer_id");
    if (id) {
      setBuyerId(parseInt(id));
    }
  }, []);

  const fetchData = async () => {
    if (!buyerId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch buyer order history
      const historyResponse = await fetch(`${API_URL}/buyer-history/${buyerId}`);
      if (!historyResponse.ok) {
        throw new Error("Failed to fetch buyer order history");
      }
      const historyData = await historyResponse.json();
      setBuyerHistory(historyData);

      // Fetch match assignments
      const assignmentsResponse = await fetch(`${API_URL}/match-assignments/${buyerId}`);
      if (!assignmentsResponse.ok) {
        throw new Error("Failed to fetch match assignments");
      }
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buyerId) {
      fetchData();
    }
  }, [buyerId]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Partially Matched':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pending':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const calculatePercentage = (matched: number, total: number) => {
    if (total === 0) return 0;
    return ((matched / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Matched Orders</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-6 text-center rounded-lg">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && buyerHistory && (
          <div className="space-y-6">
            {/* Buyer Order Summary Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-blue-600" size={32} />
                <h1 className="text-2xl font-bold text-gray-900">
                  Buyer Order #{buyerHistory.buyer_order_id}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                  <p className="text-sm font-semibold text-gray-900">{buyerHistory.buyer_transaction_id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Buyer User ID</p>
                  <p className="text-sm font-semibold text-gray-900">{buyerHistory.buyer_user_id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Project ID</p>
                  <p className="text-sm font-semibold text-gray-900">{buyerHistory.project_id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(buyerHistory.status)}`}>
                    {buyerHistory.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Original Price</p>
                  <p className="text-2xl font-bold text-blue-900">${buyerHistory.original_price.toFixed(2)}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Original Quantity</p>
                  <p className="text-2xl font-bold text-blue-900">{buyerHistory.original_qty}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-1">Trade Date/Time</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {formatDate(buyerHistory.buyer_trade_date)}
                  </p>
                  <p className="text-xs text-blue-700">{buyerHistory.buyer_trade_time}</p>
                </div>
              </div>
            </div>

            {/* Matching Progress Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={28} />
                <h2 className="text-xl font-bold text-gray-900">Matching Progress</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 mb-1">Total Matched</p>
                  <p className="text-2xl font-bold text-green-900">{buyerHistory.total_matched_qty}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {calculatePercentage(buyerHistory.total_matched_qty, buyerHistory.original_qty)}% Complete
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-orange-900">{buyerHistory.remaining_qty}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {calculatePercentage(buyerHistory.remaining_qty, buyerHistory.original_qty)}% Remaining
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 mb-1">Match Count</p>
                  <p className="text-2xl font-bold text-purple-900">{buyerHistory.match_count}</p>
                  <p className="text-xs text-purple-600 mt-1">Total Matches</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <p className="text-xs text-indigo-700 mb-1">Seller Count</p>
                  <p className="text-2xl font-bold text-indigo-900">{buyerHistory.seller_count}</p>
                  <p className="text-xs text-indigo-600 mt-1">Unique Sellers</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Fulfillment Progress</span>
                  <span>{calculatePercentage(buyerHistory.total_matched_qty, buyerHistory.original_qty)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${calculatePercentage(buyerHistory.total_matched_qty, buyerHistory.original_qty)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Match Assignments Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-purple-600" size={28} />
                <h2 className="text-xl font-bold text-gray-900">
                  Seller Assignments ({assignments.length})
                </h2>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-600">No seller assignments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Seller Order ID</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Seller User ID</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Transaction ID</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Seller Price</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Seller Total Qty</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700 bg-blue-50">Assigned Qty</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Matched Order ID</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-700">Assigned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment, idx) => (
                        <tr
                          key={assignment.id}
                          className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-50 transition-colors border-b border-gray-100`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                            {assignment.seller_order_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {assignment.seller_user_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-mono">
                            {assignment.seller_transaction_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            ${assignment.seller_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {assignment.seller_total_qty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm bg-blue-50">
                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-semibold text-xs">
                              {assignment.assigned_qty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            <span className="text-xs text-gray-600">#{assignment.matched_order_id}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDateTime(assignment.assigned_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Footer */}
              {assignments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Total assignments from <span className="font-semibold">{assignments.length}</span> seller(s)
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Total Assigned: <span className="text-blue-600">{assignments.reduce((sum, a) => sum + a.assigned_qty, 0)}</span> units
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold">Created:</span> {formatDateTime(buyerHistory.created_at)}
                </div>
                <div>
                  <span className="font-semibold">Last Updated:</span> {formatDateTime(buyerHistory.updated_at)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
