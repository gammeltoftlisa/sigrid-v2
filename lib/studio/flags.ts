/**
 * The studio assistant (AI-written guides) is built but switched off for the MVP:
 * makers write guides by hand. Set NEXT_PUBLIC_STUDIO_AI=on to turn it on, in both
 * the editor and the API route. Leave it off on any public deployment until makers
 * sign in, or anyone with the link could spend the AI credits.
 */
export const STUDIO_AI_ENABLED = process.env.NEXT_PUBLIC_STUDIO_AI === 'on'
