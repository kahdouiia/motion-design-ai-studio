import React from 'react';
import type {
  ServerResponsePhase,
  ServerTierStatus,
  Station5State,
} from '../timeline/station5';
import {STUDIO_COLORS} from '../world/palette';

interface Station5ServerCardProps {
  readonly station5: Station5State;
  readonly monoFont: string;
}

const PHASE_BANNER_META: Record<
  ServerResponsePhase,
  {
    readonly persianText: string;
    readonly codeText: string;
    readonly fg: string;
    readonly bg: string;
    readonly border: string;
    readonly dot: string;
  }
> = {
  incoming: {
    persianText: 'ورود بسته درخواست به لودبالانسر گوگل',
    codeText: 'REQ -> LB',
    fg: STUDIO_COLORS.electricBlue,
    bg: STUDIO_COLORS.electricBlueSoft,
    border: 'rgba(26, 91, 255, 0.28)',
    dot: STUDIO_COLORS.electricBlue,
  },
  processing: {
    persianText: 'پردازش درخواست روی سرور و ساخت خروجی',
    codeText: 'PROCESSING',
    fg: STUDIO_COLORS.electricBlue,
    bg: STUDIO_COLORS.electricBlueSoft,
    border: 'rgba(26, 91, 255, 0.34)',
    dot: STUDIO_COLORS.electricBlue,
  },
  building: {
    persianText: 'آماده‌سازی پاسخ و بسته‌بندی فایل‌های صفحه',
    codeText: 'BUILD 200 OK',
    fg: '#0D8A62',
    bg: STUDIO_COLORS.responseEmeraldSoft,
    border: 'rgba(16, 185, 129, 0.34)',
    dot: STUDIO_COLORS.responseEmerald,
  },
  launched: {
    persianText: 'پاسخ ۲۰۰ OK به سمت گوشی ارسال شد',
    codeText: '200 OK ↑',
    fg: '#0D8A62',
    bg: STUDIO_COLORS.responseEmeraldSoft,
    border: 'rgba(16, 185, 129, 0.38)',
    dot: STUDIO_COLORS.responseEmerald,
  },
};

function getTierPillStyle(status: ServerTierStatus, isEmerald: boolean) {
  const accent = isEmerald
    ? STUDIO_COLORS.responseEmerald
    : STUDIO_COLORS.electricBlue;
  const softBg = isEmerald
    ? STUDIO_COLORS.responseEmeraldSoft
    : STUDIO_COLORS.electricBlueSoft;
  const softBorder = isEmerald
    ? 'rgba(16, 185, 129, 0.38)'
    : 'rgba(26, 91, 255, 0.34)';

  if (status === 'active') {
    return {fg: '#FFFFFF', bg: accent, border: accent};
  }
  if (status === 'done') {
    return {fg: accent, bg: softBg, border: softBorder};
  }
  return {
    fg: '#6B7290',
    bg: '#F4F6FC',
    border: 'rgba(140, 145, 170, 0.25)',
  };
}

export const Station5ServerCard: React.FC<Station5ServerCardProps> = ({
  station5,
  monoFont,
}) => {
  const {tiers, phase, payloadAssetsReady, isResponseLaunched} = station5;
  const banner = PHASE_BANNER_META[phase];

  return (
    <div
      data-testid="station5-server-response"
      data-phase={phase}
      data-launched={isResponseLaunched ? 'true' : 'false'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 2,
      }}
    >
      {/* Row 1: 3-Tier Server Cascade + HTML/CSS/JS Payload Chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: '#F7F9FE',
          border: `1.5px solid ${
            isResponseLaunched
              ? 'rgba(16, 185, 129, 0.34)'
              : 'rgba(26, 91, 255, 0.22)'
          }`,
          borderRadius: 16,
          padding: '10px 14px',
        }}
      >
        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {tiers.map((tier, index) => {
            const style = getTierPillStyle(tier.status, tier.isEmerald);
            return (
              <React.Fragment key={tier.id}>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 15,
                    fontWeight: 700,
                    color: style.fg,
                    background: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: 10,
                    padding: '4px 10px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {tier.shortCode}
                </span>
                {index < tiers.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: monoFont,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#9BA3BD',
                    }}
                  >
                    &rsaquo;
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Payload asset chips (HTML / CSS / JS) */}
        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {payloadAssetsReady.map((asset) => (
            <span
              key={asset.code}
              style={{
                fontFamily: monoFont,
                fontSize: 14,
                fontWeight: 700,
                color: asset.ready ? '#0D8A62' : '#8C91AA',
                background: asset.ready ? '#ECFDF5' : '#F4F6FC',
                border: `1px solid ${
                  asset.ready
                    ? 'rgba(16, 185, 129, 0.34)'
                    : 'rgba(140, 145, 170, 0.22)'
                }`,
                borderRadius: 9,
                padding: '4px 8px',
                letterSpacing: '0.02em',
              }}
            >
              {asset.code}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2: Server Processing & 200 OK Launch Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: banner.bg,
          border: `1.5px solid ${banner.border}`,
          borderRadius: 16,
          padding: '11px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 11,
              height: 11,
              borderRadius: 999,
              background: banner.dot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color:
                phase === 'launched' || phase === 'building'
                  ? '#0B6E4F'
                  : STUDIO_COLORS.textPrimary,
            }}
          >
            {banner.persianText}
          </span>
        </div>

        <span
          dir="ltr"
          style={{
            fontFamily: monoFont,
            fontSize: 15,
            fontWeight: 700,
            color: banner.fg,
            background: '#FFFFFF',
            border: `1px solid ${banner.border}`,
            borderRadius: 10,
            padding: '5px 11px',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {banner.codeText}
        </span>
      </div>
    </div>
  );
};
