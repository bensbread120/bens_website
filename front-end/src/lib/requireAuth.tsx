import { User } from "@/services/api";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export async function requireAuth<T extends Record<string, unknown>>(
  ctx: GetServerSidePropsContext,
  getProps?: (user: User | null) => Promise<T>
): Promise<GetServerSidePropsResult<T & { user: User | null }>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
  headers: {
    cookie: ctx.req.headers.cookie || "",
  },
  credentials: "include",
});


    const user: User = res.ok ? await res.json() : null;

    const additionalProps = getProps ? await getProps(user) : ({} as T);

    return {
      props: {
        user,
        ...additionalProps,
      },
    };
  } catch  {
    const additionalProps = getProps ? await getProps(null) : ({} as T);
    return {
      props: {
        user: null,
        ...additionalProps,
      },
    };
  }
}
