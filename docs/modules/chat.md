# MODULE: Chat

## Mô tả
Nhắn tin realtime giữa các user thông qua WebSocket (Socket.io).

## Files liên quan
| Layer | File |
|---|---|
| Gateway | `backend/src/chat/chat.gateway.ts` |
| Service | `backend/src/chat/chat.service.ts` |
| Module | `backend/src/chat/chat.module.ts` |
| Flutter Service | `app/lib/services/chat_socket_service.dart` |
| Flutter Provider | `app/lib/providers/chat_provider.dart` |
| Flutter Model | `app/lib/models/chat_message.dart`, `chat_thread.dart` |
| Flutter Screen | `app/lib/screens/messages_tab.dart`, `chat_screen.dart` |

## WebSocket Events

### Client → Server

| Event | Payload | Mô tả |
|---|---|---|
| `sendMessage` | `{ ... }` | Gửi tin nhắn |

### Server → Client

| Event | Payload | Mô tả |
|---|---|---|
| `receive_message` | `{ ... }` | Nhận tin nhắn (broadcast cho tất cả) |

## Kết nối WebSocket (Flutter)
```dart
// Kết nối tới Socket.io server
// URL: http://192.168.0.108:3800
```

## Cấu hình Gateway
```typescript
@WebSocketGateway({
  cors: { origin: '*' }  // Cho phép mọi origin kết nối
})
```

## Trạng thái hiện tại & Hạn chế

| Vấn đề | Mô tả |
|---|---|
| Broadcast toàn bộ | Khi 1 user gửi tin, **tất cả** user đang kết nối đều nhận — chưa có chat 1-1 |
| Không lưu DB | Tin nhắn không được lưu vào database — mất khi reload |
| Không có room | Chưa implement Socket.io rooms để tạo kênh riêng |

## Kiến trúc mục tiêu (cần phát triển)
```
Client A → emit('sendMessage', { toUserId, content })
         → Server join room (A_B hoặc B_A)
         → Lưu vào bảng Message (DB)
         → Server emit('receive_message') → chỉ Client B
```

## Schema cần bổ sung (đề xuất)
```prisma
model Message {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String
  content    String
  createdAt  DateTime @default(now())

  sender   User @relation("sent", fields: [senderId], references: [id])
  receiver User @relation("received", fields: [receiverId], references: [id])
}
```
