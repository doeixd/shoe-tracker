// This file is not used by the current auth setup
// The actual auth configuration is in convex/auth.ts using convexAuth()
export default {
  providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }],
};
