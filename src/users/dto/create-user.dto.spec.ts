import { validate } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

describe("CreateUserDto", () => {
  it("should validate a valid DTO", async () => {
    const dto = new CreateUserDto();

    dto.name = "John Doe";
    dto.email = "john.doe@example.com";
    dto.password = "securepassword";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe("Name validation", () => {
    it("should fail if name is empty", async () => {
      const dto = new CreateUserDto();
      dto.name = "";
      dto.email = "john.doe@example.com";
      dto.password = "securepassword";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("name");
    });

    it("should fail if name is too short", async () => {
      const dto = new CreateUserDto();
      dto.name = "JD";
      dto.email = "john.doe@example.com";
      dto.password = "securepassword";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("name");
    });

    it("should fail if name is too long", async () => {
      const dto = new CreateUserDto();
      dto.name = "A".repeat(101);
      dto.email = "john.doe@example.com";
      dto.password = "securepassword";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("name");
    });
  });

  describe("Email validation", () => {
    it("should fail if email is invalid", async () => {
      const dto = new CreateUserDto();
      dto.name = "John Doe";
      dto.email = "invalid-email";
      dto.password = "securepassword";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("email");
    });
  });

  describe("Password validation", () => {
    it("should fail if password is empty", async () => {
      const dto = new CreateUserDto();
      dto.name = "John Doe";
      dto.email = "john.doe@example.com";
      dto.password = "";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("password");
    });

    it("should fail if password is too short", async () => {
      const dto = new CreateUserDto();
      dto.name = "John Doe";
      dto.email = "john.doe@example.com";
      dto.password = "123";

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe("password");
    });
  });
});
