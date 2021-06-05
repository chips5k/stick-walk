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

const createPhysicsAdvancer =
  () => async (timeStepMs: number, physicsState: PhysicsState) =>
    physicsState;

const createContext2DRenderer =
  (ctx: CanvasRenderingContext2D) => async (tickData: TickData) => {
    await sleep(tickData.refs.delay.current ?? 0);
    // Render
    ctx.clearRect(0, 0, 800, 600);
    ctx.fillStyle = "#ddd";
    ctx.fillRect(20, 20, 300, 300);
    const elapsedSincePreviousFrameMs =
      performance.now() - tickData.previousTickStartMs;
    const fps = Math.round(1000 / elapsedSincePreviousFrameMs);
    ctx.fillStyle = "#459617";
    ctx.fillText(`FPS: ${fps}`, 10, 10);
    ctx.fillText(`UPS: ${tickData.previousTickPhysicsUpdates}`, 60, 10);
  };

interface PhysicsState {}

const tick = async (
  tickData: TickData,
  advancePhysicsState: (
    timeStepMs: number,
    physicsState: PhysicsState
  ) => Promise<PhysicsState>,
  render: (tickData: TickData) => void
) => {
  await render(tickData);
  const currentTickStartMs = performance.now();
  const elapsedSincePreviousTickMs =
    currentTickStartMs - tickData.previousTickStartMs;
  let accumulatedMs = elapsedSincePreviousTickMs + tickData.accumulatedMs;
  const physicsTimeStepMs = 1000 / UPDATES_PER_SECOND;
  let updates = 0;
  let currentPhysicsState = tickData.previousPhysicsState;

  while (accumulatedMs / physicsTimeStepMs >= 1) {
    currentPhysicsState = await advancePhysicsState(
      physicsTimeStepMs,
      currentPhysicsState
    );
    accumulatedMs -= physicsTimeStepMs;
    updates++;
  }

  const newTickData = {
    ...tickData,
    accumulatedMs,
    previousTickStartMs: currentTickStartMs,
    previousTickPhysicsUpdates: updates,
    previousPhysicsState: currentPhysicsState,
  };
  return newTickData;
};

const tickViaRequestAnimationFrame = async (
  initialTickData: TickData,
  tickFn: (tickData: TickData) => Promise<TickData>
) => {
  const iterate = async (tickData: TickData) => {
    if (tickData.refs.running.current) {
      const newTickData = await tickFn(tickData);
      if (tickData.refs.running.current) {
        window.requestAnimationFrame(() => {
          iterate(newTickData);
        });
      }
      return newTickData;
    }
    return tickData;
  };

  return await iterate(initialTickData);
};

interface TickData {
  accumulatedMs: number;
  previousTickStartMs: number;
  previousPhysicsState: PhysicsState;
  previousTickPhysicsUpdates: number;
  refs: { delay: RefObject<number>; running: RefObject<boolean> };
}

const AppCanvas = memo(
  ({
    runningRef,
    delayRef,
  }: {
    runningRef: RefObject<boolean>;
    delayRef: RefObject<number>;
  }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      (async () => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");

        if (ctx) {
          const initialTickData: TickData = {
            accumulatedMs: 0,
            previousTickStartMs: performance.now(),
            previousPhysicsState: {} as PhysicsState,
            previousTickPhysicsUpdates: 0,
            refs: {
              delay: delayRef,
              running: runningRef,
            },
          };

          const ticker = (tickData: TickData) =>
            tick(
              tickData,
              createPhysicsAdvancer(),
              createContext2DRenderer(ctx)
            );

          await tickViaRequestAnimationFrame(initialTickData, ticker);
        }
      })();
    }, [ref, delayRef, runningRef]);

    return <StyledCanvas width={800} height={600} ref={ref} />;
  }
);

function App() {
  const delayRef = useRef(0);
  // Todo update ref automatically
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);

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
        <button
          onClick={() => {
            setRunning((prevState) => {
              runningRef.current = !prevState;
              return !prevState;
            });
          }}
        >
          {running ? "Stop" : "Start"}
        </button>
      </div>
      <AppCanvas runningRef={runningRef} delayRef={delayRef} />
    </StyledContainer>
  );
}

export default App;
