import { Expose, Type } from 'class-transformer';
import { IsArray, IsDefined, IsString, ValidateNested } from 'class-validator';
import { WINOrderENTITY } from 'logiflowerp-sdk';

export class DataRequestSave {
    @IsDefined({ message: 'data es requerido' })
    @Type(() => WINOrderENTITY)
    @IsArray()
    @ValidateNested({ each: true })
    @Expose()
    data!: WINOrderENTITY[]

    @IsDefined({ message: 'data es requerido' })
    @IsString()
    @Expose()
    db!: string
}