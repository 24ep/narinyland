import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── Helper: Calculate level from total XP (1 exp = 1 point) ────────
// Level thresholds: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 200 XP, etc.
// Formula: level = floor(totalXP / 100) + 1, capped at 50
function calculateLevel(totalXP: number): { level: number; xpInCurrentLevel: number; xpForNextLevel: number } {
  const level = Math.min(50, Math.floor(totalXP / 100) + 1);
  const xpInCurrentLevel = totalXP % 100;
  const xpForNextLevel = 100; // Always 100 XP per level
  return { level, xpInCurrentLevel, xpForNextLevel };
}

// ─── Helper: Get total XP from both partners' lifetime points ────────
async function getTotalLifetimePoints(): Promise<number> {
  const partners = await prisma.partner.findMany({
    where: { configId: 'default' },
    select: { lifetimePoints: true }
  });
  return partners.reduce((sum, p) => sum + (p.lifetimePoints || 0), 0);
}

// ─── Helper: Get total spendable points ──────────────────────────────
async function getTotalSpendablePoints(): Promise<number> {
  const partners = await prisma.partner.findMany({
    where: { configId: 'default' },
    select: { points: true }
  });
  return partners.reduce((sum, p) => sum + (p.points || 0), 0);
}

async function getPartnerPoints(): Promise<{ partner1: number; partner2: number }> {
    const partners = await prisma.partner.findMany({
        where: { configId: 'default' },
        select: { partnerId: true, points: true }
    });
    return {
        partner1: partners.find(p => p.partnerId === 'partner1')?.points || 0,
        partner2: partners.find(p => p.partnerId === 'partner2')?.points || 0
    };
}

