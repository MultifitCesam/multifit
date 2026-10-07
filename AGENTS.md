# Architecture rules
- Use react-easy-crop for interactive avatar framing and a canvas export capped at 320px without upscaling; this keeps touch gestures and output sizing consistent.
- Persist a new avatar reference only after successful upload and profile update, and retain private-storage signed URL rendering; this avoids showing failed changes or exposing private files.
- Order profile posts server-side by is_pinned, created_at, and id descending; keep the community feed chronological and authorize pin updates through owner RLS.