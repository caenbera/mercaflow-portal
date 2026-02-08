'use client';
import { Route, User, Footprints, CheckCircle, Clock } from 'lucide-react';

export function SalesHeader({ user }: { user: any }) {
  return (
    <div className="header">
      <div className="header-content">
        <div className="logo">
          <Route size={20} />
          FreshRoute Pro
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          <User size={14} className="inline mr-1" /> {user?.displayName || 'Juan P.'}
        </div>
      </div>
      <div className="user-stats">
        <div className="stat-pill">
          <Footprints size={14} />
          <span>5 visitas hoy</span>
        </div>
        <div className="stat-pill">
          <CheckCircle size={14} />
          <span>2 cerrados</span>
        </div>
        <div className="stat-pill">
          <Clock size={14} />
          <span>3.5 hrs</span>
        </div>
      </div>
    </div>
  );
}
