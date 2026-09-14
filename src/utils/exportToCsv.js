/**
 * Utility to export an array of records or headers/rows to a downloadable CSV file.
 * @param {string} filename - The filename without extension.
 * @param {Array<string>} headers - Column header names.
 * @param {Array<Array<any>>} rows - 2D array of row cell values.
 */
export const exportToCsv = (filename, headers, rows) => {
  if (!rows || !rows.length) {
    throw new Error('No data available to export');
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCsv;
