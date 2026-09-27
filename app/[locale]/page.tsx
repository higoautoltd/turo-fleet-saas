
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');

  const fleetCategories = [
    {
      category: t('fleet.category1'), // "SUVs & All-Wheel Drive"
      cars: [
        { 
          id: 1, name: '2021 Honda CR-V', type: t('fleet.types.popularSuv'), price: '89', 
          image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        },
        { 
          id: 2, name: '2024 Toyota RAV4', type: t('fleet.types.reliableAwd'), price: '85', 
          image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        },
        { 
          id: 3, name: '2024 Jeep Compass', type: t('fleet.types.rugged4x4'), price: '80', 
          image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        },
        { 
          id: 4, name: '2019 Ford Edge', type: t('fleet.types.spaciousSuv'), price: '75', 
          image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        }
      ]
    },
    {
      category: t('fleet.category2'), // "Family & Minivans"
      cars: [
        { 
          id: 5, name: '2026 Kia Carnival Hybrid', type: t('fleet.types.luxuryMpv'), price: '120', 
          image: 'https://images.unsplash.com/photo-1583153644026-6b2457805175?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        },
        { 
          id: 6, name: '2020 Kia Sedona', type: t('fleet.types.sevenSeater'), price: '90', 
          image: 'https://images.unsplash.com/photo-1511216113849-0158a221f7eb?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        }
      ]
    },
    {
      category: t('fleet.category3'), // "Economy & Sedans"
      cars: [
        { 
          id: 7, name: '2023 Hyundai Elantra (Dark)', type: t('fleet.types.fuelEfficient'), price: '55', 
          image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        },
        { 
          id: 8, name: '2023 Hyundai Elantra (White)', type: t('fleet.types.cityCommuter'), price: '55', 
          image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80', 
          turoLink: 'https://turo.com/us/en/host/32078496' 
        }
      ]
    }
  ];

  const advantages = [
    { title: t('advantages.handoff.title'), desc: t('advantages.handoff.desc'), icon: '⚡️' },
    { title: t('advantages.booking.title'), desc: t('advantages.booking.desc'), icon: '📱' },
    { title: t('advantages.value.title'), desc: t('advantages.value.desc'), icon: '💎' },
    { title: t('advantages.diverse.title'), desc: t('advantages.diverse.desc'), icon: '🏎️' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans selection:bg-rose-500/30 pb-20">
      
      {/* Header & Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0c]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Left: Language Selector */}
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors py-2">
              <span className="text-lg">🌐</span>
              <span className="hidden sm:inline">{t('nav.language')}</span>
              <span className="text-xs">▼</span>
            </div>
            {/* Dropdown Menu (已替换为真实跳转链接) */}
            <div className="absolute left-0 top-full mt-1 w-36 bg-[#121217] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
              <div className="py-2 flex flex-col">
                <a href="/en" className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">English</a>
                <a href="/zh" className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">简体中文</a>
                <a href="/ja" className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">日本語</a>
                <a href="/ko" className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">한국어</a>
                <a href="/fa" className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">فارسی</a>
              </div>
            </div>
          </div>

          {/* Center: Brand Logo */}
          <div className="text-2xl font-black tracking-tighter text-white absolute left-1/2 -translate-x-1/2">
            HIGO AUTO<span className="text-rose-500">.</span>
          </div>

          {/* Right: Quick Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
            <a href="#fleet" className="text-zinc-400 hover:text-rose-400 transition-colors">{t('nav.fleet')}</a>
            <a href="#advantages" className="text-zinc-400 hover:text-rose-400 transition-colors">{t('nav.whyUs')}</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-20">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 px-6 border-b border-white/5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              {t('hero.badge')}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
              {t('hero.titleMain')} <br className="md:hidden" />
              <span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
              {t('hero.description')}
            </p>
          </div>
        </section>

        {/* Advantages Section */}
        <section id="advantages" className="py-20 bg-black/40 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            {advantages.map((item, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-colors group text-center md:text-left">
                <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fleet Showcase */}
        <section id="fleet" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6">
            
            {fleetCategories.map((group, index) => (
              <div key={index} className="mb-20 last:mb-0">
                <div className="flex items-center gap-4 mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{group.category}</h2>
                  <div className="flex-grow h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {group.cars.map((car) => (
                    <div key={car.id} className="group relative rounded-3xl overflow-hidden bg-[#121217] border border-white/10 hover:border-rose-500/50 transition-all duration-500 hover:-translate-y-2">
                      <div className="aspect-[16/10] w-full relative overflow-hidden bg-zinc-900">
                        <img 
                          src={car.image} 
                          alt={car.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-transparent"></div>
                      </div>
                      
                      <div className="p-6 relative z-10 -mt-8">
                        <div className="inline-block px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wider text-rose-400 mb-3 uppercase">
                          {car.type}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-rose-400 transition-colors line-clamp-1">{car.name}</h3>
                        
                        <div className="flex items-end justify-between mt-6 pt-6 border-t border-white/5">
                          <div className="text-zinc-500 text-sm flex flex-col">
                            <span>{t('fleet.from')}</span>
                            <span className="text-2xl font-bold text-white">
                              <span className="text-rose-500 text-lg">$</span>{car.price}
                              <span className="text-sm font-normal text-zinc-500">{t('fleet.perDay')}</span>
                            </span>
                          </div>
                          
                          <a 
                            href={car.turoLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors shadow-lg shadow-rose-900/20"
                          >
                            {t('fleet.bookBtn')}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-sm font-medium tracking-wide uppercase">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
            {t('footer.portal')}
          </Link>
        </div>
      </footer>

    </div>
  );
}