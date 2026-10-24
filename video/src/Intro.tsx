import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#faf7f2", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 120, color: "#2b2b2b", opacity }}>My Diary</h1>
    </AbsoluteFill>
  );
};
