import React, { useRef, useEffect, useState, RefObject, memo } from "react";
import styled from "styled-components";

const StyledContainer = styled.div`
  text-align: center;
`;

const StyledCanvas = styled.canvas`
  border-radius: 0.5em;
  border: 2px solid #ccc;
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const UPDATES_PER_SECOND = 60;

const AppCanvas = memo(({ delayRef }: { delayRef: RefObject<number> }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    (async () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      const running = true;

      if (ctx) {
        const next = async (
          accumulatedMs: number = 0,
          previousFrameStartMs: number = performance.now()
        ) => {
          const currentFrameStartMs = performance.now();
          // Delta between previous and current frames
          const elapsedSincePreviousFrameMs =
            currentFrameStartMs - previousFrameStartMs;
          accumulatedMs += elapsedSincePreviousFrameMs;
          const physicsTimeMs = 1000 / UPDATES_PER_SECOND;
          let updates = 0;
          while (accumulatedMs / physicsTimeMs >= 1) {
            accumulatedMs -= physicsTimeMs;
            updates++;
          }

          await sleep(delayRef.current ?? 0);
          // Render
          ctx.clearRect(0, 0, 800, 600);
          ctx.fillStyle = "#ddd";
          ctx.fillRect(20, 20, 300, 300);

          const fps = Math.round(1000 / elapsedSincePreviousFrameMs);
          ctx.fillStyle = "#459617";
          ctx.fillText(`FPS: ${fps}`, 10, 10);
          ctx.fillText(`UPS: ${updates}`, 60, 10);

          if (running) {
            window.requestAnimationFrame(() => {
              next(accumulatedMs, currentFrameStartMs);
            });
          }
        };

        next();
      }
    })();
  }, [ref]);

  return <StyledCanvas width={800} height={600} ref={ref} />;
});

function App() {
  const delayRef = useRef(0);
  return (
    <StyledContainer>
      <div>
        <h1>Stick Walk</h1>
        <p>
          Teach a stickman to walk using evolutionary programming programming
        </p>
        Frame delay:
        <input
          type="text"
          onChange={(e) => {
            delayRef.current = parseInt(e.target.value) | 0;
          }}
        />
      </div>
      <AppCanvas delayRef={delayRef} />
    </StyledContainer>
  );
}

export default App;
