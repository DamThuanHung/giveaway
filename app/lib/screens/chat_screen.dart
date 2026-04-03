import 'package:flutter/material.dart';
import '../../models/chat_message.dart';
import '../../models/chat_thread.dart';
import '../../models/post.dart';
import '../../services/api_service.dart';
import '../../services/chat_socket_service.dart';

class ChatScreen extends StatefulWidget {
  final Post post;
  final ChatThread thread;
  final int roomId;

  const ChatScreen({
    super.key,
    required this.post,
    required this.thread,
    required this.roomId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late final TextEditingController messageController;
  final chatService = ChatSocketService();
  final ScrollController _scrollController = ScrollController();

  int get currentUserId => int.tryParse(ApiService.currentUser?['id']?.toString() ?? '0') ?? 0;

  @override
  void initState() {
    super.initState();
    messageController = TextEditingController();
    chatService.initConnection();
    chatService.joinRoom(widget.roomId);
    chatService.loadMessagesStream.listen((_) => _scrollToBottom());
  }

  @override
  void dispose() {
    messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void sendMessage() {
    final text = messageController.text.trim();
    if (text.isEmpty) return;

    chatService.sendMessage(
      roomId: widget.roomId,
      senderId: currentUserId,
      text: text,
    );

    messageController.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.thread.senderName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text(widget.post.title ?? '', style: const TextStyle(fontSize: 11), maxLines: 1),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildPostHeader(),
          Expanded(
            child: StreamBuilder<List<ChatMessage>>(
              stream: chatService.loadMessagesStream,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final messages = snapshot.data ?? [];
                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) => _buildMessageBubble(messages[index]),
                );
              },
            ),
          ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildPostHeader() {
    String rawImg = widget.post.imageUrl ?? '';
    String finalImageUrl = rawImg;

    if (finalImageUrl.isNotEmpty && !finalImageUrl.startsWith('http') && !finalImageUrl.startsWith('uploads/')) {
      finalImageUrl = "uploads/$finalImageUrl";
    }

    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 5)],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: finalImageUrl.isEmpty
                ? Container(width: 50, height: 50, color: Colors.grey[200], child: const Icon(Icons.image))
                : Image.network(
              "${ApiService.baseUrl}/$finalImageUrl",
              width: 50, height: 50, fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 40),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.post.title ?? 'Không có tiêu đề', style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(widget.post.displayPrice ?? '0đ', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    // Sửa lỗi đỏ so sánh: Ép cả 2 về String để so sánh an toàn
    bool isMe = message.senderId.toString() == currentUserId.toString();
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: isMe ? null : Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Text(message.text, style: TextStyle(color: isMe ? Colors.white : Colors.black)),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: messageController,
              decoration: const InputDecoration(hintText: 'Nhập tin nhắn...', border: InputBorder.none),
            ),
          ),
          IconButton(onPressed: sendMessage, icon: const Icon(Icons.send, color: Color(0xFF2563EB))),
        ],
      ),
    );
  }
}