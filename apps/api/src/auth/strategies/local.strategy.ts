import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private auth: AuthService) {
    super({ usernameField: 'login' });
  }

  async validate(login: string, password: string) {
    return this.auth.validateUser(login, password);
  }
}
