export function isExcelFileNameAllowed(fileName: string): boolean {
  const normalized = fileName.toLowerCase();
  return normalized.endsWith('.xlsx') || normalized.endsWith('.xls');
}

export function getExcelFileError(file: File | null): string | null {
  if (!file) return 'Choose an Excel file first.';
  if (!isExcelFileNameAllowed(file.name)) return 'Use an .xlsx or .xls file.';
  return null;
}
