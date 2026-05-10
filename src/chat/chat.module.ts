import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './services/chat.service';
import { ChatMessage, ChatRoom } from './entities/chat.entity';
import { ChatController } from './controllers/chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, ChatRoom])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
