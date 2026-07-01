import { ImgHTMLAttributes, VideoHTMLAttributes } from "react";
import { useSignedMedia } from "@/lib/storage-url";

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

export function SafeImg({ src, ...rest }: ImgProps) {
  const resolved = useSignedMedia(src);
  if (!resolved) return null;
  return <img src={resolved} {...rest} />;
}

type VideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string | null | undefined;
};

export function SafeVideo({ src, ...rest }: VideoProps) {
  const resolved = useSignedMedia(src);
  if (!resolved) return null;
  return <video src={resolved} {...rest} />;
}
