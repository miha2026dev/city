import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ok } from "assert";

const prisma = new PrismaClient();

/* ============================
   REGISTER USER
============================ */
export const adminCreateUser = async (req: Request, res: Response) => {
  const { username, password, name, phone, role } = req.body;

  if (!["OWNER", "USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password: hashedPassword, name, phone, role },
  });

  res.json({ ok: true, user });
};
/**==================================== */

export const registerUser = async (req: Request, res: Response) => {
  const { username, password, name, phone } = req.body;

  try {
    // Check if username exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser)
      return res.status(409).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        phone,
        password: hashedPassword,
        name,
        role: "USER",
      },
    });

    res.status(201).json({
      ok:true,
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/* ============================
   LOGIN USER
============================ */
export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }  
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

   
    await prisma.session.create({
  data: {
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

     res.cookie("refreshToken", refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000,
     })
    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
/*==============================


/* ============================
   GET USER INFO
============================ */
export const getUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username:true,        
        phone: true,       
        createdAt: true,   
        role:true,  
        ownedBusinesses: true, 
        reviews: true,       
        favorites: true,    
        notifications: true, 
        chatParticipants: true,
        sentReports: true,   
        bookmarks: true,    
        sentMessages: true,  
        media: true,         
        hostedStreams: true, 
        bloodRequests: true,  
        competitionsWon: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ ok: true, data:user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/* ============================
   GET USERS INFO
============================ */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { id: "desc" }
    });

    res.json({ 
      ok: true, 
      data: users,
      count: users.length,
      message: "تم جلب المستخدمين بنجاح"
    });
  } catch (err: any) {
    console.error("خطأ في جلب المستخدمين:", err);
    res.status(500).json({ 
      ok: false, 
      error: "فشل في جلب بيانات المستخدمين",
      details: err.message 
    });
  }
};



/* ============================
   UPDATE USER
============================ */
export const updateUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { name, phone, username,role ,password} = req.body;
   
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        username,
        role,
        password
      },
    });

    res.json({ ok:true ,message: "User updated", user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const { name, phone, avatarUrl, bio } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        avatarUrl,
        bio,
      },
    });

    res.json({ message: "User updated", user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/* ============================
   DELETE USER
============================ */
export const deleteUser = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  try {
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "User deleted",ok:true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/* ============================
   REFRESH TOKEN
============================ */
export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const session = await prisma.session.findUnique({
      where: { token },
    });
    if (!session || !session.isValid || session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }


    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const newAccessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};
/*============================
session
===============================*/
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const activeSessions = await prisma.session.findMany({
      where: {
        isValid: true,
        expiresAt: { gt: now },
      },
      include: { user: true },
    });

    res.json({ ok: true, data: activeSessions });
  } catch (err) {
    res.status(500).json({ ok: false, message: "فشل في جلب الجلسات" });
  }
};
