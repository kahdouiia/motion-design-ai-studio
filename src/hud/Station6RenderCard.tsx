import React from 'react';
import type {Station6State} from '../timeline/station6';
import {STUDIO_COLORS} from '../world/palette';

interface Station6RenderCardProps {
  readonly station6: Station6State;
  readonly monoFont: string;
}

export const Station6RenderCard: React.FC<Station6RenderCardProps> = ({
  station6,
  monoFont,
}) => {
  const isDone = station6.renderComplete;

  let bannerText = 'بازگشت پاسخ ۲۰۰ OK به مرورگر گوشی';
  let bannerBadge = '200 OK ↑';
  let bannerTone: 'blue' | 'emerald' = 'blue';

  if (station6.phase === 'overview') {
    bannerText = 'کل این سفر چندلایه فقط در چند ده میلی‌ثانیه!';
    bannerBadge = '84 ms ✓';
    bannerTone = 'emerald';
  } else if (isDone) {
    bannerText = 'صفحه گوگل با موفقیت رندر شد';
    bannerBadge = 'PAINTED ✓';
    bannerTone = 'emerald';
  } else if (station6.phase === 'parsing') {
    bannerText = 'پارس کدها و ساخت درخت DOM و استایل‌ها';
    bannerBadge = 'PARSING';
    bannerTone = 'blue';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 2,
      }}
    >
      {/* Header row: Persian title on right, monospace pipeline token on left */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: STUDIO_COLORS.textPrimary,
          }}
        >
          موتور مرورگر
        </span>
        <span
          dir="ltr"
          style={{
            fontFamily: monoFont,
            fontSize: 15,
            fontWeight: 700,
            color: isDone
              ? STUDIO_COLORS.responseEmerald
              : STUDIO_COLORS.electricBlue,
            letterSpacing: '0.02em',
          }}
        >
          DOM › CSS › JS › PAINT
        </span>
      </div>

      {/* 3-Stage Progressive Render Pipeline (DOM / CSS / JS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {station6.stages.map((stage) => {
          const isStageDone = stage.status === 'done';
          const isStageActive = stage.status === 'active';
          const borderColor = isStageDone
            ? 'rgba(16, 185, 129, 0.36)'
            : isStageActive
              ? 'rgba(26, 91, 255, 0.42)'
              : 'rgba(148, 163, 184, 0.28)';
          const bgColor = isStageDone
            ? STUDIO_COLORS.responseEmeraldSoft
            : isStageActive
              ? STUDIO_COLORS.electricBlueSoft
              : '#F6F8FC';
          const badgeColor = isStageDone
            ? STUDIO_COLORS.responseEmerald
            : isStageActive
              ? stage.accentColor
              : '#64748B';

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '10px 12px',
                borderRadius: 14,
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
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
                  dir="ltr"
                  style={{
                    fontFamily: monoFont,
                    fontSize: 17,
                    fontWeight: 700,
                    color: badgeColor,
                  }}
                >
                  {stage.token}
                </span>
                <span
                  dir="ltr"
                  style={{
                    fontFamily: monoFont,
                    fontSize: 14,
                    fontWeight: 700,
                    color: badgeColor,
                  }}
                >
                  {isStageDone
                    ? '✓'
                    : isStageActive
                      ? `${Math.round(stage.progress * 100)}%`
                      : '•••'}
                </span>
              </div>

              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: STUDIO_COLORS.textMuted,
                  lineHeight: 1.25,
                }}
              >
                {stage.persianLabel}
              </span>

              {/* Thin deterministic stage progress track */}
              <div
                style={{
                  height: 4,
                  width: '100%',
                  borderRadius: 999,
                  background: 'rgba(148, 163, 184, 0.25)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round(stage.progress * 100)}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: isStageDone
                      ? STUDIO_COLORS.responseEmerald
                      : stage.accentColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Wrap-Up Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 14,
          background:
            bannerTone === 'emerald'
              ? STUDIO_COLORS.responseEmeraldSoft
              : STUDIO_COLORS.electricBlueSoft,
          border: `1.5px solid ${
            bannerTone === 'emerald'
              ? 'rgba(16, 185, 129, 0.34)'
              : 'rgba(26, 91, 255, 0.24)'
          }`,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color:
              bannerTone === 'emerald'
                ? '#065F46'
                : STUDIO_COLORS.textPrimary,
            lineHeight: 1.35,
          }}
        >
          {bannerText}
        </span>

        <span
          dir="ltr"
          style={{
            fontFamily: monoFont,
            fontSize: 15,
            fontWeight: 700,
            color:
              bannerTone === 'emerald'
                ? STUDIO_COLORS.responseEmerald
                : STUDIO_COLORS.electricBlue,
            background: '#FFFFFF',
            border: `1px solid ${
              bannerTone === 'emerald'
                ? 'rgba(16, 185, 129, 0.34)'
                : 'rgba(26, 91, 255, 0.24)'
            }`,
            borderRadius: 10,
            padding: '4px 10px',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {bannerBadge}
        </span>
      </div>
    </div>
  );
};
