-- AddCheckConstraint: Post.status must be one of the valid values
-- Prevents admin/direct-DB from inserting arbitrary status strings
-- Valid values match VALID_POST_STATUSES + DELETED_BY_ADMIN_STATUS in post.service.ts

ALTER TABLE "Post"
  ADD CONSTRAINT "Post_status_valid"
  CHECK (status IN ('available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin'));
