import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, SKIP_ORG_AUTH, TokenType } from '../consts';
import { InviteTokenDto, TokenDto } from '../auth/dto/token.dto';
import { CustomJwtService } from './custom-jwt/custom-jwt.service';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const SkipOrgAuth = () => SetMetadata(SKIP_ORG_AUTH, true);

export async function checkInviteToken(
  jwtService: CustomJwtService,
  token: string,
): Promise<InviteTokenDto> {
  const payload: InviteTokenDto = await jwtService.verifyToken(
    token,
    TokenType.ONETIME,
  );
  if (payload?.tokenType !== TokenType.ONETIME || !payload?.inviteId) {
    throw Error('Invalid accept invite token');
  }
  return payload;
}

export async function checkAccessToken(
  jwtService: CustomJwtService,
  token: string,
): Promise<TokenDto> {
  const payload: TokenDto = await jwtService.verifyToken(
    token,
    TokenType.ACCESS,
  );
  if (
    payload?.tokenType !== TokenType.ACCESS ||
    !payload?.userId ||
    !payload?.sessionId
  ) {
    throw Error('Invalid Access token');
  }
  return payload;
}

export async function checkRefreshToken(
  jwtService: CustomJwtService,
  token: string,
): Promise<TokenDto> {
  const payload: TokenDto = await jwtService.verifyToken(
    token,
    TokenType.REFRESH,
  );
  if (
    payload?.tokenType !== TokenType.REFRESH ||
    !payload?.userId ||
    !payload?.sessionId
  ) {
    throw Error('Invalid Refresh token');
  }
  return payload;
}
