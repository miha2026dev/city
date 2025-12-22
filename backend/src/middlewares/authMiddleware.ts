import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';



interface AuthRequest extends Request {
  user?: any; 
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IUserPayload;
    req.user = {
      id: decoded.id,  // يجب أن يكون id وليس _id
      role: decoded.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
