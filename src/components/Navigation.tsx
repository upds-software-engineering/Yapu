import React, { useEffect, useState } from 'react';
import { 
  Compass, 
  BookOpen, 
  Flame, 
  Users, 
  GraduationCap, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { LocalRepository } from '../lib/storage/local-repository';
import type { PerfilEstudiante } from '../types/domain';

interface NavigationProps {
  currentPath?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath = '/' }) => {
  const [profile, setProfile] = useState<PerfilEstudiante | null>(null);

  useEffect(() => {
    setProfile(LocalRepository.getProfile());
  }, []);

  const navItems = [
    { href: '/', label: 'Niveles', icon: Compass },
    { href: '/dashboard', label: 'Progreso', icon: BarChart3 },
    { href: '/community', label: 'Comunidad', icon: Users },
    { href: '/docente', label: 'Docente', icon: GraduationCap },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="hidden md:flex sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-andina-terracotta to-andina-gold p-0.5 shadow-lg shadow-andina-terracotta/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-andina-gold group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-white">YAPU</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-andina-terracotta/20 text-andina-gold border border-andina-terracotta/30">
                PWA A1
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Runasimi Yachay — UPDS</p>
          </div>
        </a>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-andina-terracotta/20 text-andina-gold border border-andina-terracotta/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>{profile?.racha_dias || 3} días de racha</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>{profile?.total_palabras_aprendidas || 6} palabras</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Bar (Thumb friendly, >= 44px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0B0F19]/95 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-andina-gold bg-andina-terracotta/15 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};
export default Navigation;
