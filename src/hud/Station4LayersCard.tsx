import React from 'react';
import type {
  IspRoutingPhase,
  LayerStatus,
  Station4State,
} from '../timeline/station4';
import {STUDIO_COLORS} from '../world/palette';

interface Station4LayersCardProps {
  readonly station4: Station4State;
  readonly monoFont: string;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

function toPersianDigits(value: number): string {
  return String(value).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit,
  );
}

function getPhaseBannerMeta(station4: Station4State): {
  readonly persianText: string;
  readonly codeText: string;
  readonly fg: string;
  readonly bg: string;
  readonly border: string;
  readonly dot: string;
} {
  const {routingPhase, encapsulatedCount, activeRouterIndex, routersPassedCount} =
    station4;

  const phaseMap: Record<
    IspRoutingPhase,
    {
      readonly persianText: string;
      readonly codeText: string;
      readonly fg: string;
      readonly bg: string;
      readonly border: string;
      readonly dot: string;
    }
  > = {
    approaching: {
      persianText: 'ورود پکت رمزنگاری‌شده به لایه‌های شبکه',
      codeText: 'STACK IN',
      fg: '#5A6180',
      bg: '#F4F6FC',
      border: 'rgba(140, 145, 170, 0.26)',
      dot: '#A7ACC2',
    },
    encapsulating: {
      persianText: `بسته‌بندی هدر لایه‌ها (${toPersianDigits(encapsulatedCount)} از ۴)`,
      codeText: `ENCAP ${encapsulatedCount}/4`,
      fg: STUDIO_COLORS.electricBlue,
      bg: STUDIO_COLORS.electricBlueSoft,
      border: 'rgba(26, 91, 255, 0.34)',
      dot: STUDIO_COLORS.electricBlue,
    },
    routing: {
      persianText:
        activeRouterIndex !== null
          ? `عبور از روتر ISP شماره ${toPersianDigits(activeRouterIndex + 1)}`
          : `مسیریابی میان روترهای ISP (${toPersianDigits(routersPassedCount)} از ۲)`,
      codeText:
        activeRouterIndex !== null
          ? `ISP HOP ${activeRouterIndex + 1}/2`
          : `ISP ${routersPassedCount}/2`,
      fg: '#0284C7',
      bg: '#F0F9FF',
      border: 'rgba(14, 165, 233, 0.34)',
      dot: '#0EA5E9',
    },
    forwarded: {
      persianText: 'پکت کامل به سمت سرور گوگل مسیریابی شد',
      codeText: 'ROUTED -> ISP',
      fg: '#0D8A62',
      bg: STUDIO_COLORS.responseEmeraldSoft,
      border: 'rgba(16, 185, 129, 0.36)',
      dot: STUDIO_COLORS.responseEmerald,
    },
  };

  return phaseMap[routingPhase];
}

function getLayerChipStyle(status: LayerStatus, ringColor: string) {
  if (status === 'active') {
    return {
      fg: '#FFFFFF',
      bg: ringColor,
      border: ringColor,
    };
  }
  if (status === 'done') {
    return {
      fg: ringColor,
      bg: '#FFFFFF',
      border: ringColor,
    };
  }
  return {
    fg: '#6B7290',
    bg: '#F4F6FC',
    border: 'rgba(140, 145, 170, 0.25)',
  };
}

export const Station4LayersCard: React.FC<Station4LayersCardProps> = ({
  station4,
  monoFont,
}) => {
  const {layers, encapsulatedCount, routingPhase} = station4;
  const banner = getPhaseBannerMeta(station4);

  return (
    <div
      data-testid="station4-layers-isp"
      data-encapsulated-count={encapsulatedCount}
      data-routing-phase={routingPhase}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 2,
      }}
    >
      {/* Row 1: 4-Layer Encapsulation Progress Strip (APP -> TCP -> IP -> LINK) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: '#F7F9FE',
          border: `1.5px solid ${
            encapsulatedCount === 4
              ? 'rgba(16, 185, 129, 0.32)'
              : 'rgba(26, 91, 255, 0.22)'
          }`,
          borderRadius: 16,
          padding: '10px 14px',
        }}
      >
        <span
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: STUDIO_COLORS.textPrimary,
            flexShrink: 0,
          }}
        >
          هدر لایه‌ها
        </span>

        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {layers.map((layer, index) => {
            const style = getLayerChipStyle(layer.status, layer.ringColor);
            return (
              <React.Fragment key={layer.id}>
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background:
                        layer.status === 'active' ? '#FFFFFF' : layer.ringColor,
                      opacity: layer.status === 'idle' ? 0.45 : 1,
                    }}
                  />
                  {layer.code}
                </span>
                {index < layers.length - 1 && (
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
      </div>

      {/* Row 2: Encapsulation & ISP Routing Status Banner */}
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
                routingPhase === 'forwarded'
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
