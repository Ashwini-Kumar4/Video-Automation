import React from "react";
import { Composition } from "remotion";
import {
  ShortVideoComposition,
  ShortCompositionProps,
} from "@/components/remotion/ShortVideoComposition";

const defaultProps: ShortCompositionProps = {
  videoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  startTime: 0,
  endTime: 30,
  captions: [],
  captionPreset: "hormozi",
  cropMode: "cover",
  hookText: "Viral Short Hook",
  title: "Short Clip",
  showHookBadge: true,
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortVideoComposition"
        component={ShortVideoComposition as any}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as any}
        calculateMetadata={({ props }) => {
          const start = Number(props.startTime) || 0;
          const end = Number(props.endTime) || 30;
          const durationSeconds = Math.max(1, end - start);
          const durationInFrames = Math.max(1, Math.round(durationSeconds * 30));

          return {
            durationInFrames,
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
    </>
  );
};
