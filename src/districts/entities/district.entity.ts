import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'spatialyzer_demo.verw_kreis_f' })
export class District {
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

  @ApiProperty({ example: 1234, description: 'The ifcid' })
  @Column()
  ifcid: number;

  @ApiProperty({
    example: '2ndOrder',
    description: 'The order of the level',
  })
  @Column()
  nationalcode: string;
}
