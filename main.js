let gl;
let program;
let canvas;
const { vec3, mat4 } = glMatrix;
const { toRadian } = glMatrix.glMatrix;

let viewMatrix, projectionMatrix;
let eye, target, up;

let objects = [];
let posLoc, colorLoc, modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;

const movementSpeed = 0.02;
const mouseMovementScaler = 0.002;

let isMouseDown = false;

const MOVEMENT_DIRECTION = {
  FORWARD: 0,
  BACKWARD: 1,
  RIGHT: 2,
  LEFT: 3,
};

function main() {
  // Get canvas and setup WebGL context
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.75, 0.8, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // Init shader program via additional function and bind it
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  setupMatrices();
  setupObjects();

  document.addEventListener("keypress", keyCameraMovementXZ);

  canvas.addEventListener("mousedown", () => (isMouseDown = true));
  canvas.addEventListener("mouseup", () => (isMouseDown = false));
  canvas.addEventListener("mousemove", dragCameraMovementXZ);
  canvas.addEventListener("wheel", scrollCameraMovementZ, true);

  // Only clear once
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  render();
}

function setupMatrices() {
  // Get locations of shader variables
  posLoc = gl.getAttribLocation(program, "vPosition");
  colorLoc = gl.getAttribLocation(program, "vColor");

  modelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");
  viewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

  eye = vec3.fromValues(0.0, 0.3, 4.0);
  target = vec3.fromValues(0.0, 0.3, 0.0);
  up = vec3.fromValues(0.0, 1.0, 0.0);

  viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, eye, target, up);

  projectionMatrix = mat4.perspective(
    mat4.create(),
    toRadian(45.0),
    canvas.width / canvas.height,
    0.0001,
    1000.0
  );

  updateUniforms();
}

function setupObjects() {
  const island = new Island();

  const treeInFrontLeft = new Tree();
  const treeInFrontRight = new Tree();
  const treeInBackMiddle = new Tree();

  const cloudBehindIsland = new Cloud();
  const cloudOutsideIsland = new Cloud();
  const cloudOverIsland = new Cloud();

  treeInFrontLeft.setModelMatrix({
    position: [-1, 0.5, 0.5],
    scale: [0.2, 0.2, 0.2],
  });
  treeInFrontRight.setModelMatrix({
    position: [1, 0.5, 0.5],
    orientation: [0, -160, 0],
    scale: [0.2, 0.2, 0.2],
  });
  treeInBackMiddle.setModelMatrix({
    position: [0, 0.8, -2],
    orientation: [0, 60, 0],
    scale: [0.3, 0.3, 0.3],
  });

  cloudBehindIsland.setModelMatrix({
    position: [0, 1.4, -3],
    scale: [0.5, 0.5, 0.5],
  });
  cloudOutsideIsland.setModelMatrix({
    position: [2.3, 1, 0],
    orientation: [0, -90, -50],
    scale: [0.4, 0.5, 0.6],
  });
  cloudOverIsland.setModelMatrix({
    position: [-0.9, 2, 0],
    orientation: [20, 130, 0],
    scale: [0.6, 0.6, 0.6],
  });

  objects.push(
    island,
    treeInFrontLeft,
    treeInFrontRight,
    treeInBackMiddle,
    cloudBehindIsland,
    cloudOutsideIsland,
    cloudOverIsland
  );
}

function render() {
  objects.forEach((o) => o.render());
  updateUniforms();
  requestAnimationFrame(render);
}

function updateUniforms() {
  gl.uniformMatrix4fv(viewMatrixLoc, false, viewMatrix);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix);
}

function keyCameraMovementXZ({ key }) {
  switch (key) {
    case "w":
      moveCamera(MOVEMENT_DIRECTION.FORWARD, movementSpeed);
      break;
    case "s":
      moveCamera(MOVEMENT_DIRECTION.BACKWARD, movementSpeed);
      break;
    case "d":
      moveCamera(MOVEMENT_DIRECTION.RIGHT, movementSpeed);
      break;
    case "a":
      moveCamera(MOVEMENT_DIRECTION.LEFT, movementSpeed);
      break;
    case "q":
      rotateCameraY(movementSpeed);
      break;
    case "e":
      rotateCameraY(-movementSpeed);
      break;
  }
}

function scrollCameraMovementZ(event) {
  const scrollDirection = Math.sign(-event.deltaY);
  const movementDirection =
    scrollDirection === 1
      ? MOVEMENT_DIRECTION.FORWARD
      : MOVEMENT_DIRECTION.BACKWARD;

  moveCamera(movementDirection, movementSpeed);
}

function dragCameraMovementXZ({ movementX, movementY }) {
  if (!isMouseDown) return;
  const xMovementDirection =
    Math.sign(movementX) === 1
      ? MOVEMENT_DIRECTION.LEFT
      : MOVEMENT_DIRECTION.RIGHT;

  moveCamera(xMovementDirection, Math.abs(movementX * mouseMovementScaler));

  const yMovementDirection =
    Math.sign(-movementY) === 1
      ? MOVEMENT_DIRECTION.FORWARD
      : MOVEMENT_DIRECTION.BACKWARD;

  moveCamera(yMovementDirection, Math.abs(movementY * mouseMovementScaler));
}

function rotateCameraY(angle) {
  vec3.rotateY(target, target, eye, angle);
  mat4.lookAt(viewMatrix, eye, target, up);
}

function moveCamera(direction, speed = 1) {
  // get the look direction vector by subtracting the eye from the target
  const movement = vec3.sub(vec3.create(), target, eye);
  vec3.scale(movement, movement, speed);

  if (direction === MOVEMENT_DIRECTION.FORWARD) {
    vec3.add(eye, eye, movement);
    vec3.add(target, target, movement);
  } else if (direction === MOVEMENT_DIRECTION.BACKWARD) {
    vec3.sub(eye, eye, movement);
    vec3.sub(target, target, movement);
  } else if (direction === MOVEMENT_DIRECTION.LEFT) {
    eye[0] += movement[2];
    eye[2] -= movement[0];
    target[0] += movement[2];
    target[2] -= movement[0];
  } else if (direction === MOVEMENT_DIRECTION.RIGHT) {
    eye[0] -= movement[2];
    eye[2] += movement[0];
    target[0] -= movement[2];
    target[2] += movement[0];
  }

  mat4.lookAt(viewMatrix, eye, target, up);
}

main();
