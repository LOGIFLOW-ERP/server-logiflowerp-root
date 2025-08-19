import { Expose } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class IRENIECPersonalData {
    @IsString()
    @IsNotEmpty()
    @Expose()
    nombres: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    apellidoPaterno: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    apellidoMaterno: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    tipoDocumento: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    numeroDocumento: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    digitoVerificador: string = ''
}