import React from 'react';
import {
  DNS_DOMAIN,
  RESOLVED_IP,
  type DnsHopStatus,
  type Station2State,
} from '../timeline/station2';
import {STUDIO_COLORS} from '../world/palette';

interface Station2DnsCardProps {
  readonly station2: Station2State;
  readonly monoFont: string;
}

const HOP_STYLE_MAP: Record<
  DnsHopStatus,
  {
    readonly fg: string;
    readonly bg: string;
    readonly border: string;
    readonly dot: string;
  }
> = {
  idle: {
    fg: '#6B7290',
    bg: '#F4F6FC',
    border: 'rgba(140, 145, 170, 0.24)',
    dot: '#A7ACC2',
  },
  querying: {
    fg: STUDIO_COLORS.electricBlue,
    bg: STUDIO_COLORS.electricBlueSoft,
    border: 'rgba(26, 91, 255, 0.34)',
    dot: STUDIO_COLORS.electricBlue,
  },
  resolved: {
    fg: '#1046D6',
    bg: '#E8F0FF',
    border: 'rgba(26, 91, 255, 0.36)',
    dot: STUDIO_COLORS.electricBlue,
  },
};

export const Station2DnsCard: React.FC<Station2DnsCardProps> = ({
  station2,
  monoFont,
}) => {
  const {isResolved, resolvedRevealProgress, hops} = station2;

  return (
    <div
      data-testid="station2-dns-resolution"
      data-dns-resolved={isResolved ? 'true' : 'false'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        marginTop: 2,
      }}
    >
      {/* Primary Domain -> IP Mapping Banner (LTR inside RTL card) */}
      <div
        dir="ltr"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: isResolved ? '#EEF4FF' : '#F6F8FD',
          border: `1.5px solid ${
            isResolved
              ? 'rgba(26, 91, 255, 0.34)'
              : 'rgba(140, 145, 170, 0.25)'
          }`,
          borderRadius: 16,
          padding: '12px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 22,
              fontWeight: 700,
              color: STUDIO_COLORS.textPrimary,
            }}
          >
            {DNS_DOMAIN}
          </span>

          <span
            aria-hidden="true"
            style={{
              fontFamily: monoFont,
              fontSize: 20,
              fontWeight: 700,
              color: STUDIO_COLORS.electricBlue,
              background: '#DCE8FF',
              borderRadius: 8,
              padding: '2px 9px',
              lineHeight: 1.2,
            }}
          >
            -&gt;
          </span>

          <span
            style={{
              fontFamily: monoFont,
              fontSize: 22,
              fontWeight: 700,
              color: isResolved
                ? STUDIO_COLORS.electricBlue
                : STUDIO_COLORS.textMuted,
              opacity: isResolved ? 0.3 + 0.7 * resolvedRevealProgress : 0.85,
              letterSpacing: '0.01em',
            }}
          >
            {isResolved ? RESOLVED_IP : 'Resolving IP...'}
          </span>
        </div>

        <span
          style={{
            fontFamily: monoFont,
            fontSize: 15,
            fontWeight: 700,
            color: isResolved
              ? STUDIO_COLORS.electricBlue
              : STUDIO_COLORS.textMuted,
            background: '#FFFFFF',
            border: `1px solid ${
              isResolved
                ? 'rgba(26, 91, 255, 0.26)'
                : 'rgba(140, 145, 170, 0.26)'
            }`,
            borderRadius: 10,
            padding: '4px 10px',
            flexShrink: 0,
          }}
        >
          {isResolved ? 'A RECORD' : 'DNS QUERY'}
        </span>
      </div>

      {/* 3-Step Recursive Resolver Hop Trail (Root -> .com TLD -> Google NS) */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          width: '100%',
        }}
      >
        {hops.map((hop) => {
          const style = HOP_STYLE_MAP[hop.status];
          return (
            <div
              key={hop.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: style.bg,
                border: `1.5px solid ${style.border}`,
                borderRadius: 14,
                padding: '9px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: STUDIO_COLORS.textPrimary,
                  }}
                >
                  {hop.persianLabel}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: style.dot,
                    flexShrink: 0,
                  }}
                />
              </div>

              <span
                dir="ltr"
                style={{
                  fontFamily: monoFont,
                  fontSize: 14,
                  fontWeight: 700,
                  color: style.fg,
                  textAlign: 'left',
                }}
              >
                {hop.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
