import 'package:flutter/material.dart';
import '../services/chat_socket_service.dart';

class ChatProvider with ChangeNotifier {
  final ChatSocketService _socketService = ChatSocketService();
  List _messages = [];

  List get messages => _messages;

  Future<void> initChat() async {
    await _socketService.initConnection();
    _socketService.socket.on('receive_message', (data) {
      _messages.add(data);
      notifyListeners();
    });
  }

  void sendMessage(String text) {
    if (text.trim().isNotEmpty) {
      _socketService.socket.emit('send_message', {'text': text});
    }
  }

  @override
  void dispose() {
    _socketService.socket.disconnect();
    super.dispose();
  }
}