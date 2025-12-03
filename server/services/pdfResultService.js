// server/services/pdfResultService.js - NEW FILE

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a PDF result for a student
 */
export const generateResultPDF = async (result, school) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/results');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `result_${result.student.regNo}_${result.term.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe to file
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header - School Info
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(school.name.toUpperCase(), { align: 'center' });
      
      if (school.address) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(school.address, { align: 'center' });
      }
      
      if (school.phone) {
        doc.text(`Tel: ${school.phone}`, { align: 'center' });
      }

      doc.moveDown();
      
      // Result Title
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(`${result.term} RESULT - ${result.session}`, { align: 'center' });
      
      doc.moveDown(1.5);

      // Student Information Box
      const startY = doc.y;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('STUDENT INFORMATION', 50, startY);
      
      doc.moveDown(0.5);
      const infoStartY = doc.y;

      // Left column
      doc.font('Helvetica-Bold').text('Name:', 50, infoStartY);
      doc.font('Helvetica').text(result.student.name, 150, infoStartY);

      doc.font('Helvetica-Bold').text('Reg No:', 50, infoStartY + 20);
      doc.font('Helvetica').text(result.student.regNo, 150, infoStartY + 20);

      doc.font('Helvetica-Bold').text('Class:', 50, infoStartY + 40);
      doc.font('Helvetica').text(result.classId.name, 150, infoStartY + 40);

      // Right column
      if (result.attendance) {
        doc.font('Helvetica-Bold').text('Attendance:', 320, infoStartY);
        doc.font('Helvetica').text(
          `${result.attendance.daysPresent || 0}/${result.attendance.totalDays || 0} days`,
          420, infoStartY
        );
      }

      doc.font('Helvetica-Bold').text('Position:', 320, infoStartY + 20);
      doc.font('Helvetica').text(result.overallPosition || 'N/A', 420, infoStartY + 20);

      doc.moveDown(3);

      // Subject Results Table
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('SUBJECT PERFORMANCE', 50);
      
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 280;
      const col4 = 340;
      const col5 = 400;
      const col6 = 460;
      const col7 = 510;

      doc.fontSize(9)
         .font('Helvetica-Bold');
      
      doc.text('SUBJECT', col1, tableTop);
      doc.text('CA1', col2, tableTop);
      doc.text('CA2', col3, tableTop);
      doc.text('EXAM', col4, tableTop);
      doc.text('TOTAL', col5, tableTop);
      doc.text('GRADE', col6, tableTop);
      doc.text('REMARK', col7, tableTop);

      // Draw line under header
      doc.moveTo(col1, tableTop + 15)
         .lineTo(560, tableTop + 15)
         .stroke();

      // Table rows
      let rowY = tableTop + 25;
      doc.font('Helvetica');

      result.subjects.forEach((subject, index) => {
        // Add new page if needed
        if (rowY > 700) {
          doc.addPage();
          rowY = 50;
        }

        const total = (subject.ca1 || 0) + (subject.ca2 || 0) + (subject.exam || 0);
        
        doc.text(subject.subject, col1, rowY, { width: 140 });
        doc.text((subject.ca1 || 0).toString(), col2, rowY);
        doc.text((subject.ca2 || 0).toString(), col3, rowY);
        doc.text((subject.exam || 0).toString(), col4, rowY);
        doc.text(total.toString(), col5, rowY);
        doc.text(subject.grade || 'N/A', col6, rowY);
        doc.text(subject.remark || '-', col7, rowY, { width: 50 });

        rowY += 20;
      });

      // Draw line after subjects
      doc.moveTo(col1, rowY)
         .lineTo(560, rowY)
         .stroke();

      rowY += 10;

      // Overall Summary
      doc.fontSize(10)
         .font('Helvetica-Bold');
      
      doc.text('TOTAL SCORE:', col1, rowY);
      doc.text(`${result.overallTotal}/${result.subjects.length * 100}`, col5, rowY);

      rowY += 20;
      doc.text('AVERAGE:', col1, rowY);
      doc.text(`${result.overallAverage}%`, col5, rowY);

      rowY += 20;
      doc.text('GRADE:', col1, rowY);
      doc.text(result.overallGrade, col5, rowY);

      rowY += 30;

      // Affective Traits (if available)
      if (result.affectiveTraits && result.affectiveTraits.length > 0) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('AFFECTIVE TRAITS', col1, rowY);
        
        rowY += 20;
        doc.fontSize(9);

        result.affectiveTraits.forEach(trait => {
          doc.font('Helvetica-Bold').text(`${trait.trait}:`, col1, rowY);
          doc.font('Helvetica').text(trait.rating || 'N/A', 280, rowY);
          rowY += 15;
        });

        rowY += 10;
      }

      // Comments Section
      if (result.comments?.teacher || result.comments?.principal) {
        // Add new page if needed
        if (rowY > 650) {
          doc.addPage();
          rowY = 50;
        }

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('COMMENTS', col1, rowY);
        
        rowY += 20;

        if (result.comments.teacher) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .text("Class Teacher's Comment:", col1, rowY);
          rowY += 15;
          doc.font('Helvetica')
             .text(result.comments.teacher, col1, rowY, { width: 500 });
          rowY += 30;
        }

        if (result.comments.principal) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .text("Principal's Comment:", col1, rowY);
          rowY += 15;
          doc.font('Helvetica')
             .text(result.comments.principal, col1, rowY, { width: 500 });
          rowY += 30;
        }
      }

      // Signatures
      rowY += 20;
      if (rowY > 700) {
        doc.addPage();
        rowY = 50;
      }

      doc.fontSize(9)
         .font('Helvetica');
      
      doc.text('_____________________', 50, rowY);
      doc.text('_____________________', 350, rowY);
      
      rowY += 15;
      doc.text("Class Teacher's Signature", 50, rowY);
      doc.text("Principal's Signature", 350, rowY);

      // Footer
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .text(
           `Generated on ${new Date().toLocaleDateString('en-GB')}`,
           50,
           750,
           { align: 'center' }
         );

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          filename,
          filepath,
          url: `/uploads/results/${filename}` // URL path for download
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateResultPDF
};