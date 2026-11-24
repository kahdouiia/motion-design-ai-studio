import React from 'react';
import type {
  Station3State,
  TcpStepStatus,
  TlsStatus,
} from '../timeline/station3';
import {STUDIO_COLORS} from '../world/palette';

interface Station3TcpTlsCardProps {
  readonly station3: Station3State;
  readonly monoFont: string;
}

const TCP_STEP_STYLE: Record<
  TcpStepStatus,
  {
    readonly fg: string;
    readonly bg: string;
    readonly border: string;
  }
> = {
  idle: {
    fg: '#6B7290',
    bg: '#F4F6FC',
    border: 'rgba(140, 145, 170, 0.24)',
  },
  active: {
    fg: '#FFFFFF',
    bg: STUDIO_COLORS.electricBlue,
    border: STUDIO_COLORS.electricBlue,
  },
  done: {
    fg: '#1046D6',
    bg: '#E8F0FF',
    border: 'rgba(26, 91, 255, 0.36)',
  },
};

const TLS_STATUS_META: Record<
  TlsStatus,
  {
    readonly persianText: string;
    readonly codeText: string;
    readonly fg: string;
    readonly bg: string;
    readonly border: string;
    readonly dot: string;
  }
> = {
  waiting: {
    persianText: 'در انتظار تکمیل اتصال TCP',
    codeText: 'TLS WAIT',
    fg: '#6B7290',
    bg: '#F4F6FC',
    border: 'rgba(140, 145, 170, 0.25)',
    dot: '#A7ACC2',
  },
  handshaking: {
    persianText: 'تبادل کلیدهای رمزنگاری TLS',
    codeText: 'TLS 1.3 KEY',
    fg: STUDIO_COLORS.electricBlue,
    bg: STUDIO_COLORS.electricBlueSoft,
    border: 'rgba(26, 91, 255, 0.34)',
    dot: STUDIO_COLORS.electricBlue,
  },
  locked: {
    persianText: 'تونل امن HTTPS برقرار شد',
    codeText: 'HTTPS LOCKED',
    fg: '#0D8A62',
    bg: STUDIO_COLORS.responseEmeraldSoft,
    border: 'rgba(16, 185, 129, 0.36)',
    dot: STUDIO_COLORS.responseEmerald,
  },
};

export const Station3TcpTlsCard: React.FC<Station3TcpTlsCardProps> = ({
  station3,
  monoFont,
}) => {
  const {tcpSteps, tcpEstablished, tlsStatus} = station3;
  const tlsMeta = TLS_STATUS_META[tlsStatus];

  return (
    <div
      data-testid="station3-tcp-tls"
      data-tcp-established={tcpEstablished ? 'true' : 'false'}
      data-tls-status={tlsStatus}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 2,
      }}
    >
      {/* Row 1: TCP 3-Way Handshake Strip (SYN -> SYN-ACK -> ACK) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: '#F7F9FE',
          border: `1.5px solid ${
            tcpEstablished
              ? 'rgba(26, 91, 255, 0.32)'
              : 'rgba(140, 145, 170, 0.22)'
          }`,
          borderRadius: 16,
          padding: '10px 14px',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: STUDIO_COLORS.textPrimary,
            flexShrink: 0,
          }}
        >
          اتصال TCP
        </span>

        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {tcpSteps.map((step, index) => {
            const style = TCP_STEP_STYLE[step.status];
            return (
              <React.Fragment key={step.id}>
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 16,
                    fontWeight: 700,
                    color: style.fg,
                    background: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: 10,
                    padding: '5px 11px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step.label} {step.directionArrow}
                </span>
                {index < tcpSteps.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: monoFont,
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#9BA3BD',
                    }}
                  >
                    -&gt;
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Row 2: TLS 1.3 Encryption & Locked HTTPS Tunnel Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: tlsMeta.bg,
          border: `1.5px solid ${tlsMeta.border}`,
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
              background: tlsMeta.dot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: tlsStatus === 'locked' ? '#0B6E4F' : STUDIO_COLORS.textPrimary,
            }}
          >
            {tlsMeta.persianText}
          </span>
        </div>

        <span
          dir="ltr"
          style={{
            fontFamily: monoFont,
            fontSize: 16,
            fontWeight: 700,
            color: tlsMeta.fg,
            background: '#FFFFFF',
            border: `1px solid ${tlsMeta.border}`,
            borderRadius: 10,
            padding: '5px 11px',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {tlsMeta.codeText}
        </span>
      </div>
    </div>
  );
};
