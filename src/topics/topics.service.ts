import { Injectable } from '@nestjs/common';
import { topicDefinitionOutside } from '../general/general.interface';
import { GeneralService } from '../general/general.service';

@Injectable()
export class TopicsService {
  private generalService: GeneralService;
  constructor(generalService: GeneralService) {
    this.generalService = generalService;
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getAllTopicsInformation();
  }
}