// ─── GET /api/stats ──────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    let stats = await prisma.loveStats.findUnique({
      where: { id: 'default' },
    });

    if (!stats) {
      stats = await prisma.loveStats.create({
        data: { id: 'default' },
      });
    }

    // Calculate level from LIFETIME points (cumulative XP)
    const totalLifetimePoints = await getTotalLifetimePoints();
    const totalSpendablePoints = await getTotalSpendablePoints();
    
    // Level is based on LIFETIME points
    const { level, xpInCurrentLevel, xpForNextLevel } = calculateLevel(totalLifetimePoints);

    // Sync level back to DB (optional, but good for caching)
    if (stats.level !== level || stats.xp !== xpInCurrentLevel) {
      await prisma.loveStats.update({
        where: { id: 'default' },
        data: { level, xp: xpInCurrentLevel }
      });
    }

    const partnerPoints = await getPartnerPoints();

    res.json({
      xp: xpInCurrentLevel,
      level,
      xpForNextLevel,
      totalXP: totalLifetimePoints,
      questsCompleted: stats.questsCompleted,
      leaves: stats.leaves,
      points: totalSpendablePoints, // Spendable points
      partnerPoints // Individual points
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── PUT /api/stats/add-xp ──────────────────────────────────────────
router.put('/add-xp', async (req, res) => {
  try {
    const { amount, partnerId } = req.body; 

    let targetPartnerId = partnerId || 'partner1';

    // Increment BOTH spendable points and lifetime points
    await prisma.partner.updateMany({
        where: { configId: 'default', partnerId: targetPartnerId },
        data: { 
          points: { increment: amount || 0 },
          lifetimePoints: { increment: amount || 0 }
        }
    });

    let stats = await prisma.loveStats.findUnique({ where: { id: 'default' } });
    if (!stats) stats = await prisma.loveStats.create({ data: { id: 'default' } });

    const prevLevel = stats.level;

    // Recalculate level from LIFETIME points
    const totalLifetimePoints = await getTotalLifetimePoints();
    const totalSpendablePoints = await getTotalSpendablePoints();
    
    const { level: newLevel, xpInCurrentLevel, xpForNextLevel } = calculateLevel(totalLifetimePoints);

    const updated = await prisma.loveStats.update({
      where: { id: 'default' },
      data: {
        xp: xpInCurrentLevel,
        level: newLevel,
        leaves: stats.leaves
      },
    });

    const partnerPoints = await getPartnerPoints();

    res.json({
      xp: xpInCurrentLevel,
      level: newLevel,
      xpForNextLevel,
      totalXP: totalLifetimePoints,
      questsCompleted: updated.questsCompleted,
      leaves: updated.leaves,
      points: totalSpendablePoints,
      partnerPoints,
      leveledUp: newLevel > prevLevel,
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ error: 'Failed to add XP' });
  }
});

// ─── POST /api/stats/quest-complete ──────────────────────────────────
router.post('/quest-complete', async (req, res) => {
  try {
    const { questText, completedBy } = req.body;

    await prisma.questLog.create({
      data: {
        questText,
        completedBy,
      },
    });

    const stats = await prisma.loveStats.update({
      where: { id: 'default' },
      data: {
        questsCompleted: { increment: 1 },
      },
    });

    // Recalculate level
    const totalLifetimePoints = await getTotalLifetimePoints();
    const { level, xpInCurrentLevel } = calculateLevel(totalLifetimePoints);

    res.json({
      xp: xpInCurrentLevel,
      level,
      totalXP: totalLifetimePoints,
      questsCompleted: stats.questsCompleted,
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// ─── GET /api/stats/quests ───────────────────────────────────────────
router.get('/quests', async (_req, res) => {
  try {
    const quests = await prisma.questLog.findMany({
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    res.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// ─── POST /api/stats/add-leaf ────────────────────────────────────────
router.post('/add-leaf', async (_req, res) => {
  try {
    const COST_PER_LEAF = 100;

    const stats = await prisma.loveStats.findUnique({ where: { id: 'default' } });
    if (!stats) return res.status(404).json({ error: 'Stats not found' });

    // Check SPENDABLE points for cost
    const totalSpendablePoints = await getTotalSpendablePoints();
    if (totalSpendablePoints < COST_PER_LEAF) {
      return res.status(400).json({ error: 'Not enough points (combined)' });
    }

    // Deduct from spendable points only (Richest pays first)
    const partners = await prisma.partner.findMany({
        where: { configId: 'default' },
        orderBy: { points: 'desc' }
    });

    let remainingCost = COST_PER_LEAF;
    for (const p of partners) {
        if (remainingCost <= 0) break;
        const deduct = Math.min(p.points, remainingCost);
        if (deduct > 0) {
            await prisma.partner.update({
                where: { id: p.id },
                data: { 
                  points: { decrement: deduct }
                  // NO decrement to lifetimePoints!
                }
            });
            remainingCost -= deduct;
        }
    }

    const prevLevel = stats.level;

    // Recalculate level (based on LIFETIME points, which haven't changed)
    const totalLifetimePoints = await getTotalLifetimePoints();
    const newTotalSpendable = await getTotalSpendablePoints();
    
    const { level: currentLevel, xpInCurrentLevel } = calculateLevel(totalLifetimePoints);

    const updated = await prisma.loveStats.update({
      where: { id: 'default' },
      data: {
        leaves: { increment: 1 },
        xp: xpInCurrentLevel,
        level: currentLevel
      }
    });

    const partnerPoints = await getPartnerPoints();

    res.json({
      success: true,
      leaves: updated.leaves,
      points: newTotalSpendable,
      partnerPoints,
      xp: xpInCurrentLevel,
      level: currentLevel,
      totalXP: totalLifetimePoints,
      leveledUp: currentLevel > prevLevel
    });

  } catch (error) {
    console.error('Error adding leaf:', error);
    res.status(500).json({ error: 'Failed to add leaf' });
  }
});

// ─── POST /api/stats/add-points ──────────────────────────────────────
router.post('/add-points', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || typeof amount !== 'number') return res.status(400).json({ error: 'Invalid amount' });

        // Add to partner1 by default
        await prisma.partner.updateMany({
            where: { configId: 'default', partnerId: 'partner1' },
            data: { 
              points: { increment: amount },
              lifetimePoints: { increment: amount } // Increment total earned too
            }
        });

        const total = await getTotalSpendablePoints();
        res.json({ points: total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to add points' });
    }
});

export default router;
