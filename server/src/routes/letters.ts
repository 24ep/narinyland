import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { uploadLetterMedia, deleteFile } from '../lib/s3.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── GET /api/letters ────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const letters = await prisma.loveLetter.findMany({
      include: { from: true },
      orderBy: { createdAt: 'desc' },
    });

    const response = letters.map((l) => ({
      id: l.id,
      fromId: l.from.partnerId,
      content: l.content,
      timestamp: l.createdAt.toISOString(),
      unlockDate: l.unlockDate.toISOString(),
      isRead: l.isRead,
      media: l.mediaType
        ? { type: l.mediaType, url: l.mediaUrl }
        : undefined,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

// ─── POST /api/letters ───────────────────────────────────────────────
router.post('/', upload.single('media'), async (req, res) => {
  try {
    const { fromId, content, unlockDate } = req.body;

    // Find the partner record
    const partner = await prisma.partner.findFirst({
      where: { partnerId: fromId, configId: 'default' },
    });

    if (!partner) {
      return res.status(400).json({ error: `Partner not found: ${fromId}` });
    }

    let mediaType: string | null = null;
    let mediaUrl: string | null = null;
    let mediaS3Key: string | null = null;

    if (req.file) {
      const result = await uploadLetterMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      mediaUrl = result.url;
      mediaS3Key = result.key;
      if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
      else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
      else if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';
    } else if (req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
      mediaType = req.body.mediaType || 'image';
    }

    const letter = await prisma.loveLetter.create({
      data: {
        content,
        fromId: partner.id,
        unlockDate: new Date(unlockDate || Date.now()),
        mediaType,
        mediaUrl,
        mediaS3Key,
      },
      include: { from: true },
    });

    res.status(201).json({
      id: letter.id,
      fromId: letter.from.partnerId,
      content: letter.content,
      timestamp: letter.createdAt.toISOString(),
      unlockDate: letter.unlockDate.toISOString(),
      isRead: letter.isRead,
      media: letter.mediaType
        ? { type: letter.mediaType, url: letter.mediaUrl }
        : undefined,
    });
  } catch (error) {
    console.error('Error creating letter:', error);
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

// ─── PUT /api/letters/:id/read ───────────────────────────────────────
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const letter = await prisma.loveLetter.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, isRead: letter.isRead });
  } catch (error) {
    console.error('Error marking letter as read:', error);
    res.status(500).json({ error: 'Failed to mark letter as read' });
  }
});

// ─── DELETE /api/letters/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const letter = await prisma.loveLetter.findUnique({ where: { id } });
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    if (letter.mediaS3Key) {
      await deleteFile(letter.mediaS3Key);
    }

    await prisma.loveLetter.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting letter:', error);
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

export default router;
