// One link preview image per docs page, at /og/<page id>.png. Head.astro
// points og:image and twitter:image at it.
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { renderShareImage } from "@/lib/shareImage";

export const getStaticPaths = (async () => {
  const pages = await getCollection("docs");
  return pages.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: CollectionEntry<"docs"> }> = async ({ props }) => {
  const { title, description, kicker } = props.entry.data;
  // The home page title is the site name, which the card already shows.
  const png =
    props.entry.id === "index"
      ? await renderShareImage({ title: description ?? title })
      : await renderShareImage({ title, description, kicker });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
