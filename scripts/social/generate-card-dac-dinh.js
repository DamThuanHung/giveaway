#!/usr/bin/env node
/**
 * Card riêng cho caption quảng bá /dac-dinh — KHÔNG dùng chung template marketplace
 * của generate-card.js vì template đó cắt hook theo bullet USP kiểu "mua/bán đồ cũ"
 * và footer cứng "Mua • Bán • Cho tặng" — sai hoàn toàn ngữ cảnh ôn thi Đặc định.
 * (Phát hiện 2026-07-18 khi user kiểm tra ảnh đã đăng thấy tiêu đề cắt cụt giữa từ
 * + footer lạc đề — xem feedback trong memory project_dac_dinh_marketing_campaign.)
 *
 * Nhận diện caption /dac-dinh: có chứa link "traotay.com.vn/dac-dinh".
 */

const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const { getFonts, SLOGAN } = require('./generate-card');
const { getMinioClient, BUCKET, PUBLIC_URL } = require('./generate-video');

const SIZE = 1080;
const BADGE = 'ĐẶC ĐỊNH KỸ NĂNG SỐ 2 — NGÀNH NHÀ HÀNG';

function isDacDinhCaption(captionText) {
  return captionText.includes('traotay.com.vn/dac-dinh');
}

// Lấy đoạn mở đầu (trước dòng trống đầu tiên), bỏ phần chào hỏi + emoji 👋,
// giữ lại đúng câu vấn đề/hook thật — cắt ở ranh giới câu (dấu . ! ? hoặc —),
// không cắt cụt giữa từ như extractHook() của generate-card.js.
function extractHeadline(captionText) {
  const firstPara = captionText.split('\n\n')[0].replace(/\n/g, ' ').trim();
  const afterWave = firstPara.split('👋').pop().trim();
  const raw = afterWave || firstPara;

  const max = 130;
  if (raw.length <= max) return raw;
  const slice = raw.slice(0, max);
  const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('— '), slice.lastIndexOf(', '));
  if (lastBreak > 40) return slice.slice(0, lastBreak).trim();
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim() + '…';
}

function cardTemplate(headline) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        width: `${SIZE}px`, height: `${SIZE}px`, padding: '80px 90px',
        background: '#FFFBF5', fontFamily: 'Be Vietnam Pro, Noto Sans JP',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '16px' },
            children: [
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '9999px', background: '#10B981', fontSize: '32px' }, children: 'TT' } },
              { type: 'div', props: { style: { fontSize: '34px', fontWeight: 700, color: '#047857' }, children: 'Trao Tay' } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '22px' },
            children: [
              { type: 'div', props: { style: { fontSize: '26px', fontWeight: 700, color: '#059669', letterSpacing: '1px' }, children: BADGE } },
              { type: 'div', props: { style: { fontSize: '52px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.32 }, children: headline } },
              { type: 'div', props: { style: { fontSize: '28px', fontWeight: 400, fontStyle: 'italic', color: '#059669', marginTop: '8px' }, children: `"${SLOGAN}"` } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #FFF3E0', paddingTop: '28px' },
            children: [
              { type: 'div', props: { style: { fontSize: '24px', color: '#7A7A92' }, children: 'traotay.com.vn/dac-dinh' } },
              { type: 'div', props: { style: { fontSize: '22px', color: '#7A7A92' }, children: 'Ôn thi miễn phí' } },
            ],
          },
        },
      ],
    },
  };
}

async function renderDacDinhCardPng(headline) {
  const fonts = await getFonts();
  const svg = await satori(cardTemplate(headline), { width: SIZE, height: SIZE, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
}

// Card riêng cho "Câu hỏi ôn thi hôm nay" — hiện câu hỏi (JA+VI) VÀ 4 đáp án
// A/B/C/D ngay trên ảnh, đáp án đúng được đánh dấu (viền/nền xanh + dấu ✓) vì
// đa số người xem trên FB/IG chỉ lướt ảnh, không đọc hết caption bên dưới —
// nếu ảnh không có lựa chọn thì mất tác dụng để người đọc "chọn" ngay tại chỗ.
// Phần giải thích (💡) và trích dẫn nguồn vẫn chỉ nằm trong caption.
function optionRow({ letter, text }, isCorrect) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 16px', borderRadius: '14px',
        background: isCorrect ? '#D1FAE5' : '#FFFFFF',
        border: isCorrect ? '2px solid #10B981' : '2px solid #F0E6D6',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              width: '34px', height: '34px', borderRadius: '9999px',
              background: isCorrect ? '#10B981' : '#F3F0E8',
              color: isCorrect ? '#FFFFFF' : '#7A7A92',
              fontSize: '19px', fontWeight: 700,
            },
            children: isCorrect ? '✓' : letter,
          },
        },
        { type: 'div', props: { style: { fontSize: '21px', fontWeight: isCorrect ? 700 : 400, color: isCorrect ? '#047857' : '#1A1A2E', lineHeight: 1.3 }, children: text } },
      ],
    },
  };
}

