// server/services/pdfResultService.js
// Draws the full Nigerian result sheet (Al-Qalam style) using PDFKit — no file writes, returns Base64

import PDFDocument from 'pdfkit';

// ─── Grade helpers ────────────────────────────────────────────────────────────
const getNigerianGrade = (total) => {
  if (total >= 95) return { grade: 'A+', remark: 'EXCEPTIONAL' };
  if (total >= 90) return { grade: 'A',  remark: 'DISTINCTION' };
  if (total >= 85) return { grade: 'A-', remark: 'EXCELLENT' };
  if (total >= 80) return { grade: 'B+', remark: 'VERY GOOD' };
  if (total >= 75) return { grade: 'B',  remark: 'VERY GOOD' };
  if (total >= 70) return { grade: 'B-', remark: 'BELOW STANDARD' };
  if (total >= 60) return { grade: 'C',  remark: 'GOOD' };
  if (total >= 40) return { grade: 'D',  remark: 'AVERAGE' };
  return             { grade: 'F',  remark: 'PASS' };
};

// ─── Layout constants (A4 = 595 x 842 pts) ───────────────────────────────────
const PAGE_W   = 595;
const PAGE_H   = 842;
const MARGIN   = 22;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Drawing primitives ───────────────────────────────────────────────────────

/** Draw a filled + stroked rectangle */
const rect = (doc, x, y, w, h, { fill = null, stroke = '#000', lineWidth = 0.5 } = {}) => {
  doc.save();
  doc.lineWidth(lineWidth);
  if (fill) doc.rect(x, y, w, h).fillAndStroke(fill, stroke);
  else      doc.rect(x, y, w, h).stroke(stroke);
  doc.restore();
};

/** Draw a single horizontal line */
const hline = (doc, x1, x2, y, color = '#000', lw = 0.5) => {
  doc.save().lineWidth(lw).moveTo(x1, y).lineTo(x2, y).stroke(color).restore();
};

/** Draw a single vertical line */
const vline = (doc, x, y1, y2, color = '#000', lw = 0.5) => {
  doc.save().lineWidth(lw).moveTo(x, y1).lineTo(x, y2).stroke(color).restore();
};

/**
 * Draw text clipped inside a box (no overflow).
 * Returns text height used.
 */
const cellText = (doc, text, x, y, w, h, opts = {}) => {
  const {
    fontSize = 7,
    font = 'Helvetica',
    color = '#000',
    align = 'left',
    valign = 'top',
    bold = false,
    padding = 2,
  } = opts;

  doc.save();
  doc.fontSize(fontSize).font(bold ? 'Helvetica-Bold' : font).fillColor(color);
  const tx = x + padding;
  const ty = valign === 'center' ? y + (h - fontSize) / 2 : y + padding;
  const maxW = w - padding * 2;
  doc.text(String(text ?? ''), tx, ty, { width: maxW, align, lineBreak: false, ellipsis: true });
  doc.restore();
};

