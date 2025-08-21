import { Expose } from 'class-transformer';
import { IsDefined, IsEmail } from 'class-validator';

export class DataRequestResendMailRegisterUser {
    @IsDefined({ message: 'El campo "email" es requerido' })
    @IsEmail({}, { message: 'El campo "email" no es válido' })
    @Expose()
    email: string = ''
}