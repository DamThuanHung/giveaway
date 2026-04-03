import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';

class MessagesTab extends StatelessWidget {
  const MessagesTab({super.key}); // Đã xóa tham số cũ

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Tin nhắn")),
      body: Consumer<ChatProvider>(
        builder: (context, chat, child) {
          if (chat.messages.isEmpty) return const Center(child: Text("Chưa có tin nhắn nào"));
          return ListView.builder(
            itemCount: chat.messages.length,
            itemBuilder: (context, index) => ListTile(
              title: Text(chat.messages[index]['text'] ?? 'Tin nhắn mới'),
            ),
          );
        },
      ),
    );
  }
}