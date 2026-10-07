# Architecture rules
- Use react-easy-crop for interactive avatar framing and a canvas export capped at 320px without upscaling; this keeps touch gestures and output sizing consistent.
- Persist a new avatar reference only after successful upload and profile update, and retain private-storage signed URL rendering; this avoids showing failed changes or exposing private files.