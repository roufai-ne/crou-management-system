import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateUsageDto {
    @IsString()
    @IsNotEmpty()
    vehicleId: string;

    @IsString()
    @IsNotEmpty()
    conducteur: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @Min(0)
    kilometrageDebut: number;

    @IsNumber()
    @Min(0)
    kilometrageFin: number;

    @IsDateString()
    @IsNotEmpty()
    dateDebut: string; // ISO Date string

    @IsDateString()
    @IsNotEmpty()
    dateFin: string; // ISO Date string

    @IsDateString()
    @IsNotEmpty()
    date: string; // ISO Date string
}

export class UpdateUsageDto {
    @IsOptional()
    @IsString()
    conducteur?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    kilometrageDebut?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    kilometrageFin?: number;

    @IsOptional()
    @IsDateString()
    dateDebut?: string;

    @IsOptional()
    @IsDateString()
    dateFin?: string;

    @IsOptional()
    @IsDateString()
    date?: string;
}
