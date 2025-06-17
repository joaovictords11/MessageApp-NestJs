export abstract class HashingService {
  abstract hash(password: string): Promise<string>;
  abstract comparePassword(
    password: string,
    passwordHash: string
  ): Promise<boolean>;
}
