import { auth } from "@/auth";
import { getActiveUserById, listUsers } from "@/features/users/repository";

export async function GET() {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, {
      status: 403,
    });
  }

  try {
    return Response.json({ items: await listUsers() });
  } catch (error) {
    console.error("Could not load member records.", error);
    return Response.json({ error: "Could not load members." }, { status: 500 });
  }
}
