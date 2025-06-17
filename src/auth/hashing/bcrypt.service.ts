import * as bcrypt from "bcryptjs";
import { HashingService } from "./hashing.service";

export class BcryptService extends HashingService {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt); // returning the hashed password
  }
  async comparePassword(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash); // comparing the password with the hashed password
  }
}
