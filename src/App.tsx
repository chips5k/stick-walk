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

const peek = function <T>(array: T[], index: number) {
  return array[array.length + index];
};

const round = (number: number, decimals: number) => {
  return Math.round(number * Math.pow(10, decimals)) * Math.pow(10, -decimals);
};
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
    startMs: performance.now(),
  });

const createContext2DRenderer = (ctx: CanvasRenderingContext2D) => {
  const timing = {
    frames: 0,
    prevMs: performance.now(),
    currMs: performance.now(),
    fps: "0",
    period: 10,
  };

  return async (tickStates: TickState[]) => {
    timing.frames++;
    if (timing.frames === timing.period) {
      timing.prevMs = timing.currMs;
      timing.currMs = performance.now();
      timing.frames = 0;

      const delta = round(timing.currMs - timing.prevMs, 2);
      const ratio = 1000 / delta;
      timing.fps = Math.round(ratio * timing.period).toFixed(0);
    }
    await sleep(peek(tickStates, -1).delayMs ?? 0);

    const currentTick = peek(tickStates, -1);
    const previousTick = peek(tickStates, -2) || currentTick;

    const physicsState = peek(currentTick.physicsStates, -1);
    ctx.clearRect(0, 0, 800, 600);
    ctx.fillStyle = "#ddd";

    ctx.fillRect(20, 20, 300, 300);

    physicsState.rigidBodies.forEach((rb) => {
      ctx.strokeStyle = "#000";
      rb.edges.forEach((e) => {
        ctx.beginPath();
        ctx.moveTo(e.start.x, e.start.y);
        ctx.lineTo(e.end.x, e.end.y);
        ctx.stroke();
      });
    });

    ctx.fillStyle = "#459617";
    ctx.fillText(`FPS: ${timing.fps}`, 10, 10);
    ctx.fillText(`UPS: ${currentTick.physicsStates.length}`, 60, 10);
    ctx.fillText(`Delay(ms): ${currentTick.delayMs}`, 180, 10);
    ctx.fillText(`Paused: ${currentTick.paused}`, 280, 10);
  };
};

interface Vector {
  x: number;
  y: number;
}

interface Edge {
  start: Vector;
  end: Vector;
}

interface RigidBody {
  edges: Edge[];
  position: Vector;
  velocity: Vector;
}
interface PhysicsState {
  startMs: number;
  rigidBodies: RigidBody[];
}

const tick = async (
  tickStates: TickState[],
  advancePhysicsState: (
    timeStepMs: number,
    physicsState: PhysicsState
  ) => Promise<PhysicsState>,
  render: (tickStates: TickState[]) => Promise<void>
) => {
  const lastTick = peek(tickStates, -1);
  const currentTickStartMs = performance.now();
  if (!lastTick.paused) {
    const lastPhysicsState = peek(lastTick.physicsStates, -1);
    const elapsedSincePreviousTickMs =
      currentTickStartMs - lastPhysicsState.startMs;
    let accumulatedMs = elapsedSincePreviousTickMs + lastTick.accumulatedMs;
    const physicsTimeStepMs = 1000 / UPDATES_PER_SECOND;
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

    //If not enough time has accumulated to generate a new physics state this can occur
    if (newPhysicsStates.length === 0) {
      newPhysicsStates.push(lastPhysicsState);
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

const createRectangleRigidBody = (
  x: number,
  y: number,
  width: number,
  height: number
): RigidBody => {
  return {
    edges: [
      {
        start: { x, y },
        end: { x: x, y: y + height },
      },
      {
        start: { x: x, y: y + height },
        end: { x: x + width, y: y + height },
      },
      {
        start: { x: x + width, y: y + height },
        end: { x: x + width, y: y },
      },
      {
        start: { x: x + width, y: y },
        end: { x, y },
      },
    ],
    position: { x, y },
    velocity: { x: 0.5, y: 0.5 },
  };
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
  physicsStates: PhysicsState[];
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
            physicsStates: [
              {
                startMs: 0,
                rigidBodies: [createRectangleRigidBody(0, 0, 100, 100)],
              } as PhysicsState,
            ],
            delayMs: 0,
            paused: false,
          };

          const inputRefs = {
            paused: pausedRef,
            delayMs: delayMsRef,
          };

          const handleInput = createInputHandler(inputRefs);
          const advancePhysics = createPhysicsAdvancer();
          const render = createContext2DRenderer(ctx);

          const ticker = async (tickStates: TickState[]) =>
            tick(await handleInput(tickStates), advancePhysics, render);

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
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

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
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <AppCanvas pausedRef={pausedRef} delayMsRef={delayMsRef} />
    </StyledContainer>
  );
}

export default App;
