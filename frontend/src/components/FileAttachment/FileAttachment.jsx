import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import styles from './FileAttachment.module.css';
import { uploadFile, fetchFileBlob, downloadFileBlob } from '../../services/filesApi';
import Modal from '../Modal/Modal';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import SyncIcon from '@mui/icons-material/Sync';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const FileAttachment = ({ attachments = [], onAddAttachment, onDeleteAttachment, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const fileInputRef = useRef(null);

  // Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    file: null,
  });

  // Preview Modal state
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    file: null,
    loading: false,
    error: null,
    fileType: '', // pdf, excel, csv, docx, md, text, image, media, fallback
    blobUrl: null,
    excelData: null, // { sheetNames: [], sheets: {} }
    activeSheet: '',
    htmlContent: '',
    textContent: '',
    zoomLevel: 100,
  });

  const [isDragging, setIsDragging] = useState(false);

  // Process uploaded files (both from file input and drag-and-drop)
  const processFilesUpload = async (filesList) => {
    const selectedFiles = Array.from(filesList || []);
    if (selectedFiles.length === 0) return;

    const validFiles = [];
    const oversizedFiles = [];

    selectedFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0 && onError) {
      onError(`File(s) exceed 10MB limit: ${oversizedFiles.join(', ')}`);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setProgress(0);
    setCurrentFileName(
      validFiles.length === 1 ? validFiles[0].name : `${validFiles.length} files`
    );

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await uploadFile(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });

      if (res.success) {
        const newAttachments = res.data?.attachments || (res.data?.attachment ? [res.data.attachment] : []);
        newAttachments.forEach((att) => onAddAttachment(att));
      }
    } catch (err) {
      console.error('File upload error:', err);
      const msg = err.response?.data?.message || 'File upload failed. Please try again.';
      if (onError) onError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    processFilesUpload(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileCategory = (name = '') => {
    const ext = name.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (ext === 'csv') return 'csv';
    if (['doc', 'docx'].includes(ext)) return 'docx';
    if (['md', 'markdown'].includes(ext)) return 'md';
    if (['txt', 'json', 'js', 'html', 'css', 'xml', 'log', 'py'].includes(ext)) return 'text';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    if (['mp4', 'webm'].includes(ext)) return 'video';
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
    return 'other';
  };

  const getFileIcon = (file) => {
    const name = file?.originalName || '';
    const category = getFileCategory(name);

    if (category === 'image' && file.url) {
      return (
        <img
          src={file.url}
          alt={name}
          className={styles.thumbImg}
          onClick={() => handleOpenPreview(file)}
        />
      );
    }
    if (category === 'pdf') return <PictureAsPdfIcon className={styles.fileIcon} style={{ color: '#ef4444' }} />;
    if (category === 'excel' || category === 'csv') return <TableChartIcon className={styles.fileIcon} style={{ color: '#10b981' }} />;
    if (category === 'docx') return <DescriptionIcon className={styles.fileIcon} style={{ color: '#3b82f6' }} />;
    if (category === 'md' || category === 'text') return <CodeIcon className={styles.fileIcon} style={{ color: '#8b5cf6' }} />;
    if (category === 'audio') return <AudioFileIcon className={styles.fileIcon} style={{ color: '#ec4899' }} />;
    if (category === 'video') return <VideoFileIcon className={styles.fileIcon} style={{ color: '#f59e0b' }} />;
    if (category === 'archive') return <FolderZipIcon className={styles.fileIcon} style={{ color: '#64748b' }} />;
    return <InsertDriveFileIcon className={styles.fileIcon} style={{ color: 'var(--accent-primary)' }} />;
  };

  // Trigger Delete Confirmation Modal
  const handleTriggerDelete = (file) => {
    setDeleteModal({ isOpen: true, file });
  };

  // Confirm Delete Attachment
  const handleConfirmDelete = () => {
    if (deleteModal.file) {
      if (previewState.file?._id === deleteModal.file._id || previewState.file?.publicId === deleteModal.file.publicId) {
        closePreview();
      }
      onDeleteAttachment(deleteModal.file);
    }
    setDeleteModal({ isOpen: false, file: null });
  };

  // Trigger Direct Download
  const handleDownload = async (file) => {
    try {
      await downloadFileBlob(file.url, file.originalName);
    } catch (err) {
      console.error('File download error:', err);
      if (onError) onError('Failed to download file.');
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (file) => {
    const category = getFileCategory(file.originalName);
    setPreviewState({
      isOpen: true,
      file,
      loading: true,
      error: null,
      fileType: category,
      blobUrl: null,
      excelData: null,
      activeSheet: '',
      htmlContent: '',
      textContent: '',
      zoomLevel: 100,
    });

    try {
      const blob = await fetchFileBlob(file.url, file.originalName);
      const createdBlobUrl = URL.createObjectURL(blob);

      if (category === 'pdf' || category === 'image' || category === 'audio' || category === 'video') {
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
        }));
      } else if (category === 'excel') {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames || [];
        const sheets = {};
        sheetNames.forEach((sName) => {
          const sheet = workbook.Sheets[sName];
          sheets[sName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        });
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
          excelData: { sheetNames, sheets },
          activeSheet: sheetNames[0] || '',
        }));
      } else if (category === 'csv') {
        const text = await blob.text();
        const rows = text.split('\n').map((r) => r.split(','));
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
          excelData: { sheetNames: ['Sheet1'], sheets: { Sheet1: rows } },
          activeSheet: 'Sheet1',
        }));
      } else if (category === 'docx') {
        const ext = file.originalName.toLowerCase().split('.').pop();
        if (ext === 'docx') {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewState((prev) => ({
            ...prev,
            loading: false,
            blobUrl: createdBlobUrl,
            htmlContent: result.value || '<p>No content extracted</p>',
          }));
        } else {
          // .doc binary fallback
          setPreviewState((prev) => ({
            ...prev,
            loading: false,
            blobUrl: createdBlobUrl,
            fileType: 'fallback',
          }));
        }
      } else if (category === 'md') {
        const text = await blob.text();
        const formattedHtml = parseMarkdownToHtml(text);
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
          htmlContent: formattedHtml,
        }));
      } else if (category === 'text') {
        const text = await blob.text();
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
          textContent: text,
        }));
      } else {
        setPreviewState((prev) => ({
          ...prev,
          loading: false,
          blobUrl: createdBlobUrl,
          fileType: 'fallback',
        }));
      }
    } catch (err) {
      console.error('Preview load error:', err);
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        error: 'Unable to render inline preview for this file.',
      }));
    }
  };

  const closePreview = () => {
    if (previewState.blobUrl) {
      URL.revokeObjectURL(previewState.blobUrl);
    }
    setPreviewState({
      isOpen: false,
      file: null,
      loading: false,
      error: null,
      fileType: '',
      blobUrl: null,
      excelData: null,
      activeSheet: '',
      htmlContent: '',
      textContent: '',
      zoomLevel: 100,
    });
  };

  const parseMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/^\s*[\-\*] (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br />');

    return `<p>${html}</p>`;
  };

  const getColumnLabel = (index) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  return (
    <div className={styles.attachmentContainer}>
      {/* Upload Dropzone */}
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUploadIcon className={styles.dropzoneIcon} fontSize="large" />
        <div className={styles.dropzoneText}>
          {isDragging ? 'Drop your files here!' : 'Click or drag multiple files here to attach'}
        </div>
        <div className={styles.dropzoneSubtext}>
          Supported: PDF, DOCX, XLS/XLSX, CSV, MD, TXT, Images, Audio, Video (Max 10MB per file)
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.fileInput}
          onChange={handleFileChange}
        />
      </div>

      {uploading && (
        <div>
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressText}>
            Uploading {currentFileName}... {progress}%
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className={styles.fileList}>
          {attachments.map((file, idx) => {
            const isCurrentlyPreviewing = previewState.isOpen && previewState.file?.url === file.url;
            return (
              <div
                key={file._id || file.publicId || idx}
                className={`${styles.fileCard} ${isCurrentlyPreviewing ? styles.activeFileCard : ''}`}
              >
                <div className={styles.fileInfo}>
                  {getFileIcon(file)}
                  <div>
                    <h5 className={styles.fileName}>{file.originalName}</h5>
                    <span className={styles.fileMeta}>{formatFileSize(file.size)}</span>
                  </div>
                </div>

                <div className={styles.fileActions}>
                  {/* Preview Button */}
                  <button
                    className={`${styles.actionBtn} ${isCurrentlyPreviewing ? styles.activeActionBtn : ''}`}
                    onClick={() => handleOpenPreview(file)}
                    title="Preview File"
                    type="button"
                  >
                    <VisibilityIcon fontSize="small" />
                  </button>

                  {/* Direct Download Button */}
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleDownload(file)}
                    title="Download File"
                    type="button"
                  >
                    <FileDownloadIcon fontSize="small" />
                  </button>

                  {/* Delete Button */}
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => handleTriggerDelete(file)}
                    title="Delete Attachment"
                    type="button"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Popup Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Attachment"
        onClose={() => setDeleteModal({ isOpen: false, file: null })}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModal({ isOpen: false, file: null })}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>
              Delete Attachment
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to remove <strong>"{deleteModal.file?.originalName}"</strong> from this note?
        </p>
        <p style={{ marginTop: '8px', color: 'var(--danger-color)', fontSize: '13px' }}>
          This will delete the file permanently from storage.
        </p>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewState.isOpen}
        title={
          <div className={styles.previewTitleGroup}>
            {getFileIcon(previewState.file)}
            <span className={styles.previewTitle}>{previewState.file?.originalName}</span>
          </div>
        }
        onClose={closePreview}
        maxWidth="900px"
        footer={
          <div className={styles.previewHeaderActions}>
            {previewState.blobUrl && (
              <a
                href={previewState.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                title="Open in new window"
              >
                <OpenInNewIcon fontSize="small" />
                <span>Open in Tab</span>
              </a>
            )}
            <button
              className="btn btn-primary"
              onClick={() => previewState.file && handleDownload(previewState.file)}
            >
              <FileDownloadIcon fontSize="small" />
              <span>Download File</span>
            </button>
          </div>
        }
      >
        <div className={styles.previewBodyContainer}>
          {previewState.loading ? (
            <div className={styles.loadingSpinner}>
              <SyncIcon style={{ fontSize: 36, animation: 'spin 1s linear infinite' }} />
              <span>Loading preview content...</span>
            </div>
          ) : previewState.error ? (
            <div className={styles.fallbackContainer}>
              <InsertDriveFileIcon className={styles.fallbackIcon} />
              <h4>Preview Error</h4>
              <p>{previewState.error}</p>
              <button
                className="btn btn-primary"
                onClick={() => previewState.file && handleDownload(previewState.file)}
              >
                Download File Instead
              </button>
            </div>
          ) : (
            <>
              {/* PDF Preview */}
              {previewState.fileType === 'pdf' && previewState.blobUrl && (
                <div className={styles.pdfContainer}>
                  <object
                    data={previewState.blobUrl}
                    type="application/pdf"
                    className={styles.pdfObject}
                  >
                    <div className={styles.fallbackContainer}>
                      <PictureAsPdfIcon className={styles.fallbackIcon} />
                      <p>Your browser is unable to render PDF inline directly.</p>
                      <a
                        href={previewState.blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        Open PDF in New Window
                      </a>
                    </div>
                  </object>
                </div>
              )}

              {/* Excel / CSV Preview */}
              {(previewState.fileType === 'excel' || previewState.fileType === 'csv') && previewState.excelData && (
                <div className={styles.excelViewer}>
                  {previewState.excelData.sheetNames.length > 1 && (
                    <div className={styles.sheetTabs}>
                      {previewState.excelData.sheetNames.map((name) => (
                        <button
                          key={name}
                          className={`${styles.sheetTab} ${
                            previewState.activeSheet === name ? styles.sheetTabActive : ''
                          }`}
                          onClick={() => setPreviewState((p) => ({ ...p, activeSheet: name }))}
                          type="button"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.tableWrapper}>
                    {previewState.excelData.sheets[previewState.activeSheet] ? (
                      <table className={styles.excelTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            {previewState.excelData.sheets[previewState.activeSheet][0]?.map((_, colIdx) => (
                              <th key={colIdx}>{getColumnLabel(colIdx)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewState.excelData.sheets[previewState.activeSheet].map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              <td>{rowIdx + 1}</td>
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx}>{cell !== undefined && cell !== null ? String(cell) : ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No rows in this sheet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Word DOCX & Markdown Preview */}
              {(previewState.fileType === 'docx' || previewState.fileType === 'md') && (
                <div
                  className={styles.docContainer}
                  dangerouslySetInnerHTML={{ __html: previewState.htmlContent }}
                />
              )}

              {/* Text & Code Preview */}
              {previewState.fileType === 'text' && (
                <div className={styles.codeContainer}>
                  <code>{previewState.textContent}</code>
                </div>
              )}

              {/* Image Preview */}
              {previewState.fileType === 'image' && previewState.blobUrl && (
                <div className={styles.imageContainer}>
                  <div className={styles.imageControls}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setPreviewState((p) => ({ ...p, zoomLevel: Math.min(p.zoomLevel + 25, 300) }))}
                    >
                      <ZoomInIcon fontSize="small" />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setPreviewState((p) => ({ ...p, zoomLevel: Math.max(p.zoomLevel - 25, 50) }))}
                    >
                      <ZoomOutIcon fontSize="small" />
                    </button>
                  </div>
                  <img
                    src={previewState.blobUrl}
                    alt={previewState.file?.originalName}
                    className={styles.previewImage}
                    style={{ transform: `scale(${previewState.zoomLevel / 100})` }}
                  />
                </div>
              )}

              {/* Audio & Video Preview */}
              {previewState.fileType === 'audio' && previewState.blobUrl && (
                <div className={styles.fallbackContainer}>
                  <audio controls src={previewState.blobUrl} style={{ width: '100%', maxWidth: '500px' }} />
                </div>
              )}
              {previewState.fileType === 'video' && previewState.blobUrl && (
                <div className={styles.fallbackContainer}>
                  <video controls src={previewState.blobUrl} style={{ width: '100%', maxHeight: '50vh' }} />
                </div>
              )}

              {/* Fallback Preview */}
              {previewState.fileType === 'fallback' && (
                <div className={styles.fallbackContainer}>
                  <FolderZipIcon className={styles.fallbackIcon} />
                  <h4>File Attached</h4>
                  <p>Inline preview is not available for this format ({previewState.file?.originalName}).</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => previewState.file && handleDownload(previewState.file)}
                  >
                    Download File to View
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FileAttachment;
