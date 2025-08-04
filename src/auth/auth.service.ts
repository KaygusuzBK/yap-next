import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { LoginDto, RegisterDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; token: string }> {
    const { email, password, name, avatar, role } = registerDto;

    // Email kontrolü
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Bu email adresi zaten kullanılıyor');
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluşturma
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      avatar,
      role: role || UserRole.TEAM_MEMBER,
    });

    const savedUser = await this.userRepository.save(user);

    // JWT token oluşturma
    const token = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    // Şifreyi çıkarıp döndürme
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; token: string }> {
    const { email, password } = loginDto;

    // Kullanıcıyı bul (şifre dahil)
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // Son aktif zamanı güncelle
    await this.userRepository.update(user.id, { lastActive: new Date() });

    // JWT token oluşturma
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Şifreyi çıkarıp döndürme
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async validateUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    return user;
  }
} 