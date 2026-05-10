import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'roles';

export const Public = (...roles: string[]) => SetMetadata(ROLE_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';

export const PublicRoute = () => SetMetadata(IS_PUBLIC_KEY, true);
