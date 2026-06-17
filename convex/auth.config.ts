export default {
    providers: [
        {
            domain: "https://accounts.google.com",
            applicationID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? "",
        },
    ],
};