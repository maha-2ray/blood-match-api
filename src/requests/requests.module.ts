import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BloodRequest } from "./entities/request.entity";
import { RequestsService } from "./services/requests.service";
import { RequestsController } from "./controllers/requests.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BloodRequest])],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
