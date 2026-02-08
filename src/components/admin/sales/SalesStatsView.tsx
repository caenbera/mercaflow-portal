'use client';
import { CalendarDays, Filter, MapPin } from 'lucide-react';
export function SalesStatsView() {
  return (
    <div>
        <div className="sales-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <CalendarDays size={16} /> Esta Semana
                </div>
                <div className="dashboard-date">02-08 Feb</div>
            </div>
            <div className="metrics-grid">
                <div className="metric-box">
                    <div className="metric-value">42</div>
                    <div className="metric-label">Visitas</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">12</div>
                    <div className="metric-label">Nuevos</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">8</div>
                    <div className="metric-label">Cerrados</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">19%</div>
                    <div className="metric-label">Conversión</div>
                </div>
            </div>
        </div>

        <div className="district-card p-4">
            <div className="font-bold text-base mb-4 flex items-center gap-2">
                <Filter size={16} className="text-primary" /> Pipeline de Ventas
            </div>
            
            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>Nuevos prospectos</span>
                    <span className="font-bold">24</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '40%', height: '100%' }} className="bg-gray-400 rounded-full"></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>Visitados</span>
                    <span className="font-bold">18</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '30%', height: '100%' }} className="bg-blue-500 rounded-full"></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>En negociación</span>
                    <span className="font-bold">12</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '20%', height: '100%' }} className="bg-orange-500 rounded-full"></div>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-2 text-sm">
                    <span>Clientes ganados</span>
                    <span className="font-bold text-green-600">8</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '13%', height: '100%' }} className="bg-green-500 rounded-full"></div>
                </div>
            </div>
        </div>

        <div className="district-card p-4 mt-4">
            <div className="font-bold text-base mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-secondary" /> Top Zonas (Potencial $)
            </div>
            
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-secondary">
                    <div>
                        <div className="font-bold text-sm">CHI-LV (Little Village)</div>
                        <div className="text-xs text-muted-foreground">22 prospectos</div>
                    </div>
                    <div className="font-extrabold text-secondary text-base">$18k</div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-primary">
                    <div>
                        <div className="font-bold text-sm">CHI-PIL (Pilsen)</div>
                        <div className="text-xs text-muted-foreground">18 prospectos</div>
                    </div>
                    <div className="font-extrabold text-primary text-base">$12k</div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-info">
                    <div>
                        <div className="font-bold text-sm">CHI-AP (Albany Park)</div>
                        <div className="text-xs text-muted-foreground">15 prospectos</div>
                    </div>
                    <div className="font-extrabold text-info text-base">$9.5k</div>
                </div>
            </div>
        </div>
    </div>
  );
}
