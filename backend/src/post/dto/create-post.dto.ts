import { IsOptional, IsString, MaxLength } from 'class-validator';

// Permissive theo thiết kế: post.service.createPost() đã tự clamp/whitelist
// từng field (MAX_TITLE_LEN, VALID_ITEM_CATEGORIES, fallback mặc định...).
// DTO này chỉ thêm whitelist (strip field lạ) + type-safety, KHÔNG strict-reject
// để tránh đổi hành vi API hiện tại (client cũ gửi field hơi lệch vẫn fallback
// được thay vì nhận lỗi 400 mới).
export class CreatePostDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsString() itemCategory?: string;
  @IsOptional() @IsString() listingType?: string;
  @IsOptional() @IsString() postType?: string;
  @IsOptional() @IsString() price?: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsString() @MaxLength(50) province?: string;
  @IsOptional() @IsString() @MaxLength(50) district?: string;
  @IsOptional() @IsString() @MaxLength(50) ward?: string;
  @IsOptional() @IsString() @MaxLength(200) addressDetail?: string;
  @IsOptional() @IsString() @MaxLength(50) subType?: string;
  @IsOptional() @IsString() area?: string;
  @IsOptional() @IsString() bedrooms?: string;
  @IsOptional() @IsString() @MaxLength(20) priceUnit?: string;
  @IsOptional() @IsString() @MaxLength(200) serviceArea?: string;
}
