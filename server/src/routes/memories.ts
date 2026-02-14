import { Router } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { uploadMemoryImage, deleteFile } from '../lib/s3.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// ─── GET /api/memories ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { privacy } = req.query;
    const where: any = {};
    if (privacy && privacy !== 'all') {
      where.privacy = privacy;
    }

    const memories = await prisma.memory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch memories', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// ─── POST /api/memories ──────────────────────────────────────────────
// Upload a new memory image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let url = req.body.url;
    let s3Key: string | null = null;

    // If a file was uploaded, upload to S3
    if (req.file) {
      const result = await uploadMemoryImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      url = result.url;
      s3Key = result.key;
    }

    if (!url) {
      return res.status(400).json({ error: 'Either a file or URL is required' });
    }

    const maxOrder = await prisma.memory.aggregate({ _max: { sortOrder: true } });
    const newOrder = (maxOrder._max.sortOrder || 0) + 1;

    const memory = await prisma.memory.create({
      data: {
        url,
        s3Key,
        privacy: req.body.privacy || 'public',
        caption: req.body.caption || null,
        sortOrder: newOrder,
      },
    });

    res.status(201).json(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// ─── PUT /api/memories/:id ───────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { privacy, caption, sortOrder, url } = req.body;

    const updateData: any = {};
    if (privacy !== undefined) updateData.privacy = privacy;
    if (caption !== undefined) updateData.caption = caption;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (url !== undefined) updateData.url = url;

    const memory = await prisma.memory.update({
      where: { id },
      data: updateData,
    });

    res.json(memory);
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// ─── DELETE /api/memories/:id ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Delete from S3 if it was uploaded
    if (memory.s3Key) {
      await deleteFile(memory.s3Key);
    }

    await prisma.memory.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// ─── PUT /api/memories/reorder ───────────────────────────────────────
router.put('/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body; // Array of IDs in new order

    const updates = orderedIds.map((id: string, index: number) =>
      prisma.memory.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering memories:', error);
    res.status(500).json({ error: 'Failed to reorder memories' });
  }
});

export default router;
