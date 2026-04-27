import { Button } from '@frontend-showcase/ui';
import type { ChangeEvent } from 'react';
import type { ExcelImportState } from '../model/types';

type ExcelImportPanelProps = {
  state: ExcelImportState;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onCancel: () => void;
};

export function ExcelImportPanel({ state, onFileChange, onUpload, onCancel }: ExcelImportPanelProps) {
  if (state.status === 'closed') return null;

  const selectedFile = state.status === 'idle' || state.status === 'uploading' || state.status === 'error' ? state.file : null;
  const uploading = state.status === 'uploading';
  const uploadDisabled = uploading || !selectedFile;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0] ?? null);
  };

  return (
    <section className="import-panel" aria-labelledby="excel-import-title">
      <div className="details-panel-header">
        <div>
          <h2 id="excel-import-title">Update from Excel</h2>
          <p>Upload a catalog Excel file. The backend owns import parsing and validation.</p>
        </div>
        <Button variant="ghost" onClick={onCancel} disabled={uploading}>
          Close
        </Button>
      </div>

      <div className="file-input-row">
        <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={uploading} />
        <span>{selectedFile ? selectedFile.name : 'No file selected'}</span>
      </div>

      {state.status === 'success' ? (
        <div className="form-success" role="status">
          {state.message}
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="form-alert" role="alert">
          {state.message}
        </div>
      ) : null}

      <div className="drawer-actions">
        <Button variant="secondary" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button variant="primary" loading={uploading} disabled={uploadDisabled} onClick={onUpload}>
          Upload
        </Button>
      </div>
    </section>
  );
}
