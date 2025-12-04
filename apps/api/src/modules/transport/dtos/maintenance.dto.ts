import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateMaintenanceDto {
    @IsString()
    @IsNotEmpty()
    vehicleId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsNumber()
    @Min(0)
    kilometrage: number;

    @IsDateString()
    @IsNotEmpty()
    dateDebut: string;

    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    coutEstime?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    coutReel?: number;

    @IsOptional()
    @IsString()
    devise?: string;

    @IsOptional()
    @IsString()
    garage?: string;
}

export class UpdateMaintenanceDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    kilometrage?: number;

    @IsOptional()
    @IsDateString()
    dateDebut?: string;

    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    coutEstime?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    coutReel?: number;

    @IsOptional()
    @IsString()
    devise?: string;

    @IsOptional()
    @IsString()
    garage?: string;
}
