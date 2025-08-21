import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class DataVerifyEmailDTO {
    @IsString()
    @MinLength(50)
    @Expose()
    token: string = ''
}