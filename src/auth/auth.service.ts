import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private db: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    // generate the password hash
    const hash = await argon.hash(dto.password);

    // save in the db and return the new user
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email,
          hash: hash,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violated
          throw new ForbiddenException('Email already taken');
        }
      }
      throw error;
    }
  }

  async login(dto: AuthDto) {
    const user = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // Guard condition: if the user does not exist
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }

    const passwordMatches = await argon.verify(user.hash, dto.password);
    // Guard condition: if the password does not match
    if (!passwordMatches) {
      throw new ForbiddenException('Incorrect credentials');
    }

    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email: email,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '10m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token,
    };
  }
}
