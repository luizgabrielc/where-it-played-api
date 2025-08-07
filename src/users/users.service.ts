import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async getAllUsers() {
    return await this.databaseService.getAllUsers();
  }

  async findUserById(id: string) {
    return await this.databaseService.findUserById(id);
  }

  async findUserByEmail(email: string) {
    return await this.databaseService.findUserByEmail(email);
  }

  async updateUser(id: string, data: { name?: string; email?: string; birthdate?: string }) {
    return await this.databaseService.updateUser(id, data);
  }
} 