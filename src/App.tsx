import React, { useRef, useEffect, useState, RefObject, memo } from "react";
import styled from "styled-components";

const StyledContainer = styled.div`
  text-align: center;
`;

const StyledCanvas = styled.canvas`
  border-radius: 0.5em;
  border: 2px solid #ccc;
  margin-top: 0.5em;
`;

const peek = (array: any[], index: number) => array[array.length + index];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const UPDATES_PER_SECOND = 60;

interface InputRefs {
  paused: RefObject<boolean>;
  delayMs: RefObject<number>;
}

const createInputHandler = (inputRefs: InputRefs) => {
  return (tickStates: TickState[]) => {
    return [
      ...tickStates.slice(0, -1),
      {
        ...tickStates.slice(-1)[0],
        paused: inputRefs.paused.current,
        delayMs: inputRefs.delayMs.current,
      },
    ] as TickState[];
  };
};

const createPhysicsAdvancer =
  () => async (timeStepMs: number, physicsState: PhysicsState) => ({
    ...physicsState,
    physicsTimeMs: performance.now(),
  });

const createContext2DRenderer =
  (ctx: CanvasRenderingContext2D) => async (tickStates: TickState[]) => {
    await sleep(peek(tickStates, -1).delayMs ?? 0);
    // Render
    ctx.clearRect(0, 0, 800, 600);
    ctx.fillStyle = "#ddd";
    ctx.fillRect(20, 20, 300, 300);
    const currentTick = peek(tickStates, -1);
    const previousTick = peek(tickStates, -2) || currentTick;
    const elapsedSincePreviousFrameMs =
      currentTick.startMs - previousTick.startMs;
    const fps = Math.round(1000 / elapsedSincePreviousFrameMs);
    ctx.fillStyle = "#459617";
    ctx.fillText(`FPS: ${fps}`, 10, 10);
    ctx.fillText(`UPS: ${currentTick.physicsStates.length}`, 60, 10);
    ctx.fillText(`Delay(ms): ${currentTick.delayMs}`, 180, 10);
    ctx.fillText(`Paused: ${currentTick.paused}`, 280, 10);
  };

interface PhysicsState {}

const tick = async (
  tickStates: TickState[],
  advancePhysicsState: (
    timeStepMs: number,
    physicsState: PhysicsState
  ) => Promise<PhysicsState>,
  render: (tickStates: TickState[]) => Promise<void>
) => {
  const lastTick = peek(tickStates, -1);
  if (lastTick.paused) {
    const currentTickStartMs = performance.now();
    const elapsedSincePreviousTickMs = currentTickStartMs - lastTick.startMs;
    let accumulatedMs = elapsedSincePreviousTickMs + lastTick.accumulatedMs;
    const physicsTimeStepMs = 1000 / UPDATES_PER_SECOND;
    const lastPhysicsState = peek(lastTick.physicsState, -1);
    const newPhysicsStates: PhysicsState[] = [];
    while (accumulatedMs / physicsTimeStepMs >= 1) {
      newPhysicsStates.push(
        await advancePhysicsState(
          physicsTimeStepMs,
          peek(newPhysicsStates, -1) || lastPhysicsState
        )
      );
      accumulatedMs -= physicsTimeStepMs;
    }

    const newTickStates = [
      ...tickStates,
      {
        ...lastTick,
        accumulatedMs,
        startMs: currentTickStartMs,
        physicsStates: newPhysicsStates,
      },
    ];
    await render(newTickStates);
    return newTickStates;
  }
  await render(tickStates);
  return tickStates;
};

const tickViaRequestAnimationFrame = async (
  initialTickState: TickState,
  tickFn: (tickStates: TickState[]) => Promise<TickState[]>
) => {
  const iterate = async (tickStates: TickState[]) => {
    const newTickStates = (await tickFn(tickStates)).slice(-100);
    window.requestAnimationFrame(() => iterate(newTickStates));
    return newTickStates;
  };

  return await iterate([initialTickState]);
};
interface TickState {
  accumulatedMs: number;
  startMs: number;
  physicsState: PhysicsState;
  delayMs: number;
  paused: boolean;
}

const AppCanvas = memo(
  ({
    pausedRef,
    delayMsRef,
  }: {
    pausedRef: RefObject<boolean>;
    delayMsRef: RefObject<number>;
  }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      (async () => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");

        if (ctx) {
          const initialTickState: TickState = {
            accumulatedMs: 0,
            startMs: performance.now(),
            physicsState: {} as PhysicsState,
            delayMs: 0,
            paused: true,
          };

          const inputRefs = {
            paused: pausedRef,
            delayMs: delayMsRef,
          };

          const handleInput = createInputHandler(inputRefs);
          const ticker = async (tickStates: TickState[]) =>
            tick(
              await handleInput(tickStates),
              createPhysicsAdvancer(),
              createContext2DRenderer(ctx)
            );

          await tickViaRequestAnimationFrame(initialTickState, ticker);
        }
      })();
    }, [ref, delayMsRef, pausedRef]);

    return <StyledCanvas width={800} height={600} ref={ref} />;
  }
);

function App() {
  const delayMsRef = useRef(0);
  // Todo update ref automatically
  const [paused, setPaused] = useState(true);
  const pausedRef = useRef(true);

  return (
    <StyledContainer>
      <div>
        <h1>Stick Walk</h1>
        <p>
          Teach a stickman to walk using evolutionary programming programming
        </p>
        Frame delay(ms):
        <input
          type="text"
          onChange={(e) => {
            delayMsRef.current = parseInt(e.target.value) | 0;
          }}
        />{" "}
        <button
          onClick={() => {
            setPaused((prevState) => {
              pausedRef.current = !prevState;
              return !prevState;
            });
          }}
        >
          {paused ? "Pause" : "Resume"}
        </button>
      </div>
      <AppCanvas pausedRef={pausedRef} delayMsRef={delayMsRef} />
    </StyledContainer>
  );
}

export default App;
