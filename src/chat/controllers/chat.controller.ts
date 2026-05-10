import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatService } from '../services/chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  /**This feature is not needed as of now */

  // @Get('rooms')
  // getMyChatRooms(@Request() req: any) {
  //   return this.chatService.getMyChatRooms(req.user.id);
  // }

  @Get('conversation/:userId')
  getConversation(@Request() req: any, @Param('userId') userId: string) {
    return this.chatService.getConversation(req.user.id, userId);
  }

  @Get('unread')
  getUnreadCount(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Get('unread/:senderId')
  getUnreadCountBySender(
    @Request() req: any,
    @Param('senderId') senderId: string,
  ) {
    return this.chatService.getUnreadCountBySender(req.user.id, senderId);
  }

  @Post('mark-as-read/:senderId')
  markAsRead(@Request() req: any, @Param('senderId') senderId: string) {
    return this.chatService.markAsRead(senderId, req.user.id);
  }
}
