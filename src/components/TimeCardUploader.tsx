'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, Sparkles, X, Users, Clock, Eye } from 'lucide-react';
import { ProcessedShift, RestaurantConfig } from '../types/tips';
import { parseTimecardFile, parseTimecardCsv } from '../lib/parser';
import { MISSION_HILL_SAMPLE_CSV } from '../lib/sampleData';

interface TimeCardUploaderProps {
  restaurant: RestaurantConfig;
  shifts: ProcessedShift[];
  fileName: string | null;
  onShiftsLoaded: (
    shifts: ProcessedShift[],
    fileName: string,
    extractedTips?: Record<string, number>,
    detectedStart?: string,
    detectedEnd?: string
  ) => void;
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
      onShiftsLoaded(
        result.shifts,
        file.name,
        result.extractedDailyTips,
        result.detectedStartDate,
        result.detectedEndDate
      );
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
      onShiftsLoaded(
        result.shifts,
        'Mission_Hill_TimeCard_Sep7_Sep20.xlsx',
        result.extractedDailyTips,
        result.detectedStartDate,
        result.detectedEndDate
      );
    } catch (err: any) {
      setErrorMsg(`Failed to load sample: ${err.message}`);
    }
  };

  // Unique employees and hours
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
    <div className="glass-panel" style={{ padding: '22px 24px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Time Card Import</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Upload Excel (.xlsx, .xls) or CSV export from Toast POS
            </p>
          </div>
        </div>

        {shifts.length > 0 && (
          <div className="badge badge-indigo">
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
            padding: '12px 14px',
            color: '#fb7185',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
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
              border: isDragging ? '2px dashed #6366f1' : '2px dashed rgba(255, 255, 255, 0.16)',
              background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.45)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 20px',
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
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                color: '#94a3b8',
              }}
            >
              <UploadCloud size={22} />
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Drag & Drop time card file here, or browse
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Accepts .xlsx, .xls, and .csv files
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <button
              onClick={handleLoadSample}
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '7px 14px',
                color: '#818cf8',
                borderColor: 'rgba(99, 102, 241, 0.3)',
              }}
            >
              <Sparkles size={13} />
              <span>Load Mission Hill Sample Time Card</span>
            </button>
          </div>
        </div>
      ) : (
        /* Loaded File Summary Box */
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fileName || 'TimeCard_Data.xlsx'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} color="#60a5fa" />
                    <strong>{uniqueEmployees.length}</strong> Staff
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="#818cf8" />
                    <strong>{totalHours.toFixed(2)}</strong> Total Hours
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.8rem' }}
              >
                <Eye size={13} />
                <span>Inspect</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.8rem', color: '#fb7185' }}
              >
                <X size={13} />
                <span>Remove</span>
              </button>
            </div>
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
              border: '1px solid rgba(255, 255, 255, 0.16)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Time Card Shift Records</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Search by employee name, role, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Date</th>
                    <th>Time In - Out</th>
                    <th>Biz Date</th>
                    <th style={{ textAlign: 'right' }}>Total Hours</th>
                    <th style={{ textAlign: 'right' }}>POS Tips</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.employeeName}</td>
                      <td>
                        <span className={`badge ${s.isEligibleRecipient ? 'badge-indigo' : 'badge-amber'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td>{s.rawDate}</td>
                      <td style={{ fontSize: '0.8rem' }}>{s.timeIn} - {s.timeOut}</td>
                      <td style={{ fontWeight: 500 }}>{s.businessDate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#818cf8' }}>
                        {s.totalHours.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#60a5fa' }}>
                        ${s.posTips.toFixed(2)}
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
                style={{ padding: '8px 20px', fontSize: '0.88rem' }}
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
