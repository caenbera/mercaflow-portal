'use client';
import { LayoutGrid, Map, List, ChartLine } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: 'districts', icon: LayoutGrid, label: 'Distritos' },
    { id: 'map', icon: Map, label: 'Mapa' },
    { id: 'list', icon: List, label: 'Prospectos' },
    { id: 'stats', icon: ChartLine, label: 'Ventas' },
  ];

  return (
    <div className="tab-nav">
      {tabs.map(tab => (
        <div 
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} 
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon size={18} />
          <span>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
