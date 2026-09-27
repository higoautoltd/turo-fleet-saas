"use client";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

type Vehicle = {
  id: number;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  license_plate?: string;
  status?: string;
};

// 预定义状态和对应的颜色样式
const STATUS_OPTIONS = [
  { value: "active", label: "🟢 Available (待租)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "on_trip", label: "🔵 On Trip (出租中)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "maintenance", label: "🟡 Maintenance (维修)", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { value: "retired", label: "⚪️ Retired (已退役)", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
];

export default function FleetPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // 表单状态
  const [newVehicleYear, setNewVehicleYear] = useState("");
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
        await fetchVehicles(data.session.user.id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  async function fetchVehicles(uid: string) {
    const { data } = await supabase
      .from("turo_vehicles")
      .select("id, name, year, make, model, license_plate, status")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    
    if (data) setVehicles(data);
  }

  // --- 新增：更新车辆状态 ---
  async function handleStatusChange(id: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from("turo_vehicles")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      if (userId) await fetchVehicles(userId);
    } catch (err: any) {
      alert("状态更新失败: " + err.message);
    }
  }

  // --- 新增：彻底删除车辆 ---
  async function handleDeleteVehicle(id: number, name: string) {
    if (!window.confirm(`确定要彻底删除 [${name}] 吗？\n警告：如果是已经产生收入的车辆，建议将状态改为"Retired"，否则可能会影响历史财务报表！`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("turo_vehicles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      if (userId) await fetchVehicles(userId);
    } catch (err: any) {
      alert("删除失败: " + err.message);
    }
  }

  async function handleAddVehicle(event: FormEvent) {
    event.preventDefault();
    if (!newVehicleMake.trim() || !newVehicleModel.trim() || !newVehiclePlate.trim() || !userId) return;
    
    setIsAddingVehicle(true);
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
            license_plate: newVehiclePlate.trim(),
            status: 'active'
        }]);
        
      if (error) throw error;
      
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

  if (loading) {
    return <div className="p-10 text-zinc-400">Loading fleet data...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">车队管理 (Fleet Management)</h1>
        <p className="mt-2 text-sm text-zinc-400">在这里添加新车辆或管理现有车队的状态。</p>
      </header>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* 左侧：车辆列表 */}
        <div className="flex-1">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">My Fleet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.length === 0 ? (
              <span className="text-sm text-zinc-500">暂无车辆，请在右侧添加。</span>
            ) : (
              vehicles.map(v => {
                // 动态获取当前状态的颜色
                const currentStatus = STATUS_OPTIONS.find(s => s.value === (v.status || 'active'));
                const statusColor = currentStatus ? currentStatus.color : "text-zinc-400 bg-white/5 border-white/10";

                return (
                  <div key={v.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#121217] p-5 transition hover:border-emerald-500/30">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-white text-lg leading-tight">
                        {v.year} {v.make} {v.model}
                      </span>
                      {/* 下拉状态选择器 */}
                      <select 
                        value={v.status || 'active'}
                        onChange={(e) => handleStatusChange(v.id, e.target.value)}
                        className={`appearance-none text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${statusColor}`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <span className="inline-flex rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-mono text-zinc-300 uppercase tracking-widest">
                        {v.license_plate}
                      </span>
                      {/* 删除按钮 */}
                      <button 
                        onClick={() => handleDeleteVehicle(v.id, v.name)}
                        className="text-xs font-medium text-zinc-500 hover:text-red-400 transition underline underline-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 右侧：添加车辆表单 (保持不变) */}
        <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 xl:w-96 p-6 rounded-2xl border border-white/10 bg-[#121217]">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 border-b border-white/5 pb-3">Add New Vehicle</h2>
          <div className="flex gap-3 mt-2">
            <div className="w-1/3">
              <label className="mb-1 block text-xs text-zinc-400">Year</label>
              <input type="number" placeholder="2025" value={newVehicleYear} onChange={(e) => setNewVehicleYear(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" required />
            </div>
            <div className="w-2/3">
              <label className="mb-1 block text-xs text-zinc-400">Make</label>
              <input type="text" placeholder="e.g. Kia" value={newVehicleMake} onChange={(e) => setNewVehicleMake(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Model</label>
            <input type="text" placeholder="e.g. Carnival Hybrid" value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">License Plate</label>
            <input type="text" placeholder="ABC 123" value={newVehiclePlate} onChange={(e) => setNewVehiclePlate(e.target.value)} className="w-full uppercase font-mono rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" required />
          </div>
          <button type="submit" disabled={isAddingVehicle} className="mt-4 w-full rounded-xl bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50">
            {isAddingVehicle ? "Adding..." : "+ Add to Fleet"}
          </button>
        </form>
      </div>
    </div>
  );
}