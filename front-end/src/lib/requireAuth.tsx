import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

export async function requireAuth<T extends Record<string, any>>(
  ctx: GetServerSidePropsContext,
  getProps?: (user: any | null) => Promise<T>
): Promise<GetServerSidePropsResult<T & { user: any | null }>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
  headers: {
    cookie: ctx.req.headers.cookie || "",
  },
  credentials: "include",
});


    const user = res.ok ? await res.json() : null;

    const additionalProps = getProps ? await getProps(user) : ({} as T);

    return {
      props: {
        user,
        ...additionalProps,
      },
    };
  } catch (error) {
    const additionalProps = getProps ? await getProps(null) : ({} as T);
    return {
      props: {
        user: null,
        ...additionalProps,
      },
    };
  }
}
