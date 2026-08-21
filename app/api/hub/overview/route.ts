import { NextResponse } from 'next/server';
import { HUB, stripHtml } from '@/lib/federated';

async function read(path: string) {
  const response = await fetch(`${HUB}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

export async function GET() {
  const [latestResult, categoriesResult, topResult, aboutResult] = await Promise.allSettled([
    read('/latest.json'),
    read('/categories.json'),
    read('/top.json?period=weekly'),
    read('/about.json'),
  ]);

  const latestData = latestResult.status === 'fulfilled' ? latestResult.value : null;
  const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
  const topData = topResult.status === 'fulfilled' ? topResult.value : null;
  const aboutData = aboutResult.status === 'fulfilled' ? aboutResult.value : null;

  const latest = [...(latestData?.topic_list?.topics ?? [])]
    .sort((a: any, b: any) => Date.parse(b.last_posted_at ?? b.created_at ?? '0') - Date.parse(a.last_posted_at ?? a.created_at ?? '0'))
    .slice(0, 12)
    .map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      url: `${HUB}/t/${topic.slug}/${topic.id}`,
      posts: topic.posts_count,
      views: topic.views,
      categoryId: topic.category_id,
      lastPostedAt: topic.last_posted_at,
      tags: topic.tags ?? [],
    }));

  const categories = [...(categoriesData?.category_list?.categories ?? [])]
    .sort((a: any, b: any) => Number(a.position ?? 999) - Number(b.position ?? 999))
    .map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: stripHtml(category.description_text ?? category.description ?? ''),
      topicCount: category.topic_count,
      postCount: category.post_count,
      position: category.position,
      parentCategoryId: category.parent_category_id,
      subcategoryIds: category.subcategory_ids ?? [],
      color: category.color,
      url: `${HUB}/c/${category.slug}/${category.id}`,
    }));

  const top = (topData?.topic_list?.topics ?? []).slice(0, 8).map((topic: any) => ({
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    url: `${HUB}/t/${topic.slug}/${topic.id}`,
    posts: topic.posts_count,
    views: topic.views,
    likeCount: topic.like_count,
  }));

  const rawStats = aboutData?.about?.stats ?? {};
  const numeric = (...values: unknown[]) => values.find((value) => typeof value === 'number') as number | undefined;
  const stats = {
    topics: numeric(rawStats.topics_count, rawStats.topic_count),
    posts: numeric(rawStats.posts_count, rawStats.post_count),
    users: numeric(rawStats.users_count, rawStats.user_count),
    activeUsers7Days: numeric(rawStats.active_users_7_days),
    topics7Days: numeric(rawStats.topics_7_days),
    posts7Days: numeric(rawStats.posts_7_days),
  };

  return NextResponse.json({
    origin: HUB,
    latest,
    categories,
    top,
    stats,
    health: {
      latest: latestResult.status === 'fulfilled',
      categories: categoriesResult.status === 'fulfilled',
      top: topResult.status === 'fulfilled',
      stats: aboutResult.status === 'fulfilled',
    },
  });
}
