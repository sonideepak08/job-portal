import { Role } from "../generated/prisma/enums.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: Role;
      };
    }
  }
}
