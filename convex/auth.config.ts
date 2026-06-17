// Google OAuth JWT provider configuration for Convex.
// The applicationID must be your Google Web Client ID (type: "Web application")
// which Convex uses to verify incoming ID tokens via Google's JWKS endpoint.
//
// IMPORTANT: Set the GOOGLE_WEB_CLIENT_ID environment variable in the Convex
// dashboard: https://dashboard.convex.dev/d/trustworthy-ostrich-164/settings/environment-variables
export default {
    providers: [
        {
            domain: "https://accounts.google.com",
            applicationID: process.env.GOOGLE_WEB_CLIENT_ID ?? "295671462958-htienc7pqh7t5lv1p282ol5oiarik7ec.apps.googleusercontent.com",
        },
    ],
};
