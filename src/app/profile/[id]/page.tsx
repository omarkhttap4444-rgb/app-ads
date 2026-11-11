import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfileIdRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/store/${encodeURIComponent(id)}`);
}

