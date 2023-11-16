import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  GeoJSON,
  Geometry,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'spatialyzer_demo.verw_kreis_f' })
export class KreisEntity {
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
