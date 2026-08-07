// Procedural crescent moon (no user-supplied asset exists for this yet).
// Same box-shadow pixel-grid technique as the cloud variants: a FILL layer
// (opaque paper-white, so it occludes whatever is behind it) plus a black
// OUTLINE layer drawn on top.
export const MOON_W = 14
export const MOON_H = 14
export const MOON_FILL: number[] = [1,4,2,3,3,2,3,3,4,1,4,2,5,1,5,2,6,1,6,2,6,3,7,1,7,2,7,3,8,1,8,2,8,3,9,1,9,2,9,3,9,4,10,2,10,3,10,4,10,5,10,6,11,3,11,4,11,5,11,6,11,7,11,8,11,9,11,10,12,4,12,5,12,6,12,7,12,8,12,9]
export const MOON_OUTLINE: number[] = [1,4,2,3,3,2,3,3,4,1,4,2,5,1,5,2,6,1,6,3,7,1,7,3,8,1,8,3,9,1,9,4,10,2,10,5,10,6,11,3,11,7,11,8,11,9,11,10,12,4,12,5,12,6,12,7,12,8,12,9]
