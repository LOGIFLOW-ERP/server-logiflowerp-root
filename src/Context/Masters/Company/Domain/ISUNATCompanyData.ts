import { Expose } from 'class-transformer'
import { IsBoolean, IsDefined, IsNotEmpty, IsString } from 'class-validator'

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

    @IsDefined({ message: 'El campo "tipo" es requerido' })
    @IsString()
    @Expose()
    tipo: string = ''

    @IsDefined({ message: 'El campo "actividadEconomica" es requerido' })
    @IsString()
    @Expose()
    actividadEconomica: string = ''

    @IsDefined({ message: 'El campo "numeroTrabajadores" es requerido' })
    @IsString()
    @Expose()
    numeroTrabajadores: string = ''

    @IsDefined({ message: 'El campo "tipoFacturacion" es requerido' })
    @IsString()
    @Expose()
    tipoFacturacion: string = ''

    @IsDefined({ message: 'El campo "tipoContabilidad" es requerido' })
    @IsString()
    @Expose()
    tipoContabilidad: string = ''

    @IsDefined({ message: 'El campo "comercioExterior" es requerido' })
    @IsString()
    @Expose()
    comercioExterior: string = ''
}