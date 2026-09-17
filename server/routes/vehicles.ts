import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const tenantWhere = (req: AuthRequest) => {
  if (req.user?.role === 'superadmin') return {};
  return { companyId: req.user?.companyId };
};

// ---- Vehicle Items ----
router.get('/', async (req: AuthRequest, res) => {
  try {
    const vehicles = await prisma.vehicleItem.findMany({
      where: tenantWhere(req),
      orderBy: { name: 'asc' },
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Failed to fetch vehicles' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, plateNumber } = req.body;
    const item = await prisma.vehicleItem.create({
      data: {
        adminId: req.user!.id,
        companyId: req.user!.companyId || '',
        name,
        plateNumber,
        status: 'Tersedia',
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ message: 'Failed to create vehicle' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.vehicleItem.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({ message: 'Failed to update vehicle status' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.vehicleItem.findFirst({ where: { id: req.params.id, ...tenantWhere(req) } });
    if (!item) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await prisma.vehicleItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Failed to delete vehicle' });
  }
});

// ---- Vehicle Logs ----
router.get('/logs', async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.vehicleLog.findMany({
      where: tenantWhere(req),
      orderBy: { startDate: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching vehicle logs:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle logs' });
  }
});

router.post('/logs', async (req: AuthRequest, res) => {
  try {
    const { vehicleId, driver, purpose } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const v = await tx.vehicleItem.findUnique({ where: { id: vehicleId } });
      if (!v) throw new Error('Vehicle not found');
      await tx.vehicleItem.update({ where: { id: vehicleId }, data: { status: 'Sedang Digunakan' } });
      return tx.vehicleLog.create({
        data: {
          adminId: req.user!.id,
          companyId: v.companyId,
          vehicleId,
          driver,
          purpose,
          status: 'JALAN',
        },
      });
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating vehicle log:', error);
    res.status(500).json({ message: 'Failed to create vehicle log' });
  }
});

router.patch('/logs/:logId/finish', async (req: AuthRequest, res) => {
  try {
    const log = await prisma.vehicleLog.findUnique({ where: { id: req.params.logId } });
    if (!log) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }
    const result = await prisma.$transaction(async (tx) => {
      await tx.vehicleItem.update({ where: { id: log.vehicleId }, data: { status: 'Tersedia' } });
      return tx.vehicleLog.update({
        where: { id: req.params.logId },
        data: { status: 'SELESAI', endDate: new Date() },
      });
    });
    res.json(result);
  } catch (error) {
    console.error('Error finishing trip:', error);
    res.status(500).json({ message: 'Failed to finish trip' });
  }
});

// ---- Vehicle Needs ----
router.get('/needs', async (req: AuthRequest, res) => {
  try {
    const needs = await prisma.vehicleNeed.findMany({
      where: tenantWhere(req),
      orderBy: { date: 'desc' },
    });
    res.json(needs);
  } catch (error) {
    console.error('Error fetching vehicle needs:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle needs' });
  }
});

router.post('/needs', async (req: AuthRequest, res) => {
  try {
    const { vehicleId, type, description, cost, pic } = req.body;
    const v = await prisma.vehicleItem.findUnique({ where: { id: vehicleId } });
    if (!v) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    const need = await prisma.vehicleNeed.create({
      data: {
        adminId: req.user!.id,
        companyId: v.companyId,
        vehicleId,
        type,
        description,
        cost: Number(cost) || 0,
        pic,
      },
    });
    res.status(201).json(need);
  } catch (error) {
    console.error('Error creating vehicle need:', error);
    res.status(500).json({ message: 'Failed to create vehicle need' });
  }
});

export default router;
