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
            applicationID: process.env.GOOGLE_WEB_CLIENT_ID ?? "295671462958-isg76jc0rjt3tl40n3r5l8cq46ke4r9k.apps.googleusercontent.com",
        },
    ],
};
