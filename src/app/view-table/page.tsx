"use client";
import { useState, useEffect } from "react";
import { Database, RefreshCw, ArrowLeft, Trophy } from "lucide-react";

const API_URL = "http://localhost:8080/api";

type Order = {
  id: number;
  role: string;
  price: number;
  quantity: number;
  trade_date: string;
  trade_time: string;
  transaction_type: number | string;
  created_at?: string; 
};

type TableData = Omit<Order, 'created_at'>[]; 

export default function ViewTablePage() {
  const [tableName, setTableName] = useState("");
  const [data, setData] = useState<TableData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table") || "";
    setTableName(table);
  }, []);

  const getTransactionTypeName = (type: number) => {
    if (type === 0) return "Cash";
    if (type === 1) return "Crypto";
    if (type === 2) return "Cash or Crypto";
    return "Unknown";
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr.split('T')[0];
    }
  };

  const fetchTableData = async () => {
    if (!tableName) return;
    
    setLoading(true);
    setError(null);
    
    let endpoint = "";
    
    switch(tableName) {
      case "buyer":
        endpoint = `${API_URL}/orders/buyer/all`;
        break;
      case "seller":
        endpoint = `${API_URL}/orders/seller/all`;
        break;
      case "top_buyer":
        endpoint = `${API_URL}/orders/all`;
        break;
      case "top_seller":
        endpoint = `${API_URL}/orders/all`;
        break;
      default:
        setError("Invalid table name");
        setLoading(false);
        return;
    }
    
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        
        let processedData: Order[] = [];
        
        if (tableName === "top_buyer") {
          const topBuyerResponse = await fetch(`${API_URL}/top-orders/all`);
          if (topBuyerResponse.ok) {
            const topResult = await topBuyerResponse.json();
            processedData = topResult.top_buyer_0 || [];
            if (topResult.top_buyer_1) processedData = [...processedData, ...topResult.top_buyer_1];
            if (topResult.top_buyer_2) processedData = [...processedData, ...topResult.top_buyer_2];
            
            processedData.sort((a, b) => b.price - a.price);
          }
        } else if (tableName === "top_seller") {
          const topSellerResponse = await fetch(`${API_URL}/top-orders/all`);
          if (topSellerResponse.ok) {
            const topResult = await topSellerResponse.json();
            processedData = topResult.top_seller_0 || [];
            if (topResult.top_seller_1) processedData = [...processedData, ...topResult.top_seller_1];
            if (topResult.top_seller_2) processedData = [...processedData, ...topResult.top_seller_2];
            
            processedData.sort((a, b) => a.price - b.price);
          }
        } else {
          if (tableName === "buyer" || tableName === "seller") {
            processedData = Array.isArray(result) ? result : [];
            
            if (tableName === "buyer") {
              processedData.sort((a, b) => b.price - a.price);
            } else if (tableName === "seller") {
              processedData.sort((a, b) => a.price - b.price);
            }
          }
        }
        
        
        const transformedData = processedData.map((item: Order) => {
     
          const { created_at, ...rest } = item;
          
          return {
            ...rest,
            trade_date: formatDate(item.trade_date),
            transaction_type: getTransactionTypeName(item.transaction_type as number)
          };
        });
        
        setData(transformedData as any);
      } else {
        setError(`Failed to fetch data: ${response.statusText}`);
      }
    } catch () {
      setError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      fetchTableData();
    }
  }, [tableName]);

  const getTableTitle = () => {
    switch(tableName) {
      case "buyer": return "All Buyer Orders (Highest to Lowest)";
      case "seller": return "All Seller Orders (Lowest to Highest)";
      case "top_buyer": return "Top 10 Buyer Orders (Highest Prices)";
      case "top_seller": return "Top 10 Seller Orders (Lowest Prices)";
      default: return "Database Table";
    }
  };

  const isTopTable = tableName.startsWith("top_");

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black rounded-lg hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-normal">Close</span>
          </button>
          
          <button
            onClick={fetchTableData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            <span className="font-normal">Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            {isTopTable ? (
              <Trophy className="text-black" size={40} />
            ) : (
              <Database className="text-black" size={40} />
            )}
            <h1 className="text-3xl font-bold text-black">{getTableTitle()}</h1>
          </div>

          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">Loading data...</p>
            </div>
          )}

          {error && (
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <p className="text-black font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <Database className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-gray-800 text-lg font-semibold">No data found</p>
              <p className="text-gray-600 text-sm mt-2">This table is currently empty</p>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    {Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                 
                        className="px-4 py-3 text-left text-sm font-normal text-black capitalize"
                      >
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-green-100 transition-colors cursor-pointer`}
                    >
                      {Object.values(row).map((value, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-2 py-1 text-[9px] text-black"
                        >
                          {value !== null && value !== undefined ? String(value) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="mt-6 text-center text-gray-600 text-sm">
              Showing {data.length} {data.length === 1 ? 'record' : 'records'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
