import { Router, Request, Response } from 'express';
import { db } from '../data/database';
import { MCE_DEPARTMENTS } from '../data/mceCampusData';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').toLowerCase();

  if (!q && !category) {
    // Return recommended popular campus destinations
    const popular = [
      db.buildings.get('b-cse-ise'),
      db.buildings.get('b-admin'),
      db.buildings.get('b-library'),
      db.rooms.get('room-cse-lab-ai'),
      db.rooms.get('room-exam-cell'),
      db.buildings.get('b-meriise'),
      db.buildings.get('b-canteen')
    ].filter(Boolean);

    return res.json({
      success: true,
      query: '',
      results: popular.map(item => ({
        id: item!.id,
        name: item!.name,
        type: 'building' in item! ? 'room' : 'building',
        buildingId: (item as any).buildingId || item!.id,
        floor: (item as any).floor ?? 0,
        coordinates: item!.coordinates,
        verificationStatus: item!.verificationStatus
      }))
    });
  }

  const results: any[] = [];

  // Search Buildings
  for (const b of db.buildings.values()) {
    if (category && category !== 'all' && b.category !== category) continue;

    const matchesName = b.name.toLowerCase().includes(q);
    const matchesCode = b.shortCode.toLowerCase().includes(q);
    const matchesDesc = b.description.toLowerCase().includes(q);

    if (matchesName || matchesCode || matchesDesc) {
      results.push({
        id: b.id,
        type: 'building',
        name: b.name,
        shortCode: b.shortCode,
        category: b.category,
        floor: 0,
        coordinates: b.coordinates,
        buildingName: b.name,
        description: b.description,
        verificationStatus: b.verificationStatus
      });
    }
  }

  // Search Departments
  for (const dept of MCE_DEPARTMENTS) {
    if (category && category !== 'all' && category !== 'academic') continue;

    const matchesName = dept.name.toLowerCase().includes(q);
    const matchesCode = dept.shortCode.toLowerCase().includes(q);
    const matchesHod = dept.hodName.toLowerCase().includes(q);
    const matchesLab = dept.laboratories.some(l => l.toLowerCase().includes(q));

    if (matchesName || matchesCode || matchesHod || matchesLab) {
      const bldg = db.buildings.get(dept.buildingId);
      results.push({
        id: dept.id,
        type: 'department',
        name: `${dept.name} (${dept.shortCode})`,
        shortCode: dept.shortCode,
        category: 'academic',
        floor: dept.floor,
        buildingId: dept.buildingId,
        buildingName: bldg ? bldg.name : 'Academic Complex',
        coordinates: bldg ? bldg.coordinates : [76.10354, 13.02365],
        hodName: dept.hodName,
        verificationStatus: 'verified'
      });
    }
  }

  // Search Rooms & Labs
  for (const room of db.rooms.values()) {
    if (category && category !== 'all' && room.category !== category) continue;

    const matchesName = room.name.toLowerCase().includes(q);
    const matchesNum = room.roomNumber.toLowerCase().includes(q);
    const matchesAlias = room.aliases.some(a => a.toLowerCase().includes(q));

    if (matchesName || matchesNum || matchesAlias) {
      const bldg = db.buildings.get(room.buildingId);
      results.push({
        id: room.id,
        type: 'room',
        name: room.name,
        roomNumber: room.roomNumber,
        category: room.category,
        floor: room.floor,
        buildingId: room.buildingId,
        buildingName: bldg ? bldg.name : 'Campus Building',
        coordinates: room.coordinates,
        verificationStatus: room.verificationStatus
      });
    }
  }

  return res.json({
    success: true,
    query: q,
    count: results.length,
    results: results.slice(0, 20)
  });
});

export default router;
