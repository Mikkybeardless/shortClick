import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../decorators/role.decorator';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SYSTEM_MESSAGES } from 'src/common/constants/system-messages';
import { Role } from '../role/roles.enum';

@Injectable()
export class RoleGuard extends AuthGuard {
  private readonly localReflector: Reflector;
  constructor(reflector: Reflector, jwtService: JwtService) {
    super(jwtService, reflector);
    this.localReflector = reflector;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Unauthorized');
    }
    const requiredRoles = this.localReflector.getAllAndOverride<Role[]>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: User }>();

    if (!user.role) {
      throw new ForbiddenException('User has no role assigned');
    }
    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(SYSTEM_MESSAGES.AUTH_NO_ROLE);
    }
    return true;
  }
}
