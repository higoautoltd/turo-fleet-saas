"use client";

import { FormEvent, useEffect, useId, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/utils/supabase";

const TRANSACTION_TYPES = [

  "Trip Revenue",

  "Gas",

  "Wash",

  "Maintenance",

  "Insurance",

  "Parking & Tolls",

  "Advertising",

  "Office Supplies",

  "Professional Fees",

  "Other Expense",

] as const;

type TransactionType = (typeof TRANSACTION_TYPES)[number];

// 更新 Vehicle 类型，加入新字段

type Vehicle = {

  id: number;

  name: string; // 依然保留作为备用或者旧数据兼容

  year?: number;

  make?: string;

  model?: string;

  license_plate?: string;

};

// 获取当前本地时间，精确到分钟，用于默认填充表单

function currentDateTimeLocal() {

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;

  return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);

}

export default function DashboardPage() {

  const router = useRouter();

  const drawerTitleId = useId();

  

  const [email, setEmail] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);

  

  const [transactions, setTransactions] = useState<any[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  

  const [date, setDate] = useState(currentDateTimeLocal);

  const [vehicle, setVehicle] = useState<string>(""); 

  const [type, setType] = useState<TransactionType>("Trip Revenue");

  const [amount, setAmount] = useState("");

  const [notes, setNotes] = useState("");

  // 新增车辆表单状态

  const [newVehicleYear, setNewVehicleYear] = useState("");

  const [newVehicleMake, setNewVehicleMake] = useState("");

  const [newVehicleModel, setNewVehicleModel] = useState("");

  const [newVehiclePlate, setNewVehiclePlate] = useState("");

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  async function fetchTransactions(uid: string) {

    const { data } = await supabase

      .from("turo_transactions")

      .select("*")

      .eq("user_id", uid)

      .order("date", { ascending: false });

    

    if (data) setTransactions(data);

  }

  async function fetchVehicles(uid: string) {

    const { data } = await supabase

      .from("turo_vehicles")

      .select("id, name, year, make, model, license_plate") // 查出新字段

      .eq("user_id", uid)

      .eq("status", "active")

      .order("created_at", { ascending: true });

    if (data) {

      setVehicles(data);

      // 如果没有选中的车，默认选中第一辆

      if (data.length > 0) {

          // 如果有新字段就组合显示，否则退回只显示name

          const displayString = data[0].year ? `${data[0].year} ${data[0].make} ${data[0].model} (${data[0].license_plate})` : data[0].name;

          setVehicle(prev => prev || displayString);

        }
      }
    }

  useEffect(() => {

    let cancelled = false;

    async function loadSession() {

      const { data } = await supabase.auth.getSession();

      const session = data.session;

      if (!session) {

        router.replace("/");

        return;

      }

      if (!cancelled) {

        setEmail(session.user.email ?? null);

        setUserId(session.user.id);

        await Promise.all([

          fetchTransactions(session.user.id),

          fetchVehicles(session.user.id)

        ]);

        setLoading(false);

      }

    }

    void loadSession();

    return () => { cancelled = true; };

  }, [router]);

  useEffect(() => {

    if (!drawerOpen) return;

    function onKeyDown(event: KeyboardEvent) {

      if (event.key === "Escape") setDrawerOpen(false);

    }

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      window.removeEventListener("keydown", onKeyDown);

      document.body.style.overflow = previousOverflow;

    };

  }, [drawerOpen]);

  async function handleSignOut() {

    await supabase.auth.signOut();

    router.replace("/");

    router.refresh();

  }

  function resetForm() {

    setDate(currentDateTimeLocal());

    if (vehicles.length > 0) {

        const v = vehicles[0];

        setVehicle(v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name);

    } else {

        setVehicle("");

    }

    setType("Trip Revenue");

    setAmount("");

    setNotes("");

    setSubmitError(null);

    setSubmitSuccess(null);

  }

  function closeDrawer() {

    setDrawerOpen(false);

    setTimeout(resetForm, 300);

  }

  async function handleAddVehicle(event: FormEvent) {

    event.preventDefault();

    if (!newVehicleMake.trim() || !newVehicleModel.trim() || !newVehiclePlate.trim() || !userId) return;

    

    setIsAddingVehicle(true);

    // 组合一个完整名称存入 name 字段以防旧代码需要，同时单独存入新字段

    const compositeName = `${newVehicleYear} ${newVehicleMake.trim()} ${newVehicleModel.trim()} (${newVehiclePlate.trim()})`;

    try {

      const { error } = await supabase

        .from("turo_vehicles")

        .insert([{ 

            user_id: userId, 

            name: compositeName,

            year: newVehicleYear ? parseInt(newVehicleYear) : null,

            make: newVehicleMake.trim(),

            model: newVehicleModel.trim(),

            license_plate: newVehiclePlate.trim()

        }]);

        

      if (error) throw error;

      

      // 清空表单

      setNewVehicleYear("");

      setNewVehicleMake("");

      setNewVehicleModel("");

      setNewVehiclePlate("");

      

      await fetchVehicles(userId); 

    } catch (err: any) {

      alert("添加车辆失败: " + err.message);

    } finally {

      setIsAddingVehicle(false);

    }

  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setSubmitError(null);

    setSubmitSuccess(null);

    setIsSubmitting(true);

    try {

      if (!userId) throw new Error("无法验证用户身份");

      if (!vehicle) throw new Error("请先添加并选择一辆车");

      

      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("请输入有效的金额。");

      const isoDate = new Date(date).toISOString();

      const { error: insertError } = await supabase

        .from("turo_transactions") 

        .insert([{ user_id: userId, date: isoDate, vehicle, type, amount: numericAmount, notes }]);

      if (insertError) throw insertError;

      setSubmitSuccess("记账成功！");

      await fetchTransactions(userId);

      setTimeout(() => closeDrawer(), 1500);

    } catch (err: any) {

      setSubmitError(err.message || "保存失败，请稍后再试。");

    } finally {

      setIsSubmitting(false);

    }

  }

  async function handleDelete(id: number) {

    if (!window.confirm("确定要删除这条记录吗？这会影响你的利润计算。")) {

      return;

    }

    try {

      const { error } = await supabase

        .from("turo_transactions")

        .delete()

        .eq("id", id);

        

      if (error) throw error;

      if (userId) await fetchTransactions(userId);

    } catch (err: any) {

      alert("删除失败: " + err.message);

    }

  }

  const tripRevenue = transactions

    .filter((t) => t.type === "Trip Revenue")

    .reduce((sum, t) => sum + Number(t.amount), 0);

    

  const operatingCosts = transactions

    .filter((t) => t.type !== "Trip Revenue")

    .reduce((sum, t) => sum + Number(t.amount), 0);

    

  const netProfit = tripRevenue - operatingCosts;
  function downloadCSV() {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    // 1. 定义表格的列名
    const headers = ["Date", "Vehicle", "Category", "Amount", "Notes"];
    
    // 2. 遍历数据，提取并清理格式（防止文本里的逗号换行破坏表格）
    const rows = transactions.map(tx => {
      const dateStr = new Date(tx.date).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/,/g, '');
      const vehicleStr = tx.vehicle ? tx.vehicle.replace(/,/g, ' ') : ''; 
      const notesStr = tx.notes ? tx.notes.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
      
      return `${dateStr},${vehicleStr},${tx.type},${tx.amount},${notesStr}`;
    });

    // 3. 拼接成标准 CSV 格式（\uFEFF 是 BOM 头，防止 Excel 打开乱码）
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    // 4. 在后台悄悄创建一个 a 标签模拟点击下载
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `turo_finance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {

    return (

      <div className="flex min-h-full flex-1 items-center justify-center bg-[#07070a] text-zinc-400">

        Loading dashboard...

      </div>

    );

  }

  return (

    <div className="relative min-h-full flex-1 overflow-hidden bg-[#07070a] text-zinc-100 pb-20">

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-24 top-[-10rem] h-80 w-80 rounded-full bg-emerald-500/12 blur-3xl" />

        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 py-10 lg:px-10">

        <header className="flex flex-col gap-4 border-b border-white/8 pb-8 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-300/80">

              Turo Finance

            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">

              Welcome back{email ? `, ${email}` : ""}.

            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">

              Track trip revenue and T2125 expenses across the fleet in one ledger.

            </p>

          </div>

          <button

            type="button"

            onClick={handleSignOut}

            className="w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/10"

          >

            Sign out

          </button>

        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5">

            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Net Profit</p>

            <p className={`mt-3 font-mono text-2xl tracking-tight ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>

              ${netProfit.toFixed(2)}

            </p>

          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5">

            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trip Revenue</p>

            <p className="mt-3 font-mono text-2xl tracking-tight text-white">

              ${tripRevenue.toFixed(2)}

            </p>

          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5">

            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operating Costs</p>

            <p className="mt-3 font-mono text-2xl tracking-tight text-white">

              ${operatingCosts.toFixed(2)}

            </p>

          </article>

        </section>

        {/* 全新升级的车辆管理模块 */}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6">

          <h2 className="mb-4 text-sm font-medium text-white">Fleet Management</h2>

          

          <div className="flex flex-col xl:flex-row gap-8">

            {/* 左侧：已添加的车辆列表，采用卡片样式展示细节 */}

            <div className="flex-1">

              <label className="mb-3 block text-xs uppercase tracking-wider text-zinc-500">Active Vehicles</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {vehicles.length === 0 ? (

                  <span className="text-sm text-zinc-500">No vehicles added yet.</span>

                ) : (

                  vehicles.map(v => (

                    <div key={v.id} className="flex flex-col gap-1 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">

                        <div className="flex justify-between items-start">

                             <span className="font-semibold text-cyan-400">

                                {v.year} {v.make} {v.model}

                             </span>

                        </div>

                        <div className="flex items-center gap-2 mt-1">

                            <span className="inline-flex rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono text-zinc-300">

                                {v.license_plate}

                            </span>

                        </div>

                    </div>

                  ))

                )}

              </div>

            </div>

            {/* 右侧：多字段输入表单 */}

            <form onSubmit={handleAddVehicle} className="flex flex-col gap-3 xl:w-80 p-4 rounded-xl border border-white/5 bg-black/20">

              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Add New Vehicle</p>

              

              <div className="flex gap-3">

                  <input

                    type="number"

                    placeholder="Year (e.g. 2025)"

                    value={newVehicleYear}

                    onChange={(e) => setNewVehicleYear(e.target.value)}

                    className="w-1/3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/50"

                    required

                  />

                  <input

                    type="text"

                    placeholder="Make (e.g. Kia)"

                    value={newVehicleMake}

                    onChange={(e) => setNewVehicleMake(e.target.value)}

                    className="w-2/3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/50"

                    required

                  />

              </div>

              <input

                type="text"

                placeholder="Model (e.g. Carnival Hybrid)"

                value={newVehicleModel}

                onChange={(e) => setNewVehicleModel(e.target.value)}

                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/50"

                required

              />

              <input

                type="text"

                placeholder="License Plate"

                value={newVehiclePlate}

                onChange={(e) => setNewVehiclePlate(e.target.value)}

                className="w-full uppercase font-mono rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/50"

                required

              />

              <button

                type="submit"

                disabled={isAddingVehicle}

                className="mt-2 w-full rounded-lg bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"

              >

                {isAddingVehicle ? "Adding..." : "+ Add to Fleet"}

              </button>

            </form>

          </div>

        </section>

        <section className="mt-12 flex flex-col items-center justify-center py-6">

          <button

            type="button"

            onClick={() => setDrawerOpen(true)}

            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 text-base font-semibold text-zinc-950 shadow-[0_20px_60px_rgba(16,185,129,0.28)] transition hover:opacity-90"

          >

            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/15 text-xl leading-none">

              +

            </span>

            记一笔 (Log Transaction)

          </button>

        </section>

        <section className="mt-12">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Recent Transactions</h2>
          {transactions.length > 0 && (
            <button
              onClick={downloadCSV}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-emerald-500/20 hover:text-emerald-400"
            >
              ↓ Export CSV (T2125)
            </button>
          )}
        </div>

          {transactions.length === 0 ? (

            <p className="text-sm text-zinc-500">No entries yet. Log the first trip or expense to start the ledger.</p>

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">

              <table className="w-full text-left text-sm text-zinc-400">

                <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">

                  <tr>

                    <th className="px-6 py-4 font-medium whitespace-nowrap">Date & Time</th>

                    <th className="px-6 py-4 font-medium">Vehicle</th>

                    <th className="px-6 py-4 font-medium">Category</th>

                    <th className="px-6 py-4 font-medium">Notes</th>

                    <th className="px-6 py-4 font-medium text-right">Amount</th>

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

                      <td className="px-6 py-4 font-mono text-zinc-300">{tx.vehicle}</td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${

                          tx.type === "Trip Revenue" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-300"

                        }`}>

                          {tx.type}

                        </span>

                      </td>

                      <td className="px-6 py-4 max-w-[150px] truncate">{tx.notes || "-"}</td>

                      <td className={`px-6 py-4 text-right font-mono font-medium ${

                        tx.type === "Trip Revenue" ? "text-emerald-400" : "text-zinc-200"

                      }`}>

                        {tx.type === "Trip Revenue" ? "+" : "-"}${Number(tx.amount).toFixed(2)}

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

        </section>

      </main>

      <div

        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${

          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"

        }`}

        onClick={closeDrawer}

        aria-hidden={!drawerOpen}

      />

      <aside

        role="dialog"

        aria-modal="true"

        aria-labelledby={drawerTitleId}

        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-white/10 bg-[#0c0c10] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${

          drawerOpen ? "translate-x-0" : "translate-x-full"

        }`}

      >

        <div className="flex h-full flex-col">

          <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">

            <h2 id={drawerTitleId} className="text-lg font-semibold text-white">

              Log Transaction

            </h2>

            <button

              onClick={closeDrawer}

              className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"

            >

              ✕

            </button>

          </header>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-6">

            <div className="space-y-5">

              <div>

                <label className="mb-2 block text-sm font-medium text-zinc-400">Date & Time</label>

                <input

                  type="datetime-local"

                  required

                  value={date}

                  onChange={(e) => setDate(e.target.value)}

                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10 [color-scheme:dark]"

                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-zinc-400">Vehicle</label>

                <select

                  value={vehicle}

                  onChange={(e) => setVehicle(e.target.value)}

                  required

                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"

                >

                  {vehicles.length === 0 && <option value="" disabled>Please add a vehicle first</option>}

                  {vehicles.map((v) => {

                      const display = v.year ? `${v.year} ${v.make} ${v.model} (${v.license_plate})` : v.name;

                      return <option key={v.id} value={display} className="bg-zinc-900">{display}</option>;

                  })}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-zinc-400">Category (T2125)</label>

                <select

                  value={type}

                  onChange={(e) => setType(e.target.value as any)}

                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"

                >

                  {TRANSACTION_TYPES.map((t) => (

                    <option key={t} value={t} className="bg-zinc-900">{t}</option>

                  ))}

                </select>

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-zinc-400">Amount ($)</label>

                <input

                  type="number"

                  step="0.01"

                  placeholder="0.00"

                  required

                  value={amount}

                  onChange={(e) => setAmount(e.target.value)}

                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10 placeholder:text-zinc-600"

                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-zinc-400">Notes (Optional)</label>

                <textarea

                  rows={3}

                  placeholder="e.g. Costco gas receipt"

                  value={notes}

                  onChange={(e) => setNotes(e.target.value)}

                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10 placeholder:text-zinc-600"

                />

              </div>

              {submitError && (

                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

                  {submitError}

                </div>

              )}

              {submitSuccess && (

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">

                  {submitSuccess}

                </div>

              )}

            </div>

            <div className="mt-auto flex gap-3 pt-8">

              <button

                type="button"

                onClick={closeDrawer}

                disabled={isSubmitting}

                className="flex-1 rounded-full bg-white/5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"

              >

                Cancel

              </button>

              <button

                type="submit"

                disabled={isSubmitting || !!submitSuccess}

                className="flex-1 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"

              >

                {isSubmitting ? "Saving..." : submitSuccess ? "Saved!" : "Save"}

              </button>

            </div>

          </form>

        </div>

      </aside>

    </div>

  );

}
