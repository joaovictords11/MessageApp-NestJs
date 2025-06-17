import { UsersController } from "./users.controller";

describe("UsersController", () => {
  let controller: UsersController;
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadPicture: jest.fn(),
  };

  beforeEach(() => {
    controller = new UsersController(usersServiceMock as any);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call create method of UsersService", async () => {
    // Arrange
    const createUserDto = {
      name: "Test User",
      email: "test@example.com",
      password: "password",
    };
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "create").mockResolvedValue(expected);

    // Act
    const result = await controller.create(createUserDto);

    // Assert
    expect(usersServiceMock.create).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual(expected);
  });

  it("should call findAll method of UsersService", async () => {
    // Arrange
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "findAll").mockResolvedValue(expected);

    // Act
    const result = await controller.findAll();

    // Assert
    expect(usersServiceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("should call findOne method of UsersService", async () => {
    // Arrange
    const id = 1;
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "findOne").mockResolvedValue(expected);

    // Act
    const result = await controller.findOne(id);

    // Assert
    expect(usersServiceMock.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it("should call update method of UsersService", async () => {
    // Arrange
    const id = 1;
    const updateUserDto = { name: "Updated Name" };
    const tokenPayload = { sub: 1 } as any;
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "update").mockResolvedValue(expected);

    // Act
    const result = await controller.update(id, updateUserDto, tokenPayload);

    // Assert
    expect(usersServiceMock.update).toHaveBeenCalledWith(
      id,
      updateUserDto,
      tokenPayload
    );
    expect(result).toEqual(expected);
  });

  it("should call remove method of UsersService", async () => {
    // Arrange
    const id = 1;
    const tokenPayload = { sub: 1 } as any;
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "remove").mockResolvedValue(expected);

    // Act
    const result = await controller.remove(id, tokenPayload);

    // Assert
    expect(usersServiceMock.remove).toHaveBeenCalledWith(id, tokenPayload);
    expect(result).toEqual(expected);
  });

  it("should call uploadPicture method of UsersService", async () => {
    // Arrange
    const file = { originalname: "test.jpg" } as any;
    const tokenPayload = { sub: 1 } as any;
    const expected = { anyKey: "anyValue" };

    jest.spyOn(usersServiceMock, "uploadPicture").mockResolvedValue(expected);

    // Act
    const result = await controller.uploadPicture(file, tokenPayload);

    // Assert
    expect(usersServiceMock.uploadPicture).toHaveBeenCalledWith(
      file,
      tokenPayload
    );
    expect(result).toEqual(expected);
  });
});
