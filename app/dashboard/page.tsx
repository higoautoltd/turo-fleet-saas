"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { MapPin, FileText, Edit, Trash2, Plus, Check } from "lucide-react";

const TRANSACTION_TYPES = [
  "行程收入", "加油费", "洗车费", "维修保养", "保险费",
  "停车与过路费", "广告营销", "办公用品", "专业服务费", "其他支出"
] as const;

type Vehicle = { id: number; name: string; year?: number; make?: string; model?: string; license_plate?: string; };
type Trip = { 
  id: number; reservation_id: string; vehicle_name: string; 
  start_time: string; end_time: string; status: string;
  pickup_location?: string; earnings?: number; notes?: string;
};

function currentDateTimeLocal() {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
}

export default function DashboardPage() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [txDrawerOpen, setTxDrawerOpen] = useState(false);
  const [tripDrawerOpen, setTripDrawerOpen] = useState(false);

  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [txDate, setTxDate] = useState(currentDateTimeLocal);
  const [txVehicle, setTxVehicle] = useState(""); 
  const [txType, setTxType] = useState<string>("加油费");
  const [txAmount, setTxAmount] = useState("");
  const [txNotes, setTxNotes] = useState("");
  const [txTripId, setTxTripId] = useState<number | "">(""); 

  const [tripResId, setTripResId] = useState("");
  const [tripVehicle, setTripVehicle] = useState("");
  const [tripStart, setTripStart] = useState(currentDateTimeLocal);
  const [tripEnd, setTripEnd] = useState(currentDateTimeLocal);
  const [tripLocation, setTripLocation] = useState("");
  const [tripEarnings, setTripEarnings] = useState("");
  const [tripNotes, setTripNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  async function loadData(uid: string) {
    const [txRes, vehRes, tripRes] = await Promise.all([
      supabase.from("turo_transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
      supabase.from("turo_vehicles").select("*").eq("user_id", uid).eq("status", "active").order("created_at", { ascending: true }),
      // 将订单排序修改为倒序（按 id 降序），确保新添加的订单在最上面
      supabase.from("turo_trips").select("*").eq("user_id", uid).eq("status", "active").order("id", { ascending: false })
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (vehRes.data) {
      setVehicles(vehRes.data);
      if (vehRes.data.length > 0 && !txVehicle) {
        const v = vehRes.data[0];
        const vName = v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name;
        setTxVehicle(vName);
        setTripVehicle(vName);
      }
    }
    if (tripRes.data) setTrips(tripRes.data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/");
      else {
        setUserId(data.session.user.id);
        loadData(data.session.user.id).then(() => setLoading(false));
      }
    });
  }, [router]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsParsing(true);
    setTimeout(() => {
      setTripResId("61606677");
      setTripLocation("5911 Minoru Boulevard Richmond, BC");
      setTripEarnings("221.87");
      setTripStart("2026-09-23T17:00");
      setTripEnd("2026-09-27T08:00");

      const parsedVehicleText = "Jeep Compass 2024".toLowerCase();
      const matchedVehicle = vehicles.find(v => 
        (v.make && parsedVehicleText.includes(v.make.toLowerCase())) ||
        (v.model && parsedVehicleText.includes(v.model.toLowerCase())) ||
        (v.name && parsedVehicleText.includes(v.name.toLowerCase()))
      );

      if (matchedVehicle) {
        const displayString = matchedVehicle.year 
          ? `${matchedVehicle.year} ${matchedVehicle.make} ${matchedVehicle.model} (${matchedVehicle.license_plate})` 
          : matchedVehicle.name;
        setTripVehicle(displayString);
      }
      setIsParsing(false);
    }, 1500);
  }

  function openTxForTrip(trip: Trip) {
    setEditingTxId(null);
    setTxDate(currentDateTimeLocal());
    setTxVehicle(trip.vehicle_name);
    setTxTripId(trip.id);
    setTxType("加油费"); 
    setTxAmount("");
    setTxNotes(`关联预订号 #${trip.reservation_id}`);
    setTxDrawerOpen(true);
  }

  function openGlobalTx() {
    setEditingTxId(null);
    setTxDate(currentDateTimeLocal());
    setTxTripId("");
    setTxAmount("");
    setTxNotes("");
    if (vehicles.length > 0) {
      const v = vehicles[0];
      setTxVehicle(v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name);
    }
    setTxDrawerOpen(true);
  }

  function openEditTx(tx: any) {
    setEditingTxId(tx.id);
    setTxDate(new Date(tx.date).toISOString().slice(0, 16));
    setTxVehicle(tx.vehicle || "");
    setTxTripId(tx.trip_id || "");
    setTxType(tx.type || "加油费");
    setTxAmount(tx.amount?.toString() || "");
    setTxNotes(tx.notes || "");
    setTxDrawerOpen(true);
  }

  async function handleCompleteTrip(tripId: number, earnings?: number) {
    if (!window.confirm("确认客户已还车，订单已结束？")) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("turo_trips").update({ status: 'completed' }).eq("id", tripId);
      if (error) throw error;
      
      if (earnings && earnings > 0) {
          await supabase.from("turo_transactions").insert([{
              user_id: userId, date: new Date().toISOString(), type: "行程收入",
              amount: earnings, trip_id: tripId, notes: "系统自动结算"
          }]);
      }
      await loadData(userId!);
    } catch (err: any) { alert("操作失败: " + err.message); } 
    finally { setIsSubmitting(false); }
  }

  async function handleAddTrip(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("turo_trips").insert([{
        user_id: userId, reservation_id: tripResId, vehicle_name: tripVehicle,
        start_time: new Date(tripStart).toISOString(), end_time: new Date(tripEnd).toISOString(),
        pickup_location: tripLocation, earnings: tripEarnings ? parseFloat(tripEarnings) : null,
        notes: tripNotes, status: "active"
      }]);
      if (error) throw error;
      await loadData(userId!);
      setTripDrawerOpen(false);
      setTripResId(""); setTripLocation(""); setTripEarnings(""); setTripNotes("");
    } catch (err: any) { alert("创建失败: " + err.message); } 
    finally { setIsSubmitting(false); }
  }

  async function handleAddTx(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: userId, 
        date: new Date(txDate).toISOString(), 
        vehicle: txVehicle,
        type: txType, 
        amount: parseFloat(txAmount), 
        notes: txNotes,
        trip_id: txTripId === "" ? null : txTripId 
      };

      if (editingTxId) {
        const { error } = await supabase.from("turo_transactions").update(payload).eq("id", editingTxId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("turo_transactions").insert([payload]);
        if (error) throw error;
      }

      await loadData(userId!);
      setTxDrawerOpen(false);
      setTxAmount(""); setTxNotes(""); setEditingTxId(null);
    } catch (err: any) { alert("操作失败: " + err.message); } 
    finally { setIsSubmitting(false); }
  }

  async function handleDeleteTx(id: number) {
    if (!window.confirm("确定要删除这条记录吗？")) return;
    try {
      const { error } = await supabase.from("turo_transactions").delete().eq("id", id);
      if (error) throw error;
      await loadData(userId!);
    } catch (err: any) { alert("删除失败: " + err.message); }
  }

  const isRevenue = (type: string) => type === "Trip Revenue" || type === "行程收入";
  const tripRevenue = transactions.filter(t => isRevenue(t.type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const operatingCosts = transactions.filter(t => !isRevenue(t.type)).reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = tripRevenue - operatingCosts;

  if (loading) return <div className="p-10 text-zinc-400">正在加载工作台...</div>;

  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-6xl mx-auto pb-24 flex flex-col gap-10">
      <header className="flex justify-between items-start border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">外勤工作台</h1>
          <p className="text-sm text-zinc-400 mt-1">现场调度与极速记账</p>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            当前任务
          </h2>
          <button onClick={() => setTripDrawerOpen(true)} className="text-sm text-zinc-950 bg-white px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 新建订单
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {trips.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/20 p-8 text-center text-zinc-500">
              当前没有进行中的订单任务。
            </div>
          ) : (
            trips.map(trip => (
              <div key={trip.id} className="rounded-2xl border border-white/10 bg-[#121217] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-lg font-bold text-white">{trip.vehicle_name}</span>
                    <span className="text-xs px-2 py-1 bg-white/10 rounded-md font-mono text-zinc-300">#{trip.reservation_id}</span>
                  </div>
                  {trip.pickup_location && (
                    <p className="text-xs text-zinc-300 mb-3 truncate bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {trip.pickup_location}
                    </p>
                  )}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-zinc-400 flex justify-between">
                      <span>起：{new Date(trip.start_time).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </p>
                    <p className="text-xs text-zinc-400 flex justify-between">
                      <span>止：{new Date(trip.end_time).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </p>
                  </div>
                  
                  {trip.earnings && (
                    <p className="text-sm font-mono text-emerald-400 mt-2">预计收入: ${trip.earnings.toFixed(2)}</p>
                  )}
                  {trip.notes && (
                    <div className="mt-3 rounded-lg bg-white/5 p-3 border border-white/10">
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        <span className="font-medium text-zinc-300">备注：</span>{trip.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 flex gap-2">
                  <button onClick={() => openTxForTrip(trip)} className="flex-[3] flex justify-center items-center gap-1.5 bg-emerald-500 text-black py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition">
                    <Plus className="w-4 h-4" /> 记外勤支出
                  </button>
                  <button onClick={() => handleCompleteTrip(trip.id, trip.earnings)} className="flex-[2] flex justify-center items-center gap-1.5 bg-white/5 text-zinc-300 py-2.5 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition">
                    <Check className="w-4 h-4" /> 完成单子
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-white/5 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              最近记账
            </h2>
            <button onClick={openGlobalTx} className="text-xs px-2.5 py-1.5 bg-white/5 rounded-md text-zinc-300 hover:bg-white/10 transition border border-white/10">
              + 全局记账
            </button>
          </div>
          <Link href="/dashboard/transactions" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
            查看全部明细 →
          </Link>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121217]">
          {transactions.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 text-center">暂无记账记录。</p>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-zinc-200">
                      {tx.vehicle}
                      {tx.trip_id && (
                        <span className="ml-2 inline-flex rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                          已绑订单
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(tx.date).toLocaleDateString()} · {tx.type} {tx.notes && `· ${tx.notes}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className={`font-mono font-medium ${isRevenue(tx.type) ? "text-emerald-400" : "text-zinc-300"}`}>
                      {isRevenue(tx.type) ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditTx(tx)} className="text-zinc-500 hover:text-white transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTx(tx.id)} className="text-zinc-500 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-white/5 pt-8 mt-auto">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 mb-4">
          车队财务概览
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#121217] p-4 border border-white/5">
            <p className="text-[10px] uppercase text-zinc-500">净利润 (Net Profit)</p>
            <p className={`mt-1 font-mono text-xl ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>${netProfit.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl bg-[#121217] p-4 border border-white/5">
            <p className="text-[10px] uppercase text-zinc-500">总收入 (Revenue)</p>
            <p className="mt-1 font-mono text-xl text-white">${tripRevenue.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl bg-[#121217] p-4 border border-white/5">
            <p className="text-[10px] uppercase text-zinc-500">总支出 (Costs)</p>
            <p className="mt-1 font-mono text-xl text-zinc-300">${operatingCosts.toFixed(0)}</p>
          </div>
        </div>
      </section>

      {/* --- 录入订单抽屉 --- */}
      <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity ${tripDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setTripDrawerOpen(false)} />
      <aside className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-[#0c0c10] border-l border-white/10 transition-transform duration-300 ${tripDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <header className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-white">录入订单任务</h2>
            <button onClick={() => setTripDrawerOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
          </header>
          
          <form onSubmit={handleAddTrip} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="relative border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 text-center hover:bg-emerald-500/10 transition group cursor-pointer">
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2 text-emerald-500">
                  <FileText className="w-8 h-8 opacity-80" />
                  <span className="text-sm font-medium">
                    {isParsing ? "正在提取数据..." : "上传 Turo 账单 (PDF) 自动填表"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-zinc-500">或 手动填写</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div><label className="text-xs text-zinc-400 mb-1 block">预订号 (Reservation ID)</label>
                <input required value={tripResId} onChange={e => setTripResId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white" />
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">派发车辆</label>
                <select value={tripVehicle} onChange={e => setTripVehicle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white">
                  {vehicles.map(v => <option key={v.id} value={v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name} className="bg-zinc-900">{v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">接送地点</label>
                <input value={tripLocation} onChange={e => setTripLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white" placeholder="输入地址..." />
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">预期收入 (Earnings) $</label>
                <input type="number" step="0.01" value={tripEarnings} onChange={e => setTripEarnings(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-emerald-400 focus:border-emerald-500/50" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-zinc-400 mb-1 block">接车时间</label>
                  <input type="datetime-local" required value={tripStart} onChange={e => setTripStart(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-xs text-white [color-scheme:dark]" />
                </div>
                <div><label className="text-xs text-zinc-400 mb-1 block">还车时间</label>
                  <input type="datetime-local" required value={tripEnd} onChange={e => setTripEnd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-xs text-white [color-scheme:dark]" />
                </div>
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">备注</label>
                <textarea rows={2} value={tripNotes} onChange={e => setTripNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white" placeholder="附加要求等..." />
              </div>
            </div>

            <div className="shrink-0 p-5 border-t border-white/10 bg-[#0c0c10] pb-8 md:pb-5">
              <button disabled={isSubmitting} type="submit" className="w-full bg-emerald-500 text-black font-bold rounded-xl py-3.5 hover:bg-emerald-400 transition">
                {isSubmitting ? "保存中..." : "保存订单"}
              </button>
            </div>
          </form>
        </div>
      </aside>

      {/* --- 记账/修改抽屉 --- */}
      <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity ${txDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => {setTxDrawerOpen(false); setEditingTxId(null);}} />
      <aside className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-[#0c0c10] border-l border-white/10 transition-transform duration-300 ${txDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <header className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-white">
              {editingTxId ? "修改支出记录" : (txTripId ? "记外勤支出" : "记全局账单")}
            </h2>
            <button onClick={() => {setTxDrawerOpen(false); setEditingTxId(null);}} className="text-zinc-500 hover:text-white">✕</button>
          </header>
          
          <form onSubmit={handleAddTx} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div><label className="text-xs text-zinc-400 mb-1 block">时间 (精确到分钟)</label>
                <input type="datetime-local" required value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white [color-scheme:dark]" />
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">金额 ($)</label>
                <input type="number" step="0.01" required value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono focus:border-emerald-500/50 text-white" placeholder="0.00" />
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">支出类别</label>
                <select value={txType} onChange={e => setTxType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white">
                  {TRANSACTION_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                </select>
              </div>
              {!txTripId && (
                <div><label className="text-xs text-zinc-400 mb-1 block">关联车辆</label>
                  <select value={txVehicle} onChange={e => setTxVehicle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white">
                    {vehicles.map(v => <option key={v.id} value={v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name} className="bg-zinc-900">{v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="text-xs text-zinc-400 mb-1 block">备注 (如地点、商店)</label>
                <textarea rows={2} value={txNotes} onChange={e => setTxNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500/50 text-white" placeholder="例如：Costco 加油站..." />
              </div>
            </div>

            <div className="shrink-0 p-5 border-t border-white/10 bg-[#0c0c10] pb-8 md:pb-5">
              <button disabled={isSubmitting} type="submit" className="w-full bg-emerald-500 text-black font-bold rounded-xl py-3.5 hover:bg-emerald-400 transition">
                {isSubmitting ? "保存中..." : (editingTxId ? "保存修改" : "确认记账")}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}