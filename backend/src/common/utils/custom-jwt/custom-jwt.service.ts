import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenType } from 'src/common/consts';
import logger from 'src/common/logger';
import Opts from 'src/common/options';
import { getSecret } from 'src/common/secrets';
import SecretKeys from 'src/common/secrets/keys';

@Injectable()
export class CustomJwtService {
  constructor(private readonly jwtService: JwtService) {}

  private createOpts = {
    [TokenType.ONETIME]: {
      secret: getSecret(SecretKeys.JWT_SECRET_ONETIME),
      expiresIn: Opts.INVITE_TOKEN_EXPIRY,
    },
    [TokenType.ACCESS]: {
      secret: getSecret(SecretKeys.JWT_SECRET),
      expiresIn: Opts.ACCESS_TOKEN_EXPIRY,
    },
    [TokenType.REFRESH]: {
      secret: getSecret(SecretKeys.JWT_SECRET),
      expiresIn: Opts.REFRESH_TOKEN_EXPIRY,
    },
  };

  private verifyOpts = {
    [TokenType.ONETIME]: { secret: getSecret(SecretKeys.JWT_SECRET_ONETIME) },
    [TokenType.ACCESS]: { secret: getSecret(SecretKeys.JWT_SECRET) },
    [TokenType.REFRESH]: { secret: getSecret(SecretKeys.JWT_SECRET) },
  };

  async createHashedText(plaintext: string) {
    return await bcrypt.hash(plaintext, 10);
  }

  async comparingPlainTextTohashed(plaintext: string, hashedtext: string) {
    return await bcrypt.compare(plaintext, hashedtext);
  }

  async verifyToken(token: string, type: TokenType) {
    try {
      return await this.jwtService.verifyAsync(token, this.verifyOpts[type]);
    } catch (err) {
      logger.error('');
      throw err;
    }
  }

  async createToken(payload: any, type: TokenType) {
    return await this.jwtService.signAsync(payload, this.createOpts[type]);
  }
}
