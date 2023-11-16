import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  GeoJSON,
  Geometry,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'spatialyzer_demo.verw_land_f' })
export class LandEntity {
  @ApiProperty({
    example: 1,
    description: 'The ID',
  })
  @Column()
  id: number;

  @ApiProperty({
    example: 1234,
    description: 'The object ID',
  })
  @PrimaryGeneratedColumn({ name: 'objectid' })
  objectId: number;

  @ApiProperty({ example: 'de_sn', description: '' })
  @Column()
  id00: string;

  @ApiProperty({ example: 'Sachsen', description: '' })
  @Column()
  name: string;

  @ApiProperty({ example: 'ABC', description: '' })
  @Column()
  nuts_code: string;

  @ApiProperty({ example: 'DE12', description: '' })
  @Column()
  egm_code: string;

  @ApiProperty({ example: 'Deutschland', description: '' })
  @Column()
  land: string;

  @ApiProperty({ example: 'Sachsen', description: '' })
  @Column()
  bundesland: string;

  @ApiProperty({ example: 1.234, description: '' })
  @Column()
  geometrieflaeche: number;

  @ApiProperty({ example: 'Quadratkilometer', description: '' })
  @Column()
  geometrieflaeche_eh: string;

  @ApiProperty({ example: 0, description: '' })
  @Column()
  shape_area: number;

  @ApiProperty({ example: 0, description: '' })
  @Column()
  shape_len: number;

  @ApiProperty({ example: '', description: '' })
  @Column({ type: 'geometry', srid: 25833, spatialFeatureType: 'Polygon' })
  geom: Geometry;
}
