import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  readonly limit: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  readonly page: number;
}
