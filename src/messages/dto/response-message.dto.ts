export class ResponseMessageDto {
  id: number;
  content: string;
  from: {
    id: number;
    name: string;
  };
  to: {
    id: number;
    name: string;
  };
  read: boolean;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
