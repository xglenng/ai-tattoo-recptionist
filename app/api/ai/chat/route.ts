import { protectedRoute } from '@/packages/auth/server';
import { handlePOST } from '@/packages/ai/src/http';
export const POST = protectedRoute(handlePOST);
