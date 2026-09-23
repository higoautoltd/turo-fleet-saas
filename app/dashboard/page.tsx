"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const VEHICLES = ["8ABC123", "7XYZ456", "9TUR789", "4FLEET01"] as const;

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const drawerTitleId = useId();
  
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // 新增：用于存储从数据库拉取的所有账单数据
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [date, setDate] = useState(todayIsoDate);
  const [vehicle, setVehicle] = useState<(typeof VEHICLES)[number]>(VEHICLES[0]);
  const [type, setType] = useState<TransactionType>("Trip Revenue");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // 新增：从数据库拉取当前用户数据的函数
  async function fetchTransactions(uid: string) {
    const { data, error } = await supabase
      .from("turo_transactions")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false }); // 按日期倒序排列
    
    if (data) {
      setTransactions(data);
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
        // 登录成功后，立刻拉取数据
        await fetchTransactions(session.user.id);
        setLoading(false);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
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
    setDate(todayIsoDate());
    setVehicle(VEHICLES[0]);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      if (!userId) throw new Error("无法验证用户身份");
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("请输入有效的金额。");

      const { error: insertError } = await supabase
        .from("turo_transactions") 
        .insert([{ user_id: userId, date, vehicle, type, amount: numericAmount, notes }]);

      if (insertError) throw insertError;

      setSubmitSuccess("记账成功！");
      // 提交成功后，重新拉取最新数据，让首页金额实时跳动！
      await fetchTransactions(userId);
      
      setTimeout(() => {
        closeDrawer();
      }, 1500);

    } catch (err: any) {
      setSubmitError(err.message || "保存失败，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 新增：自动计算财务数据
  const tripRevenue = transactions
    .filter((t) => t.type === "Trip Revenue")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const operatingCosts = transactions
    .filter((t) => t.type !== "Trip Revenue")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const netProfit = tripRevenue - operatingCosts;

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

        {/* 核心看板：现在显示的是真实的计算数据！ */}
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

        {/* 记账按钮 */}
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

        {/* 账单明细列表 */}
        <section className="mt-12">
          <h2 className="mb-6 text-lg font-medium text-white">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500">No entries yet. Log the first trip or expense to start the ledger.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Vehicle</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">{tx.date}</td>
                      <td className="px-6 py-4 font-mono text-zinc-300">{tx.vehicle}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tx.type === "Trip Revenue" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-300"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate">{tx.notes || "-"}</td>
                      <td className={`px-6 py-4 text-right font-mono font-medium ${
                        tx.type === "Trip Revenue" ? "text-emerald-400" : "text-zinc-200"
                      }`}>
                        {tx.type === "Trip Revenue" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
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
                <label className="mb-2 block text-sm font-medium text-zinc-400">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Vehicle</label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value as any)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/10"
                >
                  {VEHICLES.map((v) => (
                    <option key={v} value={v} className="bg-zinc-900">{v}</option>
                  ))}
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