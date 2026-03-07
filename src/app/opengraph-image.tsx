import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = {
  width: 1536,
  height: 1024,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const buffer = await readFile(
    join(process.cwd(), "public", "asu_network.png"),
  );
  return new Response(buffer, {
    headers: { "Content-Type": contentType },
  });
}
