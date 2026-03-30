import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('rooms')
  getMyChatRooms(@Request() req) {
    return this.chatService.getMyChatRooms(req.user.id);
  }

  @Get('conversation/:userId')
  getConversation(@Request() req, @Param('userId') userId: string) {
    return this.chatService.getConversation(req.user.id, userId);
  }

  @Get('unread')
  getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Get('unread/:senderId')
  getUnreadCountBySender(@Request() req, @Param('senderId') senderId: string) {
    return this.chatService.getUnreadCountBySender(req.user.id, senderId);
  }

  @Post('mark-as-read/:senderId')
  markAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.chatService.markAsRead(senderId, req.user.id);
  }
}
