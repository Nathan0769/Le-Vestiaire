import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return redirect(`/wishlist/share/${id}`);
}
