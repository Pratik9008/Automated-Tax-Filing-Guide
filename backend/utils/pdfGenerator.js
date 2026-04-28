function generatePDFReport(userId) {
  return {
    userId,
    message: 'PDF generation is handled in the browser with jsPDF.'
  };
}

module.exports = { generatePDFReport };
