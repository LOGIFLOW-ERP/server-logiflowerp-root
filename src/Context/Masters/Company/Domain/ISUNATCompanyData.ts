import { Expose } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class ISUNATCompanyData {
    @IsString()
    @IsNotEmpty()
    @Expose()
    razonSocial: string = ''

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
    estado: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    condicion: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    direccion: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    ubigeo: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    viaTipo: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    viaNombre: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    zonaCodigo: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    zonaTipo: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    numero: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    interior: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    lote: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    dpto: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    manzana: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    kilometro: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    distrito: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    provincia: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    departamento: string = ''

    @IsBoolean()
    @IsNotEmpty()
    @Expose()
    EsAgenteRetencion: boolean = false

    @IsBoolean()
    @IsNotEmpty()
    @Expose()
    EsBuenContribuyente: boolean = false

    @IsString()
    @IsNotEmpty()
    @Expose()
    tipo: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    actividadEconomica: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    numeroTrabajadores: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    tipoFacturacion: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    tipoContabilidad: string = ''

    @IsString()
    @IsNotEmpty()
    @Expose()
    comercioExterior: string = ''
}