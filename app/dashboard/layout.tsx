import '../globals.css';
import Link from 'next/link';
import { LayoutDashboard, Car, ReceiptText, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#07070a] text-white flex h-screen overflow-hidden selection:bg-emerald-500/30">
        
        {/* 1. 电脑端侧边栏 (Desktop Sidebar) */}
        <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0a0a0c] p-6 z-20">
          <div className="mb-10 text-2xl font-black tracking-tighter text-white">
            HIGO AUTO<span className="text-emerald-500">.</span>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1">
            <Link href="/dashboard" className="px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" /> 记账总览
            </Link>
            <Link href="/dashboard/fleet" className="px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition flex items-center gap-3">
              <Car className="w-5 h-5" /> 车队管理
            </Link>
            <Link href="/dashboard/transactions" className="px-4 py-3 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition flex items-center gap-3">
              <ReceiptText className="w-5 h-5" /> 财务明细
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <Link href="/" className="px-4 py-2 text-sm text-zinc-500 hover:text-white transition flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> 返回官网主页
            </Link>
          </div>
        </aside>

        {/* 2. 主内容区 (Main Content) */}
        <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
          {children}
        </main>

        {/* 3. 移动端底部导航 (Mobile Bottom Nav) */}
        <nav className="md:hidden fixed bottom-0 w-full border-t border-white/10 bg-[#0a0a0c]/90 backdrop-blur-lg flex justify-around p-3 z-50 pb-safe">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <LayoutDashboard className="w-6 h-6" />
            总览
          </Link>
          <Link href="/dashboard/fleet" className="flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <Car className="w-6 h-6" />
            车队
          </Link>
          <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <ReceiptText className="w-6 h-6" />
            明细
          </Link>
        </nav>
        
      </body>
    </html>
  );
}