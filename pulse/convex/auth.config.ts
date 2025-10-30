import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

const authConfig = convexAuth({
  providers: [Password],
});

export default authConfig;

export const { auth, signIn, signOut, store } = authConfig;