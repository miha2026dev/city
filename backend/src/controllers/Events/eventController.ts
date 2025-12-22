
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ============================
   CREATE EVENT (OWNER ONLY)
============================ */
export const createEvent = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const {
    name, description, startDate, endDate, businessId,
    address, city, region, lat, lng, price, capacity, isPublic
  } = req.body;

  try {
    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: parseInt(businessId), ownerId: userId }
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found or access denied" });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        businessId: parseInt(businessId),
        address,
        city,
        region,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        price: price ? parseFloat(price) : null,
        capacity: capacity ? parseInt(capacity) : null,
        isPublic: isPublic !== undefined ? isPublic : true,
      },
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/* ============================
   GET BUSINESS EVENTS (OWNER ONLY)
============================ */
export const getBusinessEvents = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const businessId = parseInt(req.params.businessId);

  try {
    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId }
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found or access denied" });
    }

    const events = await prisma.event.findMany({
      where: { businessId },
      include: {
        media: true,
        liveStream: true,
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};