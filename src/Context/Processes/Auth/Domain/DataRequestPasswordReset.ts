import { Expose } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class DataRequestPasswordResetDTO {
    @IsEmail()
    @Expose()
    email: string = ''
}