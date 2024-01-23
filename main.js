let gl;
let defaultProgram;
let canvas;
const { vec3, mat4 } = glMatrix;
const { toRadian } = glMatrix.glMatrix;

let viewMatrix, projectionMatrix;
let eye, target, up;

let objects = [];
let viewMatrixLoc, projectionMatrixLoc;

let lightPosition;

const movementSpeed = 0.02;
const mouseMovementScaler = 0.004;

let isMouseDown = false;

const MOVEMENT_DIRECTION = {
  FORWARD: 0,
  BACKWARD: 1,
  RIGHT: 2,
  LEFT: 3,
};

async function main() {
  // Get canvas and setup WebGL context
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");

  // Configure viewport
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.75, 0.8, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // Init shader program via additional function and bind it
  defaultProgram = await initShaders(
    gl,
    "shaders/default.vert.glsl",
    "shaders/default.frag.glsl"
  );
  gl.useProgram(defaultProgram);

  setupMatrices();
  setupObjects();

  document.addEventListener("keypress", keyCameraMovementXZ);

  canvas.addEventListener("mousedown", () => (isMouseDown = true));
  canvas.addEventListener("mouseup", () => (isMouseDown = false));
  canvas.addEventListener("mousemove", mouseMoveCameraRotationY);
  canvas.addEventListener("mousemove", dragCameraMovementXZ);
  canvas.addEventListener("wheel", scrollCameraMovementZ, true);

  gameLoop();
}

function setupMatrices() {
  eye = vec3.fromValues(0.0, 1.0, 6);
  target = vec3.fromValues(0.0, 1.0, 0.0);
  up = vec3.fromValues(0.0, 1.0, 0.0);

  viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, eye, target, up);

  projectionMatrix = mat4.perspective(
    mat4.create(),
    toRadian(45.0),
    canvas.width / canvas.height,
    0.5,
    100.0
  );
}

function setupObjects() {
  lightPosition = [1.0, 2.0, 1.0];

  const island = new Island(defaultProgram);
  const river = new River(defaultProgram);
  const sun = new Sun(defaultProgram);

  const treeInFrontLeft = new Tree(defaultProgram);
  const treeInFrontRight = new Tree(defaultProgram);
  const treeInBackMiddle = new Tree(defaultProgram);

  const cloudBehindIsland = new Cloud(defaultProgram);
  const cloudOutsideIsland = new Cloud(defaultProgram);
  const cloudOverIsland = new Cloud(defaultProgram);

  river.setModelMatrix({
    position: [0, 0.04, 1.8],
    orientation: [0, 185, 0],
    scale: [0.11, 0.11, 0.11],
  });
  sun.setModelMatrix({
    position: lightPosition,
    scale: [0.1, 0.1, 0.1],
  });

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
    river,
    sun,
    treeInFrontLeft,
    treeInFrontRight,
    treeInBackMiddle,
    cloudBehindIsland,
    cloudOutsideIsland,
    cloudOverIsland
  );

  for (let object of objects) {
    gl.useProgram(object.shader);

    // Set view and projection matrix
    gl.uniformMatrix4fv(object.viewMatrixLoc, false, viewMatrix);
    gl.uniformMatrix4fv(object.projectionMatrixLoc, false, projectionMatrix);

    // Set position und intensity of the light source
    gl.uniform3fv(object.lightPositionLoc, lightPosition);
    gl.uniform4fv(object.IaLoc, [0.4, 0.4, 0.4, 1.0]);
    gl.uniform4fv(object.IdLoc, [0.8, 0.8, 0.8, 1.0]);
    gl.uniform4fv(object.IsLoc, [1.0, 1.0, 1.0, 1.0]);
  }
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

function mouseMoveCameraRotationY({ movementX }) {
  if (isMouseDown) return;
  rotateCameraY(-movementX * mouseMovementScaler);
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
}

function updateView() {
  mat4.lookAt(viewMatrix, eye, target, up);

  for (let object of objects) {
    gl.useProgram(object.shader);
    gl.uniformMatrix4fv(object.viewMatrixLoc, false, viewMatrix);
  }
}

function render() {
  // Only clear once
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  objects.forEach((o) => o.render());
}

function gameLoop() {
  updateView();
  render();
  requestAnimationFrame(gameLoop);
}

window.onload = async function () {
  main();
};
