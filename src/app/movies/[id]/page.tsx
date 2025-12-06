import Movie from "~/app/_components/movie";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-background min-h-screen">
      <Movie movieId={id} />
    </div>
  );
}
