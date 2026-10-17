import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const item = await db.getItemById(id);

  const name = item ? item.name : 'وقاية G6PD';
  const category = item?.category === 'medication' ? '💊 دواء وصيدلية' : '🍔 أكلات وسناكس';
  const hPercent = item?.hemolysis_percent ?? 0;
  const sPercent = item?.safe_percent ?? 0;
  const total = item?.total_votes ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F8F9FE',
          padding: '48px 60px',
          fontFamily: 'sans-serif',
          direction: 'rtl',
        }}
      >
        {/* Header with Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#5E72E4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
            >
              🛡️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: '900', color: '#5E72E4' }}>
                Weqaya G6PD
              </span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#32325D' }}>
                وقاية انيميا الفول — دليل الأمان الميداني
              </span>
            </div>
          </div>
          <span
            style={{
              padding: '8px 24px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #8898AA',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#32325D',
            }}
          >
            {category}
          </span>
        </div>

        {/* Center: Item Name & Large Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '44px', fontWeight: '900', color: '#32325D', lineHeight: 1.2 }}>
            {name}
          </span>

          {/* Numbers comparison */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#F5365C' }}>
                ⚠️ نسبة التكسير
              </span>
              <span style={{ fontSize: '56px', fontWeight: '900', color: '#F5365C' }}>
                {hPercent}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#525F7F' }}>
                إجمالي المشاركات
              </span>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#32325D' }}>
                {total} صوت مجتمعي
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#139E69' }}>
                آمن مع المصوتين ✅
              </span>
              <span style={{ fontSize: '56px', fontWeight: '900', color: '#139E69' }}>
                {sPercent}%
              </span>
            </div>
          </div>

          {/* 60px Split Bar */}
          <div
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: '#E5E9F2',
            }}
          >
            <div style={{ width: `${hPercent}%`, backgroundColor: '#F5365C', height: '100%' }} />
            <div style={{ width: `${sPercent}%`, backgroundColor: '#2DCE89', height: '100%' }} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid rgba(136, 152, 170, 0.2)',
            paddingTop: '20px',
            fontSize: '18px',
            color: '#525F7F',
            fontWeight: 'bold',
          }}
        >
          <span>تجارب مجتمعية استرشادية — شارك وصوت الآن</span>
          <span style={{ color: '#5E72E4' }}>weqaya.org</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
