import React from 'react';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface RoadmapPlaceholderProps {
  sprint: string;
  title: string;
  phase: string;
  modules: string[];
  deliverables: string;
  onNavigateToPhaseA: () => void;
}

export const RoadmapPlaceholderPage: React.FC<RoadmapPlaceholderProps> = ({
  sprint,
  title,
  phase,
  modules,
  deliverables,
  onNavigateToPhaseA
}) => {
  return (
    <div
      className="card"
      style={{
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '2.5rem',
        textAlign: 'center',
        backgroundColor: '#FFFFFF'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: '#FFEBEE',
          color: '#E53935',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Clock size={28} />
      </div>

      <div style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
        <span className="badge badge-purple" style={{ fontSize: '12px' }}>
          {sprint} - {phase}
        </span>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
        {title}
      </h2>

      <p style={{ color: '#4B5563', fontSize: '14px', maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
        Tính năng này nằm trong lộ trình xây dựng hệ thống quản trị của <strong>Công ty TNHH NK Nam Khánh</strong> (Chuyên cung cấp Văn phòng phẩm & Thiết bị văn phòng). Hệ thống Quản trị Hệ thống & Nền tảng đã sẵn sàng vận hành 100%!
      </p>

      <div
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '1.5rem',
          border: '1px solid #F3F4F6'
        }}
      >
        <div style={{ fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '0.5rem' }}>
          📦 Các chức năng được xây dựng trong {sprint}:
        </div>
        <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {modules.map((m, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#4B5563' }}>
              <CheckCircle2 size={14} color="#16A34A" />
              <span>{m}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB', fontSize: '12px', color: '#6B7280' }}>
          🎯 <strong>Tiêu chuẩn đầu ra (Deliverables):</strong> {deliverables}
        </div>
      </div>

      <button onClick={onNavigateToPhaseA} className="btn btn-primary">
        <span>Quay về Quản trị cơ cấu tổ chức</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
