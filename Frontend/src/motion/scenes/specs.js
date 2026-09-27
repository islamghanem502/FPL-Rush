// Composition sizes live apart from the scenes, so pages can reserve the space
// without pulling Remotion into the main bundle.
export const HEADLINE = { compositionWidth: 1000, compositionHeight: 440, fps: 30, durationInFrames: 72 };
export const CHALLENGE = { compositionWidth: 900, compositionHeight: 720, fps: 30, durationInFrames: 300 };

export const aspect = (spec) => `${spec.compositionWidth} / ${spec.compositionHeight}`;
