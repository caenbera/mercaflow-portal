
'use client';
import { LayoutGrid, Map, List, ChartLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const t = useTranslations('AdminSalesPage');
  
  const tabs = [
    { id: 'districts', icon: LayoutGrid, label: t('tab_districts') },
    { id: 'map', icon: Map, label: t('tab_map') },
    { id: 'list', icon: List, label: t('tab_list') },
    { id: 'stats', icon: ChartLine, label: t('tab_stats') },
  ];

  return (
    <div className="grid grid-cols-4">
      {tabs.map(tab => (
        <div 
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} 
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon size={18} />
          <span className="truncate w-full px-1">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
