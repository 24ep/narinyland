import { Router } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile, listFiles, getPresignedUrl } from '../lib/s3.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

// ─── POST /api/upload ────────────────────────────────────────────────
// General purpose file upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'uploads';
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(201).json({
      key: result.key,
      url: result.url,
      originalName: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ─── DELETE /api/upload ──────────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    await deleteFile(key);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ─── GET /api/upload/presign ─────────────────────────────────────────
router.get('/presign', async (req, res) => {
  try {
    const { key, expires } = req.query;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    const url = await getPresignedUrl(key, Number(expires) || 3600);
    res.json({ url });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// ─── GET /api/upload/list ────────────────────────────────────────────
router.get('/list', async (req, res) => {
  try {
    const { folder } = req.query;
    const files = await listFiles(typeof folder === 'string' ? folder : 'uploads');
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
