'use client';

import React from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Clock,
  BarChart3,
  RotateCcw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Coffee,
} from 'lucide-react';

export type NavScreen = 'hero' | 'setup' | 'timecards' | 'dashboard';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onHardRefresh: () => void;
  onLoadTestData: () => void;
  onLoadMissionHillData: () => void;
}

export function Sidebar({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onHardRefresh,
  onLoadTestData,
  onLoadMissionHillData,
}: SidebarProps) {
  const navItems = [
    {
      id: 'hero' as NavScreen,
      label: 'Welcome & Overview',
      icon: Sparkles,
      badge: null,
    },
    {
      id: 'setup' as NavScreen,
      label: 'Tip Pool Setup',
      icon: SlidersHorizontal,
      badge: 'Rules',
    },
    {
      id: 'timecards' as NavScreen,
      label: 'Time Cards',
      icon: Clock,
      badge: 'Shifts',
    },
    {
      id: 'dashboard' as NavScreen,
      label: 'Calculation Dashboard',
      icon: BarChart3,
      badge: 'Live',
    },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? '76px' : '260px',
        minWidth: isCollapsed ? '76px' : '260px',
        height: '100vh',
        background: '#151336',
        borderRight: '1px solid rgba(139, 142, 222, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: isCollapsed ? '24px 16px' : '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(139, 142, 222, 0.14)',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1,
              }}
            >
              ABACUS
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: '#8e91be',
                marginTop: '4px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Tip Calculator
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          type="button"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'rgba(139, 142, 222, 0.1)',
            border: '1px solid rgba(139, 142, 222, 0.2)',
            borderRadius: '8px',
            color: '#c5c7e8',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 142, 222, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(139, 142, 222, 0.1)';
            e.currentTarget.style.color = '#c5c7e8';
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isCollapsed ? '12px' : '12px 14px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: '10px',
                background: isActive ? 'rgba(93, 84, 230, 0.2)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(108, 99, 255, 0.45)'
                  : '1px solid transparent',
                color: isActive ? '#ffffff' : '#8e91be',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(139, 142, 222, 0.08)';
                  e.currentTarget.style.color = '#c5c7e8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#8e91be';
                }
              }}
            >
              <Icon size={19} color={isActive ? '#9ca3ff' : '#8e91be'} />
              {!isCollapsed && (
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(108, 99, 255, 0.4)' : 'rgba(139, 142, 222, 0.14)',
                    color: isActive ? '#ffffff' : '#8e91be',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Footer */}
      <div
        style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(139, 142, 222, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Load Mission Hill Data */}
        <button
          onClick={onLoadMissionHillData}
          type="button"
          title={isCollapsed ? 'Load Mission Hill Sample Dataset' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isCollapsed ? '10px' : '10px 12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            background: 'rgba(93, 84, 230, 0.1)',
            border: '1px solid rgba(108, 99, 255, 0.3)',
            color: '#a49eff',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(93, 84, 230, 0.2)';
            e.currentTarget.style.borderColor = '#6c63ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(93, 84, 230, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
          }}
        >
          <Coffee size={16} />
          {!isCollapsed && <span>Load Mission Hill Data</span>}
        </button>

        {/* Load Test-1 Data */}
        <button
          onClick={onLoadTestData}
          type="button"
          title={isCollapsed ? 'Load Test-1 Sample Dataset' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isCollapsed ? '10px' : '10px 12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            background: 'rgba(0, 210, 180, 0.08)',
            border: '1px solid rgba(0, 210, 180, 0.25)',
            color: '#00e5a3',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 210, 180, 0.16)';
            e.currentTarget.style.borderColor = '#00e5a3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 210, 180, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(0, 210, 180, 0.25)';
          }}
        >
          <FileSpreadsheet size={16} />
          {!isCollapsed && <span>Load Test-1 Data</span>}
        </button>

        {/* Hard Refresh Button */}
        <button
          onClick={onHardRefresh}
          type="button"
          title={isCollapsed ? 'Hard Refresh (Clear All Memory)' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isCollapsed ? '10px' : '10px 12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            background: 'rgba(255, 95, 109, 0.08)',
            border: '1px solid rgba(255, 95, 109, 0.25)',
            color: '#ff5f6d',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 95, 109, 0.18)';
            e.currentTarget.style.borderColor = '#ff5f6d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 95, 109, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 95, 109, 0.25)';
          }}
        >
          <RotateCcw size={16} />
          {!isCollapsed && <span>Hard Refresh</span>}
        </button>
      </div>
    </aside>
  );
}
