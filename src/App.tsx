import React, { useRef, useEffect } from "react";
import styled from "styled-components";

const StyledContainer = styled.div`
  text-align: center;
`;

const StyledCanvas = styled.canvas`
  border-radius: 0.5em;
  border: 2px solid #ccc;
`;

const AppCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(20, 20, 300, 300);
    }
  }, [ref]);

  return <StyledCanvas width={800} height={600} ref={ref} />;
};

function App() {
  return (
    <StyledContainer>
      <h1>Stick Walk</h1>
      <p>Teach a stickman to walk using evolutionary programming programming</p>
      <AppCanvas />
    </StyledContainer>
  );
}

export default App;
