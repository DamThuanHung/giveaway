import 'chat_message.dart';

class ChatThread {
  final int postId; // PRO UPDATE: Dùng ID thực từ DB
  final String senderName;
  final List<ChatMessage> messages;
  int unreadCount;

  ChatThread({
    required this.postId,
    required this.senderName,
    required this.messages,
    this.unreadCount = 0,
  });
}