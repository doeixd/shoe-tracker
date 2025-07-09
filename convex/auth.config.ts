export default {
  providers: [
    {
      domain: process?.env?.CONVEX_SITE_URL || "https://myshoetracker.fun",
      applicationID: "convex",
    },
  ],
};