// ─── Main export ──────────────────────────────────────────────────────────────
export const generateResultPDFBase64 = async (result, school) => {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });

      doc.on('data',  chunk => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ success: true, base64: buf.toString('base64'), size: buf.length });
      });

      // ══════════════════════════════════════════════════════════════════════
      //  Unpack data
      // ══════════════════════════════════════════════════════════════════════
      const student    = result.student   || {};
      const classId    = result.classId   || {};
      const teacher    = result.teacher   || {};
      const subjects   = result.subjects  || [];
      const affective  = result.affectiveTraits || {};
      const attendance = result.attendance || {};
      const comments   = result.comments  || {};

      const totalObtainable = subjects.length * 100;
      const totalObtained   = subjects.reduce((s, sub) => s + (sub.total || 0), 0);
      const percentage      = totalObtainable > 0
        ? ((totalObtained / totalObtainable) * 100).toFixed(1)
        : '0.0';
      const overallGrade    = getNigerianGrade(parseFloat(percentage));

      // ══════════════════════════════════════════════════════════════════════
      //  PAGE BORDER
      // ══════════════════════════════════════════════════════════════════════
      rect(doc, MARGIN, MARGIN, CONTENT_W, PAGE_H - MARGIN * 2, { lineWidth: 1.5 });

      let curY = MARGIN;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 1 — HEADER  (Logo | School info)
      // ══════════════════════════════════════════════════════════════════════
      const HEADER_H = 72;
      const LOGO_W   = 68;
      const INFO_W   = CONTENT_W - LOGO_W - 2;

      // Logo box
      rect(doc, MARGIN, curY, LOGO_W, HEADER_H);
      if (school.logoBase64) {
        try {
          const logoData = school.logoBase64.replace(/^data:image\/\w+;base64,/, '');
          doc.image(Buffer.from(logoData, 'base64'), MARGIN + 4, curY + 4, {
            width: LOGO_W - 8, height: HEADER_H - 8, fit: [LOGO_W - 8, HEADER_H - 8],
          });
        } catch (_) { /* logo decode failed, skip */ }
      } else {
        cellText(doc, 'LOGO', MARGIN, curY + HEADER_H / 2 - 5, LOGO_W, 10,
          { align: 'center', color: '#aaa', fontSize: 8 });
      }

      // School info (centre column)
      const infoX = MARGIN + LOGO_W + 2;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000')
         .text(school.name ? school.name.toUpperCase() : 'SCHOOL NAME',
               infoX, curY + 6, { width: INFO_W, align: 'center', lineBreak: false });

      if (school.motto) {
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#222')
           .text(`Motto: ${school.motto}`, infoX, curY + 22, { width: INFO_W, align: 'center' });
      }

      if (school.address) {
        doc.fontSize(7.5).font('Helvetica').fillColor('#222')
           .text(school.address, infoX, curY + 34, { width: INFO_W, align: 'center' });
      }

      const contactLine = [school.phone && `Tel: ${school.phone}`, school.email && `Email: ${school.email}`]
        .filter(Boolean).join(' | ');
      if (contactLine) {
        doc.fontSize(7).font('Helvetica').fillColor('#333')
           .text(contactLine, infoX, curY + 52, { width: INFO_W, align: 'center' });
      }

      curY += HEADER_H;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 2 — SESSION BANNER
      // ══════════════════════════════════════════════════════════════════════
      const BANNER_H = 14;
      rect(doc, MARGIN, curY, CONTENT_W, BANNER_H, { fill: '#e0e0e0', lineWidth: 0.5 });
      const bannerText = `${result.session || '20__/20__'} — ${(result.term || 'TERM').toUpperCase()} PUPIL'S PERFORMANCE REPORT`;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000')
         .text(bannerText, MARGIN, curY + 3, { width: CONTENT_W, align: 'center' });
      curY += BANNER_H;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 3 — TOP BAND (Personal Data | Attendance | Summary)
      // ══════════════════════════════════════════════════════════════════════
      const BAND_H   = 68;
      const COL1_W   = CONTENT_W * 0.40;
      const COL2_W   = CONTENT_W * 0.30;
      const COL3_W   = CONTENT_W - COL1_W - COL2_W;
      const bandX2   = MARGIN + COL1_W;
      const bandX3   = bandX2 + COL2_W;

      // outer box
      rect(doc, MARGIN, curY, CONTENT_W, BAND_H, { lineWidth: 0.8 });
      // dividers
      vline(doc, bandX2, curY, curY + BAND_H, '#000', 0.8);
      vline(doc, bandX3, curY, curY + BAND_H, '#000', 0.8);

      // — Personal Data —
      const PD_LABEL_H = 12;
      rect(doc, MARGIN, curY, COL1_W, PD_LABEL_H, { fill: '#e0e0e0' });
      cellText(doc, 'PERSONAL DATA', MARGIN, curY + 2, COL1_W, PD_LABEL_H,
        { align: 'center', bold: true, fontSize: 7.5 });

      const pdRows = [
        ['NAME:',       student.name || ''],
        ['ADMIN NO:',   student.admNo || student.regNo || ''],
        ['GENDER:',     student.gender || ''],
        ['CLASS:',      classId.name || student.className || ''],
        ['D.O.B:',      student.dob || ''],
        ['CLUB/SOCIETY:', student.club || ''],
      ];
      let pdY = curY + PD_LABEL_H + 1;
      const ROW_H = (BAND_H - PD_LABEL_H - 2) / pdRows.length;
      pdRows.forEach(([label, val]) => {
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000')
           .text(label, MARGIN + 2, pdY + 1, { width: 52, lineBreak: false });
        doc.fontSize(6.5).font('Helvetica').fillColor('#000')
           .text(val, MARGIN + 56, pdY + 1, { width: COL1_W - 60, lineBreak: false });
        pdY += ROW_H;
      });

      // — Attendance —
      rect(doc, bandX2, curY, COL2_W, PD_LABEL_H, { fill: '#e0e0e0' });
      cellText(doc, 'ATTENDANCE', bandX2, curY + 2, COL2_W, PD_LABEL_H,
        { align: 'center', bold: true, fontSize: 7.5 });

      const attTop = curY + PD_LABEL_H;
      const ATT_COL_W = COL2_W / 3;
      const attLabels = ['No of Times\nSchool Opened', 'No of Times\nPresent', 'No of Times\nAbsent'];
      const attVals   = [attendance.opened || 0, attendance.present || 0, attendance.absent || 0];

      attLabels.forEach((lbl, i) => {
        const ax = bandX2 + i * ATT_COL_W;
        if (i > 0) vline(doc, ax, attTop, attTop + 30, '#aaa', 0.4);
        doc.fontSize(6).font('Helvetica').fillColor('#333')
           .text(lbl, ax + 1, attTop + 2, { width: ATT_COL_W - 2, align: 'center' });
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000')
           .text(String(attVals[i]), ax + 1, attTop + 18, { width: ATT_COL_W - 2, align: 'center' });
      });

      // Terminal duration sub-label
      const tdY = attTop + 32;
      hline(doc, bandX2, bandX2 + COL2_W, tdY, '#999', 0.4);
      rect(doc, bandX2, tdY, COL2_W, 9, { fill: '#efefef' });
      cellText(doc, 'TERMINAL DURATION', bandX2, tdY + 1, COL2_W, 9,
        { align: 'center', bold: true, fontSize: 6.5 });
      const termBegins = result.termBegins
        ? new Date(result.termBegins).toLocaleDateString('en-GB') : '___________';
      const termEnds   = result.termEnds
        ? new Date(result.termEnds).toLocaleDateString('en-GB')   : '___________';
      const halfW = COL2_W / 2;
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
         .text('Term Beginning', bandX2 + 2, tdY + 11, { width: halfW - 4 });
      doc.fontSize(6).font('Helvetica').fillColor('#000')
         .text(termBegins, bandX2 + 2, tdY + 20, { width: halfW - 4 });
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
         .text('Term Ending', bandX2 + halfW + 2, tdY + 11, { width: halfW - 4 });
      doc.fontSize(6).font('Helvetica').fillColor('#000')
         .text(termEnds, bandX2 + halfW + 2, tdY + 20, { width: halfW - 4 });

      // — Performance Summary —
      rect(doc, bandX3, curY, COL3_W, PD_LABEL_H, { fill: '#e0e0e0' });
      cellText(doc, 'PERFORMANCE SUMMARY', bandX3, curY + 2, COL3_W, PD_LABEL_H,
        { align: 'center', bold: true, fontSize: 7.5 });

      const summaryRows = [
        ['Total Score Obtainable', String(totalObtainable)],
        ['Total Score Obtained',   String(totalObtained)],
        ['%TAGE',                  `${percentage}%`],
        ['GRADE',                  overallGrade.grade],
        ['POSITION',               result.overallPosition
          ? `${result.overallPosition}${['th','st','nd','rd'][(result.overallPosition % 10 < 4 && result.overallPosition % 100 > 14) ? 0 : result.overallPosition % 10] || 'th'}`
          : '—'],
        ['CLASS SIZE',             String(result.classSize || '—')],
      ];
      let sumY = curY + PD_LABEL_H + 1;
      const SUM_ROW = (BAND_H - PD_LABEL_H - 2) / summaryRows.length;
      summaryRows.forEach(([label, val]) => {
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000')
           .text(label, bandX3 + 2, sumY + 1, { width: COL3_W * 0.65 - 4, lineBreak: false });
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000')
           .text(val, bandX3 + COL3_W * 0.65, sumY + 1, { width: COL3_W * 0.35 - 4, lineBreak: false });
        sumY += SUM_ROW;
      });

      curY += BAND_H;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 4 — COGNITIVE DOMAIN (Scores Table)
      // ══════════════════════════════════════════════════════════════════════

      // "COGNITIVE DOMAIN" header bar
      const CDH_H = 11;
      rect(doc, MARGIN, curY, CONTENT_W, CDH_H, { fill: '#d0d0d0', lineWidth: 0.8 });
      cellText(doc, 'COGNITIVE DOMAIN', MARGIN, curY + 2, CONTENT_W, CDH_H,
        { align: 'center', bold: true, fontSize: 8 });
      curY += CDH_H;

      // Column widths (must sum to CONTENT_W)
      const COLS = [
        { label: 'SUBJECTS',         w: 100, sub: '',      key: 'subject',       align: 'left'   },
        { label: 'C.A.',             w: 26,  sub: '40',    key: 'ca',            align: 'center' },
        { label: 'EXAM',             w: 28,  sub: '60',    key: 'exam',          align: 'center' },
        { label: '3RD TERM',         w: 32,  sub: '100',   key: 'total',         align: 'center' },
        { label: '2ND TERM',         w: 32,  sub: '100',   key: 'term2Total',    align: 'center' },
        { label: '1ST TERM',         w: 32,  sub: '100',   key: 'term1Total',    align: 'center' },
        { label: 'SESSION\nAVERAGE', w: 36,  sub: '100',   key: 'sessionAverage',align: 'center' },
        { label: 'ANNUAL',           w: 28,  sub: '',      key: 'annual',        align: 'center' },
        { label: 'CLASS\nPOSIT.',    w: 32,  sub: '',      key: 'classPosition', align: 'center' },
        { label: 'CLASS\nAVG',       w: 30,  sub: '',      key: 'classAverage',  align: 'center' },
        { label: 'GRADE',            w: 28,  sub: '',      key: 'grade',         align: 'center' },
        { label: 'REMARKS',          w: 47,  sub: '',      key: 'remark',        align: 'center' },
      ];

      // Adjust last col so total = CONTENT_W exactly
      const fixedW = COLS.reduce((s, c) => s + c.w, 0);
      COLS[COLS.length - 1].w += CONTENT_W - fixedW;

      // Table header rows (two rows: labels + sub-labels)
      const TH1_H = 14;
      const TH2_H = 10;

      let colX = MARGIN;
      COLS.forEach((col, i) => {
        rect(doc, colX, curY, col.w, TH1_H + TH2_H, { fill: '#e8e8e8', lineWidth: 0.5 });
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
           .text(col.label, colX + 1, curY + 2, { width: col.w - 2, align: 'center' });
        if (col.sub) {
          doc.fontSize(6).font('Helvetica').fillColor('#555')
             .text(col.sub, colX + 1, curY + TH1_H + 2, { width: col.w - 2, align: 'center' });
        }
        colX += col.w;
      });
      hline(doc, MARGIN, MARGIN + CONTENT_W, curY + TH1_H, '#888', 0.4);
      curY += TH1_H + TH2_H;

      // Data rows
      const ROW_DATA_H = 12;
      subjects.forEach((subj, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
        const g  = getNigerianGrade(subj.total || 0);

        // background
        rect(doc, MARGIN, curY, CONTENT_W, ROW_DATA_H, { fill: bg, lineWidth: 0 });
        hline(doc, MARGIN, MARGIN + CONTENT_W, curY + ROW_DATA_H, '#ccc', 0.3);

        colX = MARGIN;
        COLS.forEach(col => {
          vline(doc, colX, curY, curY + ROW_DATA_H, '#ccc', 0.3);
          let val = '';
          switch (col.key) {
            case 'subject':       val = (subj.subject || '').toUpperCase(); break;
            case 'ca':            val = subj.ca ?? subj.ca1 ?? ''; break;
            case 'exam':          val = subj.exam ?? ''; break;
            case 'total':         val = subj.total ?? ''; break;
            case 'term2Total':    val = subj.term2Total ?? ''; break;
            case 'term1Total':    val = subj.term1Total ?? ''; break;
            case 'sessionAverage':val = subj.sessionAverage ?? ''; break;
            case 'annual':        val = subj.annual ?? ''; break;
            case 'classPosition': val = subj.classPosition ?? ''; break;
            case 'classAverage':  val = subj.classAverage ?? ''; break;
            case 'grade':         val = g.grade; break;
            case 'remark':        val = g.remark; break;
          }
          const isBold = ['total', 'grade'].includes(col.key);
          doc.fontSize(6.5)
             .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
             .fillColor('#000')
             .text(String(val), colX + 1, curY + 3, {
               width: col.w - 2, align: col.align, lineBreak: false, ellipsis: true,
             });
          colX += col.w;
        });
        vline(doc, MARGIN + CONTENT_W, curY, curY + ROW_DATA_H, '#ccc', 0.3);
        curY += ROW_DATA_H;
      });

      // Bottom border of table
      hline(doc, MARGIN, MARGIN + CONTENT_W, curY, '#000', 0.8);

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 5 — AFFECTIVE + PSYCHOMOTOR domains  (side by side)
      // ══════════════════════════════════════════════════════════════════════

      const DOMAIN_COL_W = CONTENT_W / 2 - 1;
      const affX  = MARGIN;
      const psyX  = MARGIN + DOMAIN_COL_W + 2;

      const affectiveSkills = [
        ['Attentiveness',           'attentiveness'],
        ['Honesty',                 'honesty'],
        ['Neatness',                'neatness'],
        ['Politeness',              'politeness'],
        ['Punctuality/ Assembly',   'punctuality'],
        ['Self Control/ Calmness',  'selfControl'],
        ['Obedience',               'obedience'],
        ['Reliability',             'reliability'],
        ['Sense of Responsibility', 'responsibility'],
        ['Relationship With Others','relationship'],
      ];

      const psychomotorSkills = [
        ['Handling Of Tools',  'handlingOfTools'],
        ['Drawing/ Painting',  'drawingPainting'],
        ['Handwriting',        'handwriting'],
        ['Public Speaking',    'publicSpeaking'],
        ['Speech Fluency',     'speechFluency'],
        ['Sports & Games',     'sportsGames'],
      ];

      const SCALE_COLS = [5, 4, 3, 2, 1];
      const SCALE_W    = 13; // width per scale column
      const TRAIT_W    = DOMAIN_COL_W - SCALE_COLS.length * SCALE_W;
      const D_LABEL_H  = 10;
      const D_HEADER_H = 10;
      const D_ROW_H    = 10;

      const drawDomain = (title, skills, startX, startY) => {
        // Title bar
        rect(doc, startX, startY, DOMAIN_COL_W, D_LABEL_H, { fill: '#d8d8d8', lineWidth: 0.5 });
        cellText(doc, title, startX, startY + 2, DOMAIN_COL_W, D_LABEL_H,
          { align: 'center', bold: true, fontSize: 7 });
        let dy = startY + D_LABEL_H;

        // Scale header row
        rect(doc, startX, dy, DOMAIN_COL_W, D_HEADER_H, { fill: '#ececec', lineWidth: 0.3 });
        cellText(doc, 'Traits', startX + 1, dy + 2, TRAIT_W - 2, D_HEADER_H,
          { bold: true, fontSize: 6.5 });
        SCALE_COLS.forEach((n, i) => {
          const sx = startX + TRAIT_W + i * SCALE_W;
          vline(doc, sx, dy, dy + D_HEADER_H, '#aaa', 0.3);
          cellText(doc, String(n), sx, dy + 2, SCALE_W, D_HEADER_H,
            { align: 'center', bold: true, fontSize: 6.5 });
        });
        hline(doc, startX, startX + DOMAIN_COL_W, dy + D_HEADER_H, '#888', 0.4);
        dy += D_HEADER_H;

        // Trait rows
        skills.forEach(([label, key], idx) => {
          const bg = idx % 2 === 0 ? '#fff' : '#f7f7f7';
          rect(doc, startX, dy, DOMAIN_COL_W, D_ROW_H, { fill: bg, lineWidth: 0 });
          hline(doc, startX, startX + DOMAIN_COL_W, dy + D_ROW_H, '#e0e0e0', 0.3);

          cellText(doc, label, startX + 2, dy + 2, TRAIT_W - 4, D_ROW_H,
            { fontSize: 6.5 });

          const val = affective[key] || 0;
          SCALE_COLS.forEach((n, i) => {
            const sx = startX + TRAIT_W + i * SCALE_W;
            vline(doc, sx, dy, dy + D_ROW_H, '#ddd', 0.3);
            if (val === n) {
              doc.fontSize(8).font('Helvetica-Bold').fillColor('#000')
                 .text('✓', sx, dy + 1, { width: SCALE_W, align: 'center', lineBreak: false });
            }
          });
          dy += D_ROW_H;
        });

        // outer border
        rect(doc, startX, startY, DOMAIN_COL_W, dy - startY, { lineWidth: 0.8 });

        return dy; // return ending Y
      };

      const domainStartY = curY + 3;
      const affEndY  = drawDomain('AFFECTIVE DOMAIN',     affectiveSkills,  affX, domainStartY);
      const psyEndY  = drawDomain('PSYCHOMOTOR - SKILL',  psychomotorSkills, psyX, domainStartY);

      // Grade Scale (below Psychomotor, right column)
      const GRADE_SCALE = [
        ['A+', '95-100%',  'EXCEPTIONAL'],
        ['A',  '90-94.9%', 'DISTINCTION'],
        ['A-', '85-89.9%', 'EXCELLENT'],
        ['B+', '80-84.9%', 'VERY GOOD'],
        ['B',  '75-79.9%', 'VERY GOOD'],
        ['B-', '70-74.9%', 'BELOW STANDARD'],
        ['C',  '60-69.9%', 'GOOD'],
        ['D',  '40-59.9%', 'AVERAGE'],
        ['F',  '0-39.9%',  'PASS'],
      ];
      const GS_ROW_H  = 9;
      const GS_TOTAL  = GS_ROW_H * GRADE_SCALE.length + 12;
      const gsY       = psyEndY + 3;

      rect(doc, psyX, gsY, DOMAIN_COL_W, GS_TOTAL, { fill: '#fafafa', lineWidth: 0.8 });
      rect(doc, psyX, gsY, DOMAIN_COL_W, 11, { fill: '#d8d8d8', lineWidth: 0 });
      cellText(doc, 'Grade Scale', psyX, gsY + 2, DOMAIN_COL_W, 11,
        { align: 'center', bold: true, fontSize: 7.5 });

      GRADE_SCALE.forEach(([grade, range, desc], i) => {
        const gy  = gsY + 11 + i * GS_ROW_H;
        const gbg = i % 2 === 0 ? '#fff' : '#f0f0f0';
        rect(doc, psyX, gy, DOMAIN_COL_W, GS_ROW_H, { fill: gbg, lineWidth: 0 });
        hline(doc, psyX, psyX + DOMAIN_COL_W, gy + GS_ROW_H, '#ddd', 0.3);
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000')
           .text(grade, psyX + 3, gy + 2, { width: 14, lineBreak: false });
        doc.fontSize(6.5).font('Helvetica').fillColor('#000')
           .text(range, psyX + 18, gy + 2, { width: 44, lineBreak: false });
        doc.fontSize(6.5).font('Helvetica').fillColor('#444')
           .text(desc, psyX + 63, gy + 2, { width: DOMAIN_COL_W - 66, lineBreak: false });
      });

      const gsEndY = gsY + GS_TOTAL;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 6 — COMMENTS  (Teacher | Head)
      // ══════════════════════════════════════════════════════════════════════
      const bottomY  = Math.max(affEndY, gsEndY) + 4;
      const COMM_H   = 52;
      const COMM_COL = CONTENT_W / 2;

      // Teacher comment
      rect(doc, MARGIN, bottomY, COMM_COL, COMM_H, { lineWidth: 0.8 });
      rect(doc, MARGIN, bottomY, COMM_COL, 10, { fill: '#e8e8e8' });
      cellText(doc, "Class Teacher's Remark", MARGIN, bottomY + 2, COMM_COL, 10,
        { bold: true, fontSize: 7, padding: 3 });

      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#111')
         .text(comments.teacher || '', MARGIN + 3, bottomY + 13,
           { width: COMM_COL - 6, height: 20 });

      hline(doc, MARGIN + 3, MARGIN + COMM_COL - 3, bottomY + COMM_H - 18, '#aaa', 0.5);
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333')
         .text('Name:', MARGIN + 3, bottomY + COMM_H - 16, { width: 25, lineBreak: false });
      doc.fontSize(6).font('Helvetica').fillColor('#111')
         .text(teacher.name || '', MARGIN + 28, bottomY + COMM_H - 16, { width: COMM_COL - 32, lineBreak: false });
      hline(doc, MARGIN + 3, MARGIN + COMM_COL - 3, bottomY + COMM_H - 6, '#aaa', 0.5);
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333')
         .text('Name/Sign:', MARGIN + 3, bottomY + COMM_H - 4, { width: 40, lineBreak: false });

      // Principal / Head Teacher comment
      const headX = MARGIN + COMM_COL;
      rect(doc, headX, bottomY, COMM_COL, COMM_H, { lineWidth: 0.8 });
      rect(doc, headX, bottomY, COMM_COL, 10, { fill: '#e8e8e8' });
      cellText(doc, "Head Teacher's Remark", headX, bottomY + 2, COMM_COL, 10,
        { bold: true, fontSize: 7, padding: 3 });

      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#111')
         .text(comments.principal || '', headX + 3, bottomY + 13,
           { width: COMM_COL - 6, height: 20 });

      hline(doc, headX + 3, headX + COMM_COL - 3, bottomY + COMM_H - 18, '#aaa', 0.5);
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333')
         .text('Name:', headX + 3, bottomY + COMM_H - 16, { width: 25, lineBreak: false });
      hline(doc, headX + 3, headX + COMM_COL - 3, bottomY + COMM_H - 6, '#aaa', 0.5);
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#333')
         .text('Name/Sign:', headX + 3, bottomY + COMM_H - 4, { width: 40, lineBreak: false });

      const afterComments = bottomY + COMM_H + 4;

      // ══════════════════════════════════════════════════════════════════════
      //  SECTION 7 — STATUS + RATING INDICES (footer)
      // ══════════════════════════════════════════════════════════════════════
      const FOOTER_H = 36;
      const STATUS_W = CONTENT_W * 0.45;
      const RATING_W = CONTENT_W - STATUS_W;

      // Status (left)
      rect(doc, MARGIN, afterComments, STATUS_W, FOOTER_H, { lineWidth: 0.5 });
      const promoted = (result.overallAverage || 0) >= 40;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000')
         .text('Status:', MARGIN + 4, afterComments + 4);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(promoted ? '#006600' : '#cc0000')
         .text(promoted ? 'PROMOTED' : 'REPEATED', MARGIN + 36, afterComments + 2);

      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
         .text('Next Session Begins:', MARGIN + 4, afterComments + 18);
      const nextTerm = result.nextTermResumption
        ? new Date(result.nextTermResumption).toLocaleDateString('en-GB') : '_______________';
      doc.fontSize(7).font('Helvetica').fillColor('#000')
         .text(nextTerm, MARGIN + 90, afterComments + 18);

      // Rating Indices (right)
      const ratingX = MARGIN + STATUS_W;
      rect(doc, ratingX, afterComments, RATING_W, FOOTER_H, { fill: '#fafafa', lineWidth: 0.5 });
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
         .text('Rating Indices', ratingX + 4, afterComments + 2);
      const indices = [
        '5 - Maintains an Excellent degree of Observable (Obs) traits',
        '4 - Maintains a High level of Obs traits',
        '3 - Acceptable level of Obs traits',
        '2 - Shows Minimal regard for Obs traits',
        '1 - Has No regard for Observable traits',
      ];
      indices.forEach((line, i) => {
        doc.fontSize(5.8).font('Helvetica').fillColor('#222')
           .text(line, ratingX + 4, afterComments + 12 + i * 5, {
             width: RATING_W - 8, lineBreak: false,
           });
      });

      // ══════════════════════════════════════════════════════════════════════
      //  FINALIZE
      // ══════════════════════════════════════════════════════════════════════
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};