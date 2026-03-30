import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, ChatRoom } from './chat.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
  ) {}

  async sendMessage(senderId: string, sendMessageDto: SendMessageDto): Promise<ChatMessage> {
    const { receiverId, content } = sendMessageDto;

    let chatRoom = await this.findChatRoom(senderId, receiverId);
    if (!chatRoom) {
      chatRoom = await this.createChatRoom(senderId, receiverId);
    }

    const message = this.chatMessageRepository.create({
      senderId,
      receiverId,
      content,
    });

    chatRoom.lastMessageAt = new Date();
    await this.chatRoomRepository.save(chatRoom);

    return this.chatMessageRepository.save(message);
  }

  async findChatRoom(user1Id: string, user2Id: string): Promise<ChatRoom | undefined> {
    return this.chatRoomRepository.findOne({
      where: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    });
  }

  async createChatRoom(user1Id: string, user2Id: string): Promise<ChatRoom> {
    const chatRoom = this.chatRoomRepository.create({
      user1Id,
      user2Id,
    });
    return this.chatRoomRepository.save(chatRoom);
  }

  async getConversation(userId: string, otherUserId: string): Promise<ChatMessage[]> {
    const messages = await this.chatMessageRepository.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      relations: ['sender', 'receiver'],
      select: {
        sender: {
          id: true,
          firstName: true,
          lastName: true,
        },
        receiver: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    await this.markAsRead(otherUserId, userId);

    return messages;
  }

  async getMyChatRooms(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.user1', 'user1')
      .leftJoinAndSelect('room.user2', 'user2')
      .where('room.user1Id = :userId OR room.user2Id = :userId', { userId })
      .orderBy('room.lastMessageAt', 'DESC')
      .addOrderBy('room.createdAt', 'DESC')
      .select([
        'room.id',
        'room.createdAt',
        'room.lastMessageAt',
        'user1.id',
        'user1.firstName',
        'user1.lastName',
        'user2.id',
        'user2.firstName',
        'user2.lastName',
      ])
      .getMany();
  }

  async markAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('senderId = :senderId AND receiverId = :receiverId AND isRead = false', {
        senderId,
        receiverId,
      })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.chatMessageRepository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getUnreadCountBySender(userId: string, senderId: string): Promise<number> {
    return this.chatMessageRepository.count({
      where: { senderId, receiverId: userId, isRead: false },
    });
  }
}
