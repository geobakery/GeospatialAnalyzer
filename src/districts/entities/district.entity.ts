import { ApiProperty } from '@nestjs/swagger';

export class District {

    @ApiProperty({ example: "Hoyerswerda Flur 5", description: 'the name of the district' })
    name: string;

    @ApiProperty({ example: 1234, description: 'The ifcid' })
    ifcid: number;

    @ApiProperty({
        example: '2ndOrder',
        description: 'The order of the level',
    })
    level: string;
}