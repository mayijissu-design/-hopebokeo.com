/**
 * Fast direct binary file uploader
 * Directly streams the file as multipart/form-data to /api/upload-file,
 * returning a lightweight URL (e.g. /uploads/filename.pdf).
 * Bypasses memory-heavy base64 conversions in JavaScript.
 */

export interface UploadResult {
  success: boolean;
  url: string;
  fileName: string;
  size?: number;
}

export async function uploadFileDirectly(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-file', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Upload failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.message) errMsg = errJson.message;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (!data.success || !data.url) {
    throw new Error(data.message || 'File upload failed on server');
  }

  return {
    success: true,
    url: data.url,
    fileName: data.fileName || file.name,
    size: data.size || file.size,
  };
}
