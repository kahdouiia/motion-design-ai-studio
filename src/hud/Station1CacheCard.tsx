import React from 'react';
import {interpolate} from 'remotion';
import type {CacheCheckStatus, Station1State} from '../timeline/station1';
import {STUDIO_COLORS} from '../world/palette';

interface Station1CacheCardProps {
  readonly station1: Station1State;
  readonly monoFont: string;
}

interface CacheRowMeta {
  readonly key: string;
  readonly persianLabel: string;
  readonly techLabel: string;
  readonly status: CacheCheckStatus;
}

const STATUS_STYLE_MAP: Record<
  CacheCheckStatus,
  {
    readonly persianText: string;
    readonly codeText: string;
    readonly fg: string;
    readonly bg: string;
    readonly border: string;
    readonly dot: string;
  }
> = {
  idle: {
    persianText: 'در انتظار',
    codeText: 'WAIT',
    fg: '#6B7290',
    bg: '#F3F5FB',
    border: 'rgba(140, 145, 170, 0.25)',
    dot: '#A7ACC2',
  },
  checking: {
    persianText: 'در حال بررسی',
    codeText: 'LOOKUP',
    fg: STUDIO_COLORS.electricBlue,
    bg: STUDIO_COLORS.electricBlueSoft,
    border: 'rgba(26, 91, 255, 0.28)',
    dot: STUDIO_COLORS.electricBlue,
  },
  miss: {
    persianText: 'ناموجود',
    codeText: 'MISS',
    fg: '#D93848',
    bg: '#FFF1F2',
    border: 'rgba(217, 56, 72, 0.28)',
    dot: '#D93848',
  },
};

export const Station1CacheCard: React.FC<Station1CacheCardProps> = ({
  station1,
  monoFont,
}) => {
  const rows: readonly CacheRowMeta[] = [
    {
      key: 'browser',
      persianLabel: 'کش مرورگر',
      techLabel: 'Browser Cache',
      status: station1.browserCacheStatus,
    },
    {
      key: 'os',
      persianLabel: 'کش سیستم‌عامل',
      techLabel: 'OS / Hosts',
      status: station1.osCacheStatus,
    },
  ];

  const summaryOpacity = interpolate(station1.frame, [144, 158], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      data-testid="station1-cache-check"
      data-browser-cache={station1.browserCacheStatus}
      data-os-cache={station1.osCacheStatus}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 2,
      }}
    >
      {rows.map((row) => {
        const style = STATUS_STYLE_MAP[row.status];
        const isActiveRow = row.status !== 'idle';
        return (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              background: isActiveRow ? '#FAFBFD' : '#F6F7FC',
              border: `1.5px solid ${style.border}`,
              borderRadius: 16,
              padding: '11px 16px',
            }}
          >
            {/* RTL Persian label + subtle LTR technical tag */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 999,
                  background: style.dot,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: STUDIO_COLORS.textPrimary,
                }}
              >
                {row.persianLabel}
              </span>
              <span
                dir="ltr"
                style={{
                  fontFamily: monoFont,
                  fontSize: 15,
                  fontWeight: 500,
                  color: STUDIO_COLORS.textMuted,
                }}
              >
                {row.techLabel}
              </span>
            </div>

            {/* Crisp status badge (Persian + Monospace status token) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: style.fg,
                }}
              >
                {style.persianText}
              </span>
              <span
                dir="ltr"
                style={{
                  fontFamily: monoFont,
                  fontSize: 15,
                  fontWeight: 700,
                  color: style.fg,
                  letterSpacing: '0.03em',
                }}
              >
                {style.codeText}
              </span>
            </div>
          </div>
        );
      })}

      {/* Cache Miss -> Packet Launch Banner */}
      {station1.cacheMissSummaryVisible && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: STUDIO_COLORS.electricBlueSoft,
            border: '1.5px solid rgba(26, 91, 255, 0.28)',
            borderRadius: 14,
            padding: '10px 16px',
            opacity: summaryOpacity,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: STUDIO_COLORS.electricBlue,
            }}
          >
            آی‌پی یافت نشد — ارسال پکت به DNS
          </span>
          <span
            dir="ltr"
            style={{
              fontFamily: monoFont,
              fontSize: 16,
              fontWeight: 700,
              color: STUDIO_COLORS.electricBlue,
            }}
          >
            CACHE MISS → DNS
          </span>
        </div>
      )}
    </div>
  );
};
