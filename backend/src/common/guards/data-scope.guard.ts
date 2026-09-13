import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from './auth.guard';

export const getDataScope = (user: AuthenticatedUser, moduleCode: string): 'ALL' | 'DEPARTMENT' | 'PERSONAL' => {
  if (user.roles.includes('ADMIN') || user.roles.includes('CEO')) {
    return 'ALL';
  }

  const perm = user.permissions?.find((p) => p.moduleCode === moduleCode);
  if (!perm) return 'PERSONAL';

  return (perm.dataScope as 'ALL' | 'DEPARTMENT' | 'PERSONAL') || 'PERSONAL';
};

export const dataScopeFilter = (moduleCode: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user) {
      (req as any).dataScope = getDataScope(user, moduleCode);
    }
    next();
  };
};
