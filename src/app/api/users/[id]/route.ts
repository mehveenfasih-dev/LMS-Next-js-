import { auth } from "@/auth";
import {
  getActiveUserById,
  setUserActive,
} from "@/features/users/repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user
    ? await getActiveUserById(session.user.id)
    : undefined;
  if (user?.role !== "admin") {
    return Response.json({ error: "Administrator access is required." }, {
      status: 403,
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "A valid JSON body is required." }, {
      status: 400,
    });
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("active" in payload) ||
    typeof payload.active !== "boolean"
  ) {
    return Response.json({ error: "The active field must be a boolean." }, {
      status: 400,
    });
  }

  const { id } = await params;
  if (user.id === id) {
    return Response.json({ error: "You cannot disable your own account." }, {
      status: 400,
    });
  }
  try {
    const user = await setUserActive(id, payload.active);
    if (!user) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }
    return Response.json(user);
  } catch (error) {
    console.error("Could not update member access.", error);
    return Response.json({ error: "Could not update member access." }, {
      status: 500,
    });
  }
}
