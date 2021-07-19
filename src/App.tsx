import React, { useRef, useEffect, memo } from "react";
import styled from "styled-components";

const StyledContainer = styled.div`
  text-align: center;
`;

const StyledCanvas = styled.canvas`
  border-radius: 0.5em;
  border: 2px solid #ccc;
  margin-top: 0.5em;
`;

interface Functor<T> {
  map: (fn: Functor<T>) => Functor<T>;
}

interface CanvasContext2dRenderer {
  default: (ctx: CanvasRenderingContext2D) => void;
}

const canvasContext2dRenderer = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, 800, 600);
  ctx.fillRect(Math.random() * 100, Math.random() * 30, 400, 100);
  return ctx;
};

const createFrameRequestRenderer = (
  requestFrame: (cb: FrameRequestCallback) => void
) => {
  return (render: (ctx: CanvasRenderingContext2D) => void) => {
    return (ctx: CanvasRenderingContext2D) => {
      requestFrame(() => {
        render(ctx);
        requestFrame(() => {
          render(ctx);
        });
      });
      return ctx;
    };
  };
};

function Maybe<T>(value: T | null | undefined) {
  return {
    map: <T2,>(fn: (a: T) => T2 | null | undefined) => {
      if (value) {
        return Maybe<T2>(fn(value));
      }
      return Maybe<T2>(null);
    },
    getOrElse: (dflt: any) => {
      if (value) {
        return value;
      }
      return dflt;
    },
  };
}

function Flow(...fns: ((a: any) => any)[]) {
  return fns.reduce((prev, curr) => curr(prev));
}

const AppCanvas = memo(() => {
  const ref = useRef<HTMLCanvasElement>(null);
  const renderer = Flow(
    canvasContext2dRenderer,
    createFrameRequestRenderer(requestAnimationFrame)
  );

  useEffect(() => {
    Maybe(ref.current)
      .map((c) => c.getContext("2d"))
      .map(renderer);
  });

  return <StyledCanvas width={800} height={600} ref={ref} />;
});

function App() {
  return (
    <StyledContainer>
      <div>
        <h1>Stick Walk</h1>
        <p>
          Teach a stickman to walk using evolutionary programming programming
        </p>
      </div>
      <AppCanvas />
    </StyledContainer>
  );
}

export default App;
