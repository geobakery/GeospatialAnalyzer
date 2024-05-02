import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { ParameterDto } from '../general/dto/parameter.dto';
import { topicDefinitionOutside } from '../general/general.interface';
import {
  GeneralService,
  GeospatialLogicalRequest,
  GeospatialResultEntity,
} from '../general/general.service';
import { GeospatialService } from '../general/geospatial.service';
import { TransformService } from '../transform/transform.service';

@Injectable()
export class TopicsService extends GeospatialService<ParameterDto> {
  protected override handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<GeospatialResultEntity>,
    logicalRequest: GeospatialLogicalRequest,
    request: ParameterDto,
  ): void {
    throw new Error('Method not implemented.');
  }
  constructor(
    dataSource: DataSource,
    generalService: GeneralService,
    transformService: TransformService,
  ) {
    super(dataSource, generalService, transformService);
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getAllTopicsInformation();
  }
}
