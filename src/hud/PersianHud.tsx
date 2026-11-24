import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {loadFont as loadVazirmatn} from '@remotion/google-fonts/Vazirmatn';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';
import {STATIONS, type ChoreographyState} from '../timeline/choreography';
import {getStation1State} from '../timeline/station1';
import {getStation2State} from '../timeline/station2';
import {getStation3State} from '../timeline/station3';
import {getStation4State} from '../timeline/station4';
import {getStation5State} from '../timeline/station5';
import {SHORTS_SAFE_ZONE, STUDIO_COLORS} from '../world/palette';
import {Station1CacheCard} from './Station1CacheCard';
import {Station2DnsCard} from './Station2DnsCard';
import {Station3TcpTlsCard} from './Station3TcpTlsCard';
import {Station4LayersCard} from './Station4LayersCard';
import {Station5ServerCard} from './Station5ServerCard';

const {fontFamily: persianFont} = loadVazirmatn('normal', {
  weights: ['400', '500', '700'],
  subsets: ['arabic', 'latin'],
});

const {fontFamily: monoFont} = loadJetBrainsMono('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
});

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

function toPersianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

interface PersianHudProps {
  readonly choreography: ChoreographyState;
}

export const PersianHud: React.FC<PersianHudProps> = ({choreography}) => {
  const {station, stationIndex, stationProgress, packetDirection, frame} = choreography;
  const isInbound = packetDirection === 'inbound';
  const station1 = useMemo(() => getStation1State(frame), [frame]);
  const station2 = useMemo(() => getStation2State(frame), [frame]);
  const station3 = useMemo(() => getStation3State(frame), [frame]);
  const station4 = useMemo(() => getStation4State(frame), [frame]);
  const station5 = useMemo(() => getStation5State(frame), [frame]);
  const isRichStationCard =
    stationIndex === 1 ||
    stationIndex === 2 ||
    stationIndex === 3 ||
    stationIndex === 4 ||
    stationIndex === 5;

  const cardEntranceOpacity =
    stationIndex === 1
      ? 1
      : interpolate(stationProgress, [0, 0.04], [0.25, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const cardEntranceOffsetY =
    stationIndex === 1
      ? 0
      : interpolate(stationProgress, [0, 0.04], [14, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const activeAccent = isInbound
    ? STUDIO_COLORS.responseEmerald
    : STUDIO_COLORS.electricBlue;

  return (
    <AbsoluteFill
      dir="rtl"
      data-testid="persian-hud"
      data-station-index={stationIndex}
      data-frame={frame}
      style={{
        paddingTop: SHORTS_SAFE_ZONE.top,
        paddingRight: SHORTS_SAFE_ZONE.right,
        paddingBottom: SHORTS_SAFE_ZONE.bottom,
        paddingLeft: SHORTS_SAFE_ZONE.left,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: persianFont,
      }}
    >
      {/* Top Safe-Zone Station Progress Header */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 22,
          padding: '18px 24px',
          border: '1.5px solid rgba(26, 91, 255, 0.16)',
          boxShadow: '0 12px 32px rgba(27, 31, 59, 0.07)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: STUDIO_COLORS.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            ایستگاه {toPersianDigits(stationIndex)} از {toPersianDigits(STATIONS.length)}
          </span>

          <span
            dir="ltr"
            style={{
              fontFamily: monoFont,
              fontSize: 18,
              fontWeight: 700,
              color: activeAccent,
              background: isInbound
                ? STUDIO_COLORS.responseEmeraldSoft
                : STUDIO_COLORS.electricBlueSoft,
              border: `1px solid ${isInbound ? 'rgba(16, 185, 129, 0.28)' : 'rgba(26, 91, 255, 0.22)'}`,
              borderRadius: 12,
              padding: '5px 12px',
              letterSpacing: '0.02em',
            }}
          >
            {isInbound ? '200 OK ↑' : 'REQ ↓'}
          </span>
        </div>

        {/* 6-Station static timeline progress rail */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            width: '100%',
          }}
        >
          {STATIONS.map((item) => {
            const isCompleted = item.index < stationIndex;
            const isCurrent = item.index === stationIndex;
            const fillRatio = isCompleted ? 1 : isCurrent ? stationProgress : 0;
            return (
              <div
                key={item.id}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: '#E0E5F5',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round(fillRatio * 100)}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: isCurrent ? activeAccent : STUDIO_COLORS.electricBlue,
                  }}
                />
              </div>
            );
          })}
        </div>
      </header>

      {/* Bottom Safe-Zone Persian Narrative Card */}
      <section
        aria-label={station.persianTitle}
        style={{
          background: 'rgba(255, 255, 255, 0.94)',
          borderRadius: 24,
          padding: isRichStationCard ? '22px 24px' : '26px 28px',
          border: '1.5px solid rgba(26, 91, 255, 0.18)',
          boxShadow: '0 18px 44px rgba(27, 31, 59, 0.09)',
          opacity: cardEntranceOpacity,
          transform: `translateY(${cardEntranceOffsetY}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: isRichStationCard ? 12 : 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: isRichStationCard ? 34 : 38,
              fontWeight: 700,
              lineHeight: 1.32,
              color: STUDIO_COLORS.textPrimary,
            }}
          >
            {station.persianTitle}
          </h1>

          {stationIndex === 1 && (
            <span
              dir="ltr"
              style={{
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 700,
                color: STUDIO_COLORS.electricBlue,
                background: STUDIO_COLORS.electricBlueSoft,
                border: '1px solid rgba(26, 91, 255, 0.24)',
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              google.com
            </span>
          )}

          {stationIndex === 2 && (
            <span
              dir="ltr"
              style={{
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 700,
                color: STUDIO_COLORS.electricBlue,
                background: STUDIO_COLORS.electricBlueSoft,
                border: '1px solid rgba(26, 91, 255, 0.24)',
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              DNS RESOLVER
            </span>
          )}

          {stationIndex === 3 && (
            <span
              dir="ltr"
              style={{
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 700,
                color: station3.isTlsLocked
                  ? STUDIO_COLORS.responseEmerald
                  : STUDIO_COLORS.electricBlue,
                background: station3.isTlsLocked
                  ? STUDIO_COLORS.responseEmeraldSoft
                  : STUDIO_COLORS.electricBlueSoft,
                border: `1px solid ${
                  station3.isTlsLocked
                    ? 'rgba(16, 185, 129, 0.32)'
                    : 'rgba(26, 91, 255, 0.24)'
                }`,
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              TCP / TLS 1.3
            </span>
          )}

          {stationIndex === 4 && (
            <span
              dir="ltr"
              style={{
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 700,
                color:
                  station4.routingPhase === 'forwarded'
                    ? STUDIO_COLORS.responseEmerald
                    : STUDIO_COLORS.electricBlue,
                background:
                  station4.routingPhase === 'forwarded'
                    ? STUDIO_COLORS.responseEmeraldSoft
                    : STUDIO_COLORS.electricBlueSoft,
                border: `1px solid ${
                  station4.routingPhase === 'forwarded'
                    ? 'rgba(16, 185, 129, 0.32)'
                    : 'rgba(26, 91, 255, 0.24)'
                }`,
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              OSI / ISP
            </span>
          )}

          {stationIndex === 5 && (
            <span
              dir="ltr"
              style={{
                fontFamily: monoFont,
                fontSize: 18,
                fontWeight: 700,
                color:
                  station5.isResponseLaunched || station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmerald
                    : STUDIO_COLORS.electricBlue,
                background:
                  station5.isResponseLaunched || station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmeraldSoft
                    : STUDIO_COLORS.electricBlueSoft,
                border: `1px solid ${
                  station5.isResponseLaunched || station5.phase === 'building'
                    ? 'rgba(16, 185, 129, 0.32)'
                    : 'rgba(26, 91, 255, 0.24)'
                }`,
                borderRadius: 11,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              {station5.isResponseLaunched ? '200 OK' : 'HTTP/2'}
            </span>
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: isRichStationCard ? 21 : 24,
            fontWeight: 400,
            lineHeight: 1.5,
            color: STUDIO_COLORS.textMuted,
          }}
        >
          {station.persianSubtitle}
        </p>

        {stationIndex === 1 ? (
          <Station1CacheCard station1={station1} monoFont={monoFont} />
        ) : stationIndex === 2 ? (
          <Station2DnsCard station2={station2} monoFont={monoFont} />
        ) : stationIndex === 3 ? (
          <Station3TcpTlsCard station3={station3} monoFont={monoFont} />
        ) : stationIndex === 4 ? (
          <Station4LayersCard station4={station4} monoFont={monoFont} />
        ) : stationIndex === 5 ? (
          <Station5ServerCard station5={station5} monoFont={monoFont} />
        ) : (
          /* Technical monospace tokens rendered LTR inside the RTL card */
          <div
            dir="ltr"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 4,
            }}
          >
            {station.technicalBadges.map((badge) => {
              const isSuccessBadge = badge === '200 OK';
              return (
                <span
                  key={badge}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 19,
                    fontWeight: 700,
                    color: isSuccessBadge
                      ? STUDIO_COLORS.responseEmerald
                      : STUDIO_COLORS.electricBlue,
                    background: isSuccessBadge
                      ? STUDIO_COLORS.responseEmeraldSoft
                      : STUDIO_COLORS.electricBlueSoft,
                    border: `1px solid ${
                      isSuccessBadge
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(26, 91, 255, 0.22)'
                    }`,
                    borderRadius: 12,
                    padding: '6px 14px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {badge}
                </span>
              );
            })}
          </div>
        )}
      </section>
    </AbsoluteFill>
  );
};
