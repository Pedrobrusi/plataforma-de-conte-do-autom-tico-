import { GRAPH_BASE } from "./config";

export type MediaType = "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL";

export type CreateContainerInput = {
  igUserId: string;
  accessToken: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  mediaType?: Exclude<MediaType, "IMAGE">;
  isCarouselItem?: boolean;
  children?: string[];
};

async function graphFetch(path: string, params: Record<string, string>, method: "GET" | "POST" = "GET") {
  const query = new URLSearchParams(params);
  const url = method === "GET" ? `${GRAPH_BASE}${path}?${query.toString()}` : `${GRAPH_BASE}${path}`;
  const res = await fetch(url, {
    method,
    body: method === "POST" ? query : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message ?? JSON.stringify(data);
    throw new Error(`Instagram Graph API error (${res.status}): ${message}`);
  }
  return data;
}

/** Cria um container de mídia (imagem, vídeo, reel ou item de carrossel). */
export async function createMediaContainer(input: CreateContainerInput): Promise<{ id: string }> {
  const params: Record<string, string> = { access_token: input.accessToken };
  if (input.imageUrl) params.image_url = input.imageUrl;
  if (input.videoUrl) params.video_url = input.videoUrl;
  if (input.caption) params.caption = input.caption;
  if (input.mediaType) params.media_type = input.mediaType;
  if (input.isCarouselItem) params.is_carousel_item = "true";
  if (input.children?.length) params.children = input.children.join(",");

  const data = await graphFetch(`/${input.igUserId}/media`, params, "POST");
  return { id: String(data.id) };
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";

export async function getContainerStatus(
  containerId: string,
  accessToken: string,
): Promise<ContainerStatus> {
  const data = await graphFetch(`/${containerId}`, { fields: "status_code", access_token: accessToken });
  return data.status_code as ContainerStatus;
}

/** Aguarda o processamento do container (necessário para vídeo/reels). */
export async function pollContainerUntilFinished(
  containerId: string,
  accessToken: string,
  { timeoutMs = 60_000, intervalMs = 3_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<ContainerStatus> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await getContainerStatus(containerId, accessToken);
    if (status === "FINISHED" || status === "ERROR" || status === "EXPIRED") return status;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timeout aguardando processamento do container ${containerId}`);
}

export async function publishContainer(
  igUserId: string,
  creationId: string,
  accessToken: string,
): Promise<{ mediaId: string }> {
  const data = await graphFetch(
    `/${igUserId}/media_publish`,
    { creation_id: creationId, access_token: accessToken },
    "POST",
  );
  return { mediaId: String(data.id) };
}

export async function getMediaPermalink(
  mediaId: string,
  accessToken: string,
): Promise<{ permalink: string; mediaProductType: string }> {
  const data = await graphFetch(`/${mediaId}`, {
    fields: "permalink,media_product_type",
    access_token: accessToken,
  });
  return { permalink: data.permalink, mediaProductType: data.media_product_type };
}
