"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function TransactionsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const uid = data.session.user.id;
        setUserId(uid);
        await fetchTransactions(uid);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  async function fetchTransactions(uid: string) {
    // 拉取所有流水，按时间倒序
    const { data } = await supabase
      .from("turo_transactions")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false });
    
    if (data) setTransactions(data);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确定要删除这条记账记录吗？删除后不可恢复。")) return;
    
    try {
      const { error } = await supabase.from("turo_transactions").delete().eq("id", id);
      if (error) throw error;
      if (userId) await fetchTransactions(userId);
    } catch (err: any) {
      alert("删除失败: " + err.message);
    }
  }

  function downloadCSV() {
    if (transactions.length === 0) {
      alert("没有可以导出的数据。");
      return;
    }

    const headers = ["Date", "Vehicle", "Category", "Amount", "Trip ID", "Notes"];
    
    const rows = transactions.map(tx => {
      const dateStr = new Date(tx.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/,/g, '');
      const vehicleStr = tx.vehicle ? tx.vehicle.replace(/,/g, ' ') : ''; 
      const notesStr = tx.notes ? tx.notes.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
      const tripStr = tx.trip_id ? `Trip #${tx.trip_id}` : 'Global';
      
      return `${dateStr},${vehicleStr},${tx.type},${tx.amount},${tripStr},${notesStr}`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `higo_auto_finance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <div className="p-10 text-zinc-400">Loading transactions...</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">财务明细 (Ledger)</h1>
          <p className="mt-2 text-sm text-zinc-400">查看所有历史流水，导出 T2125 报税报表。</p>
        </div>
        
        {transactions.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <span className="text-lg">↓</span> Export CSV
          </button>
        )}
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121217]">
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-zinc-500">暂无任何流水记录。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-300">
                      {new Date(tx.date).toLocaleString([], { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {tx.vehicle}
                      {tx.trip_id && (
                        <span className="ml-2 inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                          Trip
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tx.type === "Trip Revenue" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-zinc-300 border border-white/10"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-medium ${
                      tx.type === "Trip Revenue" ? "text-emerald-400" : "text-zinc-200"
                    }`}>
                      {tx.type === "Trip Revenue" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-xs">
                      {tx.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-xs font-medium text-zinc-500 transition hover:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}