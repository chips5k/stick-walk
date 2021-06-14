interface Simulation {
  startMs: number;
  endMs: number;
  pausedMs: number;
  running: boolean;
  state: State[];
}

interface State {
  startMs: number;
  endMs: number;
  entities: Map<string, Entity>;
}

interface Entity {
  rigidBody?: RigidBody;
}

interface RigidBody {
  edges: Map<string, Edge>;
}

interface Edge {
  begin: Particle;
  end: Particle;
}

interface Particle {
  position: Vector2d;
  mass: number;
  velocity: Vector2d;
  static: boolean;
}

interface Vector2d {
  x: number;
  y: number;
}

const simulation = {
  startMs: performance.now(),
  endMs: performance.now(),
  pausedMs: performance.now(),
  running: true,
  state: [
    {
      startMs: 0,
      endMs: 0,
      entities: {
        box: {
          rigidBody: {
            edges: {
              a: {
                begin: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
              },
              b: {
                begin: {
                  position: { x: 0, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 20, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "a" },
              },
              c: {
                begin: {
                  position: { x: 20, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 20, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "b" },
              },
              d: {
                begin: {
                  position: { x: 20, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "c", end: "a" },
              },
            },
          },
        },
        ground: {
          rigidBody: {
            edges: {
              main: {
                begin: {
                  position: { x: 0, y: 800 },
                  static: true,
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 600, y: 800 },
                  static: true,
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
              },
            },
          },
        },
        skeleton: {
          rigidBody: {
            edges: {
              head: {
                begin: {
                  position: { x: 0, y: -30 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: -40 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "neck" },
              },
              neck: {
                begin: {
                  position: { x: 0, y: -20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: -30 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "torso" },
              },
              leftArm: {
                begin: {
                  position: { x: 0, y: -20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "neck" },
              },
              rightArm: {
                begin: {
                  position: { x: 0, y: -20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "neck" },
              },
              torso: {
                begin: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: -20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
              },
              leftUpperLeg: {
                begin: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 10 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "torso" },
              },
              rightUpperLeg: {
                begin: {
                  position: { x: 0, y: 0 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 10 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "torso" },
              },
              leftLowerLeg: {
                begin: {
                  position: { x: 0, y: 10 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "leftUpperLeft" },
              },
              rightLowerLeg: {
                begin: {
                  position: { x: 0, y: 10 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                end: {
                  position: { x: 0, y: 20 },
                  mass: 5,
                  velocity: { x: 0, y: 0 },
                },
                parents: { begin: "rightUpperLeg" },
              },
            },
          },
        },
      },
    },
  ],
};
