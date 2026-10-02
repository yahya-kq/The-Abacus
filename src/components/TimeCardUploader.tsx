'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, Sparkles, X, Users, Clock, Filter, Eye } from 'lucide-react';
import { ProcessedShift, RestaurantConfig } from '../types/tips';
import { parseTimecardFile, parseTimecardCsv, formatDisplayDate } from '../lib/parser';
import { MISSION_HILL_SAMPLE_CSV } from '../lib/sampleData';

interface TimeCardUploaderProps {
  restaurant: RestaurantConfig;
  shifts: ProcessedShift[];
  fileName: string | null;
  onShiftsLoaded: (shifts: ProcessedShift[], fileName: string) => void;
  onClear: () => void;
}

export function TimeCardUploader({
  restaurant,
  shifts,
  fileName,
  onShiftsLoaded,
  onClear,
}: TimeCardUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseTimecardFile(buffer, restaurant);
      if (result.shifts.length === 0) {
        setErrorMsg('Could not find valid shifts in this file. Please verify format.');
        return;
      }
      onShiftsLoaded(result.shifts, file.name);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setErrorMsg(null);
    try {
      const result = parseTimecardCsv(MISSION_HILL_SAMPLE_CSV, restaurant);
      onShiftsLoaded(result.shifts, 'Mission_Hill_TimeCard_Sep7_Sep20.xlsx');
    } catch (err: any) {
      setErrorMsg(`Failed to load sample: ${err.message}`);
    }
  };

  // Unique employees
  const uniqueEmployees = Array.from(new Set(shifts.map((s) => s.employeeName)));
  const totalHours = shifts.reduce((sum, s) => sum + s.totalHours, 0);

  // Filtered shifts for preview
  const filteredShifts = shifts.filter(
    (s) =>
      s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.businessDate.includes(searchTerm)
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>2. Upload Time Cards</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload Excel (.xlsx, .xls) or CSV time card export from your POS/scheduling system
            </p>
          </div>
        </div>

        {shifts.length > 0 && (
          <div className="badge badge-emerald">
            <Check size={12} style={{ marginRight: '4px' }} />
            {shifts.length} Shifts Loaded
          </div>
        )}
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: '#fb7185',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Box or Loaded State */}
      {shifts.length === 0 ? (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2px dashed #10b981' : '2px dashed rgba(255, 255, 255, 0.15)',
              background: isDragging ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: '#94a3b8',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Drag & Drop time card Excel or CSV file here
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports .xlsx, .xls, and .csv with employee names, dates, and total hours
            </div>
          </div>

          {/* Quick Demo Helper Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
            <button
              onClick={handleLoadSample}
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#34d399',
              }}
            >
              <Sparkles size={14} />
              <span>Load Mission Hill Sample Time Card (Sep 7 – Sep 20)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Loaded File Summary Box */
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fileName || 'TimeCard_Data.xlsx'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} color="#60a5fa" />
                    <strong>{uniqueEmployees.length}</strong> Employees
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="#34d399" />
                    <strong>{totalHours.toFixed(2)}</strong> Total Hours
                  </span>
                  <span>•</span>
                  <span><strong>{shifts.length}</strong> Shift records</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
              >
                <Eye size={14} />
                <span>Inspect Shifts</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#fb7185' }}
              >
                <X size={14} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Compliance Callout */}
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.78rem',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={14} />
            <span>
              <strong>Rule Verification:</strong> The calculation utilizes the employee’s <strong>Total Hours</strong> from the time card. Regular and overtime hours are not separately calculated.
            </span>
          </div>
        </div>
      )}

      {/* Modal to inspect raw shifts */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Parsed Time Card Shift Records</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total {shifts.length} shifts parsed from {fileName}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search by employee name, role, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Shift Table */}
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Cal Date</th>
                    <th>Time In - Out</th>
                    <th>Biz Date</th>
                    <th style={{ textAlign: 'right' }}>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.employeeName}</td>
                      <td>
                        <span className={`badge ${s.isEligibleRecipient ? 'badge-blue' : 'badge-amber'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td>{s.rawDate}</td>
                      <td style={{ fontSize: '0.8rem' }}>{s.timeIn} - {s.timeOut}</td>
                      <td style={{ fontWeight: 500 }}>{s.businessDate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                        {s.totalHours.toFixed(2)}
                      </td>
                      <td>
                        {s.isEligibleRecipient ? (
                          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Recipient (Equal)</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Excluded from pool</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
