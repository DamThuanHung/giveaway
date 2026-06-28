# Nhạc nền cho video Reels

Copy file `.mp3`/`.wav`/`.m4a` vào folder này — `generate-video.js` sẽ tự chọn random 1 file
cho mỗi video, cắt theo độ dài video (`VIDEO_REEL_DURATION_SEC`, mặc định 8s) + fade out cuối.

Nếu folder này trống, video vẫn tạo được bình thường — chỉ là không có nhạc (track câm).

## Bắt buộc: chỉ dùng nhạc royalty-free / được phép dùng thương mại

AI không tự tải nhạc về vì việc xác minh điều khoản license cần con người quyết định.
Nguồn gợi ý (free, không cần trả phí, được dùng cho mục đích thương mại/social media):

- **Pixabay Music** — pixabay.com/music — license Pixabay (CC0-like, không cần attribution)
- **YouTube Audio Library** — studio.youtube.com (mục Audio Library) — chọn nhạc "không cần ghi công"
- **Free Music Archive** — chỉ chọn track ghi rõ CC0 hoặc "free for commercial use"

Sau khi tải, đặt file `.mp3` trực tiếp vào folder này (không cần đổi tên).
Các file nhạc KHÔNG được commit lên git (xem `.gitignore`).
