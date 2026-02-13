import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── GET /api/coupons ────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { configId: 'default' },
      orderBy: { createdAt: 'asc' },
    });

    const response = coupons.map((c) => ({
      id: c.id,
      title: c.title,
      emoji: c.emoji,
      desc: c.desc,
      color: c.color,
      for: c.forPartner,
      isRedeemed: c.isRedeemed,
      redeemedAt: c.redeemedAt,
      points: c.points, // Include points
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// ─── POST /api/coupons ───────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, emoji, desc, color, forPartner } = req.body;

    const coupon = await prisma.coupon.create({
      data: {
        title,
        emoji,
        desc,
        color,
        points: req.body.points || 0,
        forPartner: forPartner || 'partner1',
        configId: 'default',
      },
    });

    res.status(201).json({
      id: coupon.id,
      title: coupon.title,
      emoji: coupon.emoji,
      desc: coupon.desc,
      color: coupon.color,
      for: coupon.forPartner,
      isRedeemed: coupon.isRedeemed,
      redeemedAt: coupon.redeemedAt,
      points: coupon.points,
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// ─── PUT /api/coupons/:id/redeem ─────────────────────────────────────
router.put('/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
      },
    });

    // Add points to the partner who owns this coupon (for growth level calculation)
    if (coupon.points > 0) {
      await prisma.partner.updateMany({
        where: { configId: 'default', partnerId: coupon.forPartner },
        data: { 
          points: { increment: coupon.points },
          lifetimePoints: { increment: coupon.points }
        }
      });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({ error: 'Failed to redeem coupon' });
  }
});

// ─── DELETE /api/coupons/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

export default router;
