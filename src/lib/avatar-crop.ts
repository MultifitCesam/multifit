import type { Area } from "react-easy-crop";

export function avatarOutputSize(crop: Pick<Area, "width" | "height">) {
  return Math.max(1, Math.min(320, Math.floor(crop.width), Math.floor(crop.height)));
}

export async function cropAvatar(source: string, crop: Area): Promise<Blob> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = avatarOutputSize(crop);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a foto");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Não foi possível recortar a foto")), "image/jpeg", 0.9);
  });
}