import { IsArray, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

// Permissive cùng lý do với CreatePostDto — post.service.updatePost() tự
// clamp/whitelist từng field, DTO chỉ thêm whitelist + type-safety.
//
// LƯU Ý: updatePost nhận JSON body (khác createPost multipart) — web/app gửi
// `price` là number (không phải string như multipart form field). Verify thực tế
// trước khi đổi type: web/app/posts/edit/page.tsx + app/lib/screens/post/edit_post_screen.dart.
export class UpdatePostDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() @MaxLength(50) province?: string;
  @IsOptional() @IsString() @MaxLength(50) district?: string;
  @IsOptional() @IsString() @MaxLength(50) ward?: string;
  @IsOptional() @IsString() @MaxLength(200) addressDetail?: string;
  @IsOptional() @IsString() listingType?: string;
  @IsOptional() @IsString() itemCategory?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
}