function questionCardTemplate({ chapterTitleVi, questionJa, questionVi, options, correctLetter }) {
  const badgeLabel = `CÂU HỎI ÔN THI HÔM NAY — ${chapterTitleVi.toUpperCase()}`;
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column',
        width: `${SIZE}px`, height: `${SIZE}px`, padding: '64px 90px',
        background: '#FFFBF5', fontFamily: 'Be Vietnam Pro, Noto Sans JP',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '16px' },
            children: [
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '9999px', background: '#10B981', fontSize: '28px' }, children: 'TT' } },
              { type: 'div', props: { style: { fontSize: '30px', fontWeight: 700, color: '#047857' }, children: 'Trao Tay' } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', flex: 1 },
            children: [
              { type: 'div', props: { style: { fontSize: '21px', fontWeight: 700, color: '#059669', letterSpacing: '1px' }, children: badgeLabel } },
              { type: 'div', props: { style: { fontSize: '30px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.32 }, children: questionJa } },
              { type: 'div', props: { style: { fontSize: '23px', fontWeight: 400, color: '#4B5563', lineHeight: 1.35, marginBottom: '4px' }, children: questionVi } },
              ...options.map(o => optionRow(o, o.letter === correctLetter)),
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #FFF3E0', paddingTop: '22px', marginTop: '18px' },
            children: [
              { type: 'div', props: { style: { fontSize: '22px', color: '#7A7A92' }, children: 'traotay.com.vn/dac-dinh' } },
              { type: 'div', props: { style: { fontSize: '20px', color: '#7A7A92' }, children: 'Giải thích trong caption' } },
            ],
          },
        },
      ],
    },
  };
}

async function renderQuestionCardPng({ chapterTitleVi, questionJa, questionVi, options, correctLetter }) {
  const fonts = await getFonts();
  const svg = await satori(questionCardTemplate({ chapterTitleVi, questionJa, questionVi, options, correctLetter }), { width: SIZE, height: SIZE, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
}

// Nhận diện caption "Câu hỏi ôn thi hôm nay" — có dòng đánh dấu riêng, khác caption
// quảng bá thường (không có JA/VI câu hỏi để render).
function isQuestionCaption(captionText) {
  return captionText.includes('CÂU HỎI ÔN THI HÔM NAY');
}

// Trích các trường cần cho card trực tiếp từ caption (không cần file dữ liệu riêng) —
// caption LUÔN phải chứa các dòng đánh dấu này (xem gen-question-captions.js): badge,
// 📝/🇻🇳, 4 dòng "A. "…"D. ", và dòng "✅ Đáp án đúng: <letter>. ...".
function parseQuestionCaption(captionText) {
  const lines = captionText.split('\n');
  const badgeLine = lines.find(l => l.startsWith('CÂU HỎI ÔN THI HÔM NAY'));
  const jaLine = lines.find(l => l.startsWith('📝 '));
  const viLine = lines.find(l => l.startsWith('🇻🇳 '));
  const optionLines = lines.filter(l => /^[A-D]\. /.test(l));
  const correctLine = lines.find(l => l.startsWith('✅ Đáp án đúng: '));
  const chapterTitleVi = badgeLine ? badgeLine.replace('CÂU HỎI ÔN THI HÔM NAY — ', '').trim() : 'Ôn thi Đặc định số 2';
  return {
    chapterTitleVi,
    questionJa: jaLine ? jaLine.replace('📝 ', '').trim() : '',
    questionVi: viLine ? viLine.replace('🇻🇳 ', '').trim() : '',
    options: optionLines.map(l => ({ letter: l.charAt(0), text: l.slice(3).trim() })),
    correctLetter: correctLine ? correctLine.replace('✅ Đáp án đúng: ', '').trim().charAt(0) : '',
  };
}

async function getOrCreateQuestionCardUrl(file, captionText) {
  const key = `social-cards/dac-dinh/${path.basename(file, '.txt')}.png`;
  const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
  const client = getMinioClient();
  try {
    await client.statObject(BUCKET, key);
    return url;
  } catch {
    // chưa có, render mới
  }
  const png = await renderQuestionCardPng(parseQuestionCaption(captionText));
  await client.putObject(BUCKET, key, png, png.length, { 'Content-Type': 'image/png' });
  return url;
}

async function getOrCreateDacDinhCardUrl(file, captionText) {
  const key = `social-cards/dac-dinh/${path.basename(file, '.txt')}.png`;
  const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
  const client = getMinioClient();
  try {
    await client.statObject(BUCKET, key);
    return url;
  } catch {
    // chưa có, render mới
  }
  const headline = extractHeadline(captionText);
  const png = await renderDacDinhCardPng(headline);
  await client.putObject(BUCKET, key, png, png.length, { 'Content-Type': 'image/png' });
  return url;
}

module.exports = { isDacDinhCaption, extractHeadline, renderDacDinhCardPng, getOrCreateDacDinhCardUrl, isQuestionCaption, parseQuestionCaption, renderQuestionCardPng, getOrCreateQuestionCardUrl };
