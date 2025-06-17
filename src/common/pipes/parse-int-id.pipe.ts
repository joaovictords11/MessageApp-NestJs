import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

@Injectable()
export class ParseIntIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== "param" || metadata.data !== "id") {
      return value;
    }

    const parsedValue = Number(value);

    if (isNaN(parsedValue)) {
      throw new BadRequestException("Param ID must be a number");
    }

    if (parsedValue <= 0) {
      throw new BadRequestException("Param ID must be a positive number");
    }

    return parsedValue;
  }
}
