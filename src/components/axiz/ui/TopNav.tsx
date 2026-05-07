import React from 'react';
import { LayoutDashboard, FilePlus, BookOpen, Layers, History, Settings, User } from 'lucide-react';

export const TopNav = () => {
  const menuItems = [
    { label: 'Projetos', icon: LayoutDashboard, href: '/axiz/dashboard' },
    { label: 'Novo Projeto', icon: FilePlus, href: '/axiz/novo-projeto' },
    { label: 'Templates', icon: BookOpen, href: '/axiz/templates' },
    { label: 'Biblioteca', icon: Layers, href: '/axiz/biblioteca' },
    { label: 'Histórico', icon: History, href: '/axiz/historico' },
    { label: 'Configurações', icon: Settings, href: '/axiz/configuracoes' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-primary text-white z-40 px-6 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-8">
        <a href="/axiz/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-display font-bold text-lg">A</div>
          <span className="font-display font-bold text-xl tracking-tight">AXIZ</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Mock Auth Section */}
      <div className="flex items-center gap-4 pl-6 border-l border-white/20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
            <User size={18} className="text-secondary" />
          </div>
          <span className="text-sm font-bold">Admin</span>
        </div>
      </div>
    </nav>
  );
};
