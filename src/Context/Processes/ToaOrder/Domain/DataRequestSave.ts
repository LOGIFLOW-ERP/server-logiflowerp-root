import { Type } from 'class-transformer';
import { IsArray, IsDefined, ValidateNested } from 'class-validator';
import { TOAOrderENTITY } from 'logiflowerp-sdk';

export class DataRequestSave {
    @IsDefined({ message: 'es requerido' })
    @Type(() => TOAOrderENTITY)
    @IsArray()
    @ValidateNested({ each: true })
    data!: TOAOrderENTITY[]
}