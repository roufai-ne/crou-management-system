import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { VehicleType } from '../../../../../packages/database/src/entities/Vehicle.entity';

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    immatriculation: string;

    @IsString()
    @IsNotEmpty()
    marque: string;

    @IsString()
    @IsNotEmpty()
    modele: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsOptional()
    @IsString()
    status?: string;
}

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    marque?: string;

    @IsOptional()
    @IsString()
    modele?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
